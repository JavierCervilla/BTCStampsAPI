import {
	decodeSRC20Transaction,
	type SRC20Transaction,
} from "$lib/utils/decoding.ts";
import {
	getMempoolTransactions,
	isTransactionConfirmed,
} from "$lib/utils/btc.ts";

const BATCH_SIZE = 1000;
const CACHE_TTL = 30 * 60 * 1000;
const CONFIRMATION_CHECK_INTERVAL = 5 * 60 * 1000;

interface CachedSRC20Transaction extends SRC20Transaction {
	timestamp: number;
}

let isScanningMempool = false;

const cache = {
	cachedSrc20Txs: [] as CachedSRC20Transaction[],
	errored: [] as string[],
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
			if (decodedTx !== null && decodedTx !== txid) {
				newCachedSrc20Txs.push({
					...decodedTx,
					timestamp: currentTime,
				});
			} else if (decodedTx === txid) {
				cache.errored.push(txid);
			}
		} catch (error) {
			console.error(`Error decoding transaction ${txid}:`, error);
			cache.errored.push(txid);
		}
	}

	// Mantener transacciones existentes que aún son válidas
	const validExistingTxs = cache.cachedSrc20Txs.filter(
		(tx) =>
			currentTime - tx.timestamp < CACHE_TTL && mempoolTxs.includes(tx.tx_hash),
	);

	const txMap = new Map<string, CachedSRC20Transaction>();
	for (const tx of validExistingTxs) {
		txMap.set(tx.tx_hash, tx);
	}

	for (const tx of newCachedSrc20Txs) {
		txMap.set(tx.tx_hash, tx);
	}
	cache.cachedSrc20Txs = Array.from(txMap.values());

	cache.mempoolTxsAnalized += analized;
	console.log(
		`Processed batch. Updated SRC20 transactions cache. Found ${cache.cachedSrc20Txs.length} transactions.`,
	);
}

async function scanMempool() {
	if (isScanningMempool) return;
	isScanningMempool = true;
	try {
		const mempoolTxs = await getMempoolTransactions();
		console.log(`Found ${mempoolTxs.length} transactions in mempool.`);
		const currentTime = Date.now();
		cache.totalMempoolTxs = mempoolTxs.length;
		cache.lastCacheTime = currentTime;
		cache.mempoolTxsAnalized = 0;
		let analized = 0;

		let startIndex = 0;
		while (startIndex < mempoolTxs.length) {
			await processBatch(mempoolTxs, startIndex, currentTime);
			startIndex += BATCH_SIZE;
			analized += BATCH_SIZE;
			cache.mempoolTxsAnalized = analized;
		}
	} catch (error) {
		console.error("Error scanning mempool:", error);
	} finally {
		isScanningMempool = false;
	}
}

async function checkConfirmations() {
	const currentTime = Date.now();
	const txsToCheck = cache.cachedSrc20Txs;
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
	}
	console.log(`Removed ${confirmedTxs} confirmed transactions.`);
}

interface MempoolInfo {
	mempool_size: number;
	processed: number;
	lastCacheTime: string;
	total: number;
	data: SRC20Transaction[];
}

export function getCachedSrc20Txs(): MempoolInfo {
	return {
		mempool_size: cache.totalMempoolTxs,
		processed: cache.mempoolTxsAnalized,
		lastCacheTime: new Date(cache.lastCacheTime).toLocaleString("es-ES", {
			timeZone: "Europe/Madrid",
		}),
		total: cache.cachedSrc20Txs.length,
		data: cache.cachedSrc20Txs.map(({ timestamp, ...tx }) => tx),
	};
}

// Add this instead:
const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_MINUTE = 1 * 60 * 1000;
const TWO_MINUTES = 2 * 60 * 1000;

// Ejecutamos el escaneo inicial inmediatamente
scanMempool();

// Export the interval IDs if you need to clear them later
export const scanIntervalId = setInterval(scanMempool, ONE_MINUTE);
export const checkIntervalId = setInterval(checkConfirmations, FIVE_MINUTES);
