# Department Name Cleaning — Design

## Context

`courses.db` was scraped without cleaning. The `department_reserved` column
holds 40 distinct values, ~9 of which are dirty:

- **Compound rows** join several departments with a `(N)` count marker, e.g.
  `"DEPARTMENT OF TEACHER EDUCATION (20) DEPARTMENT OF SCIENCE AND MATHEMATICS EDUCATION"`
  and `"SCHOOL OF ENGINEERING (1) DEPARTMENT OF CHEMICAL ENGINEERING (2) ..."`.
  The `(N)` is scrape dirt separating two real department names.
- **Abbreviation duplicate**: `"DCISM - MATHEMATICS SECTION"` is the same unit as
  `"DEPARTMENT OF COMPUTER, INFORMATION SCIENCES AND MATHEMATICS"`.
- **All-caps**: every value is uppercase; should be Title Case.

`/api/departments` feeds the All-Subjects cards and the Add-Notebook dropdown
(see `2026-...` Part 1 refactor). Clean names must come out of that endpoint.

## Decision

Clean at the **API endpoint** (non-destructive). `courses.db` stays as the raw
scrape; the transform lives in `server.js` and runs on the query result. Chosen
over a DB migration because split rows have no 1:1 row mapping and we want zero
risk to course records.

## The transform — `cleanDepartments(rawValues) -> string[]`

Pure function in `server.js`. For each raw value:

1. **Split dirt** — `value.split(/\s*\(\d+\)\s*/)`, trim parts, drop empties.
   Each part is a candidate department.
2. **Map abbreviations** — `/^DCISM\b/i` → `"Department of Computer, Information
   Sciences and Mathematics"`. Single-entry lookup; extend if more appear.
3. **Title-case** — `toLowerCase()`, capitalize first letter of each
   whitespace-delimited token; tokens in the small-word set
   (`of, and, the, in, for, to, a, an, or`) stay lowercase unless first.
   `&`, `-`, and trailing commas pass through unchanged.
4. **Dedupe** — case-insensitive, first occurrence wins.
5. **Sort** — alphabetical.

Endpoint maps rows to `r.department_reserved`, runs `cleanDepartments`, returns
`{ success: true, departments }`.

## Result

40 raw → ~31 clean. Dirt rows split into parts that already exist clean, so
dedupe absorbs them. New notebooks created via the dropdown store the clean
name, so the Part 1 exact-match filter keeps working.

## Verification

- `node -e` self-check (`demo()`) asserting: compound `(N)` split → 2 names;
  `DCISM - MATHEMATICS SECTION` → canonical full name; `DEPARTMENT OF BIOLOGY`
  → `Department of Biology`; duplicate-after-clean collapses to one.
- Boot server, `curl /api/departments`, confirm clean sorted list, no `(N)`,
  no all-caps, single DCISM/Computer entry.

## Out of scope

DB mutation; a general abbreviation table (one entry now); configurable
small-word list (inline const).
