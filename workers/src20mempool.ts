import {
	decodeSRC20Transaction,
	type SRC20Transaction,
} from "$lib/utils/decoding.ts";
import {
	getMempoolTransactions,
	isTransactionConfirmed,
} from "$lib/utils/btc.ts";

const BATCH_SIZE = 1000;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos en milisegundos
const CONFIRMATION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos en milisegundos

interface CachedSRC20Transaction extends SRC20Transaction {
	timestamp: number;
}

let cachedSrc20Txs: CachedSRC20Transaction[] = [];

async function scanMempool() {
	try {
		const mempoolTxs = await getMempoolTransactions();
		console.log(`Found ${mempoolTxs.length} transactions in mempool.`);
		const currentTime = Date.now();
		const newCachedSrc20Txs: CachedSRC20Transaction[] = [];

		// Procesar nuevas transacciones
		for (let i = 0; i < Math.min(mempoolTxs.length, BATCH_SIZE); i++) {
			const txid = mempoolTxs[i];
			try {
				const decodedTx = await decodeSRC20Transaction(txid);
				if (decodedTx) {
					newCachedSrc20Txs.push({
						...decodedTx,
						timestamp: currentTime,
					});
				}
			} catch (error) {
				console.error(`Error decoding transaction ${txid}:`, error);
			}
		}

		// Mantener transacciones existentes que aún son válidas
		const validExistingTxs = cachedSrc20Txs.filter(
			(tx) =>
				currentTime - tx.timestamp < CACHE_TTL &&
				mempoolTxs.includes(tx.tx_hash),
		);

		cachedSrc20Txs = [...validExistingTxs, ...newCachedSrc20Txs];
		console.log(
			`Updated SRC20 transactions cache. Found ${cachedSrc20Txs.length} transactions.`,
		);
	} catch (error) {
		console.error("Error scanning mempool:", error);
	}
}

async function checkConfirmations() {
	const currentTime = Date.now();
	const txsToCheck = cachedSrc20Txs.filter(
		(tx) => currentTime - tx.timestamp >= CONFIRMATION_CHECK_INTERVAL,
	);

	for (const tx of txsToCheck) {
		try {
			const confirmed = await isTransactionConfirmed(tx.tx_hash);
			if (confirmed) {
				cachedSrc20Txs = cachedSrc20Txs.filter(
					(cachedTx) => cachedTx.tx_hash !== tx.tx_hash,
				);
				console.log(`Removed confirmed transaction ${tx.tx_hash} from cache.`);
			}
		} catch (error) {
			console.error(
				`Error checking confirmation for transaction ${tx.tx_hash}:`,
				error,
			);
		}
	}
}

export function getCachedSrc20Txs(): CachedSRC20Transaction[] {
	return cachedSrc20Txs.map(({ timestamp, ...tx }) => tx);
}

//// Ejecutamos el escaneo inicial inmediatamente
//scanMempool();
//
//// Configuramos los cron jobs
//Deno.cron("SRC20 Mempool Scanner", "*/5 * * * *", scanMempool);
//Deno.cron("SRC20 Confirmation Checker", "*/5 * * * *", checkConfirmations);

// Add this instead:
const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_MINUTE = 1 * 60 * 1000;
const TWO_MINUTES = 2 * 60 * 1000;

// Ejecutamos el escaneo inicial inmediatamente
scanMempool();

// Configuramos los intervalos
setInterval(scanMempool, TWO_MINUTES);
setInterval(checkConfirmations, FIVE_MINUTES);

// Export the interval IDs if you need to clear them later
export const scanIntervalId = setInterval(scanMempool, FIVE_MINUTES);
export const checkIntervalId = setInterval(checkConfirmations, FIVE_MINUTES);
