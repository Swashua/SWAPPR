# SWAPPR Architecture

SWAPPR is a small Express and SQLite app with a static vanilla JavaScript front end.

## Runtime Layout

- `server.js` serves `public/` and exposes the JSON API under `/api`.
- `sql/swappr.db` stores users, notebooks, likes, and swap requests.
- `sql/courses.db` stores course and subject data used for department and program filtering.
- `lib/` contains shared Node helpers for course mapping, subject filtering, and department cleanup.
- `public/` contains browser-facing HTML, CSS, images, and scripts.

## Front-End Scripts

`public/index.html` loads classic scripts in a fixed order. The app uses `window.SWAPPR` as a small namespace so the code can stay split without adding a build step.

- `public/js/app/state.js` owns shared app state and display labels.
- `public/js/app/api.js` wraps calls to the Express API.
- `public/js/app/session.js` loads the current user and handles logout.
- `public/js/app/theme.js` manages dark-mode state and the theme icon.
- `public/js/app/pagination-controls.js` renders pagination controls using `public/js/pagination.js`.
- `public/js/app/subjects.js` loads departments and subjects, then renders subject cards.
- `public/js/app/notebooks.js` loads, filters, renders, creates, updates, and likes notebooks.
- `public/js/app/swapps.js` handles swap request display, sending, responding, and badges.
- `public/js/app/sidebar.js` fills top and recent sidebar lists.
- `public/js/app/profile-panel.js` loads and renders the slide-out profile panel.
- `public/js/app/notebook-modal.js` manages the add/edit notebook modal.
- `public/js/app/toast.js` renders toast notifications.
- `public/js/app/main.js` boots the page and exposes compatibility globals for existing inline handlers.

## Testing

Run all current unit checks with:

```bash
npm test
```

The test script runs the helper unit checks in `lib/` and the pagination helper check in `public/js/`.
