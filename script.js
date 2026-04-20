const form = document.getElementById("ip-form");
const input = document.getElementById("ip-input");
const statusCard = document.getElementById("status-card");
const statusMessage = document.getElementById("status-message");
const resultsGrid = document.getElementById("results-grid");

const resultFields = {
  ip: document.getElementById("result-ip"),
  type: document.getElementById("result-type"),
  location: document.getElementById("result-location"),
  region: document.getElementById("result-region"),
  coordinates: document.getElementById("result-coordinates"),
  isp: document.getElementById("result-isp"),
  org: document.getElementById("result-org"),
  asn: document.getElementById("result-asn"),
  timezone: document.getElementById("result-timezone"),
  offset: document.getElementById("result-offset"),
  currency: document.getElementById("result-currency"),
  mapTitle: document.getElementById("result-map-title"),
  mapCopy: document.getElementById("result-map-copy"),
  mapLink: document.getElementById("map-link"),
  proxy: document.getElementById("result-proxy"),
  tor: document.getElementById("result-tor"),
  mobile: document.getElementById("result-mobile"),
  continent: document.getElementById("result-continent")
};

const sampleButtons = document.querySelectorAll("[data-sample-ip]");
const useMyIpButton = document.getElementById("use-my-ip");
const submitButton = form.querySelector('button[type="submit"]');
const isFileProtocol = window.location.protocol === "file:";

function updateStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusCard.classList.toggle("status-error", isError);
}

function toFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) {
    return "";
  }

  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function formatTruth(value) {
  return value ? "Yes" : "No";
}

function formatOptionalTruth(value) {
  return typeof value === "boolean" ? formatTruth(value) : "Unavailable";
}

function setResultText(key, value) {
  resultFields[key].textContent = value || "Unavailable";
}

function buildMapsUrl(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number") {
    return "#";
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lon}`)}`;
}

function setLoadingState(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Tracking..." : "Track IP";
  input.disabled = isLoading;
  useMyIpButton.disabled = isLoading;
  sampleButtons.forEach((button) => {
    button.disabled = isLoading;
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

async function fetchBrowserProvider(url, parser) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Provider returned ${response.status}`);
  }

  const payload = await response.json();
  return parser(payload);
}

async function resolveBrowserLookup(query) {
  const cleanQuery = query.trim();
  const providers = [
    async () => {
      const url = cleanQuery ? `https://ipwho.is/${encodeURIComponent(cleanQuery)}` : "https://ipwho.is/";
      const data = await fetchBrowserProvider(url, (payload) => {
        if (payload.success === false) {
          throw new Error(payload.message || "ipwho.is lookup failed");
        }

        return normalizeIpWhoIsPayload(payload);
      });

      if (!data.ip) {
        throw new Error("ipwho.is did not return lookup data");
      }

      return data;
    },
    async () => {
      const url = cleanQuery
        ? `https://ipapi.co/${encodeURIComponent(cleanQuery)}/json/`
        : "https://ipapi.co/json/";
      const data = await fetchBrowserProvider(url, (payload) => {
        if (payload.error) {
          throw new Error(payload.reason || payload.message || "ipapi.co lookup failed");
        }

        return normalizeIpApiPayload(payload, cleanQuery);
      });

      if (!data.ip) {
        throw new Error("ipapi.co did not return lookup data");
      }

      return data;
    },
    async () => {
      const suffix = cleanQuery ? `/${encodeURIComponent(cleanQuery)}` : "/";
      const url = `https://api.country.is${suffix}?fields=city,continent,subdivision,postal,location,asn`;
      const data = await fetchBrowserProvider(url, (payload) => normalizeCountryIsPayload(payload, cleanQuery));

      if (!data.ip) {
        throw new Error("country.is did not return lookup data");
      }

      return data;
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

async function resolveServerLookup(query) {
  const endpoint = query ? `/api/lookup?ip=${encodeURIComponent(query)}` : "/api/lookup";
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json"
    }
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.details || payload.error || "Lookup failed");
  }

  return payload;
}

function populateResults(data) {
  const cityLine = [data.city, data.country].filter(Boolean).join(", ");
  const regionLine = [data.region, data.postal].filter(Boolean).join(" • ");
  const coords = [data.latitude, data.longitude].every((value) => typeof value === "number")
    ? `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`
    : "Unavailable";
  const timezoneLine = data.timezone?.id || data.timezone || "Unavailable";
  const offsetLine = data.timezone?.utc || "UTC offset unavailable";
  const currencyLine = [data.currencyCode, data.currency].filter(Boolean).join(" • ") || "Unavailable";
  const orgLine = data.org || "Unavailable";
  const ispLine = data.isp || "Unavailable";
  const asnLine = data.asn ? `ASN ${data.asn}` : "ASN unavailable";
  const mapUrl = buildMapsUrl(data.latitude, data.longitude);

  setResultText("ip", data.ip || "Unavailable");
  setResultText("type", `${(data.type || "Unknown").toUpperCase()} address`);
  setResultText("location", [toFlagEmoji(data.countryCode), cityLine].filter(Boolean).join(" "));
  setResultText("region", regionLine);
  setResultText("coordinates", coords);
  setResultText("isp", ispLine);
  setResultText("org", orgLine);
  setResultText("asn", asnLine);
  setResultText("timezone", timezoneLine);
  setResultText("offset", offsetLine);
  setResultText("currency", currencyLine);
  setResultText("mapTitle", cityLine || "Approximate geolocation");
  setResultText("mapCopy", `Location data is approximate and was resolved via ${data.provider}.`);
  setResultText("proxy", formatOptionalTruth(data.proxy));
  setResultText("tor", formatOptionalTruth(data.tor));
  setResultText("mobile", formatOptionalTruth(data.mobile));
  setResultText("continent", data.continent || "Unavailable");

  resultFields.mapLink.href = mapUrl;
  resultFields.mapLink.textContent = mapUrl === "#" ? "Map unavailable" : "Open in Google Maps";
  resultsGrid.hidden = false;
}

async function lookupIp(ipValue = "") {
  const query = ipValue.trim();
  const modeLabel = isFileProtocol ? "browser mode" : "local server";

  updateStatus(query ? `Looking up ${query}...` : "Looking up your current IP...");
  resultsGrid.hidden = true;
  setLoadingState(true);

  try {
    const payload = isFileProtocol
      ? await resolveBrowserLookup(query)
      : await resolveServerLookup(query);

    populateResults(payload);
    updateStatus(`Showing results for ${payload.ip} via ${payload.provider} in ${modeLabel}.`);
  } catch (error) {
    const fallbackMessage = isFileProtocol
      ? "Lookup failed in file mode. If this browser blocks external API requests, run `npm start` and use http://localhost:8080/."
      : "Lookup failed. All providers were unavailable for this request.";
    updateStatus(fallbackMessage, true);
  } finally {
    setLoadingState(false);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  lookupIp(input.value);
});

sampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const sampleIp = button.dataset.sampleIp || "";
    input.value = sampleIp;
    lookupIp(sampleIp);
  });
});

useMyIpButton.addEventListener("click", () => {
  input.value = "";
  lookupIp("");
});

if (isFileProtocol) {
  updateStatus(
    "Running in browser-only mode. If lookups are blocked here, start the local server with `npm start` and open http://localhost:8080/.",
    false
  );
}

lookupIp("");
