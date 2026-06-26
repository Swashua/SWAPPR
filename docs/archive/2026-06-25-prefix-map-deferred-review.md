# Prefix-Map Accuracy — Deferred Review

**Date:** 2026-06-25
**Status:** Deferred (out of scope for the initial program-subject-filter build)
**Related:** [2026-06-25-program-subject-filter-design.md](2026-06-25-program-subject-filter-design.md),
[2026-06-25-program-subject-filter.md](2026-06-25-program-subject-filter.md)

These are **data-accuracy refinements** to the program→prefix map in
`lib/course_mapper.js`. None block the feature shipping. Every prefix assigned
in the plan was verified to exist in `courses.db`; what remains are *scope*
judgment calls that need USC domain confirmation. Use `node lib/coverage.js`
(Task 6) to re-check counts after any change.

## 1. Accountancy — does `AA` (Auditing) belong to all accountancy programs?

Evidence pulled from `courses.db`:
- `AC` (40 subjects) = the full BS-Accountancy foundational sequence (year 1→4):
  Conceptual Frameworks → Intermediate Accounting 1/2/3 → Income Tax → thesis
  `AC 3201` → internship `AC 3202N`. Correctly treated as the **shared**
  accountancy core.
- `AA` (8) = Auditing & Assurance + advanced accounting practice → currently
  mapped as **Internal Auditing** own-prefix only.
- `AAE` (4) = Mgmt Advisory, Taxation, Regulatory → **Management Accounting**
  own-prefix.
- `ACM` (2) = thesis-only variant (mirrors `AC 3105`/`AC 3201`).

**Open question:** BS Accountancy currently resolves to `AC` + `ACM` only — it
never picks up `AA` auditing subjects, though auditing is core to an
accountancy degree.
- If `AA` is specialization-only → leave map as-is.
- If `AA` is shared accountancy core → move `AA` into
  `DEPARTMENT_SHARED_PREFIXES["Department of Accountancy"]` → `["AC","ACM","AA"]`.

## 2. Science Education — `SCED` (9) vs `PHSCED` (12)

BSED-Science currently mapped to own-prefix `SCED`. But `PHSCED` (12 subjects,
larger) also exists. Confirm which is the real Secondary-Education-Science
prefix, or whether both apply.

## 3. Architecture — is `AD` (25) a shared department prefix?

Mapped as `DEPARTMENT_SHARED_PREFIXES["Department of Architecture"] = ["AD"]`,
i.e. shared across Architecture / Landscape Architecture / Interior Design.
Confirm `AD` is a shared design/elective core and not one program's own.

## 4. Engineering — `EM` / `ES` / `GEM` / `GEW` shared across all 6 depts?

All four assigned to every engineering department as shared (presumed
engineering-wide math/science/GE). Confirm none are dept-specific.

## 5. Hospitality & Tourism — `THC` / `DHT` scope

Mapped both as shared across Hospitality / Tourism / Culinary. Confirm `THC`
isn't tourism-specific.

## 6. Minor undercounts — unmapped variant prefixes

Real subjects dropped because their variant prefix is unmapped. Decide per case
whether to fold into the parent program:
- `BIOL` (7) — Biology (main prefix `BIO`)
- `ECON` (4) — Economics (main `ECN`)
- `ACC` (3) / `ACCTG` (1) — Accountancy (main `AC`)

`node lib/coverage.js` lists all orphan prefixes for a full sweep.
