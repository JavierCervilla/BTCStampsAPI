import { ErrorResponseBody } from "globals";
import { Handlers } from "$fresh/server.ts";
import { electrumManager } from "utils/electrum.ts";

interface ElectrumParams {
  method: string;
  params: unknown[];
}

export const handler: Handlers = {
  async POST(
    req,
    _ctx,
  ) {
    const body: ElectrumParams[] = await req.json();
    const electrum = await electrumManager.getClient();
    try {
      const data = await electrum.call(body);
      return new Response(JSON.stringify(data));
    } catch (error) {
      console.error(error);
      electrumManager.closeClient(electrum);
      const body: ErrorResponseBody = { error: `Error: Internal server error` };
      return new Response(JSON.stringify(body));
    } finally {
      electrumManager.releaseClient(electrum);
    }
  },
};
