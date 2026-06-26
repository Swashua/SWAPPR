# Show subjects only when notebooks exist — design

## Goal

Subject cards render only for subjects that have at least one notebook in the
database under that subject's `course_code`.

## Decisions

- **Match rule:** exact `course_code` equality (trimmed both sides). Dropdown
  values are the same deduped subject codes, so notebooks can only be tagged
  with a code that exists as a subject — no N-suffix mismatch.
- **Where:** the filter applies ONLY to the subject *cards*. The upload
  dropdown (`select#newSubject`) must list ALL program subjects so users can
  tag a notebook for a subject that has none yet.

## Change

`GET /api/subjects` returns all program subjects plus the codes that have
notebooks; the client filters the cards, not the dropdown.

Server [server.js](../../server.js):

```js
res.json({ success: true, subjects, codesWithNotebooks });
```

Client [subjects.js](../../public/js/app/subjects.js):

- `loadSubjects`: `app.state.codesWithNotebooks = new Set(data.codesWithNotebooks)`.
- `populateSubjectDropdown`: unchanged — uses full `state.subjects`.
- `renderSubjectCards`: `cardSubjects = subjects.filter((s) => have.has(s.code))`;
  paginate the filtered list.

## Notes

- Two empty states: no program subjects → "No subjects found for your
  program."; program subjects exist but none have notebooks → "No subjects
  with shared notebooks yet."
- Skipped: prefix/stem matching, caching. Add if a concrete need appears.
