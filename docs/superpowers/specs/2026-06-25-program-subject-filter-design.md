# Program-Filtered Subject List ("All Subjects")

**Date:** 2026-06-25
**Status:** Approved (design)
**Branch:** `refactor/course-mappings`
**Supersedes:** the browse-direction of
[2026-06-24-course-department-mapping-design.md](2026-06-24-course-department-mapping-design.md)
(its `departmentForCourse` + `/api/courses` were never implemented).

## Goal

"All Subjects" currently renders 32 **department** cards. That was wrong. It
must render the list of **subjects** (individual courses from `courses.db`),
filtered to the subjects relevant to the logged-in user's registered program.

## The data model (confirmed against `courses.db`)

A subject's relevance to a program is encoded in its `course_code` **prefix**:

| Prefix kind | Example | Belongs to |
|-------------|---------|------------|
| Program-specific | `CS 3101N` | BS Computer Science only |
| Program-specific | `IT 3101N`, `IS 3101N` | BS IT / BS IS only |
| Department-shared core | `CIS 1201` Programming II | every program in the department (BSCS, BSIT, BSIS…) |
| Graduate | `MIT`, `MSIT`, `DIT`, `PHDIT` | graduate programs |
| Noise / cross-listed | `MATH`, `ICT`, `MECH` under DCISM | ignore for that program |

So a program's subject set =
**its own prefix(es)** ∪ **its department's shared prefix(es)**.

### Source facts

- `sql/courses.db` → table `courses` (2465 rows): `course_code`,
  `course_description`, `department_reserved`.
- 246 distinct code prefixes. Each department resolves to a handful of
  program-specific prefixes + usually one shared core prefix + grad + noise.
- `lib/course_mapper.js` already maps every registerable program →
  `{ school, department }` (~50 programs, 7 schools). The registration dropdown
  in `public/login.html` stores the **exact** full program name (matches
  `course_mapper` keys). Only `seed.js` uses stale short forms ("BS Computer
  Science") — demo data, re-seedable.
- Data is dirty: NULL `department_reserved`, `N`-suffix duplicates
  (`CS 3106` / `CS 3106N`), compound dept strings, `DCISM - MATHEMATICS
  SECTION`. Handled at **map-construction** time, not runtime.

## Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Filter granularity | Per-program via code prefix (own + dept-shared) |
| 2 | Map location | Extend `lib/course_mapper.js` |
| 3 | Filter location | Server-side, new `GET /api/subjects` |
| 4 | Subject card click | Out of scope now — render list only |
| 5 | 32-department browse view | Dropped entirely |
| 6 | Logged-out / no course | N/A — page already redirects to login (`loadUser`) |
| 7 | Coverage | All ~50 programs, built via assisted semantic extraction |

## Data artifact — extend `lib/course_mapper.js`

Two additions, no breaking change to existing exports:

1. Add `prefixes: [...]` (the program's **own** code prefixes) to each
   `courseMap` entry.
   ```js
   "Bachelor of Science in Computer Science": {
     school: "School of Arts and Sciences",
     department: "Department of Computer, Information Sciences and Mathematics",
     prefixes: ["CS"],
   },
   ```
2. Add a department → shared-core-prefixes table:
   ```js
   const DEPARTMENT_SHARED_PREFIXES = {
     "Department of Computer, Information Sciences and Mathematics": ["CIS"],
     // …one entry per department that has a shared core
   };
   ```
3. New export `subjectPrefixesFor(programName)`:
   ```js
   // own ∪ shared(department); [] if program unknown
   function subjectPrefixesFor(programName) {
     const e = courseMap[programName];
     if (!e) return [];
     return [...new Set([...(e.prefixes || []),
                         ...(DEPARTMENT_SHARED_PREFIXES[e.department] || [])])];
   }
   ```

Runtime filtering is **pure prefix matching** — it never touches
`department_reserved` or any department-name convention.

### Map construction (assisted semantic extraction)

Prefixes-grouped-by-department is already dumped (see commit notes). For each
department I classify every prefix as program-own / dept-shared / grad / noise
and attach to the right `course_map` entry; **user reviews and corrects** the
draft before it lands. Grad-only and noise prefixes are simply left
unassigned. Grad prefixes (`MIT`, `MSIT`, `DIT`, `PHDIT`, …) are deliberately
ignored: `course_mapper.js` and the registration dropdown contain only
Bachelor/Diploma programs, so no registerable program maps to them and
`/api/subjects` is never queried with one. Building grad prefix sets would be
dead code until grad programs become registerable.

## Server — `GET /api/subjects`

```
GET /api/subjects?course=<exact program name>
```
1. `prefixes = subjectPrefixesFor(course)`.
2. Query `SELECT course_code, course_description FROM courses`.
3. Keep rows whose leading-letters prefix (`/^[A-Za-z]+/`, upper-cased) is in
   `prefixes`. De-duplicate `N`-suffix variants by `course_description` +
   numeric stem — **keep the suffix variant** (e.g. `CS 3106N` over `CS 3106`;
   it carries the better-tagged data). Generalize tolerantly: same stem +
   description, differing trailing letter(s) → one row, prefer the
   suffixed one.
4. Respond `{ success: true, subjects: [{ code, description }] }`.

**Fallback:** `prefixes` empty (unknown/blank course) → respond with **all**
subjects. Harmless; in practice every registered user has a mapped program.

## Frontend — `public/js/script.js`

- Replace `renderDepartmentCards()` with `renderSubjectCards()`: render
  `subjects[]` as cards (subject code + description). Same `.subjects-list`
  layout/pagination as today.
- `loadSubjects()`: `fetch('/api/subjects?course=' +
  encodeURIComponent(currentUser.course))` on load; store `subjects[]`.
  Requires `currentUser.course` — see note below.
- Delete `departments[]` load path for the feed, `selectDepartment`,
  `resetDepartments`, "Back to Departments" button, and the
  `renderNotebooks()` early-return into `renderDepartmentCards()`. Repoint the
  "All Subjects" filter to `renderSubjectCards()`.
- `/api/departments` + dropdown population for the **upload form** stay (still
  needed to tag a notebook's department).
- Subject cards are inert for now (decision #4).

### `currentUser.course` availability

`loadUser()` reads `sessionStorage.currentUser`, which `login.html` sets from
the login response. The login/register responses currently omit `course`
([server.js](../../server.js) `/api/login` returns only id/username/name).
**Add `course` to the `/api/login` and `/api/register` response user object**
so the client has it without an extra fetch.

## Data flow

```
login → sessionStorage.currentUser = { …, course }
page load → loadSubjects() → GET /api/subjects?course=<program>
  server: subjectPrefixesFor(program) → prefix set → filter courses.db
  → subjects[]  → renderSubjectCards()
```

## Error handling

- Fetch failure → `console.error`, `subjects = []`, empty list (mirrors
  existing `loadDepartments`/`loadNotebooks`).
- Unknown course → all subjects (fallback above).

## Testing

Extend `lib/cleanDepartments.test.js` (or new `lib/course_mapper.test.js`) —
no framework, assert-based, matching existing style:

- `subjectPrefixesFor("Bachelor of Science in Computer Science")`
  → contains `"CS"` and `"CIS"`, not `"IT"`.
- shared prefix appears for **all** programs in a department.
- unknown program → `[]`.
- prefix-extraction regex: `"CIS 1201"` → `"CIS"`, `"CS 3106N"` → `"CS"`.

## Out of scope

- Subject card → notebook filtering (no notebook→subject data yet).
- Graduate-program prefixes and noise/cross-listed prefixes (no registerable
  grad program exists yet).
- Recovering NULL `department_reserved` scraper gaps.
- Re-seeding `seed.js` to full program names (separate cleanup).
