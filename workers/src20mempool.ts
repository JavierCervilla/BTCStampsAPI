import {
	decodeSRC20Transaction,
	type SRC20Transaction,
} from "$lib/utils/decoding.ts";
import {
	getMempoolTransactions,
	isTransactionConfirmed,
	setupWebSocket,
} from "$lib/utils/btc.ts";

const BATCH_SIZE = 100;
const CACHE_TTL = 30 * 60 * 1000;

interface CachedSRC20Transaction extends SRC20Transaction {
	timestamp: number;
}

let isScanningMempool = false;
let shouldStop = false;

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
	const startTime = Date.now();
	let analized = 0;

	const batch = mempoolTxs.slice(startIndex, startIndex + BATCH_SIZE);
	for (const txid of batch) {
		if (shouldStop) {
			console.log("Stopping...");
			return;
		}
		if (cache.cachedSrc20Txs.some((tx) => tx.tx_hash === txid)) {
			continue;
		}
		analized++;
		try {
			const decodedTx = await decodeSRC20Transaction(txid);
			if (decodedTx !== null) {
				newCachedSrc20Txs.push({
					...decodedTx,
					timestamp: currentTime,
				});
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

	const endTime = Date.now();
	const timeTaken = (endTime - startTime) / 1000;
	cache.mempoolTxsAnalized += analized;
	console.log(
		`INFO: Processed batch [${startIndex}-${startIndex + BATCH_SIZE}] in ${timeTaken}s. Updated SRC20 transactions cache. Found ${newCachedSrc20Txs.length}/${cache.cachedSrc20Txs.length} new transactions.`,
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
		while (startIndex < mempoolTxs.length && !shouldStop) {
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

let websocket: WebSocket | null = null;

export function setupWebSocket() {
	const url = "wss://ws.blockchain.info/inv";
	websocket = new WebSocket(url);

	websocket.onopen = () => {
		console.log("WebSocket connection established");
		sendInitMessage();
		sendWantMessage();
	};

	websocket.onmessage = async (event) => {
		try {
			const data = JSON.parse(event.data);
			if (data.op === "block") {
				console.log("New block detected");
				shouldStop = true;
				await checkConfirmations();
				shouldStop = false;
				scanMempool();
			} else if (data.op === "pong") {
				console.log("Websocket connected.");
			}
		} catch (error) {
			console.error("Error parsing WebSocket message:", error);
		}
	};

	websocket.onerror = () => {
		console.error("WebSocket error");
	};

	websocket.onclose = () => {
		console.log("WebSocket connection closed. Reconnecting...");
		setTimeout(setupWebSocket, 5000);
	};
}

function sendInitMessage() {
	if (websocket && websocket.readyState === WebSocket.OPEN) {
		const initMessage = { op: "ping" };
		websocket.send(JSON.stringify(initMessage));
	}
}

function sendWantMessage() {
	if (websocket && websocket.readyState === WebSocket.OPEN) {
		const wantMessage = {
			op: "blocks_sub",
		};
		websocket.send(JSON.stringify(wantMessage));
	}
}

export function closeWebSocket() {
	if (websocket) {
		websocket.close();
		websocket = null;
	}
}

// Initialize WebSocket connection
setupWebSocket();

// Initial mempool scan
scanMempool();

// Export a function to manually trigger a mempool scan if needed
export function triggerMempoolScan() {
	if (!isScanningMempool) {
		scanMempool();
	}
}
