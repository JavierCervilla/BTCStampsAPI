import { Handlers } from "$fresh/server.ts";
import { getCachedSrc20Txs } from "$workers/src20mempool.ts";

export const handler: Handlers = {
	async GET(req) {
		try {
			const src20Txs = getCachedSrc20Txs();

			return new Response(JSON.stringify(src20Txs), {
				headers: { "Content-Type": "application/json" },
			});
		} catch (error) {
			console.error("Error fetching SRC20 transactions:", error);
			return new Response(JSON.stringify({ error: "Internal Server Error" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	},
};
