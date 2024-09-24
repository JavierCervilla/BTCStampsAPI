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
	params: any[] = [],
): Promise<RPCResponse> {
	const response = await fetch(BITCOIN_RPC_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Basic  ${btoa(`${BITCOIN_RPC_USER}:${BITCOIN_RPC_PASS}}`)}`,
		},
		body: JSON.stringify({
			jsonrpc: "1.0",
			id: "curltest",
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
