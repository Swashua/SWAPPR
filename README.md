<div align="center">
  <img src="public/Images/swappr_logo_updated.jpg" alt="SWAPPR Logo" width="200" />
  <p>
    <a href="https://github.com/Swashua/SWAPPR/commits/main">
      <img alt="Last commit" src="https://img.shields.io/github/last-commit/Swashua/SWAPPR?style=for-the-badge&logo=github&color=7c3aed" />
    </a>
    <a href="https://github.com/Swashua/SWAPPR/blob/main/LICENSE">
      <img alt="License" src="https://img.shields.io/github/license/Swashua/SWAPPR?style=for-the-badge&color=2563eb" />
    </a>
    <a href="https://github.com/Swashua/SWAPPR/issues">
      <img alt="Issues" src="https://img.shields.io/github/issues/Swashua/SWAPPR?style=for-the-badge&color=dc2626" />
    </a>
    <a href="https://github.com/Swashua/SWAPPR/pulls">
      <img alt="Pull requests" src="https://img.shields.io/github/issues-pr/Swashua/SWAPPR?style=for-the-badge&color=059669" />
    </a>
  </p>
  <h1>SWAPPR — Study Together</h1>
</div>

**SWAPPR** is a collaborative platform for students to share notebooks, study materials, and seamlessly filter courses by department.

## Features
- **Notebook Sharing & Swapping:** Easily upload your portfolios and swap study materials with peers.
- **Department Browsing:** Automatically filters and organizes courses into clean, intuitive department categories.
- **Study Requests (Swapps):** Manage and respond to incoming requests for course materials.
- **Dynamic & Responsive UI:** Built with Tailwind CSS, supporting modern dark mode and dynamic theme toggling.

## Technology Stack
- **Backend:** Node.js, Express, SQLite3
- **Frontend:** Vanilla JavaScript, HTML5, Tailwind CSS, Lucide Icons

## Project Map
- `server.js` - Express API and static file server.
- `lib/` - course, subject, and department helpers with unit tests.
- `public/` - static HTML, CSS, images, and browser JavaScript.
- `public/js/app/` - focused front-end modules loaded by `public/index.html`.
- `sql/` - local SQLite databases used by the app.
- `docs/` - backlog, architecture notes, and implementation plans.

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your system.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd SWAPPR
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Initialize and seed the database (if needed):
   ```bash
   node seed.js
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`.

### Testing

Run the current unit checks:

```bash
npm test
```

For a deeper map of the codebase, see `docs/ARCHITECTURE.md`.

## Contributing
This is a closed project. Contributions, pull requests, and issues are not currently being accepted.

## License
This project is licensed under the [MIT License](LICENSE).
