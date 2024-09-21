import { Handlers } from "$fresh/server.ts";

import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { StampController } from "$lib/controller/stampController.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { electrumManager } from "utils/electrum.ts";

import { SRC20TrxRequestParams } from "globals";

export const handler: Handlers = {
  async GET(req, ctx) {
    const { tx_hash } = ctx.params;
    const url = new URL(req.url);
    const params: SRC20TrxRequestParams = {
      tx_hash,
      limit: undefined,
      page: undefined,
      sort: url.searchParams.get("sort") || "ASC",
      noPagination: true,
      singleResult: true,
    };
    const electrum = await electrumManager.getClient();
    try {
      const tx = await electrum.call([
        { method: "blockchain.transaction.get", params: [tx_hash, true] },
      ]);
      const src20Tx = await Src20Controller.handleSrc20TransactionsRequest(
        req,
        params
      );
      const stampsTx = await StampController.getStampDetailsById(tx_hash);
      const last_block = stampsTx.last_block;
      const body = {
        last_block: last_block,
        data: {
          tx: tx[0],
          src20Tx: src20Tx || null,
          stampsTx: stampsTx.data || null,
        },
      };
      return ResponseUtil.success(body);
    } catch (error) {
      console.error(error);
      electrumManager.closeClient(electrum);
      return ResponseUtil.error("Internal server error", 500);
    } finally {
      electrumManager.releaseClient(electrum);
    }
  },
};
