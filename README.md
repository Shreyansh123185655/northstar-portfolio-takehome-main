# Northstar Portfolio

## Overview
Northstar Portfolio is a minimal, beautifully designed full-stack application built for tracking investment holdings. It supports basic JWT authentication, multi-tenant data isolation, CSV uploads with validation, and a sleek dashboard showing portfolio start/end values, period return, and market value by asset class natively parameterized matching design mockups.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS (v3), Custom CSS Animations
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Infrastructure**: Docker Compose

## How to Run

1. Clone the project.
2. Ensure you have Docker running on your system.
3. Start the entire stack (Database, Backend API, and Frontend) using Docker Compose:
   ```bash
   docker compose up --build -d
   ```
4. Open your browser and navigate to the frontend URL: `http://localhost:5173`.

## Login Credentials

There are two seeded users available for testing multi-tenant isolation:

**Tenant 1 — Alpha Capital**
- Email: `tenant_a@example.com`
- Password: `Password123!`

**Tenant 2 — Beacon Advisors**
- Email: `tenant_b@example.com`
- Password: `Password123!`

## Testing the Upload Flow
We have provided sample CSV files to test the application logic (which can also be downloaded directly from the UI):
- **`sample_good.csv`**: A clean, valid CSV.
- **`sample_dirty.csv`**: Contains a duplicate row to demonstrate backend validation and error handling.

The upload endpoint expects a CSV file with a header row exactly as follows:
```csv
date,ticker,asset_class,quantity,price
```

## Validation

The CSV upload includes robust validation logic:
- Ensures all expected headers are present.
- Validates the date, quantity (positive number), and price (positive number).
- Performs duplicate detection based on normalized values.
- If any validation error is encountered, the upload is atomic and completely rejected.

## Calculations

- **Market Value**: Computed by the backend as `quantity * price`.
- **Period Return**: Computed as `(end_market_value - start_market_value) / start_market_value`.
  - `start_market_value`: Total market value of all holdings on the earliest available date for that tenant.
  - `end_market_value`: Total market value of all holdings on the latest available date for that tenant.

## Tenant Isolation

Tenant ID isolation is strictly enforced on the server-side via JWT contexts. All SQL queries use parameterized clauses driven by the authenticated context, ensuring completely isolated datasets.

## Assumptions

- We assume a simplified upload model: uploading a new CSV completely replaces the prior holdings for that tenant. This prevents data duplication issues if a user uploads the same dataset repeatedly.
- Passwords for the seeded accounts are pre-hashed and stored securely in the database init script (`seed.sql`).
