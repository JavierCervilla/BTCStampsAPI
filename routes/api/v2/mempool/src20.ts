import type { Handlers } from "$fresh/server.ts";
import { getCachedSrc20Txs } from "$workers/src20mempool.ts";

export const handler: Handlers = {
	async GET(req) {
		try {
			const url = new URL(req.url);
			const src20Txs = getCachedSrc20Txs();

			const params = {
				address: url.searchParams.getAll("address"),
				txid: url.searchParams.getAll("txid"),
				op: url.searchParams.getAll("op").map((op) => op.toLowerCase()),
				tick: url.searchParams.getAll("tick").map((tick) => tick.toLowerCase()),
				type: url.searchParams.getAll("type").map((type) => type.toLowerCase()),
			};

			const filteredTxs = src20Txs.data.filter(
				(tx) =>
					(params.address.length === 0 ||
						params.address.includes(tx.destination) ||
						params.address.includes(tx.creator)) &&
					(params.txid.length === 0 || params.txid.includes(tx.tx_hash)) &&
					(params.op.length === 0 ||
						params.op.includes(tx.data.op.toLowerCase())) &&
					(params.tick.length === 0 ||
						params.tick.includes(tx.data.tick.toLowerCase())) &&
					(params.type.length === 0 || params.type.includes(tx.type)),
			);

			return new Response(
				JSON.stringify({
					total: filteredTxs.length,
					processed: src20Txs.processed,
					mempool_size: src20Txs.mempool_size,
					data: filteredTxs,
				}),
				{
					headers: { "Content-Type": "application/json" },
				},
			);
		} catch (error) {
			console.error("Error fetching SRC20 transactions:", error);
			return new Response(JSON.stringify({ error: "Internal Server Error" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	},
};
