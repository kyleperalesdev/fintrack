# FinTrack

A personal finance tracker for logging daily income and expenses, visualizing spending patterns, and monitoring savings goals. Built as a self-hosted web app with a mobile-first responsive UI.

---

## Features

- **Daily Entries** — Log income and expenses for any date; edit or delete entries inline
- **Breakdown** — Pie chart and category list showing spending or income distribution for any date range
- **History** — Chronological transaction log with date range filtering and per-day totals
- **Observations** — Savings rate tracker (35% target), daily averages, spending trend line chart, and top expense categories bar chart
- **Import** — 3-step wizard to bulk-import transactions from an Excel (.xlsx) file with category mapping and duplicate detection
- **Dark mode** — Toggle between light and dark themes; preference persists across sessions
- **Responsive** — Full mobile support with a bottom tab bar on small screens

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express |
| Database | SQLite (via better-sqlite3) |
| Deployment | Docker Compose |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Or: Node.js 20+ for local development

### Run with Docker (recommended)

```bash
docker compose up --build
```

The app will be available at **http://localhost:8080**.

Data is persisted in a named Docker volume (`sqlite_data`) so it survives container restarts and rebuilds.

### Run locally for development

**Backend**

```bash
cd backend
npm install
npm run dev        # starts on http://localhost:3001 with hot-reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev        # starts on http://localhost:5173
```

The Vite dev server proxies all `/api/*` requests to the backend at `localhost:3001`, so no CORS configuration is needed during development.

---

## Project Structure

```
fintrack/
├── backend/
│   ├── routes/
│   │   ├── entries.js     # CRUD endpoints for transactions
│   │   └── import.js      # Excel import: parse, duplicate check, confirm
│   ├── db.js              # SQLite connection and schema init
│   └── server.js          # Express app entry point
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Daily.jsx
│       │   ├── Breakdown.jsx
│       │   ├── History.jsx
│       │   ├── Observations.jsx
│       │   └── Import.jsx
│       ├── components/
│       │   ├── Navigation.jsx
│       │   ├── EntryForm.jsx
│       │   └── EntryCard.jsx
│       ├── api.js          # Fetch wrappers for all API calls
│       └── ThemeContext.jsx
├── docker-compose.yml
└── deploy.ps1              # One-command deploy to home server
```

---

## API Reference

All endpoints are prefixed with `/api`.

### Entries

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/entries` | List entries. Query params: `date`, `from`, `to`, `type` |
| `GET` | `/api/entries/summary` | Aggregated totals, categories, and daily breakdown |
| `POST` | `/api/entries` | Create an entry |
| `PUT` | `/api/entries/:id` | Update an entry |
| `DELETE` | `/api/entries/:id` | Delete an entry |

**Entry shape**

```json
{
  "id": 1,
  "date": "2025-01-15",
  "type": "expense",
  "category": "Groceries",
  "description": "Weekly supermarket run",
  "amount": 1850.00,
  "created_at": "2025-01-15 08:30:00"
}
```

### Import

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/import/parse` | Upload `.xlsx` file (multipart), returns parsed rows and category mapping suggestions |
| `POST` | `/api/import/check-duplicates` | Preview which rows match existing entries |
| `POST` | `/api/import/confirm` | Bulk-insert confirmed rows with applied category mappings |

---

## Excel Import Format

The import wizard accepts a single `.xlsx` file with exactly two sheets.

### Setup sheet

Defines the income and expense category lists used in the file. Column A = Income, Column B = Expense. Row 1 is the header.

| A — Income | B — Expense |
|---|---|
| Salary | Groceries |
| Freelance | Transportation |
| Bonus | Dining out |

### Transactions sheet

One transaction per row. Row 1 is the header. Supported column names are case-insensitive.

| Date | Type | Category | Amount | Description |
|---|---|---|---|---|
| 2025-01-15 | income | Salary | 55000 | January payroll |
| 2025-01-16 | expense | Groceries | 1200 | SM Supermarket |

- **Date** — `YYYY-MM-DD` or `MM/DD/YYYY`; Excel serial date numbers are also accepted
- **Type** — must be `income` or `expense` (case-insensitive)
- **Description** — optional

During the import wizard you can map CSV categories to existing FinTrack categories or create new ones. Likely duplicates (same date, type, category, and amount) are flagged and unchecked by default.

---

## Default Categories

**Income:** Salary, Bonus, Freelance, Other income

**Expense:** Housing & utilities, Groceries, Dining out, Transportation, Healthcare, Personal & lifestyle, Baby & family, Subscriptions, Miscellaneous

Custom categories can be created during import.

---

## Deployment

The included `deploy.ps1` script copies the project to a home server and restarts the containers:

```powershell
.\deploy.ps1
```

It runs `scp` to sync files and then `docker compose up -d --build` over SSH. Update the target host and user in the script to match your server.

---

## Database

SQLite database file is stored at `/app/data/fintrack.db` inside the container, backed by the `sqlite_data` Docker volume. For manual access:

```bash
docker exec -it <container_name> sh
sqlite3 /app/data/fintrack.db
```

Schema:

```sql
CREATE TABLE entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT    NOT NULL,
  type        TEXT    NOT NULL CHECK(type IN ('income', 'expense')),
  category    TEXT    NOT NULL,
  description TEXT    DEFAULT '',
  amount      REAL    NOT NULL CHECK(amount > 0),
  created_at  TEXT    DEFAULT (datetime('now'))
);
```
