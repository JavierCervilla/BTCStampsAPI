import * as bitcoin from "bitcoinjs-lib";
import { HttpError } from "@udibo/http-error";
import { Buffer } from "buffer";
import { arc4, bin2hex, hex2bin } from "$lib/utils/minting/utils.ts";
import { zLibUncompress } from "$lib/utils/minting/zlib.ts";
import { getTransaction } from "utils/btc.ts";
import * as msgpack from "msgpack";

const STAMP_PREFIX = "stamp:";

export interface SRC20Transaction {
	tx_hash: string;
	data: {
		p: string;
		op: string;
		tick: string;
		amt?: number | string;
		lim?: number | string;
		max?: number | string;
		dec?: number | string;
	};
	creator: string;
	destination: string;
	type: "msig" | "olga";
}

export async function decodeSRC20Transaction(
	txHash: string,
): Promise<SRC20Transaction | null | string> {
	try {
		// Fetch the transaction details
		const txDetails = await getTransaction(txHash);

		// Reconstruct the encrypted data from multisig outputs
		const multisigOutputs = txDetails.vout.filter(
			(output: any) => output.scriptPubKey.type === "multisig",
		);

		let decodedData: string;
		let type: "msig" | "olga" | null = null;
		if (multisigOutputs.length > 0) {
			decodedData = await decodeSRC20MultisigTransaction(
				txHash,
				txDetails,
				multisigOutputs,
			);
			type = "msig";
		}

		// If not multisig, try OLGA
		const olgaOutputs = txDetails.vout
			.slice(1)
			.filter(
				(output: any) => output.scriptPubKey.type === "witness_v0_scripthash",
			);

		if (olgaOutputs.length > 0) {
			decodedData = await decodeSRC20OLGATransaction(
				txHash,
				txDetails,
				olgaOutputs,
			);
			type = "olga";
		}

		if (decodedData === undefined) {
			return null;
		}
		// Extract creator and destination
		const creator =
			txDetails.vin[0].address ||
			txDetails.vin[0].scriptSig.asm.split(" ")[1] ||
			txDetails.vout[txDetails.vout.length - 1].scriptPubKey.addresses?.[0] ||
			txDetails.vout[txDetails.vout.length - 1].scriptPubKey.address;
		const destination =
			txDetails.vout[0].scriptPubKey.addresses?.[0] ||
			txDetails.vout[0].scriptPubKey.address;

		return {
			tx_hash: txHash,
			data: JSON.parse(decodedData),
			creator,
			destination,
			type,
		};
	} catch (error) {
		console.error("Error decoding data:", error.message);
		return null;
	}
}

async function decodeSRC20MultisigTransaction(
	txHash: string,
	txDetails: string,
	multisigOutputs: any[],
) {
	let encryptedData = "";
	for (const output of multisigOutputs) {
		const script = Buffer.from(output.scriptPubKey.hex, "hex");
		const pubkeys = bitcoin.script.decompile(script)?.slice(1, -2) as Buffer[];
		if (!pubkeys || pubkeys.length !== 3) continue;

		const chunk1 = pubkeys[0].toString("hex").slice(2, -2);
		const chunk2 = pubkeys[1].toString("hex").slice(2, -2);
		encryptedData += chunk1 + chunk2;
	}

	// Decrypt the data using the first input's txid as the key
	const decryptionKey = txDetails.vin[0].txid;
	const decryptedData = arc4(hex2bin(decryptionKey), hex2bin(encryptedData));

	// Extract the length and actual data
	const chunkLength = Number.parseInt(bin2hex(decryptedData.slice(0, 2)), 16);
	const chunk = decryptedData.slice(2, 2 + chunkLength);

	// Check for STAMP prefix
	const prefix = new TextDecoder().decode(chunk.slice(0, STAMP_PREFIX.length));

	if (prefix !== STAMP_PREFIX) {
		return null; // Not an SRC20 transaction
	}

	const data = chunk.slice(STAMP_PREFIX.length);

	// Try to decompress and decode the data
	let decodedData: string;
	try {
		const uncompressedData = await zLibUncompress(data);
		decodedData = msgpack.decode(uncompressedData);
	} catch (error) {
		decodedData = new TextDecoder().decode(data).trim();
	}

	return decodedData;
}

async function decodeSRC20OLGATransaction(
	txHash: string,
	txDetails: any,
	olgaOutputs: any[],
): Promise<SRC20Transaction | null> {
	let encodedData = "";
	for (const output of olgaOutputs) {
		const script = Buffer.from(output.scriptPubKey.hex, "hex");
		encodedData += script.slice(2).toString("hex");
	}

	// Remove padding zeros
	encodedData = encodedData.replace(/0+$/, "");

	// Extract the length prefix (2 bytes)
	const lengthPrefix = Number.parseInt(encodedData.slice(0, 4), 16);

	// Decode the hex data to a buffer, excluding the length prefix
	const decodedBuffer = Buffer.from(encodedData.slice(4), "hex").slice(
		0,
		lengthPrefix,
	);

	// Check for STAMP prefix
	const prefix = decodedBuffer.slice(0, STAMP_PREFIX.length).toString("utf8");
	if (prefix !== STAMP_PREFIX) {
		return null; // Not an SRC20 transaction
	}

	// Remove the STAMP prefix
	const data = decodedBuffer.slice(STAMP_PREFIX.length);

	// Try to decompress and decode the data
	let decodedData: string;
	try {
		const uncompressedData = await zLibUncompress(data);
		decodedData = msgpack.decode(uncompressedData);
	} catch (_error) {
		// If decompression or msgpack decoding fails, try parsing as JSON
		const jsonString = data.toString("utf8");
		decodedData = JSON.parse(jsonString);
	}

	return decodedData;
}
