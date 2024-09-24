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

const cache = {
	cachedSrc20Txs: [] as CachedSRC20Transaction[],
	totalMempoolTxs: 0 as number,
	lastCacheTime: 0 as number,
	mempoolTxsAnalized: 0 as number,
};

async function processBatch(
	mempoolTxs: string[],
	startIndex: number,
	currentTime: number,
) {
	const newCachedSrc20Txs: CachedSRC20Transaction[] = [];
	let analized = 0;

	const batch = mempoolTxs.slice(startIndex, startIndex + BATCH_SIZE);
	for (const txid of batch) {
		if (cache.cachedSrc20Txs.some((tx) => tx.tx_hash === txid)) {
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
			currentTime - tx.timestamp < CACHE_TTL && mempoolTxs.includes(tx.tx_hash),
	);

	cache.cachedSrc20Txs = [...validExistingTxs, ...newCachedSrc20Txs];
	cache.mempoolTxsAnalized += analized;
	console.log(
		`Processed batch. Updated SRC20 transactions cache. Found ${cache.cachedSrc20Txs.length} transactions.`,
	);
}

async function scanMempool() {
	try {
		const mempoolTxs = await getMempoolTransactions();
		console.log(`Found ${mempoolTxs.length} transactions in mempool.`);
		const currentTime = Date.now();
		cache.totalMempoolTxs = mempoolTxs.length;
		cache.lastCacheTime = currentTime;
		let analized = 0;

		let startIndex = 0;
		while (startIndex < mempoolTxs.length) {
			await processBatch(mempoolTxs, startIndex, currentTime);
			startIndex += BATCH_SIZE;
			analized += BATCH_SIZE;
		}
	} catch (error) {
		console.error("Error scanning mempool:", error);
	}
}

async function checkConfirmations() {
	const currentTime = Date.now();
	const txsToCheck = cache.cachedSrc20Txs.filter(
		(tx) => currentTime - tx.timestamp >= CONFIRMATION_CHECK_INTERVAL,
	);
	let confirmedTxs = 0;
	console.log(`Checking ${txsToCheck.length} transactions for confirmations.`);
	for (const tx of txsToCheck) {
		try {
			const confirmed = await isTransactionConfirmed(tx.tx_hash);
			if (confirmed) {
				cache.cachedSrc20Txs = cache.cachedSrc20Txs.filter(
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

interface MempoolInfo {
	mempool_size: number;
	analized: number;
	lastCacheTime: string;
	total: number;
	mempool: SRC20Transaction[];
}

export function getCachedSrc20Txs(): MempoolInfo {
	return {
		mempool_size: cache.totalMempoolTxs,
		analized: cache.mempoolTxsAnalized,
		lastCacheTime: new Date(cache.lastCacheTime).toLocaleString("es-ES", {
			timeZone: "Europe/Madrid",
		}),
		total: cache.cachedSrc20Txs.length,
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
setInterval(scanMempool, ONE_MINUTE);
setInterval(checkConfirmations, FIVE_MINUTES);

// Export the interval IDs if you need to clear them later
export const scanIntervalId = setInterval(scanMempool, FIVE_MINUTES);
export const checkIntervalId = setInterval(checkConfirmations, FIVE_MINUTES);
