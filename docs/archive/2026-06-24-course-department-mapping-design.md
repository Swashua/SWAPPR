# Course → Department Mapping (Browse Courses by Department)

**Date:** 2026-06-24
**Status:** Approved (design)
**Branch:** `refactor/course-mappings`

## Goal

Let users browse the courses (subjects) that belong to a department. When a
user clicks a department card, show that department's course list alongside its
existing notebooks.

## Background

- `sql/courses.db` → table `courses` (2465 rows): `course_id`, `course_code`,
  `course_description`, `department_reserved`.
- Each course already carries a *dirty* `department_reserved` string.
- `/api/departments` ([server.js](../../server.js)) already cleans the
  distinct department values via [lib/cleanDepartments.js](../../lib/cleanDepartments.js)
  into 32 display names. Course lists must line up with those exact names.

## Data findings

- ~2305 courses map cleanly: clean their `department_reserved` → one of the 32.
- **22 courses** have compound `department_reserved` (`... (5) DEPARTMENT OF ...`).
  Rule: take the **last** segment (most specific department).
- **138 courses** have NULL/blank `department_reserved`. Root cause is mixed:
  ~60 are genuinely department-less (GE / NSTP / thesis / dissertation), the
  rest are scraper gaps (e.g. `CS`, `CHEM`, `ECN` have obvious homes but weren't
  tagged). Recovering scraper gaps is out of scope (separate scraper fix).
  Rule: bucket all 138 under a synthetic department **"General Education &
  Electives"**.

## Approach (chosen: A)

Single endpoint, group client-side. 2465 rows is small enough to load once.

- **A (chosen):** `GET /api/courses` returns all courses tagged with cleaned
  department. Frontend loads once, groups by `selectedDepartment` in JS.
- B (rejected): per-department endpoint with `?department=` — extra machinery,
  no gain at this size.
- C (rejected): add a cleaned `department` column to courses.db via migration —
  heaviest, overkill for 2465 rows.

## Components

### 1. `lib/cleanDepartments.js` — add `departmentForCourse(raw)`

Returns a single cleaned department name for one course, reusing existing
`titleCaseDept` + `ABBREVIATIONS`.

- NULL / blank → `"General Education & Electives"`
- Compound (`(\d+)` present) → clean the **last** `\s*\(\d+\)\s*`-split segment
- Otherwise → clean the whole string (same as today's per-value logic)

Output must equal one of the names `cleanDepartments` produces (so cards and
course lists match), plus the synthetic bucket.

### 2. `server.js` — add `GET /api/courses`

```sql
SELECT course_code, course_description, department_reserved FROM courses
```
Map each row → `{ course_code, course_description, department: departmentForCourse(department_reserved) }`.
Respond `{ success: true, courses }`.

### 3. `public/js/script.js`

- `loadCourses()` — `fetch('/api/courses')` on page load, store `courses[]`
  (mirrors `loadDepartments` / `loadNotebooks`).
- `renderCourseList()` — filter `courses` where `c.department === selectedDepartment`,
  render a course list section. Called from the department-selected view, above
  the notebooks.
- `selectDepartment()` — also render the course list.

### 4. `public/index.html`

Container for the course list inside the department view (if existing layout
doesn't already give an injection point).

## Data flow

```
page load → loadCourses() → GET /api/courses → courses[]
click dept card → selectDepartment(dept)
  → renderCourseList(): courses.filter(c => c.department === dept)
  → renderNotebooks(): existing notebooks filtered by dept (unchanged)
```

## Error handling

- Fetch failure → `console.error`, leave `courses = []` (course list empty,
  notebooks still render). Matches existing `loadDepartments` behaviour.

## Testing

Extend [lib/cleanDepartments.test.js](../../lib/cleanDepartments.test.js)
with `departmentForCourse` cases:

- normal value → cleaned name
- compound → last segment cleaned
- NULL / blank → `"General Education & Electives"`
- abbreviation (`DCISM ...`) → mapped full name

## Out of scope

- Fixing scraper gaps (recovering real departments for the ~78 mistagged-as-null
  courses).
- Course search / per-course pages.
- Filtering notebooks by course.
