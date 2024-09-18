import { FreshContext } from "$fresh/server.ts";

const defaultFormat =
  ':ip - :userID [:clfDate] ":method [:statusCode] :url :protocol/:httpVersion" :contentLength ":referer" ":userAgent"';

export async function accesslog(req: Request, ctx: FreshContext) {
  const start = new Date();

  const xForwardedFor = req.headers.get("x-forwarded-for");
  const xRealIp = req.headers.get("x-real-ip");
  const remoteAddress = xForwardedFor || xRealIp || req.url;

  const response = await ctx.next();

  const headers = response.headers;

  headers.set("Access-Control-Allow-Origin", "*");
  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    console.log("Handling preflight request");
    return new Response(null, { headers });
  }

  const end = new Date();
  const delta = end.getTime() - start.getTime();
  const data = {
    ":clfDate": formatDate(end),
    ":contentLength": response.headers.get("content-length") || "-",
    ":delta": delta.toString(),
    ":endDate": end.toISOString(),
    ":endTime": end.getTime().toString(),
    ":host": encode(req.headers.get("host") || "-"),
    ":httpVersion": "1.1", // Deno Fresh usa HTTP/1.1
    ":ip": remoteAddress,
    ":Xip": encode(remoteAddress || "-"),
    ":method": req.method,
    ":protocol": req.url.startsWith("https") ? "HTTPS" : "HTTP",
    ":referer": encode(req.headers.get("referer") || "-"),
    ":startDate": start.toISOString(),
    ":startTime": start.getTime().toString(),
    ":statusCode": response.status.toString(),
    ":url": encode(req.url),
    ":urlDecoded": encode(decodeURIComponent(req.url)),
    ":userID": encode(basiAuthUserID(req) || "-"),
    ":userAgent": encode(req.headers.get("user-agent") || "-"),
  };

  console.log(template(defaultFormat, data));

  return response;
}

function basiAuthUserID(req: Request): string | undefined {
  const authorization = req.headers.get("authorization");
  if (!authorization) return undefined;
  const encoded = authorization.split(" ")[1];
  const decoded = atob(encoded);
  return decoded.split(":")[0];
}

// replace :variable and :{variable} in `s` with what's in `d`
function template(s: string, d: Record<string, string>): string {
  s = s.replace(/(:[a-zA-Z]+)/g, (match, key) => d[key] || "");
  return s.replace(/:{([a-zA-Z]+)}/g, (match, key) => d[":" + key] || "");
}

// make a string safe to put in double quotes in CLF
function encode(s: string): string {
  return s.replace(/\\/g, "\\x5C").replace(/"/g, "\\x22");
}

// Custom date format similar to CLF format
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).replace(",", "").replace(" ", "/").replace(" ", ":").replace(" ", " ");
}
