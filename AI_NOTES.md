# AI Notes & Engineering Transparency

This document details how AI assistance was utilized during the development of the **Smart Expense Tracker API**, focusing specifically on the **hardest technical challenges**, code validations, refactorings, and design decisions.

---

## 1. Code Breakdown: AI-Generated vs. Human-Written

Rather than generating a generic project scaffold, AI was used as an interactive pair-programming assistant for specific complex logic components.

| Component / Technical Challenge | AI Contribution | Human Validation & Code Modification | Reason for Change |
| :--- | :--- | :--- | :--- |
| **File Storage & Concurrency** (`src/repository.js`) | Basic `fs.readFileSync` and `fs.writeFileSync` code snippets. | Replaced direct write with **Atomic Write Pattern** (`fs.writeFileSync` to temporary file `.tmp` + `fs.renameSync`). | Direct file writes risk corrupting `expenses.json` if a request fails mid-write or under concurrent HTTP requests. Atomic renaming guarantees file integrity. |
| **Floating-Point Currency Precision** (`src/repository.js` & `src/app.js`) | Standard `Array.reduce` accumulator logic for calculating totals. | Implemented `Math.round(amount * 100) / 100` across single items and aggregated totals. | JavaScript standard binary floating-point math causes precision bugs (e.g. `0.1 + 0.2 = 0.30000000000000004`). Explicit rounding ensures currency values are exact. |
| **Test Fixture Isolation** (`tests/api.test.js`) | Basic Supertest test structure pointing to the live `expenses.json`. | Implemented `fs.mkdtempSync` in `beforeEach` and cleanup in `afterEach` for isolated temporary test files. | Testing against live files risks mutating production data and causes non-deterministic test failures when running tests in parallel. |

---

## 2. Deep Dive: Key Code Comparisons

### Case Study 1: Atomic File Persistence (`src/repository.js`)

#### ❌ Initial AI Suggestion:
```javascript
// AI suggested basic synchronous write directly to target file
_writeToFile(expenses) {
  fs.writeFileSync(this.filePath, JSON.stringify(expenses, null, 2));
}
```

#### ✅ Human Modification & Final Code:
```javascript
// Upgraded to Atomic File Write to prevent partial write corruption
_writeToFile(expenses) {
  const data = JSON.stringify(expenses, null, 2);
  const tempPath = `${this.filePath}.tmp`;
  fs.writeFileSync(tempPath, data, 'utf8');
  fs.renameSync(tempPath, this.filePath);
}
```
* **Why**: On operating system file systems, `renameSync` is atomic. If the process is interrupted during stringification or writing, the original `expenses.json` remains uncorrupted.

---

### Case Study 2: Category Totals Aggregation & Precision (`src/repository.js`)

#### ❌ Initial AI Suggestion:
```javascript
// AI suggested direct arithmetic addition
for (const expense of expenses) {
  overallTotal += expense.amount;
  byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
}
```

#### ✅ Human Modification & Final Code:
```javascript
// Added rounding protection for currency values
for (const expense of expenses) {
  const amt = Number(expense.amount) || 0;
  overallTotal += amt;
  const cat = expense.category || 'Uncategorized';
  byCategory[cat] = (byCategory[cat] || 0) + amt;
}

overallTotal = Math.round(overallTotal * 100) / 100;
for (const cat in byCategory) {
  byCategory[cat] = Math.round(byCategory[cat] * 100) / 100;
}
```
* **Why**: Prevents unwanted trailing decimal digits when summing floating-point currency numbers.

---

## 3. AI Suggestions Decided NOT to Use (And Why)

1. **Database Integration (MongoDB / Mongoose / SQLite)**
   - *AI Suggestion*: The AI suggested setting up Mongoose or SQLite with Prisma ORM for data persistence.
   - *Decision*: **Rejected**.
   - *Reason*: The project specifications explicitly stated: *"Data can be stored in memory or a local JSON file; no database is required."* Introducing a database would add unnecessary setup friction for automated evaluation.

2. **JWT Authentication & User Roles**
   - *AI Suggestion*: AI prompted adding JSON Web Token (JWT) authorization middleware.
   - *Decision*: **Rejected**.
   - *Reason*: Out of scope for the core requirements and would break automated testing if unexpected authorization headers were mandated.

3. **Complex Third-Party Validation Library (`Joi` / `Zod`)**
   - *AI Suggestion*: Adding `joi` schema validation package as a dependency.
   - *Decision*: **Rejected**.
   - *Reason*: Native JavaScript validation functions (`typeof`, `isNaN`, `trim()`) in `src/app.js` are simpler, faster, require zero external dependencies, and are easier to inspect and maintain.
