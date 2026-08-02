# Smart Expense Tracker API

A lightweight, robust, fully-tested RESTful API for managing personal expenses, built using **Node.js**, **Express**, **Jest**, and **Supertest**. Expenses are persisted in a local `expenses.json` file — no database required.

The project also includes a **premium web UI** (bonus) served at `http://localhost:3000`, alongside an **interactive OpenAPI/Swagger documentation** page at `http://localhost:3000/docs`.

---

## What Was Built

- A RESTful JSON API in **Node.js + Express** with 5 core endpoints
- Persistent storage via a local **`expenses.json`** file using atomic writes to prevent data corruption
- Input validation with clear, descriptive error messages (no third-party validation library)
- Category filtering and keyword search on the list endpoint
- Overall and per-category totals with floating-point precision rounding
- A **15-test automated suite** using Jest + Supertest with fully isolated test fixtures
- Bonus: **Swagger/OpenAPI interactive docs** at `/docs`
- Bonus: **Web UI** served at `/`

---

## Features

- ➕ **Add an Expense**: Create new expenses with `title`, `amount` (> 0), `category`, and `date`. Generates unique UUIDs.
- 📋 **View Expenses**: Retrieve all stored expenses.
- 🔍 **Filter & Search**: Filter expenses by `category` (case-insensitive) or search by keyword in `title`.
- 📊 **Calculate Totals**: Get overall total spending and breakdown by category with clean 2-decimal place precision.
- 🗑️ **Delete Expense**: Remove an expense by ID.
- 📖 **Interactive Swagger UI (Bonus)**: Interactive OpenAPI documentation built-in at `/docs`.

---

## Prerequisites

- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher

---

## How to Install Dependencies

To install all required runtime and development dependencies, run:

```bash
npm install
```

---

## How to Start the Server

To launch the API server locally:

```bash
npm start
```

The server will start at:
- **API Base URL**: `http://localhost:3000`
- **Interactive Swagger Docs**: `http://localhost:3000/docs`

---

## How to Run Tests

To execute the automated Jest test suite:

```bash
npm test
```

---

## API Endpoint Reference

| Method | Endpoint | Description | Query Parameters / Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/expenses` | Add a new expense | Body: `{ title, amount, category, date? }` |
| `GET` | `/expenses` | View all expenses | Optional: `?category=Food`, `?search=groc` |
| `GET` | `/expenses/totals` | Get total expenses overall & by category | None |
| `GET` | `/expenses/:id` | View expense details by ID | None |
| `DELETE` | `/expenses/:id` | Delete an expense by ID | None |
| `GET` | `/docs` | Interactive OpenAPI / Swagger UI | None |

---

## Project Structure

```
your-repo/
  README.md        # Installation, server startup, and testing instructions
  AI_NOTES.md      # Transparent AI usage notes, code comparisons, and technical validation
  package.json     # Node.js dependencies and script definitions
  .gitignore       # Excludes node_modules/, data/, temp files
  src/
    app.js         # Express application routes and input validation
    server.js      # Entry point — HTTP server on port 3000
    repository.js  # JSON file persistence (atomic writes, filtering, totals)
    swagger.js     # Swagger/OpenAPI documentation configuration
  tests/
    api.test.js    # 15-test integration suite (Jest + Supertest, isolated fixtures)
  public/
    index.html     # Bonus: standalone web UI served at http://localhost:3000
```
