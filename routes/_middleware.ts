import type { FreshContext } from "$fresh/server.ts";
import { accesslog } from "utils/accesslog.ts";
import { captureException } from "utils/sentry.ts";

export async function handler(req: Request, ctx: FreshContext) {
	try {
		// Primero, ejecutamos el accesslog
		const accesslogResponse = await accesslog(req, ctx);

		// Si accesslog devuelve una respuesta, la retornamos
		if (accesslogResponse) {
			return accesslogResponse;
		}

		// Si no, continuamos con el siguiente middleware o ruta
		const resp = await ctx.next();
		return resp;
	} catch (error) {
		// Capturamos cualquier error con Sentry
		captureException(error, {
			contexts: {
				request: {
					url: req.url,
					method: req.method,
					headers: Object.fromEntries(req.headers.entries()),
				},
			},
		});

		// Opcionalmente, puedes manejar el error aquí
		// Por ejemplo, devolver una página de error personalizada
		// return new Response("Internal Server Error", { status: 500 });

		// O simplemente relanzar el error para que Fresh lo maneje
		throw error;
	}
}
