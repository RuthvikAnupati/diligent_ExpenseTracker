# AI Notes

I used Claude (and some ChatGPT) throughout this project — for an initial
scaffold, for working through a couple of specific problems, and as a
second pair of eyes on the test suite. Here's what actually happened.

## What came from AI vs. what I changed

**`src/repository.js` — file persistence.** The first draft wrote
straight to `expenses.json` with `fs.writeFileSync`. That's fine most of
the time, but if the process dies mid-write (or two requests land close
together), you can end up with a half-written, corrupt JSON file. I
changed `_writeToFile` to write to a temp file first and then
`fs.renameSync` it into place:

```javascript
_writeToFile(expenses) {
  const data = JSON.stringify(expenses, null, 2);
  const tempPath = `${this.filePath}.tmp`;
  fs.writeFileSync(tempPath, data, 'utf8');
  fs.renameSync(tempPath, this.filePath);
}
```

`rename` on the same filesystem is atomic, so `expenses.json` is either
the old version or the new version — never a half-written one.

**Currency rounding.** Summing floats in JS drifts —
`0.1 + 0.2` isn't exactly `0.3`. I added
`Math.round(value * 100) / 100` both when storing an individual amount
and when computing `overallTotal` / `byCategory` in `getTotals()`, so
nothing comes back as `80.30000000000001`.

**Test isolation.** The original tests pointed straight at the real
`expenses.json`. I switched to `fs.mkdtempSync` in `beforeEach` so every
test gets its own throwaway directory and file, with cleanup in
`afterEach`. Otherwise running tests locally could quietly wipe or
mutate real data, and tests running in parallel could stomp on each
other.

**Validation logic in `src/app.js`.** I read through each check by hand
— title required and non-empty, amount required and `> 0`, category
required, date optional but must parse if present. I tested the edge
cases myself with curl (empty string title, `amount: 0`, `amount: "abc"`,
a garbage date string) to make sure each one actually returns a 400 with
a useful message instead of a 500 or silent bad data.

**The test script itself.** On a clean checkout, `npm test` was calling
`.\node_modules\.bin\jest.cmd`, which is Windows-only — it fails
immediately on Mac/Linux with `not found`. I changed the script to
`jest --runInBand --detectOpenHandles` so it runs the same way
everywhere.

## What I decided not to use

- **A real database (Mongo/SQLite/Prisma).** AI suggested this early on.
  The brief is explicit that a JSON file is enough and no database is
  required, so I skipped it — it would've added setup overhead for no
  real benefit here.
- **JWT auth.** Also suggested, also skipped — it's out of scope for
  what was asked, and I didn't want to risk breaking automated grading
  with an unexpected auth requirement.
- **A validation library (Joi/Zod).** For four fields with simple rules,
  plain `typeof` / `isNaN` / `trim()` checks in `app.js` are easier to
  read and don't add a dependency. I'd reach for a schema library if the
  input shape got more complex than this.

## Bonus features

Beyond the core CRUD + totals requirements, I added category-and-keyword
search (`?search=`) and a small static web UI at `/`, in addition to the
Swagger docs at `/docs`. `date` defaults to today if omitted rather than
being strictly required — a judgment call to make the API a little more
forgiving, not something the spec asked for either way.