# Repo Cleanup Refactor Implementation Plan

> **For Nathaniel:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Organize SWAPPR's front-end JavaScript, repository hygiene, and documentation while preserving current behavior.

**Architecture:** Keep the app as static HTML plus classic browser scripts. Split the monolithic `public/js/script.js` into focused files under `public/js/app/`, all coordinated through a shared `window.SWAPPR` namespace.

**Tech Stack:** Node.js, Express, SQLite, vanilla JavaScript, Tailwind CDN, Lucide CDN.

---

### Task 1: Prepare Baseline

**Files:** none

**Steps:**

1. Confirm the current branch is not `main` or `master`.
2. Run the existing unit checks:
   - `node lib/cleanDepartments.test.js`
   - `node lib/course_mapper.test.js`
   - `node lib/subjects.test.js`
   - `node public/js/pagination.test.js`
3. Stop and investigate before refactoring if any baseline command fails.

**Verification:** All four commands exit with code 0.

---

### Task 2: Split Browser App Script

**Files:**

- `public/js/script.js`
- `public/js/app/state.js`
- `public/js/app/api.js`
- `public/js/app/session.js`
- `public/js/app/theme.js`
- `public/js/app/pagination-controls.js`
- `public/js/app/subjects.js`
- `public/js/app/notebooks.js`
- `public/js/app/swapps.js`
- `public/js/app/sidebar.js`
- `public/js/app/profile-panel.js`
- `public/js/app/notebook-modal.js`
- `public/js/app/toast.js`
- `public/js/app/main.js`

**Steps:**

1. Create the `public/js/app/` directory.
2. Move shared state/constants into `state.js`.
3. Move endpoint fetch wrappers into `api.js`.
4. Move session, theme, pagination, subjects, notebooks, swapps, sidebar, profile panel, modal, and toast logic into their matching files.
5. Keep compatibility functions globally callable through `main.js`.
6. Keep `public/js/script.js` as a tiny compatibility entry or remove it from the page once `index.html` references all app files.
7. Replace mojibake section banners with ASCII comments where files still need section markers.

**Verification:** Browser-loaded files define the same user-facing global functions used by `index.html`.

---

### Task 3: Update HTML Script Loading

**Files:**

- `public/index.html`

**Steps:**

1. Replace the old `js/script.js` load with ordered `js/app/*.js` scripts.
2. Keep `js/pagination.js` loaded before `pagination-controls.js`.
3. Leave existing inline handlers intact for this refactor.

**Verification:** `rg -n "js/script.js|js/app/" public/index.html` shows the new script list and no old monolith reference.

---

### Task 4: Improve Repo Scripts and Docs

**Files:**

- `package.json`
- `README.md`
- `public/README.md`
- `.gitignore`
- `docs/ARCHITECTURE.md`
- `docs/cleanup_checklist.md`

**Steps:**

1. Add a useful `npm test` script that runs current unit checks.
2. Update README setup/test notes.
3. Replace placeholder `public/README.md` with a short static-app map.
4. Add `docs/ARCHITECTURE.md` with the repo layout and front-end script responsibilities.
5. Add ignore rules for local/system artifacts such as `desktop.ini` and `output.txt`.
6. Mark cleanup checklist items complete only if actually addressed.

**Verification:** `npm test` runs the current checks successfully.

---

### Task 5: Verify and Refresh Graph

**Files:** graphify output

**Steps:**

1. Run `npm test`.
2. Start the server briefly with `npm start` and confirm it reaches the listening log.
3. Run `graphify update .`.
4. Review `git status --short` and `git diff --stat`.

**Verification:** Commands complete without test failures; graphify update exits successfully.

---

### Task 6: Commit If Requested

**Files:** all changed files

**Steps:**

1. If committing, use a conventional commit.
2. Suggested message: `refactor: organize frontend app structure`.

**Verification:** `git show -s --format="%s"` matches the conventional commit style if a commit is created.

