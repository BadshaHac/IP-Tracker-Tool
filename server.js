const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT) || 8080;
const HOST = "0.0.0.0";
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";

  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (error.code === "ENOENT") {
        sendJson(response, 404, { error: "Not found" });
        return;
      }

      sendJson(response, 500, { error: "Unable to read file" });
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=3600"
    });
    response.end(data);
  });
}

function requestJson(targetUrl) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      targetUrl,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "ip-tracker-tool/1.0"
        }
      },
      (response) => {
        let body = "";

        response.on("data", (chunk) => {
          body += chunk;
        });

        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`Provider returned ${response.statusCode}`));
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(new Error("Provider returned invalid JSON"));
          }
        });
      }
    );

    request.on("error", () => {
      reject(new Error("Provider request failed"));
    });

    request.setTimeout(5000, () => {
      request.destroy(new Error("Provider timeout"));
    });
  });
}

function normalizeIpWhoIsPayload(data) {
  return {
    ip: data.ip || "",
    type: data.type || "",
    city: data.city || "",
    region: data.region || "",
    country: data.country || "",
    countryCode: data.country_code || "",
    postal: data.postal || "",
    latitude: typeof data.latitude === "number" ? data.latitude : null,
    longitude: typeof data.longitude === "number" ? data.longitude : null,
    continent: data.continent || "",
    timezone: data.timezone || null,
    currencyCode: data.currency_code || "",
    currency: data.currency || "",
    org: data.org || "",
    isp: data.connection?.isp || "",
    asn: data.connection?.asn || "",
    mobile: typeof data.connection?.mobile === "boolean" ? data.connection.mobile : null,
    proxy: typeof data.security?.proxy === "boolean" ? data.security.proxy : null,
    tor: typeof data.security?.tor === "boolean" ? data.security.tor : null,
    provider: "ipwho.is"
  };
}

function normalizeIpApiPayload(data, query) {
  return {
    ip: query || data.ip || "",
    type: query && query.includes(":") ? "ipv6" : "ipv4",
    city: data.city || "",
    region: data.region || "",
    country: data.country_name || data.country || "",
    countryCode: data.country_code || "",
    postal: data.postal || "",
    latitude: typeof data.latitude === "number" ? data.latitude : null,
    longitude: typeof data.longitude === "number" ? data.longitude : null,
    continent: data.continent_code || "",
    timezone: data.timezone
      ? {
          id: data.timezone,
          utc: data.utc_offset || ""
        }
      : null,
    currencyCode: data.currency || "",
    currency: "",
    org: data.org || "",
    isp: data.org || "",
    asn: data.asn || "",
    mobile: null,
    proxy: null,
    tor: null,
    provider: "ipapi.co"
  };
}

function normalizeCountryIsPayload(data, query) {
  return {
    ip: query || data.ip || "",
    type: query && query.includes(":") ? "ipv6" : "ipv4",
    city: data.city || "",
    region: data.subdivision?.name || data.subdivision || "",
    country: data.country?.name || data.country || "",
    countryCode: data.country?.code || data.country_code || "",
    postal: data.postal || "",
    latitude: typeof data.location?.latitude === "number" ? data.location.latitude : null,
    longitude: typeof data.location?.longitude === "number" ? data.location.longitude : null,
    continent: data.continent?.name || data.continent || "",
    timezone: null,
    currencyCode: "",
    currency: "",
    org: data.asn?.organization || "",
    isp: data.asn?.organization || "",
    asn: data.asn?.asn || "",
    mobile: null,
    proxy: null,
    tor: null,
    provider: "country.is"
  };
}

async function lookupIp(query) {
  const cleanQuery = query.trim();
  const providers = [
    async () => {
      const url = cleanQuery ? `https://ipwho.is/${encodeURIComponent(cleanQuery)}` : "https://ipwho.is/";
      const data = await requestJson(url);

      if (!data.success) {
        throw new Error(data.message || "ipwho.is could not resolve that IP");
      }

      return normalizeIpWhoIsPayload(data);
    },
    async () => {
      const url = cleanQuery
        ? `https://ipapi.co/${encodeURIComponent(cleanQuery)}/json/`
        : "https://ipapi.co/json/";
      const data = await requestJson(url);

      if (data.error) {
        throw new Error(data.reason || data.message || "ipapi.co could not resolve that IP");
      }

      return normalizeIpApiPayload(data, cleanQuery);
    },
    async () => {
      const suffix = cleanQuery ? `/${encodeURIComponent(cleanQuery)}` : "/";
      const url = `https://api.country.is${suffix}?fields=city,continent,subdivision,postal,location,asn`;
      const data = await requestJson(url);
      return normalizeCountryIsPayload(data, cleanQuery);
    }
  ];

  const failures = [];

  for (const provider of providers) {
    try {
      return await provider();
    } catch (error) {
      failures.push(error.message || "Unknown provider error");
    }
  }

  throw new Error(failures.join(" | "));
}

function isSafePath(filePath) {
  return filePath.startsWith(ROOT);
}

function handleStaticRequest(requestPath, response) {
  const safePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const normalizedPath = path.normalize(safePath);
  const filePath = path.join(ROOT, normalizedPath);

  if (!isSafePath(filePath) || normalizedPath.startsWith("..")) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  sendFile(response, filePath);
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && requestUrl.pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/lookup") {
    try {
      const data = await lookupIp(requestUrl.searchParams.get("ip") || "");
      sendJson(response, 200, data);
    } catch (error) {
      sendJson(response, 502, {
        error: "Lookup failed",
        details: "All lookup providers were unavailable for this request."
      });
    }
    return;
  }

  if (request.method === "GET") {
    handleStaticRequest(requestUrl.pathname, response);
    return;
  }

  sendJson(response, 405, { error: "Method not allowed" });
});

server.listen(PORT, HOST, () => {
  console.log(`IP Tracker Tool running at http://localhost:${PORT}`);
});
