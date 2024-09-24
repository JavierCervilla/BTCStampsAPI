import { bitcoinRPC } from "utils/btc-rpc.ts";

export const getBtcBalance = async (address: string) => {
	const utxos = await fetch(
		`https://mempool.space/api/address/${address}/utxo`,
	);
	const utxosJson = await utxos.json();
	const balance = utxosJson.reduce(
		(acc: number, utxo: { value: number }) => acc + utxo.value,
		0,
	);
	return balance / 100000000;
};

async function getBtcAddressInfoFromMempool(address: string) {
	const response = await fetch(`https://mempool.space/api/address/${address}`);
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const data = await response.json();
	const { chain_stats, mempool_stats } = data;

	return {
		address: address,
		balance:
			(chain_stats.funded_txo_sum - chain_stats.spent_txo_sum) / 100000000,
		txCount: chain_stats.tx_count,
		unconfirmedBalance:
			(mempool_stats.funded_txo_sum - mempool_stats.spent_txo_sum) / 100000000,
		unconfirmedTxCount: mempool_stats.tx_count,
	};
}

async function getBtcAddressInfoFromQuickNode(address: string) {
	const fetchQuickNode = async (name: string, params: any[]) => {
		const response = await fetch("/quicknode/getPrice", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name, params }),
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.json();
	};

	const balance = await fetchQuickNode("getbalance", [address]);
	const unconfirmedBalance = await fetchQuickNode("getunconfirmedbalance", [
		address,
	]);
	const txCount = await fetchQuickNode("getreceivedbyaddress", [address, 0]);
	const unconfirmedTxCount = await fetchQuickNode("getunconfirmedbalance", [
		address,
	]);

	return {
		address: address,
		balance: balance.result,
		txCount: txCount.result,
		unconfirmedBalance: unconfirmedBalance.result,
		unconfirmedTxCount: unconfirmedTxCount.result,
	};
}

export async function getBtcAddressInfo(address: string) {
	try {
		return await getBtcAddressInfoFromMempool(address);
	} catch (error) {
		console.error(
			"Error fetching from mempool.space, falling back to QuickNode:",
			error,
		);
		try {
			return await getBtcAddressInfoFromQuickNode(address);
		} catch (quickNodeError) {
			console.error("Error fetching from QuickNode:", quickNodeError);
			throw new Error("Failed to fetch BTC address info from both sources");
		}
	}
}

export async function fetchBTCPrice(): Promise<number> {
	try {
		const response = await fetch("/quicknode/getPrice", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: "cg_simplePrice",
				params: ["bitcoin", "usd", true, true, true],
			}),
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const { price } = await response.json();
		return price;
	} catch (error) {
		console.error("Error fetching BTC price:", error);
		return 0; // Return a default value or throw an error based on your error handling strategy
	}
}

const CACHE_TTL = 60000; // 1 minuto en milisegundos

let cachedMempoolTxs: string[] | null = null;
let lastCacheTime = 0;

export async function getMempoolTransactions(): Promise<string[]> {
	const currentTime = Date.now();

	if (cachedMempoolTxs && currentTime - lastCacheTime < CACHE_TTL) {
		return cachedMempoolTxs;
	}

	try {
		const response = await bitcoinRPC<string[]>("getrawmempool", [false]);

		if (!Array.isArray(response.result)) {
			throw new Error("Unexpected response format from getrawmempool");
		}

		cachedMempoolTxs = response.result;
		lastCacheTime = currentTime;

		return cachedMempoolTxs;
	} catch (error) {
		console.error("Error fetching mempool transactions:", error);
		if (cachedMempoolTxs) {
			console.warn("Returning expired cached data due to error");
			return cachedMempoolTxs;
		}
		throw error;
	}
}

export async function isTransactionConfirmed(txid: string): Promise<boolean> {
	try {
		// Primero, verificamos si la transacción aún está en la mempool
		const mempoolTxs = await getMempoolTransactions();
		if (mempoolTxs.includes(txid)) {
			return false; // La transacción aún está en la mempool, por lo tanto no está confirmada
		}

		// Si no está en la mempool, verificamos si está en la blockchain
		const response = await bitcoinRPC<{ confirmations?: number }>(
			"getrawtransaction",
			[txid, true],
		);

		// Si la transacción tiene confirmaciones, está confirmada
		return (
			response.result.confirmations !== undefined &&
			response.result.confirmations > 0
		);
	} catch (error) {
		// Si obtenemos un error específico indicando que la transacción no se encontró,
		// asumimos que ha sido descartada de la mempool sin ser confirmada
		if (
			error instanceof Error &&
			error.message.includes("No such mempool or blockchain transaction")
		) {
			return false;
		}

		console.error(
			`Error checking transaction confirmation for ${txid}:`,
			error,
		);
		throw error; // Re-lanzamos el error para manejarlo en el nivel superior
	}
}

export async function getBitcoinNodeInfo(): Promise<any> {
	try {
		const [networkInfo, mempoolInfo, blockchainInfo] = await Promise.all([
			bitcoinRPC<any>("getnetworkinfo", []),
			bitcoinRPC<any>("getmempoolinfo", []),
			bitcoinRPC<any>("getblockchaininfo", []),
		]);

		console.log("Network Info:", JSON.stringify(networkInfo.result, null, 2));
		console.log("Mempool Info:", JSON.stringify(mempoolInfo.result, null, 2));
		console.log(
			"Blockchain Info:",
			JSON.stringify(blockchainInfo.result, null, 2),
		);

		return {
			networkInfo: networkInfo.result,
			mempoolInfo: mempoolInfo.result,
			blockchainInfo: blockchainInfo.result,
		};
	} catch (error) {
		console.error("Error fetching Bitcoin node info:", error);
		throw error;
	}
}
