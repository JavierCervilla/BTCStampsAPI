import { serverConfig } from "$server/config/config.ts";

const BITCOIN_RPC_URL = serverConfig.BITCOIN.RPC_URL || "http://localhost:8332";
const BITCOIN_RPC_USER = serverConfig.BITCOIN.RPC_USER || "rpc";
const BITCOIN_RPC_PASS = serverConfig.BITCOIN.RPC_PASS || "rpc";

interface RPCResponse {
	result: T;
	error: string | null;
	id: string;
}

export async function bitcoinRPC(
	method: string,
	params: unknown[] = [],
): Promise<RPCResponse> {
	const AUTH_CODE = `Basic ${btoa(`${BITCOIN_RPC_USER}:${BITCOIN_RPC_PASS}}`)}`;
	console.log("BITCOIN_RPC_URL", BITCOIN_RPC_URL);
	console.log("AUTH_CODE", AUTH_CODE);

	const response = await fetch(BITCOIN_RPC_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: AUTH_CODE,
		},
		body: JSON.stringify({
			jsonrpc: "1.0",
			id: "deno",
			method: method,
			params: params,
		}),
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const data: RPCResponse = await response.json();

	if (data.error) {
		throw new Error(`RPC error: ${data.error}`);
	}

	return data;
}
