import { captureException } from "utils/sentry.ts";

// biome-ignore lint/complexity/noStaticOnlyClass: Better organization this way.
export class ResponseUtil {
	static success<T>(data: T, status = 200): Response {
		return new Response(JSON.stringify(data), {
			status,
			headers: { "Content-Type": "application/json" },
		});
	}

	static successArray<T>(data: T[], status = 200): Response {
		return new Response(JSON.stringify(data), {
			status,
			headers: { "Content-Type": "application/json" },
		});
	}

	static error(message: string, status = 400): Response {
		return new Response(JSON.stringify({ error: message }), {
			status,
			headers: { "Content-Type": "application/json" },
		});
	}

	static custom<T>(body: T, status: number): Response {
		return new Response(JSON.stringify(body), {
			status,
			headers: { "Content-Type": "application/json" },
		});
	}

	static notFound(message = "Resource not found"): Response {
		return new Response(JSON.stringify({ error: message }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	static handleError(error: unknown, defaultMessage: string): Response {
		console.error(error.message);
		captureException(error);
		const message = error instanceof Error ? error.message : defaultMessage;
		return ResponseUtil.error(message, 500);
	}
}
