# IP Tracker Tool

A polished IP tracker web app that looks up geolocation and network details for any public IPv4 or IPv6 address.

## Features

- Detect your current public IP or look up any IP manually
- Backend lookup endpoint to avoid browser-side API/CORS failures
- Provider fallback between `ipwho.is` and `ipapi.co`
- Responsive UI with location, timezone, ASN, ISP, continent, and security hints
- No external runtime dependencies for the server

## Run locally

1. Open a terminal in this folder.
2. Start the app:

```bash
npm start
```

3. Open `http://localhost:8080`

## Open without a server

You can also open `index.html` directly as a `file://` page for a lightweight browser-only mode.

- In `file://` mode, the app calls public IP providers directly from the browser.
- In `http://localhost:8080` mode, the local server proxies requests and is more reliable.
- If browser-only mode fails, use `npm start` and open `http://localhost:8080`.

## Project structure

- `index.html` - main UI markup
- `styles.css` - styling and responsive layout
- `script.js` - client-side interactions
- `server.js` - local Node server and IP lookup proxy
- `package.json` - project metadata and start script

## API

- `GET /api/health`
- `GET /api/lookup?ip=8.8.8.8`

If `ip` is omitted, the server resolves the current public IP based on the request.
