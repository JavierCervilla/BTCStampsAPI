import { decodeSRC20Transaction } from "$lib/utils/decoding.ts";
import { getMempoolTransactions } from "$lib/utils/bitcoin-node.ts";

const BATCH_SIZE = 100;

let cachedSrc20Txs: { txid: string; decodedData: string }[] = [];

async function scanMempool() {
	try {
		const mempoolTxs = await getMempoolTransactions();

		const newCachedSrc20Txs = [];
		for (let i = 0; i < Math.min(mempoolTxs.length, BATCH_SIZE); i++) {
			const txid = mempoolTxs[i];
			try {
				const decodedTx = await decodeSRC20Transaction(txid);
				if (decodedTx) {
					newCachedSrc20Txs.push({ txid, decodedData: decodedTx });
				}
			} catch (error) {
				console.error(`Error decoding transaction ${txid}:`, error);
			}
		}

		cachedSrc20Txs = newCachedSrc20Txs;
		console.log(
			`Updated SRC20 transactions cache. Found ${cachedSrc20Txs.length} transactions.`,
		);
	} catch (error) {
		console.error("Error scanning mempool:", error);
	}
}

// Exportamos la función para que pueda ser llamada desde otros archivos
export function getCachedSrc20Txs() {
	return cachedSrc20Txs;
}

// Ejecutamos el escaneo inicial inmediatamente
scanMempool();

// Configuramos el cron job para ejecutar cada 5 minutos
Deno.cron("SRC20 Mempool Scanner", "*/5 * * * *", scanMempool);
