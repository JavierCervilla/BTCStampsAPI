import { FreshContext } from "$fresh/server.ts";
import { accesslog } from "utils/accesslog.ts";

export async function handler(req: Request, ctx: FreshContext) {
  return accesslog(req, ctx);
}
