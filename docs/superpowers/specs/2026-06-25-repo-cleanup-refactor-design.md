# Repo Cleanup Refactor Design

Date: 2026-06-25
Status: Approved

## Goal

Make the SWAPPR repository easier to navigate and maintain without changing the current vanilla HTML/CSS/JavaScript deployment model.

## Approved Approach

Use a compatibility-first split of `public/js/script.js` into focused browser scripts under `public/js/app/`. Keep classic script loading and expose the small set of functions still called by inline HTML handlers.

This avoids introducing a bundler or module pipeline while reducing the size and responsibility of the current monolithic script.

## Current Pain Points

- `public/js/script.js` mixes session loading, API calls, rendering, filters, modal state, profile panel behavior, and swap request logic.
- `public/css/styles.css` and `server.js` are also large, but splitting the front-end script is the highest-value low-risk cleanup.
- Inline handlers in `public/index.html` require functions such as `filterBy`, `openAddModal`, `submitPortfolio`, `handleLogout`, `openProfilePanel`, and `closeProfilePanel` to remain globally callable.
- The repo includes local/system artifacts such as `desktop.ini` and `output.txt`.
- `package.json` has no useful test script despite existing unit tests.

## Target Structure

```text
public/js/
  pagination.js
  pagination.test.js
  app/
    state.js
    api.js
    session.js
    theme.js
    pagination-controls.js
    subjects.js
    notebooks.js
    swapps.js
    sidebar.js
    profile-panel.js
    notebook-modal.js
    toast.js
    main.js
```

## Module Responsibilities

- `state.js`: shared mutable app state and constants.
- `api.js`: fetch helpers for SWAPPR endpoints.
- `session.js`: current-user loading and logout behavior.
- `theme.js`: dark-mode toggle setup.
- `pagination-controls.js`: page state and pagination DOM rendering.
- `subjects.js`: subject-card rendering.
- `notebooks.js`: notebook loading, filtering, card rendering, and submit behavior.
- `swapps.js`: swap request rendering, sending, responding, and badge updates.
- `sidebar.js`: top and recent sidebar lists.
- `profile-panel.js`: profile drawer loading and closing.
- `notebook-modal.js`: add/edit modal behavior.
- `toast.js`: toast notification helper.
- `main.js`: boot sequence and global compatibility exports.

## Non-Goals

- Do not change application behavior intentionally.
- Do not add a bundler, transpiler, TypeScript, or framework.
- Do not refactor the login/profile pages unless needed for compatibility.
- Do not read or modify `docs/superpowers/specs/2026-06-25-universal-subjects-design.md`.

## Verification

- Run existing unit checks:
  - `node lib/cleanDepartments.test.js`
  - `node lib/course_mapper.test.js`
  - `node lib/subjects.test.js`
  - `node public/js/pagination.test.js`
- Add an `npm test` script that runs the same checks.
- Run `npm test`.
- Start the Express server long enough to confirm it boots.
- Run `graphify update .` after code changes.

