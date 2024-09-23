import { Handlers } from "$fresh/server.ts";
import { convertEmojiToTick, convertToEmoji, paginate } from "utils/util.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { PaginatedTickResponseBody, TickHandlerContext } from "globals";
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
        op: url.searchParams.get("op") || undefined,
        sort: url.searchParams.get("sort") || "ASC",
      };

      const src20_txs = await Src20Controller.getValidSrc20Tx(params);

      const pagination = paginate(total, params.page, params.limit);

      const body: PaginatedTickResponseBody = {
        ...pagination,
        last_block: lastBlock,
        data: src20_txs.rows.map((tx: any) => ({
          ...tx,
          tick: convertToEmoji(tx.tick),
          max: tx.max ? new BigFloat(tx.max).toString() : null,
          lim: tx.lim ? new BigFloat(tx.lim).toString() : null,
          amt: tx.amt ? new BigFloat(tx.amt).toString() : null,
        })),
      };

      return ResponseUtil.success(body);
    } catch (error) {
      console.error(error);
      return ResponseUtil.handleError(error, "Error processing request");
    }
  },
};
