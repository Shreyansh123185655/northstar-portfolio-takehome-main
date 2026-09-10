# Northstar Portfolio

## Overview
Northstar Portfolio is a minimal, junior full-stack application built for tracking investment holdings. It supports basic JWT authentication, multi-tenant data isolation, CSV uploads with validation, and a dashboard showing portfolio start/end values, period return, and market value by asset class.

## Tech Stack
- React, TypeScript, Vite, Tailwind CSS, Recharts
- Node.js, Express
- PostgreSQL
- Docker Compose

## How to Run

1. Clone or copy the project.
2. Start the database and backend API using Docker Compose:
   ```bash
   docker compose up --build
   ```
3. In a separate terminal window, start the frontend development server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Open your browser and navigate to the frontend URL (usually `http://localhost:5173`).

## Environment Variables

Copy `.env.example` to `.env` in the project root if you want to override defaults.
- `DATABASE_URL` (e.g., `postgres://postgres:password@localhost:5432/northstar`)
- `JWT_SECRET`
- `PORT` (for API)
- `VITE_API_URL` (for frontend, defaults to `http://localhost:3000`)

## Login Credentials

There are two seeded users available for testing multi-tenant isolation:

**Tenant 1 — Alpha Capital**
- Email: `tenant_a@example.com`
- Password: `Password123!`

**Tenant 2 — Beacon Advisors**
- Email: `tenant_b@example.com`
- Password: `Password123!`

## CSV Format

The upload endpoint expects a CSV file with a header row exactly as follows:
```csv
date,ticker,asset_class,quantity,price
```

## Validation

The CSV upload includes basic validation logic:
- Ensures all expected headers are present.
- Validates the date, quantity (positive number), and price (positive number).
- Performs generic duplicate detection. It constructs a unique key for each row based on the normalized values (`date_ticker_asset_class_quantity_price`).
- If any validation error is encountered (such as a duplicate row), the upload is completely rejected (atomic upload), and no rows are inserted.

## Calculations

- **Market Value**: Computed by the backend as `quantity * price`.
- **Period Return**: Computed as `(end_market_value - start_market_value) / start_market_value`.
  - `start_market_value`: Total market value of all holdings on the earliest available date for that tenant.
  - `end_market_value`: Total market value of all holdings on the latest available date for that tenant.

## Tenant Isolation

Tenant ID isolation is strictly enforced on the server-side.
- When a user logs in, the `tenant_id` is encoded into the JWT.
- During any API request (like upload or dashboard fetch), the middleware extracts the `tenant_id` from the JWT context.
- All SQL queries use parameterized clauses like `WHERE tenant_id = $1` driven by the authenticated context, completely ignoring any tenant IDs provided via URL or request body.

## Assumptions

- We assume a simplified upload model: uploading a new CSV completely replaces the prior holdings for that tenant. This prevents data duplication issues if a user uploads the same dataset repeatedly.
- Passwords for the seeded accounts are pre-hashed and stored securely in the database init script (`seed.sql`).

## If I Had More Time

- **Robust Validation**: Use a library like Zod for strict type and schema validation on the backend API endpoints.
- **Frontend State Management**: Utilize React Query or SWR for improved fetching, caching, and error handling on the frontend.
- **Optimized SQL Queries**: Implement better indexing on the `holdings` table (e.g., on `tenant_id` and `holding_date`).
- **Improved UI Components**: Use accessible component libraries (like Radix or Headless UI) and add proper loading skeletons instead of simple text messages.
