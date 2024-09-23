import { BlockService } from "$lib/services/blockService.ts";
import { BlockInfoResponseBody, StampBlockResponseBody } from "globals";
import { isIntOr32ByteHex } from "utils/util.ts";

// biome-ignore lint/complexity/noStaticOnlyClass: Better organization this way.
export class BlockController {
	static async getLastXBlocks(num: number) {
		return await BlockService.getLastXBlocks(num);
	}

	static async getBlockInfoWithStamps(
		blockIdentifier: number | string,
		type: "stamps" | "cursed" | "all" = "all",
	): Promise<StampBlockResponseBody> {
		return await BlockService.getBlockInfoWithStamps(blockIdentifier, type);
	}

	static transformToBlockInfoResponse(
		stampBlockResponse: StampBlockResponseBody,
	): BlockInfoResponseBody {
		return BlockService.transformToBlockInfoResponse(stampBlockResponse);
	}

	static async getRelatedBlocksWithStamps(blockIdentifier: number | string) {
		return await BlockService.getRelatedBlocksWithStamps(blockIdentifier);
	}

	static async getLastBlock(): Promise<number> {
		return await BlockService.getLastBlock();
	}

	static async getBlockPageData(blockIdentifier: number | string) {
		if (!blockIdentifier || isNaN(Number(blockIdentifier))) {
			const lastBlock = await BlockController.getLastBlock();
			blockIdentifier = lastBlock;
		}

		const [stampBlockResponse, related_blocks] = await Promise.all([
			BlockController.getBlockInfoWithStamps(blockIdentifier, "stamps"),
			BlockController.getRelatedBlocksWithStamps(blockIdentifier),
		]);

		const block =
			BlockController.transformToBlockInfoResponse(stampBlockResponse);

		return {
			block,
			related_blocks,
		};
	}

	static async getBlockHeaders(blockIdentifier: number | string) {
		if (!isIntOr32ByteHex(blockIdentifier)) {
			throw new Error(
				`Invalid input: ${blockIdentifier}. It must be a valid block index (integer) or block hash (64 character string).`,
			);
		}

		const blockHeaders = await BlockService.getBlockHeaders(blockIdentifier);
		return blockHeaders;
	}

	static async getBlockInfoResponse(
		blockIdentifier: number | string,
		type: "stamps" | "cursed" | "all" = "all",
	) {
		if (!isIntOr32ByteHex(blockIdentifier)) {
			throw new Error(
				`Invalid input: ${blockIdentifier}. It must be a valid block index (integer) or block hash (64 character string).`,
			);
		}

		const blockInfo = await BlockController.getBlockInfoWithStamps(
			blockIdentifier,
			type,
		);
		return BlockController.transformToBlockInfoResponse(blockInfo);
	}

	static async getRelatedBlockInfoResponse(
		blockIdentifier: number | string,
		type: "stamps" | "cursed",
	) {
		if (!isIntOr32ByteHex(blockIdentifier)) {
			throw new Error(
				"Invalid argument provided. Must be an integer or 32 byte hex string.",
			);
		}
		const lastBlock = await BlockController.getLastBlock();
		const blockInfo = await BlockController.getBlockHeaders(blockIdentifier);

		const currentBlockNumber =
			typeof blockIdentifier === "number"
				? blockIdentifier
				: blockInfo.block_index;
		let startBlock = Math.max(0, currentBlockNumber - 2);
		let endBlock = Math.min(lastBlock, currentBlockNumber + 2);
		if (currentBlockNumber === lastBlock) {
			startBlock = Math.max(0, currentBlockNumber - 4);
			endBlock = currentBlockNumber;
		}
		const blockPromises = [];
		for (let i = startBlock; i <= endBlock; i++) {
			blockPromises.push(BlockController.getBlockHeaders(i));
		}
		const relatedBlocks = await Promise.all(blockPromises);

		return relatedBlocks;
	}

	static async getSharedBlockWithStamps(
		blockIndex: string | undefined,
		type: "stamps" | "cursed",
	) {
		let blockIdentifier: number | string;

		if (!blockIndex) {
			const lastBlock = await BlockController.getLastBlock();
			blockIdentifier = lastBlock;
		} else if (!isIntOr32ByteHex(blockIndex)) {
			throw new Error(
				`Invalid input: ${blockIndex}. It must be a valid block index (integer) or block hash (64 character string).`,
			);
		} else {
			blockIdentifier = /^\d+$/.test(blockIndex)
				? Number(blockIndex)
				: blockIndex;
		}

		return await BlockController.getBlockInfoWithStamps(blockIdentifier, type);
	}
}
