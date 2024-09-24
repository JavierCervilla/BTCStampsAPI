import {
	decodeSRC20Transaction,
	type SRC20Transaction,
} from "$lib/utils/decoding.ts";
import {
	getMempoolTransactions,
	isTransactionConfirmed,
} from "$lib/utils/btc.ts";

const BATCH_SIZE = 2500;
const CACHE_TTL = 30 * 60 * 1000;
const CONFIRMATION_CHECK_INTERVAL = 5 * 60 * 1000;

interface CachedSRC20Transaction extends SRC20Transaction {
	timestamp: number;
}

let cache = {
	cachedSrc20Txs: [] as CachedSRC20Transaction[],
	totalMempoolTxs: 0 as number,
	lastCacheTime: 0 as number,
	mempoolTxsAnalized: 0 as number,
};

async function scanMempool() {
	try {
		const mempoolTxs = await getMempoolTransactions();
		console.log(`Found ${mempoolTxs.length} transactions in mempool.`);
		const currentTime = Date.now();
		cache.totalMempoolTxs += mempoolTxs.length;
		cache.lastCacheTime = currentTime;
		const newCachedSrc20Txs: CachedSRC20Transaction[] = [];
		let analized = 0;
		// Procesar nuevas transacciones
		for (let i = 0; i < Math.min(mempoolTxs.length, BATCH_SIZE); i++) {
			const txid = mempoolTxs[i];
			if (cachedSrc20Txs.filter((tx) => tx.tx_hash === txid).length > 0) {
				continue;
			}
			analized++;
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
		const validExistingTxs = cache.cachedSrc20Txs.filter(
			(tx) =>
				currentTime - tx.timestamp < CACHE_TTL &&
				mempoolTxs.includes(tx.tx_hash),
		);

		cache.cachedSrc20Txs = [...validExistingTxs, ...newCachedSrc20Txs];
		cache.mempoolTxsAnalized = analized;
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
	let confirmedTxs = 0;
	console.log(`Checking ${txsToCheck.length} transactions for confirmations.`);
	for (const tx of txsToCheck) {
		try {
			const confirmed = await isTransactionConfirmed(tx.tx_hash);
			if (confirmed) {
				cachedSrc20Txs = cachedSrc20Txs.filter(
					(cachedTx) => cachedTx.tx_hash !== tx.tx_hash,
				);
				confirmedTxs++;
			}
		} catch (error) {
			console.error(
				`Error checking confirmation for transaction ${tx.tx_hash}:`,
				error,
			);
		}
		console.log(`Removed ${confirmedTxs} confirmed transactions.`);
	}
}

export function getCachedSrc20Txs(): CachedSRC20Transaction[] {
	return {
		total: cache.totalMempoolTxs,
		analized: cache.mempoolTxsAnalized,
		lastCacheTime: cache.lastCacheTime,
		mempool: cache.cachedSrc20Txs.map(({ timestamp, ...tx }) => tx),
	};
}

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
