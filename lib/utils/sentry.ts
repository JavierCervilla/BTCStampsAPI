import * as Sentry from "https://deno.land/x/sentry/index.mjs";

Sentry.init({
	dsn: "https://7a610f8673abbc527dc31649f1a4b4a2@o4508006597656576.ingest.de.sentry.io/4508006601719888",

	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for performance monitoring.
	// We recommend adjusting this value in production
	tracesSampleRate: 1.0,
});

setTimeout(() => {
	throw new Error();
});
