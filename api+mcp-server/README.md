# Ceylon Spice Company API + MCP Server

A standalone Node.js/TypeScript demonstration service representing a spice-selling company's internal product system. It owns the catalogue and exposes it in two ways:

- a conventional read-only REST API for the company website;
- a Streamable HTTP MCP endpoint for trusted AI clients such as Project Echo.

Echo receives no database access and contains no spice catalogue logic.

## Run locally

Requires Node.js 20 or newer.

```powershell
npm install
npm run dev
```

The default endpoints are:

- `GET http://127.0.0.1:3001/health`
- `GET http://127.0.0.1:3001/api/products`
- `GET http://127.0.0.1:3001/api/products/SP-001`
- `POST http://127.0.0.1:3001/mcp`

## MCP tools

- `search_spice_products`
- `get_spice_product`
- `check_spice_stock`

All tools are intentionally read-only. Product data is currently seeded in memory to keep the first implementation easy to run. The service layer can later be connected to the demo website's database without changing Echo.

## Build and test

```powershell
npm test
npm run build
npm start
```

## Connect Project Echo

Install Echo's updated Python dependencies and ensure these values are available in its `.env` if the defaults are unsuitable:

```dotenv
MCP_ENABLED=true
SPICE_MCP_URL=http://127.0.0.1:3001/mcp
MCP_CONNECTION_TIMEOUT_SECONDS=5
```

Start this service before Echo. If it is unavailable, Echo logs a warning and continues with its native tools.
