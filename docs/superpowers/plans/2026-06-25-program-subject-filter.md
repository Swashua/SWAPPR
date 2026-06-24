# Program-Filtered Subject List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Executor for this plan: Codex GPT 5.5 (Extra-High reasoning).** You have zero prior conversation context; everything you need is in this document and the referenced spec.

**Goal:** Make the homepage "All Subjects" feed render the list of individual subjects (from `sql/courses.db`) filtered to the logged-in user's registered degree program, instead of 32 department cards.

**Architecture:** A subject's relevance to a program is encoded in its `course_code` prefix (e.g. `CS` = BS Computer Science only; `CIS` = shared across all programs in that department). A new prefix map in `lib/course_mapper.js` resolves a program name → its set of relevant prefixes. A new `GET /api/subjects?course=<program>` filters `courses.db` rows by that prefix set server-side. The frontend replaces the department-card view with a subject-card view. All runtime filtering is pure prefix matching — it never touches department-name strings.

**Tech Stack:** Node.js, Express, `sqlite3`, vanilla JS frontend. Tests are plain `node` scripts using the built-in `assert` module (no test framework), run as `node lib/<file>.test.js`. Matches existing `lib/cleanDepartments.test.js`.

**Spec:** [docs/superpowers/specs/2026-06-25-program-subject-filter-design.md](../specs/2026-06-25-program-subject-filter-design.md). Read it first.

## Global Constraints

- No new npm dependencies. Use only what `package.json` already has (`express`, `sqlite3`).
- Tests: built-in `assert`, top-level assertions, runnable via `node lib/<file>.test.js`. No framework, no fixtures.
- Two SQLite databases: `./sql/swappr.db` (users/notebooks) and `./sql/courses.db` (the 2465 subjects). Already opened in `server.js` as `db` and `coursesDb`.
- Registration dropdown stores the **exact full** program name (e.g. `"Bachelor of Science in Computer Science"`). These strings are the keys of `courseMap` in `lib/course_mapper.js`. Do not invent or normalize program names.
- Frontend has no test framework; frontend tasks use manual verification steps (run the server, open the page).
- Commit after each task. Conventional Commit messages.
- The prefix map in Task 1 is a **best-effort draft**; entries flagged `// REVIEW:` are the author's uncertain assignments. Transcribe them verbatim — the human owner reviews them separately. Do not "fix" or drop REVIEW entries.
- **Demo data caveat — read before any frontend verification.** `seed.js`
  seeds users with **short** course names (`"BS Computer Science"`). The
  `courseMap` keys are the **full** names (`"Bachelor of Science in Computer
  Science"`). So `subjectPrefixesFor("BS Computer Science")` → `[]` → the
  all-subjects fallback fires and the feed shows **every** subject (~2465),
  *not* a filtered list. This is expected given the stale demo data; re-seeding
  is out of scope. **To verify real filtering you MUST register a fresh user**
  (the registration dropdown stores the full program name). Logging in as a
  seed user only exercises the fallback path.
- **Stale-session caveat.** A user whose `currentUser` was written to
  `sessionStorage` *before* Task 4 shipped has no `course` field → fallback
  until they log out and back in. Self-heals on next login; no code needed.

---

### Task 1: Prefix map + `subjectPrefixesFor()` in `lib/course_mapper.js`

**Files:**
- Modify: `lib/course_mapper.js` (append new constants + function + exports; do NOT alter the existing `courseMap` object or existing exports)
- Test: `lib/course_mapper.test.js` (create)

**Interfaces:**
- Consumes: existing `courseMap` (program → `{ school, department }`) from `lib/course_mapper.js`.
- Produces:
  - `PROGRAM_PREFIXES: Record<string, string[]>` — program name → its OWN code prefixes.
  - `DEPARTMENT_SHARED_PREFIXES: Record<string, string[]>` — exact `department` string → prefixes shared by every program in that department.
  - `subjectPrefixesFor(programName: string): string[]` — own ∪ department-shared, de-duplicated; `[]` if program unknown.

- [ ] **Step 1: Write the failing test**

Create `lib/course_mapper.test.js`:

```js
// Run: node lib/course_mapper.test.js
const assert = require("assert");
const {
  subjectPrefixesFor,
  PROGRAM_PREFIXES,
  DEPARTMENT_SHARED_PREFIXES,
} = require("./course_mapper");

// CS program gets its own prefix AND the DCISM shared core, not sibling prefixes.
const cs = subjectPrefixesFor("Bachelor of Science in Computer Science");
assert.ok(cs.includes("CS"), "CS own prefix present");
assert.ok(cs.includes("CIS"), "CIS shared prefix present");
assert.ok(!cs.includes("IT"), "must not include sibling IT prefix");
assert.ok(!cs.includes("IS"), "must not include sibling IS prefix");

// Shared prefix appears for EVERY program in the department.
const it = subjectPrefixesFor("Bachelor of Science in Information Technology");
const is = subjectPrefixesFor("Bachelor of Science in Information Systems");
assert.ok(it.includes("CIS") && is.includes("CIS"), "CIS shared across DCISM");
assert.ok(it.includes("IT") && !it.includes("CS"), "IT own, no CS");

// Result is de-duplicated (no prefix twice).
assert.strictEqual(new Set(cs).size, cs.length, "no duplicate prefixes");

// Unknown program -> empty array (triggers the all-subjects fallback downstream).
assert.deepStrictEqual(subjectPrefixesFor("No Such Program"), []);

// Data integrity: every program key in PROGRAM_PREFIXES exists in courseMap.
const { courseMap } = require("./course_mapper");
for (const program of Object.keys(PROGRAM_PREFIXES)) {
  assert.ok(courseMap[program], `PROGRAM_PREFIXES key not in courseMap: ${program}`);
}
// Every department key in DEPARTMENT_SHARED_PREFIXES is a real department.
const realDepts = new Set(Object.values(courseMap).map((e) => e.department));
for (const dept of Object.keys(DEPARTMENT_SHARED_PREFIXES)) {
  assert.ok(realDepts.has(dept), `shared-prefix dept not in courseMap: ${dept}`);
}

console.log("course_mapper.test.js OK");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node lib/course_mapper.test.js`
Expected: FAIL — `TypeError: subjectPrefixesFor is not a function` (or undefined export).

- [ ] **Step 3: Add the prefix map, function, and exports**

In `lib/course_mapper.js`, **between** the end of the `courseMap` object and the `// LOOKUP UTILITIES` section (i.e. after the closing `};` of `courseMap`, before `function lookup`), insert:

```js
// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT CODE-PREFIX MAP
// A subject's course_code prefix marks which program(s) it belongs to.
//   - PROGRAM_PREFIXES[program]              → that program's OWN prefixes
//   - DEPARTMENT_SHARED_PREFIXES[department] → prefixes taken by ALL programs
//                                              in that department (shared core)
// Runtime filtering uses ONLY these prefixes; department-name strings are not
// consulted at request time. Entries marked `// REVIEW:` are uncertain
// author assignments awaiting human confirmation — keep them as-is.
// ─────────────────────────────────────────────────────────────────────────────

const PROGRAM_PREFIXES = {
  // ── Architecture ──
  "Bachelor of Science in Architecture": ["AR"],
  "Bachelor of Landscape Architecture": ["LA"],
  "Bachelor of Science in Interior Design": ["IN"],

  // ── Fine Arts ──
  "Bachelor of Fine Arts major in Advertising Arts": ["ADV"],
  "Bachelor of Fine Arts major in Cinema": ["CNM"],

  // ── Sociology, Anthropology and History ──
  "Bachelor of Arts in Anthropology": ["ANTH"],

  // ── Biology ──
  "Bachelor of Science in Biology": ["BIO"],
  "Bachelor of Science in Marine Biology": ["MBIO"],

  // ── Chemistry ──
  "Bachelor of Science in Chemistry": ["CHEM"],

  // ── Communications, Linguistics and Literature ──
  "Bachelor of Arts in English Language Studies": ["ELS"],
  "Bachelor of Arts in Literary and Cultural Studies with Creative Writing": ["LIT"],
  "Bachelor of Arts in Communication major in Media": ["COMM"],

  // ── Computer, Information Sciences and Mathematics ──
  "Bachelor of Science in Computer Science": ["CS"],
  "Bachelor of Science in Information Systems": ["IS"],
  "Bachelor of Science in Information Technology": ["IT"],
  "Bachelor of Science in Data Science": [], // CONFIRMED: courses.db has no Data Science prefix (DS subjects sit under CS/grad codes); relies on shared CIS only until scraper adds them

  // ── Philosophy ──
  "Bachelor of Philosophy": ["PHIL"],

  // ── Physics ──
  "Bachelor of Science in Applied Physics": ["PHYS", "PHYSEL"],

  // ── Psychology ──
  "Bachelor of Science in Psychology": ["PSY", "PSYC"],

  // ── Nursing ──
  "Bachelor of Science in Nursing": ["NCM"],

  // ── Nutrition and Dietetics ──
  "Bachelor of Science in Nutrition and Dietetics": ["ND"],

  // ── Pharmacy ──
  "Bachelor of Science in Pharmacy": ["PHARM", "PHSC", "PHCH"],

  // ── Accountancy ──
  "Bachelor of Science in Accountancy": [], // REVIEW: shares the AC core only (see DEPARTMENT_SHARED_PREFIXES)
  "Bachelor of Science in Management Accounting": ["AAE"], // REVIEW
  "Bachelor of Science in Internal Auditing": ["AA"], // REVIEW

  // ── Business Administration ──
  "Bachelor of Science in Business Administration major in Financial Management": ["BFM"],
  "Bachelor of Science in Business Administration major in Human Resource Management": ["BHR"],
  "Bachelor of Science in Business Administration major in Marketing Management": ["BMM"],
  "Bachelor of Science in Business Administration major in Operations Management": ["BOM"],
  "Bachelor of Science in Entrepreneurship": ["BEN"],

  // ── Economics ──
  "Bachelor of Science in Economics": ["ECN"],

  // ── Hospitality and Tourism ──
  "Bachelor of Science in Hospitality Management": ["HM", "HPC"],
  "Bachelor of Science in Tourism Management": ["TM", "TPC"],
  "Diploma in Culinary Arts": ["HPC"], // REVIEW: culinary draws on hospitality core HPC

  // ── Teacher Education ──
  "Bachelor of Secondary Education major in Science": ["SCED"], // REVIEW: SCED prefix lives under Science & Math Education dept
  "Bachelor of Secondary Education major in Mathematics": ["MATHED"], // REVIEW: cross-department prefix
  "Bachelor of Special Needs Education specialization in Early Childhood Education-Montessori Education": ["SNED", "ECED", "EDSP"], // REVIEW

  // ── Engineering ──
  "Bachelor of Science in Chemical Engineering": ["CHE", "CHEA", "CHEL"],
  "Bachelor of Science in Civil Engineering": ["CE", "CEE", "CES", "CEA"],
  "Bachelor of Science in Computer Engineering": ["CPE", "CPEA", "CPES"],
  "Bachelor of Science in Electrical Engineering": ["EE", "EEA", "EEL"],
  "Bachelor of Science in Electronics Engineering": ["ECE", "ECEL", "ECEA"],
  "Bachelor of Science in Industrial Engineering": ["IE", "IEA", "IEL", "IES"],
  "Bachelor of Science in Mechanical Engineering": ["ME", "MEA", "MES"],

  // ── Political Science ──
  "Bachelor of Arts in Political Science major in International Relations and Foreign Service": ["IRF", "FOS"],
  "Bachelor of Arts in Political Science major in Law and Policy Studies": ["LPS"],
};

// Department -> prefixes shared by ALL its programs. Keys must match the exact
// `department` strings used in courseMap above.
const DEPARTMENT_SHARED_PREFIXES = {
  "Department of Computer, Information Sciences and Mathematics": ["CIS"],
  "Department of Fine Arts": ["FAD"],
  "Department of Sociology, Anthropology and History": ["SOAN"],
  "Department of Accountancy": ["AC", "ACM"], // REVIEW: AC = accountancy core, ACM = thesis
  "Department of Business Administration": ["CBA", "BAC"], // REVIEW: business core + research
  "Department of Hospitality and Tourism": ["DHT", "THC"],
  "Department of Political Science": ["POS"],
  "Department of Teacher Education": ["EDUC"],
  "Department of Architecture": ["AD"], // REVIEW: AD = shared design/elective prefix
  // Engineering math/science/GE shared across all engineering departments:
  "Department of Chemical Engineering": ["EM", "ES", "GEM", "GEW"], // REVIEW
  "Department of Civil Engineering": ["EM", "ES", "GEM", "GEW"], // REVIEW
  "Department of Computer Engineering": ["EM", "ES", "GEM", "GEW"], // REVIEW
  "Department of Electrical & Electronics Engineering": ["EM", "ES", "GEM", "GEW"], // REVIEW
  "Department of Industrial Engineering": ["EM", "ES", "GEM", "GEW"], // REVIEW
  "Department of Mechanical and Manufacturing Engineering": ["EM", "ES", "GEM", "GEW"], // REVIEW
};

/** Own prefixes ∪ department-shared prefixes for a program. [] if unknown. */
function subjectPrefixesFor(programName) {
  const own = PROGRAM_PREFIXES[programName] || [];
  const entry = courseMap[programName];
  const shared = entry ? DEPARTMENT_SHARED_PREFIXES[entry.department] || [] : [];
  return [...new Set([...own, ...shared])];
}
```

Then extend the existing `module.exports` line. Change:

```js
module.exports = { courseMap, lookup, byDepartment, bySchool };
```
to:
```js
module.exports = {
  courseMap,
  lookup,
  byDepartment,
  bySchool,
  PROGRAM_PREFIXES,
  DEPARTMENT_SHARED_PREFIXES,
  subjectPrefixesFor,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node lib/course_mapper.test.js`
Expected: PASS — prints `course_mapper.test.js OK`.

- [ ] **Step 5: Commit**

```bash
git add lib/course_mapper.js lib/course_mapper.test.js
git commit -m "feat: add program->subject code-prefix map and subjectPrefixesFor"
```

---

### Task 2: Subject filtering helper `lib/subjects.js`

Pure functions: extract a code prefix, and filter+dedupe subject rows by a prefix set. Kept separate from the DB layer so it is unit-testable without SQLite.

**Files:**
- Create: `lib/subjects.js`
- Test: `lib/subjects.test.js`

**Interfaces:**
- Consumes: nothing (pure).
- Produces:
  - `codePrefix(courseCode: string): string` — leading letters, upper-cased (`"CIS 1201"` → `"CIS"`, `"cs 3106n"` → `"CS"`; `""`/null → `""`).
  - `filterSubjects(rows, prefixes): {code, description}[]` where `rows` are `{ course_code, course_description }`, `prefixes` is a `string[]`. Keeps rows whose `codePrefix` is in `prefixes`; de-duplicates `N`-suffix variants (same numeric stem + same description), **preferring the suffixed code**; returns `{ code, description }` sorted by `code` ascending. Empty `prefixes` ⇒ returns ALL rows (deduped) — this is the all-subjects fallback.

- [ ] **Step 1: Write the failing test**

Create `lib/subjects.test.js`:

```js
// Run: node lib/subjects.test.js
const assert = require("assert");
const { codePrefix, filterSubjects } = require("./subjects");

// prefix extraction
assert.strictEqual(codePrefix("CIS 1201"), "CIS");
assert.strictEqual(codePrefix("CS 3106N"), "CS");
assert.strictEqual(codePrefix("cs 3106n"), "CS");
assert.strictEqual(codePrefix(""), "");
assert.strictEqual(codePrefix(null), "");

const rows = [
  { course_code: "CS 3106", course_description: "INFORMATION ASSURANCE AND SECURITY" },
  { course_code: "CS 3106N", course_description: "INFORMATION ASSURANCE AND SECURITY" },
  { course_code: "CIS 1201", course_description: "PROGRAMMING II" },
  { course_code: "IT 3101N", course_description: "PLATFORM TECHNOLOGIES" },
];

// Filter to CS + CIS only; IT excluded.
const out = filterSubjects(rows, ["CS", "CIS"]);
const codes = out.map((r) => r.code);
assert.ok(!codes.includes("IT 3101N"), "IT excluded");
assert.ok(codes.includes("CIS 1201"), "CIS kept");

// N-suffix dedupe keeps the suffixed variant, drops the bare one.
assert.ok(codes.includes("CS 3106N"), "suffixed variant kept");
assert.ok(!codes.includes("CS 3106"), "bare variant dropped");

// Output shape and sort order.
assert.deepStrictEqual(out, [
  { code: "CIS 1201", description: "PROGRAMMING II" },
  { code: "CS 3106N", description: "INFORMATION ASSURANCE AND SECURITY" },
]);

// Empty prefix list = all-subjects fallback (deduped).
const all = filterSubjects(rows, []);
assert.strictEqual(all.length, 3, "fallback returns all, deduped (3)");

console.log("subjects.test.js OK");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node lib/subjects.test.js`
Expected: FAIL — `Cannot find module './subjects'`.

- [ ] **Step 3: Implement `lib/subjects.js`**

```js
/**
 * Pure subject-filtering helpers. No DB access — operates on plain row objects
 * shaped { course_code, course_description }.
 */

/** Leading letters of a course code, upper-cased. "" for empty/missing. */
function codePrefix(courseCode) {
  const m = String(courseCode || "").trim().match(/^[A-Za-z]+/);
  return m ? m[0].toUpperCase() : "";
}

/**
 * Filter rows to those whose code prefix is in `prefixes` (empty `prefixes`
 * keeps everything), de-duplicate N-suffix variants, and return
 * { code, description } sorted by code.
 */
function filterSubjects(rows, prefixes) {
  const want = new Set(prefixes);
  const keep = (r) => want.size === 0 || want.has(codePrefix(r.course_code));

  // Dedupe key = numeric stem (trailing letters after the number stripped)
  // + description. Two rows collide only when they are the same subject with
  // and without a trailing letter (e.g. "CS 3106" vs "CS 3106N").
  const byKey = new Map();
  for (const r of rows) {
    if (!keep(r)) continue;
    const code = String(r.course_code || "").trim();
    const stem = code.replace(/[A-Za-z]+$/, "").trim(); // drop trailing letters
    const key = stem + "|" + String(r.course_description || "").trim().toUpperCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, r);
      continue;
    }
    const existingHasSuffix = /[A-Za-z]$/.test(String(existing.course_code || "").trim());
    const currentHasSuffix = /[A-Za-z]$/.test(code);
    if (currentHasSuffix && !existingHasSuffix) byKey.set(key, r);
  }

  return [...byKey.values()]
    .map((r) => ({
      code: String(r.course_code || "").trim(),
      description: String(r.course_description || "").trim(),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

module.exports = { codePrefix, filterSubjects };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node lib/subjects.test.js`
Expected: PASS — prints `subjects.test.js OK`.

- [ ] **Step 5: Commit**

```bash
git add lib/subjects.js lib/subjects.test.js
git commit -m "feat: add pure subject filter + N-suffix dedupe helper"
```

---

### Task 3: `GET /api/subjects` endpoint

**Files:**
- Modify: `server.js` (add a route in the `// ─── DEPARTMENTS ───` / notebooks area; place it right after the existing `/api/departments` route, ~line 236)
- Test: manual (curl), plus a small data smoke check

**Interfaces:**
- Consumes: `subjectPrefixesFor` (Task 1), `filterSubjects` (Task 2), the already-open `coursesDb` handle in `server.js`.
- Produces: HTTP `GET /api/subjects?course=<exact program name>` → `200 { success: true, subjects: [{ code, description }] }`. Missing/unknown `course` ⇒ all subjects (fallback). DB error ⇒ `{ success: false, message }`.

- [ ] **Step 1: Add the requires**

At the top of `server.js`, just below the existing `const { cleanDepartments } = require("./lib/cleanDepartments");` line (~line 5), add:

```js
const { subjectPrefixesFor } = require("./lib/course_mapper");
const { filterSubjects } = require("./lib/subjects");
```

- [ ] **Step 2: Add the route**

Immediately after the closing `);` of the `app.get("/api/departments", ...)` handler (~line 236), insert:

```js
// ─── SUBJECTS (filtered by the user's registered program) ───────────────────
app.get("/api/subjects", (req, res) => {
  const course = req.query.course || "";
  const prefixes = subjectPrefixesFor(course); // [] for unknown -> all subjects
  coursesDb.all(
    `SELECT course_code, course_description FROM courses`,
    [],
    (err, rows) => {
      if (err) return res.json({ success: false, message: err.message });
      const subjects = filterSubjects(rows || [], prefixes);
      res.json({ success: true, subjects });
    }
  );
});
```

- [ ] **Step 3: Start the server**

Run: `node server.js`
Expected: logs `Connected to Courses database.` and `🚀 SWAPPR running at http://localhost:3000`. Leave it running for the next step (or run in a second terminal).

- [ ] **Step 4: Verify the endpoint by hand**

In another terminal run:

```bash
curl -s "http://localhost:3000/api/subjects?course=Bachelor%20of%20Science%20in%20Computer%20Science" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);const p=new Set(j.subjects.map(x=>x.code.match(/^[A-Za-z]+/)[0]));console.log('ok=',j.success,'count=',j.subjects.length,'prefixes=',[...p].sort().join(','));})"
```

Expected: `ok= true`, a non-zero `count`, and `prefixes=` containing `CIS,CS` and **not** `IT` or `IS`. Stop the server (Ctrl-C) when done.

- [ ] **Step 5: Commit**

```bash
git add server.js
git commit -m "feat: add GET /api/subjects filtered by registered program"
```

---

### Task 4: Include `course` in the login response

So the frontend (which stores the whole `data.user` in `sessionStorage`) knows the user's program without an extra request. `/api/register` already returns `course`; only `/api/login` is missing it.

**Files:**
- Modify: `server.js` — the `/api/login` success response (~lines 149-154)

**Interfaces:**
- Produces: `/api/login` success body `user` object gains a `course` field.

- [ ] **Step 1: Update the login response**

In `server.js`, find the success block in `app.post("/api/login", ...)`:

```js
    // 4. Success!
    res.json({
      success: true,
      user: { id: user.id, username: user.username, name: user.name },
    });
```

Replace the `user` object to include `course`:

```js
    // 4. Success!
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        course: user.course || "",
      },
    });
```

- [ ] **Step 2: Verify by hand**

Start the server (`node server.js`). The seed users use short course names, but any user with a `course` column value works. Run:

```bash
curl -s -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d "{\"username\":\"ana_reyes\",\"password\":\"pass1234\"}"
```

Expected: JSON where `user` contains a `course` key. This step only checks the
field is **present** — the value may be a short demo name like `"BS Computer
Science"`. That short name will NOT match `courseMap` and falls back to
all-subjects downstream (see the demo-data caveat in Global Constraints); real
filtering is verified in Task 5 with a freshly registered user. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add server.js
git commit -m "feat: return course in /api/login response"
```

---

### Task 5: Frontend — render subjects, drop department browse

Replace the department-card feed with a subject-card feed driven by `/api/subjects`. Remove the now-dead department-browse code path. The department dropdown used by the **upload form** stays (it still tags a notebook's department).

**Files:**
- Modify: `public/js/script.js`
- Modify: `public/index.html` (the "Back to Departments" button text/label only — see Step 5)
- Test: manual (run server, open page)

**Interfaces:**
- Consumes: `GET /api/subjects?course=<program>` (Task 3); `currentUser.course` from `sessionStorage` (Task 4 ensures it is present after login).
- Produces: `subjects[]` global + `loadSubjects()` + `renderSubjectCards()`; the "All Subjects" feed renders subject cards.

- [ ] **Step 1: Add a `subjects` global and load it**

In `public/js/script.js`, near the other globals (~line 11, after `let departments = [];`), add:

```js
let subjects = [];
```

In the `DOMContentLoaded` handler (~lines 14-22), add `loadSubjects();` after `loadDepartments();`:

```js
document.addEventListener("DOMContentLoaded", () => {
  loadUser();
  loadDepartments();
  loadSubjects();
  loadNotebooks();
  loadSwapps();
  loadSidebar();
  attachStaticEventListeners();
});
```

- [ ] **Step 2: Add `loadSubjects()`**

Directly below the existing `loadDepartments()` function (after its closing `}`, ~line 114), add:

```js
async function loadSubjects() {
  try {
    const course = currentUser?.course || "";
    const res = await fetch(
      `${API}/subjects?course=${encodeURIComponent(course)}`
    );
    const data = await res.json();
    subjects = data.subjects || [];
    renderNotebooks();
  } catch (err) {
    console.error("Failed to load subjects:", err);
    subjects = [];
  }
}
```

- [ ] **Step 3: Replace `renderDepartmentCards()` with `renderSubjectCards()`**

Replace the **entire** `renderDepartmentCards()` function (~lines 276-320) with:

```js
function renderSubjectCards() {
  const grid = document.getElementById("notebookGrid");
  if (!grid) return;
  grid.innerHTML = "";
  grid.className = "subjects-list";

  const sectionTitle = document.getElementById("sectionTitle");
  if (sectionTitle) sectionTitle.textContent = "All Subjects";
  const sectionSubtitle = document.getElementById("sectionSubtitle");
  if (sectionSubtitle) {
    sectionSubtitle.textContent =
      "Subjects in your program. Browse shared study resources.";
  }

  if (subjects.length === 0) {
    grid.innerHTML = `<p class="text-sm text-purple-400">No subjects found for your program.</p>`;
    renderPagination(0);
    return;
  }

  const visibleSubjects = getPaginatedItems(subjects);
  renderPagination(subjects.length);

  visibleSubjects.forEach((subject) => {
    const card = document.createElement("div");
    card.className = "subject-card fade-in";
    card.innerHTML = `
      <div class="subject-card-inner">
        <div>
          <h3 class="subject-title">${subject.code}</h3>
          <p class="subject-desc">${subject.description || ""}</p>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}
```

(Subject cards are intentionally inert — no click handler. Notebook wiring is out of scope per the spec.)

- [ ] **Step 4: Repoint the feed and remove dead department code**

In `renderNotebooks()` (~line 329), change the early-return branch from `renderDepartmentCards()` to `renderSubjectCards()`:

```js
  if (!selectedDepartment && currentFilter === "all" && !searchQuery) {
    renderSubjectCards();
    return;
  }
```

Then delete the now-unused department-browse code in `public/js/script.js`:
- `selectDepartment(department)` function (~lines 148-155)
- `resetDepartments()` function (~lines 157-163)

Search the file for any remaining references to `selectDepartment`, `resetDepartments`, or `renderDepartmentCards`. The only expected remaining hit is `onclick="resetDepartments()"` in `index.html` (handled in Step 5). If any other JS reference remains, remove that dead line. **Do not** touch `loadDepartments`, `populateDeptDropdown`, or `departments` — those still serve the upload form's department `<select>`.

- [ ] **Step 5: Remove the "Back to Departments" control in `index.html`**

In `public/index.html` (~lines 224-231) there is a button:

```html
<button
  id="backToSubjectsBtn"
  onclick="resetDepartments()"
  ...
>
  ← Back to Departments
</button>
```

Delete this entire `<button>` element. (Its handler `resetDepartments` is being removed; the `backToSubjectsBtn` references remaining in `script.js` are null-safe `?.` calls and will simply no-op.)

- [ ] **Step 6: Manual verification**

Run `node server.js`, open `http://localhost:3000`. **Register a brand-new
user** and pick **"Bachelor of Science in Computer Science"** in the program
dropdown. Do NOT verify with a seed user — seed users have short course names
that hit the all-subjects fallback (see Global Constraints) and would mask a
broken filter.

Expected:
- The "All Subjects" feed shows **subject cards** (course code + description), not department names.
- For the Computer Science registration: cards include `CIS`- and `CS`-prefixed subjects, and **none** prefixed `IT`/`IS`. (If you instead see thousands of mixed-prefix subjects, the program name didn't match `courseMap` and the fallback fired — recheck the registered course value.)
- Pagination still works. No console errors. The "Add notebook" form's department dropdown still populates.

- [ ] **Step 7: Commit**

```bash
git add public/js/script.js public/index.html
git commit -m "feat: render program-filtered subjects, drop department browse"
```

---

### Task 6: Coverage verification script (review aid for the prefix map)

A throwaway-friendly script that reports, per program, how many subjects match and which course-code prefixes in `courses.db` are claimed by **no** program (orphans). This is the artifact the human owner uses to validate/repair the REVIEW-flagged entries from Task 1. Not wired into the app.

**Files:**
- Create: `lib/coverage.js`

**Interfaces:**
- Consumes: `courseMap`, `subjectPrefixesFor` (Task 1), `codePrefix`, `filterSubjects` (Task 2), `./sql/courses.db`.
- Produces: console report. Run via `node lib/coverage.js`.

- [ ] **Step 1: Implement `lib/coverage.js`**

```js
// Run: node lib/coverage.js
// Reports subject counts per program and orphan prefixes (claimed by nobody).
const sqlite3 = require("sqlite3").verbose();
const { courseMap, subjectPrefixesFor } = require("./course_mapper");
const { codePrefix, filterSubjects } = require("./subjects");

const db = new sqlite3.Database("./sql/courses.db");

db.all(`SELECT course_code, course_description FROM courses`, [], (err, rows) => {
  if (err) {
    console.error("DB error:", err.message);
    process.exit(1);
  }

  console.log("=== Subjects matched per program ===");
  for (const program of Object.keys(courseMap)) {
    const prefixes = subjectPrefixesFor(program);
    if (prefixes.length === 0) {
      console.log(`  [no own/shared prefixes] ${program}`);
      continue;
    }
    const n = filterSubjects(rows, prefixes).length;
    console.log(`  ${String(n).padStart(4)}  ${program}  (${prefixes.join(",")})`);
  }

  // Which prefixes in the DB are claimed by at least one program?
  const claimed = new Set();
  for (const program of Object.keys(courseMap)) {
    for (const p of subjectPrefixesFor(program)) claimed.add(p);
  }
  const counts = {};
  for (const r of rows) {
    const p = codePrefix(r.course_code) || "(none)";
    counts[p] = (counts[p] || 0) + 1;
  }
  const orphans = Object.entries(counts)
    .filter(([p]) => !claimed.has(p) && p !== "(none)")
    .sort((a, b) => b[1] - a[1]);

  console.log("\n=== Orphan prefixes (no program claims them) ===");
  console.log(orphans.map(([p, c]) => `${p}:${c}`).join("  "));
  console.log(`\nTotal subjects: ${rows.length}`);
  db.close();
});
```

- [ ] **Step 2: Run it**

Run: `node lib/coverage.js`
Expected: a per-program count table (Computer Science shows a count > 40), then a list of orphan prefixes (expected: graduate prefixes like `MIT`, `MSIT`, `PHDIT`, `GE`, `NSTP`, and other noise — these are out of scope per the spec). No crash.

- [ ] **Step 3: Commit**

```bash
git add lib/coverage.js
git commit -m "chore: add subject-coverage report for prefix-map review"
```

---

## Self-Review (author, against the spec)

**Spec coverage:**
- Prefix model + `subjectPrefixesFor` → Task 1. ✔
- N-suffix dedupe, prefer suffixed variant → Task 2 (`filterSubjects`). ✔
- `GET /api/subjects?course=` server-side filter + unknown-course fallback → Task 3. ✔
- Login response carries `course` (register already did) → Task 4. ✔
- `renderSubjectCards`, drop department browse, keep upload-form dept dropdown, inert cards → Task 5. ✔
- All ~50 programs mapped via assisted extraction; grad/noise ignored → Task 1 map + Task 6 coverage report surfaces orphans for review. ✔
- Error handling (fetch fail → empty; DB err → `{success:false}`) → Tasks 3 & 5. ✔

**Out-of-scope items confirmed NOT built:** subject→notebook click wiring, grad-program prefixes, GE/NSTP global subjects, scraper-gap recovery, `seed.js` rename. ✔

**Placeholder scan:** none — every code step is complete.

**Type consistency:** `subjectPrefixesFor(program) → string[]`, `filterSubjects(rows, string[]) → {code,description}[]`, endpoint returns `{success, subjects:[{code,description}]}`, frontend reads `subject.code`/`subject.description`. Consistent across Tasks 1–6. ✔
