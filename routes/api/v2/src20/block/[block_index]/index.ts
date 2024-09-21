import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { BlockController } from "$lib/controller/blockController.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      let { block_index } = ctx.params;

      if (!block_index || isNaN(Number(block_index))) {
        block_index = await BlockController.getLastBlock();
      }
      const url = new URL(req.url);
      const params = {
        block_index: parseInt(block_index, 10),
        sort:
          (url.searchParams.get("sort")?.toUpperCase() as "ASC" | "DESC") ||
          "ASC",
        limit: parseInt(url.searchParams.get("limit") || "100", 10),
        page: parseInt(url.searchParams.get("page") || "1", 10),
      };

      const result = await Src20Controller.handleSrc20TransactionsRequest(
        req,
        params
      );

      const block_headers = await blockController.getBlockHeaders(block_index);
      return ResponseUtil.success({
        block_info: block_headers,
        tx: result,
      });
    } catch (error) {
      console.error("Error in block handler:", error);
      return ResponseUtil.handleError(error, "Error processing block request");
    }
  },
};
