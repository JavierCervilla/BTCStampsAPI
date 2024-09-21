import { Handlers } from "$fresh/server.ts";
import { BlockController } from "$lib/controller/blockController.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { BlockHandlerContext } from "globals";

export const handler: Handlers<BlockHandlerContext> = {
  async GET(req, ctx) {
    try {
      let { block_index } = ctx.params;
      const url = new URL(req.url);
      const type = url.pathname.includes("/cursed/")
        ? "cursed"
        : url.pathname.includes("/stamps/")
        ? "stamps"
        : "all";

      if (!block_index || isNaN(Number(block_index))) {
        block_index = await BlockController.getLastBlock();
      }
      console.log(block_index);
      const response = await BlockController.getBlockInfoResponse(
        block_index,
        type
      );
      const block_headers = await BlockController.getBlockHeaders(block_index);
      return ResponseUtil.success({
        block_info: block_headers,
        tx: response,
      });
    } catch (error) {
      console.error(`Error in block handler:`, error);
      return ResponseUtil.handleError(error, "Error processing block request");
    }
  },
};
