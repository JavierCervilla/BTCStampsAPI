import { Handlers } from "$fresh/server.ts";
import { AddressTickHandlerContext } from "globals";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { convertEmojiToTick } from "utils/util.ts";

export const handler: Handlers<AddressTickHandlerContext> = {
	async GET(req, ctx) {
		try {
			const { address } = ctx.params;
			const url = new URL(req.url);
			const params = url.searchParams;

			const queryParams = {
				address,
				includePagination: params.get("includePagination") === "true", // or however you determine this
				limit: Number(params.get("limit")) || undefined,
				page: Number(params.get("page")) || undefined,
				amt: Number(params.get("amt")) || undefined,
				sort: params.get("sort") || undefined,
			};

			const result = await Src20Controller.getValidSrc20Tx(queryParams);

			if (!result || Object.keys(result).length === 0) {
				console.log("Empty result received:", result);
				return ResponseUtil.error("No data found", 404);
			}

			const total_tx_result =
				await Src20Controller.getTotalCountValidSrc20Tx(queryParams);

			return ResponseUtil.success({
				data: result.rows,
				total: total_tx_result,
			});
		} catch (error) {
			console.error("Error in GET handler:", error);
			return ResponseUtil.handleError(
				error,
				"Error processing SRC20 balance request",
			);
		}
	},
};
