# Post-Development Cleanup Checklist

This document serves as a running checklist to clean up the repository after a heavy development session. Mark items as completed once addressed.

## 1. Remove Temporary and Generated Files
- [x] **`output.txt`**: Delete this temporary output file from the root directory.
- [x] **`desktop.ini`**: Remove instances of `desktop.ini` from the root and `public/` directories (and ensure they are gitignored if using Windows).

## 2. Consolidate Assets
- [ ] **`SWAPPR PICS/`**: This folder contains temporary chat and index design images (`Chat_Temp.png`, `Updated_Index(TempChat).png`, etc.). Move these to a dedicated design archive, delete them if they are no longer needed, or place them in `.gitignore`.

## 3. Database & Backups
- [ ] **`sql/backup/courses.db`**: Verify if this backup needs to be kept in version control. If not, delete the backup folder or add it to `.gitignore`.
- [ ] **`sql/courses.db`**: Confirm if the main SQLite DB should be committed or generated via a script locally. If it should be generated locally, add it to `.gitignore`.

## 4. Codebase Cleanup
- [ ] **Debug Logs**: Remove or disable unnecessary `console.log` statements used for debugging in files like `server.js`, `public/js/script.js`, and `lib/course_mapper.js`.
- [ ] **Dead Code**: Review `public/js/script.js` and `server.js` for any commented-out code blocks left over from testing and remove them.

## 5. Update `.gitignore`
- [x] Ensure `.gitignore` is updated with:
  ```gitignore
  output.txt
  desktop.ini
  SWAPPR PICS/
  ```

---
*Keep this document updated as you progress through the cleanup.*
