# Batloung Farm Distribution Management System

A full-stack web application for Batloung Farm (Maseru, Lesotho): manage suppliers, fruits, vendors, purchases, sales, payments and stock, with stock tracked **separately for small, medium and large boxes**.

**Stack:** React (Vite) · Node.js · Express · MySQL (`mysql2`)

```
batloung-farm/
├── database/            schema.sql · seed.sql · reports.sql
├── backend/
│   ├── server.js
│   ├── scripts/demo-transactions.js
│   └── src/ config/ (db, constants) · routes/ · controllers/ · models/ · middleware/ · utils/
└── frontend/            React app (pages, components, API client)
```

## 1. Database
Requires MySQL 8+ (or MariaDB 10.5+).
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```
`reports.sql` contains the four required reporting queries (plus outstanding balances).

### Upgrading an existing database
If you created the database before vendor maps were added, run the migration once (it adds `latitude` / `longitude` to `vendors` and fills approximate pins for the seeded vendors):
```bash
mysql -u root -p < database/migrations/001_vendor_coordinates.sql
```

## 2. Backend
```bash
cd backend
cp .env.example .env     # then put your MySQL password in .env (DB_NAME must be batloung_farm)
npm install
npm run dev              # or: npm start   -> http://localhost:5000
```
If MySQL is down the API **stays running** and answers with `503 Database is currently unavailable`. Check `GET /api/health`.

## 3. Frontend
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173  (proxies /api to port 5000)
```
For production set `VITE_API_URL=https://your-api-host/api`, run `npm run build`, and host `dist/` (configure the host to rewrite all paths to `index.html`).

## Vendor map
Open **Vendor map** in the sidebar.
- **Where vendors are:** every vendor with a pin appears on the map. Pin or move a vendor from **Vendors > Edit** (click the map, drag the pin, search by name, or use your current position).
- **Your location:** the browser asks for permission and then tracks you live (blue pulsing dot, accuracy ring, "You are here" label). If permission is blocked, or you are on a desktop with a rough location, use **Set position manually** and click the map. Geolocation needs `https://` or `http://localhost`.
- **Travel time:** pick a vendor to see drive, cycle and walk time and distance from your position, with the route drawn on the map and an **Open directions** link for turn-by-turn navigation.
- **Hospitals and shops:** the Hospitals and Shops tabs list what is within 1, 2, 5 or 10 km of you (or of the selected vendor), nearest first.
- Starting point when location is unavailable: set `VITE_FARM_LAT` / `VITE_FARM_LNG` in `frontend/.env`.
- Data sources (free, no API keys): OpenStreetMap tiles, OSRM routing (routing.openstreetmap.de), Overpass (places) and Nominatim (address search). Hospital and shop coverage depends on what OpenStreetMap contributors have mapped. Seeded vendor pins are approximate.

## Design decisions
- **Packaging-specific stock:** `stock` has one row per fruit **and** size (`UNIQUE(fruit_id, packaging_size)`, `CHECK(available_quantity >= 0)`). The selling price per size also lives here.
- **Extra table `payments`** (9th table) stores each cash / mobile-money payment. `sales` additionally has `amount_paid` and `payment_method`.
- **Totals are always calculated by the server**, never typed in.
- **Atomic operations:** purchases, sales and payments use `BEGIN` / `COMMIT` / `ROLLBACK`. Sales lock stock rows with `SELECT ... FOR UPDATE` and use a guarded `UPDATE ... WHERE available_quantity >= ?`, so stock can never go negative.

## API summary (base `/api`)
| Area | Endpoints |
|---|---|
| Suppliers | `POST /suppliers` · `GET /suppliers` · `GET /suppliers/:id` · `PUT /suppliers/:id` · `DELETE /suppliers/:id` (409 if it has purchases) |
| Fruits | `POST /fruits` · `GET /fruits` (`?all=true` includes inactive) · `GET /fruits/:id` · `PUT /fruits/:id` · `GET /fruits/:id/stock` |
| Stock | `GET /stock` · `GET /stock/low?threshold=15` · `PUT /stock/:id/price` |
| Vendors | `POST /vendors` · `GET /vendors` · `GET /vendors/search?q=` · `GET /vendors/:id` · `PUT /vendors/:id` |
| Purchases | `POST /purchases` · `GET /purchases` · `GET /purchases/:id` |
| Sales | `POST /sales` · `GET /sales` · `GET /sales/:id` · `POST /sales/:id/payments` |
| Reports | `GET /reports/summary` · `/top-fruits` · `/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD` · `/top-vendor` · `/stock-levels` |

Status codes: `200`, `201`, `400` (validation / insufficient stock), `404`, `409` (conflict), `503` (database down), `500`.

### Example sale
```json
POST /api/sales
{ "vendor_id": 2, "payment_method": "CASH", "amount_paid": 100,
  "items": [ {"fruit_id": 2, "packaging_size": "SMALL", "quantity": 2},
             {"fruit_id": 1, "packaging_size": "LARGE", "quantity": 3} ] }
```
`payment_method`: `CASH`, `MOBILE_MONEY` or `CREDIT`. Status becomes `PAID`, `PARTIALLY_PAID` or `UNPAID` automatically.

### Transaction demo (for your video)
A vendor asks for 10 large boxes of apples but only 8 exist: the whole sale is rejected (`400`), no stock changes and no sale row is created. Run:
```bash
cd backend && npm run demo:transactions
```
It sends a two-item sale where the second item fails, then prints stock before and after (identical).

## Rubric map
Part A → `database/` · Part B → `backend/src` structure, `.env`, `config/db.js` · Part C → `routes/` + `controllers/` + `middleware/validate.js` · Part D → `models/sale.model.js`, `purchase.model.js`, `report.model.js`, `utils/payment.js`.
