# Universal Subjects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make university-wide subjects (NSTP, GE-*, PATH-FIT PE, USC mission core) display on the All Subjects page for every registered program.

**Architecture:** Add a `UNIVERSAL_PREFIXES` constant in `lib/course_mapper.js` and union it into `subjectPrefixesFor`, gated behind a known-program guard so stale/unknown course names still return nothing. No change to `lib/subjects.js`, the server, or the frontend — those already filter by whatever prefix set the mapper returns.

**Tech Stack:** Node.js, `assert` (stdlib) test files run with `node lib/<file>.test.js`. No test framework.

## Global Constraints

- Universal prefix set is exactly `["NSTP", "GE", "TPE", "EDM"]` — verbatim, no others.
- Excluded prefixes that must NOT appear: `PDEV`, `FIL`, `PEL`, `EDMA` (Senior High / graduate / mislabeled).
- `subjectPrefixesFor` for an unknown/stale course name must still return `[]`.
- `PROGRAM_PREFIXES` keys remain a subset of `courseMap` (existing invariant test must keep passing).
- Tests use Node's `assert` module only; run via `node lib/<name>.test.js`, success printed as `<name>.test.js OK`.

---

### Task 1: Add UNIVERSAL_PREFIXES and union it into subjectPrefixesFor

**Files:**
- Modify: `lib/course_mapper.js` (define constant near line 318; rewrite `subjectPrefixesFor` at lines 338-343; add to exports at lines 470-478)
- Test: `lib/course_mapper.test.js`

**Interfaces:**
- Consumes: existing `courseMap`, `PROGRAM_PREFIXES`, `DEPARTMENT_SHARED_PREFIXES`.
- Produces: `UNIVERSAL_PREFIXES` (array of strings, exported); `subjectPrefixesFor(programName: string) → string[]` — for a known program returns deduped union of own + department-shared + universal prefixes; for an unknown program returns `[]`.

- [ ] **Step 1: Write the failing tests**

Append to `lib/course_mapper.test.js`, immediately before the final
`console.log("course_mapper.test.js OK");` line:

```js
// Universal subjects (NSTP, GE, TPE, EDM) are added to every known program.
const { UNIVERSAL_PREFIXES } = require("./course_mapper");
assert.deepStrictEqual(
  UNIVERSAL_PREFIXES,
  ["NSTP", "GE", "TPE", "EDM"],
  "universal prefix set is exactly these four"
);
for (const p of UNIVERSAL_PREFIXES) {
  assert.ok(cs.includes(p), `CS program includes universal prefix ${p}`);
}

// Excluded prefixes (SHS / grad / mislabeled) must never be universal.
for (const bad of ["PDEV", "FIL", "PEL", "EDMA"]) {
  assert.ok(!UNIVERSAL_PREFIXES.includes(bad), `${bad} is not universal`);
}

// A program whose own prefixes are [] still gets shared + universal prefixes.
const ds = subjectPrefixesFor("Bachelor of Science in Data Science");
assert.ok(ds.includes("CIS"), "Data Science keeps DCISM shared CIS");
assert.ok(ds.includes("GE") && ds.includes("NSTP"), "Data Science gets universals");

// Unknown program STILL returns [] — universals are not added to stale courses.
assert.deepStrictEqual(
  subjectPrefixesFor("No Such Program"),
  [],
  "unknown program returns empty, no universals"
);
```

Note: the existing `assert.deepStrictEqual(subjectPrefixesFor("No Such Program"), [])`
at line 26 stays as-is and must keep passing.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node lib/course_mapper.test.js`
Expected: FAIL — `AssertionError` (either `UNIVERSAL_PREFIXES` is `undefined` causing a deepStrictEqual mismatch, or `cs` lacks the universal prefixes).

- [ ] **Step 3: Implement the change**

In `lib/course_mapper.js`, add the constant directly after the
`DEPARTMENT_SHARED_PREFIXES` object closes (after line 335, before the
`subjectPrefixesFor` comment at line 337):

```js
// Prefixes for subjects every program takes regardless of course:
// NSTP (mandated), GE / GE-* (general education + free electives),
// TPE (PATH-FIT college PE), EDM (USC mission core).
const UNIVERSAL_PREFIXES = ["NSTP", "GE", "TPE", "EDM"];
```

Replace the existing `subjectPrefixesFor` (lines 337-343) with:

```js
/** Own ∪ department-shared ∪ universal prefixes for a program. [] if unknown. */
function subjectPrefixesFor(programName) {
  const entry = courseMap[programName];
  if (!entry) return [];               // unknown/stale program -> no subjects
  const own = PROGRAM_PREFIXES[programName] || [];
  const shared = DEPARTMENT_SHARED_PREFIXES[entry.department] || [];
  return [...new Set([...own, ...shared, ...UNIVERSAL_PREFIXES])];
}
```

Add `UNIVERSAL_PREFIXES` to `module.exports` (after `DEPARTMENT_SHARED_PREFIXES,` at line 476):

```js
  DEPARTMENT_SHARED_PREFIXES,
  UNIVERSAL_PREFIXES,
  subjectPrefixesFor,
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node lib/course_mapper.test.js`
Expected: PASS — prints `course_mapper.test.js OK`

- [ ] **Step 5: Commit**

```bash
git add lib/course_mapper.js lib/course_mapper.test.js
git commit -m "feat: add universal subject prefixes to subjectPrefixesFor"
```

---

### Task 2: End-to-end assertion that universal subjects flow through subjectsForCourse

**Files:**
- Modify: `lib/subjects.test.js`
- Test: `lib/subjects.test.js` (same file — adds an end-to-end case)

**Interfaces:**
- Consumes: `subjectsForCourse(rows, course) → {code, description}[]` from `lib/subjects.js` (unchanged), which now sees universal prefixes for known programs via Task 1.
- Produces: nothing new — verification only.

- [ ] **Step 1: Write the failing test**

Append to `lib/subjects.test.js`, immediately before the final
`console.log("subjects.test.js OK");` line:

```js
// Universal subjects appear for a real program alongside its own subjects;
// excluded SHS/grad prefixes do not.
const uniRows = [
  { course_code: "CS 3101", course_description: "DATA STRUCTURES" },
  { course_code: "NSTP 1", course_description: "NATIONAL SERVICE TRAINING PROGRAM 1" },
  { course_code: "GE-ETHICS", course_description: "ETHICS" },
  { course_code: "TPE 1101", course_description: "PATH-FIT 1 - MOVEMENT ENHANCEMENT" },
  { course_code: "EDM 1", course_description: "THE CAROLINIAN MISSIONARY" },
  { course_code: "PDEV 01", course_description: "PERSONAL DEVELOPMENT" },
  { course_code: "FIL 02", course_description: "PAGBASA AT PAGSUSURI" },
];
const uniOut = subjectsForCourse(
  uniRows,
  "Bachelor of Science in Computer Science"
).map((r) => r.code);

for (const code of ["CS 3101", "NSTP 1", "GE-ETHICS", "TPE 1101", "EDM 1"]) {
  assert.ok(uniOut.includes(code), `universal/own subject ${code} present`);
}
for (const code of ["PDEV 01", "FIL 02"]) {
  assert.ok(!uniOut.includes(code), `excluded SHS subject ${code} absent`);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node lib/subjects.test.js`

> If Task 1 is already implemented, this test PASSES immediately — that is fine; it locks the end-to-end behavior in. If running this task before Task 1, expected: FAIL — `NSTP 1`/`GE-ETHICS`/`TPE 1101`/`EDM 1` missing because the mapper does not yet emit universal prefixes.

- [ ] **Step 3: Implement**

No production code change — Task 1 already supplies the behavior. This task only adds the regression test.

- [ ] **Step 4: Run test to verify it passes**

Run: `node lib/subjects.test.js`
Expected: PASS — prints `subjects.test.js OK`

- [ ] **Step 5: Commit**

```bash
git add lib/subjects.test.js
git commit -m "test: verify universal subjects flow through subjectsForCourse"
```

---

### Task 3: Manual verification against the real database

**Files:** none modified — verification only.

**Interfaces:** Consumes the real `sql/courses.db` and the updated `lib/course_mapper.js` / `lib/subjects.js`.

- [ ] **Step 1: Run an end-to-end check against courses.db**

Run:

```bash
node -e '
const s = require("sqlite3").verbose();
const { subjectsForCourse } = require("./lib/subjects");
const db = new s.Database("./sql/courses.db");
db.all("SELECT course_code, course_description FROM courses", [], (e, rows) => {
  if (e) throw e;
  const out = subjectsForCourse(rows, "Bachelor of Science in Computer Science");
  const codes = out.map((r) => r.code);
  const hasUni = ["NSTP 1","GE-ETHICS","TPE 1101","EDM 1"].filter((c) => codes.includes(c));
  const hasShs = codes.filter((c) => /^(PDEV|FIL|PEL|EDMA)\b/.test(c));
  console.log("universal present:", hasUni);
  console.log("SHS/grad leaked (should be empty):", hasShs);
  console.log("total CS-page subjects:", codes.length);
});
'
```

Expected:
- `universal present:` lists `NSTP 1`, `GE-ETHICS`, `TPE 1101`, `EDM 1` (whichever exact codes exist in the DB; at minimum the array is non-empty).
- `SHS/grad leaked (should be empty): []`
- `total CS-page subjects:` is larger than before the change (universals added).

- [ ] **Step 2: Run the full lib test suite**

Run: `node lib/course_mapper.test.js && node lib/subjects.test.js`
Expected: both print `... OK`.

No commit — verification only.
