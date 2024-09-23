import { Handlers } from "$fresh/server.ts";
import { convertEmojiToTick } from "utils/util.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { tick, address } = ctx.params;
      const url = new URL(req.url);
      const { limit, page } = getPaginationParams(url);
      const params = {
        tick: convertEmojiToTick(String(tick)),
        address,
        limit,
        page,
        sort: url.searchParams.get("sort") || "ASC",
      };
      const result = await Src20Controller.handleSrc20BalanceRequest(params);
      return ResponseUtil.success(result);
    } catch (error) {
      console.error(error);
      return ResponseUtil.handleError(error, "Error processing request");
    }
  },
};
