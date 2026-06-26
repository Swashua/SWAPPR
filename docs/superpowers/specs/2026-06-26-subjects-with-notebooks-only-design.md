# Show subjects only when notebooks exist — design

## Goal

Subject cards render only for subjects that have at least one notebook in the
database under that subject's `course_code`.

## Decisions

- **Match rule:** exact `course_code` equality (trimmed both sides).
- **Where:** server-side, in `GET /api/subjects`. Client unchanged.

## Change

In [server.js](../../../server.js) `GET /api/subjects`: after computing
`subjects` via `subjectsForCourse`, query distinct non-empty `course_code`
values from the `Notebooks` table and keep only subjects whose `code` is in
that set.

```js
const have = new Set(nbRows.map((r) => String(r.course_code).trim()));
const subjects = subjectsForCourse(rows, course).filter((s) => have.has(s.code));
```

## Notes

- Empty result is already handled by the existing "No subjects found" UI in
  `renderSubjectCards`.
- Skipped: prefix/stem matching, client-side filtering, caching. Add if a
  concrete need appears.
