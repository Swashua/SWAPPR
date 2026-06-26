# Context-aware search bar — design

## Problem

`#searchInput` searches notebooks by title/username only, regardless of view.
Searching a subject code (e.g. "CIS 2103") finds nothing, and at the All
Subjects level the search drops out of the cards view entirely.

## Desired behaviour

Search scope depends on the current view:

- **All Subjects view** (no subject selected, filter = all): typing filters the
  subject **cards** by `code` + `description`. Stays on cards.
- **Inside a subject** (a subject is selected): typing filters that subject's
  **notebooks** by `title` + `username`.

## Change (client only)

No server or DB change — card descriptions already come from `state.subjects`,
and in-subject notebook search already runs through `filterNotebooks`.

`public/js/app/notebooks.js` `renderNotebooks`:

- Remove `!searchQuery` from the top-level guard so the cards view persists
  while searching at the All Subjects level.

`public/js/app/subjects.js` `renderSubjectCards`:

- Filter `cardSubjects` by the search query against `code` + `description`
  (case-insensitive substring), in addition to the existing notebooks filter.
- Empty result while searching shows a "no match" message.

`notebookMatchesSearch` (notebooks.js): unchanged — title + username, used for
in-subject notebook search.

## Notes

- Skipped: server-side course_description join / ATTACH (not needed once cards
  own the subject-name match). Add only if cross-program notebook name search
  is required later.
