import { load } from "$std/dotenv/mod.ts";

interface ServerConfig {
	APP_ROOT: string;
	IMAGES_SRC_PATH?: string;
	API_BASE_URL?: string;
	MINTING_SERVICE_FEE?: string;
	MINTING_SERVICE_FEE_ADDRESS?: string;
	CSRF_SECRET_KEY?: string;
	MINTING_SERVICE_FEE_ENABLED: string;
	MINTING_SERVICE_FEE_FIXED_SATS: string;
	SKIP_REDIS_CONNECTION: string;
	ELECTRUM: {
		HOST: string;
		PORT: number;
	};
	BITCOIN: {
		RPC_URL: string;
		RPC_USER: string;
		RPC_PASS: string;
	};
	[key: string]: string | undefined;
}

// Initialize serverConfig with default values
let serverConfig: ServerConfig = {
	APP_ROOT: "",
	MINTING_SERVICE_FEE_ENABLED: "0",
	MINTING_SERVICE_FEE_FIXED_SATS: "0",
	ELECTRUM: {
		HOST: "217.160.101.72",
		PORT: 50001,
	},
	BITCOIN: {
		RPC_URL: Deno.env.get("BITCOIN_RPC_URL") || "https://indexer.srcpad.pro/btc/",
		RPC_USER: "rpc",
		RPC_PASS: "rpc",
	},
};

const isDeno = typeof Deno !== "undefined";

if (isDeno) {
	const env_file =
		Deno.env.get("ENV") === "development"
			? "./.env.development.local"
			: "./.env";

	const confFromFile = await load({
		envPath: env_file,
		export: true,
	});

	const envVars = Deno.env.toObject();

	serverConfig = {
		...serverConfig,
		...envVars,
		...confFromFile,
		APP_ROOT: Deno.cwd(),
	};
}

export { serverConfig };

export function getClientConfig() {
	return {
		API_BASE_URL: serverConfig.API_BASE_URL,
		MINTING_SERVICE_FEE: serverConfig.MINTING_SERVICE_FEE,
		MINTING_SERVICE_FEE_ADDRESS: serverConfig.MINTING_SERVICE_FEE_ADDRESS,
		// Add other client-safe config variables here
	};
}
