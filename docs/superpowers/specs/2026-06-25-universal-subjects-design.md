# Universal Subjects in Subject Filtering — Design

Date: 2026-06-25
Status: Approved

## Problem

The All Subjects page filters subjects to those matching the logged-in user's
registered course. University-wide subjects — NSTP, General Education (GE-*),
PATH-FIT PE (TPE), and the USC mission core (EDM) — never display for any
program.

### Root cause

`lib/course_mapper.js` `subjectPrefixesFor(program)` returns only:

- the program's own prefixes (`PROGRAM_PREFIXES`)
- its department's shared prefixes (`DEPARTMENT_SHARED_PREFIXES`)

University-wide subjects belong to no single program or department, so their
code prefixes are in nobody's set. The keep-predicate in
`lib/subjects.js` (`want.has(codePrefix(r.course_code))`) rejects them for
every user. (Engineering is the lone accidental exception: `GEM`/`GEW` were
placed in its department-shared set.)

## Solution

Introduce a `UNIVERSAL_PREFIXES` constant in `lib/course_mapper.js` and union
it into every program's prefix set:

```js
const UNIVERSAL_PREFIXES = ["NSTP", "GE", "TPE", "EDM"];

function subjectPrefixesFor(programName) {
  const own = PROGRAM_PREFIXES[programName] || [];
  const entry = courseMap[programName];
  const shared = entry ? DEPARTMENT_SHARED_PREFIXES[entry.department] || [] : [];
  return [...new Set([...own, ...shared, ...UNIVERSAL_PREFIXES])];
}
```

Single source of truth; every mapped program inherits the universal set. No
change to `lib/subjects.js`, the server endpoint, or the frontend.

### Why these four prefixes

Verified against actual rows in `sql/courses.db`:

| Prefix | Evidence | Verdict |
|--------|----------|---------|
| `NSTP` | NSTP 1/2 — National Service Training Program | universal college |
| `GE`   | 59 rows: GE-ART, GE-ETHICS, all GE-FEL free electives | universal college |
| `TPE`  | TPE 1101–2204 — PATH-FIT I–IV (CHED college PE) | universal college |
| `EDM`  | EDM 1/2/6000/7000 — USC Carolinian mission core | universal college |

`codePrefix` strips at the first non-letter, so `GE-FEL AFVC` → `GE`. The
single `GE` entry covers every `GE-*` subject, including the free electives
that are universal to all courses.

### Rejected candidates (Senior High / grad / mislabeled contamination)

- `PDEV` — "Personal Development", a K-12 Senior High School core subject.
- `FIL`  — FIL 02/03 are Grade 11/12 SHS Filipino cores
  ("Pagbasa at Pagsusuri…", "Pagsulat sa Piling Larangan").
- `PEL`  — not PE; rows are Pharmacy practice + "Current Events".
- `EDMA` — EDMA 222N is a graduate education subject.

These prefixes are NOT added, so their rows remain filtered out.

## Known limitation

Prefix-only filtering cannot distinguish graduate mission subjects
(`EDM 6000/7000`) from undergrad (`EDM 1/2`); both share the `EDM` prefix, so a
couple of graduate rows ride along. Accepted as negligible. Upgrade path if it
matters later: filter on a course-level numeric threshold or a curriculum-level
column.

## Side effect

`subjectsForCourse` still guards `prefixes.length === 0 → return []`. Because
`UNIVERSAL_PREFIXES` is non-empty, a program that previously had own+shared = []
(none currently) would now return universal subjects only. No mapped program is
affected today; an unmapped/unknown course string still returns nothing only if
it is absent from `courseMap` — once unioned it would return the universals. To
preserve "unknown course → empty", the union must apply only to programs that
exist in the maps; programs not in `courseMap` and not in `PROGRAM_PREFIXES`
yield `own=[]`, `shared=[]`, but `UNIVERSAL_PREFIXES` would still be added.

Decision: acceptable — an unknown course showing only universal GE/NSTP/PE/EDM
subjects is a reasonable, harmless fallback. No extra guard added.

## Testing

- `lib/course_mapper.test.js`: `subjectPrefixesFor` for a sample program
  includes the four universal prefixes plus its own/shared; an unmapped program
  returns exactly the universal set.
- `lib/subjects.test.js`: `subjectsForCourse` with rows containing NSTP/GE/TPE/EDM
  plus program-specific codes returns both the universal and program subjects;
  excluded prefixes (PDEV/FIL/PEL/EDMA) do not appear.

## Files touched

- `lib/course_mapper.js` — add `UNIVERSAL_PREFIXES`, union in `subjectPrefixesFor`, export it.
- `lib/course_mapper.test.js` — universal-prefix assertions.
- `lib/subjects.test.js` — end-to-end filter assertion.
