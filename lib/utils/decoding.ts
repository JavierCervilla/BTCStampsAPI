import * as bitcoin from "bitcoinjs-lib";
import { Buffer } from "buffer";
import { arc4, bin2hex, hex2bin } from "$lib/utils/minting/utils.ts";
import { zLibUncompress } from "$lib/utils/minting/zlib.ts";
import { getTransaction } from "$lib/utils/quicknode.ts";
import * as msgpack from "msgpack";

const STAMP_PREFIX = "stamp:";

export interface SRC20Transaction {
	tx_hash: string;
	data: string;
	creator: string;
	destination: string;
	timestamp: Date | number;
}

export async function decodeSRC20Transaction(
	txHash: string,
): Promise<SRC20Transaction | null> {
	try {
		// Fetch the transaction details
		const txDetails = await getTransaction(txHash);

		// Reconstruct the encrypted data from multisig outputs
		const multisigOutputs = txDetails.vout.filter(
			(output: any) => output.scriptPubKey.type === "multisig",
		);

		if (multisigOutputs.length === 0) {
			return null; // Not an SRC20 transaction
		}

		let encryptedData = "";
		for (const output of multisigOutputs) {
			const script = Buffer.from(output.scriptPubKey.hex, "hex");
			const pubkeys = bitcoin.script
				.decompile(script)
				?.slice(1, -2) as Buffer[];
			if (!pubkeys || pubkeys.length !== 3) continue;

			const chunk1 = pubkeys[0].toString("hex").slice(2, -2);
			const chunk2 = pubkeys[1].toString("hex").slice(2, -2);
			encryptedData += chunk1 + chunk2;
		}

		// Decrypt the data using the first input's txid as the key
		const decryptionKey = txDetails.vin[0].txid;
		const decryptedData = arc4(hex2bin(decryptionKey), hex2bin(encryptedData));

		// Extract the length and actual data
		const chunkLength = parseInt(bin2hex(decryptedData.slice(0, 2)), 16);
		const chunk = decryptedData.slice(2, 2 + chunkLength);

		// Check for STAMP prefix
		const prefix = new TextDecoder().decode(
			chunk.slice(0, STAMP_PREFIX.length),
		);

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

		// Extract creator and destination
		const creator =
			txDetails.vin[0].address || txDetails.vin[0].scriptSig.asm.split(" ")[1];
		const destination =
			txDetails.vout[0].scriptPubKey.addresses?.[0] ||
			txDetails.vout[0].scriptPubKey.address;

		return {
			tx_hash: txHash,
			data: decodedData,
			creator,
			destination,
		};
	} catch (error) {
		console.error("Error decoding data:", error);
		return null;
	}
}
