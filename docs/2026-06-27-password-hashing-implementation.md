# Password Hashing & Legacy Cleanup Implementation Plan

Date: 2026-06-27
Goal: Remove legacy code storing passwords in plaintext and hash all passwords to improve account system security. 

## Analysis & Requirements

Following the `ponytail` (lazy senior dev) and `superpowers` (brainstorming/design) guidelines, the analysis of the `SWAPPR` codebase reveals:
1. **Current State:**
   - `server.js` already contains `hashPassword` and `verifyPassword` functions using `crypto.scryptSync`.
   - `verifyPassword` has a fallback to plaintext comparison if the hash doesn't start with `scrypt$`.
   - The `/api/login` endpoint has lazy-migration logic that hashes the plaintext password upon successful login.
   - `seed.js` stores and inserts passwords as plaintext (e.g., `"pass1234"`).
   - The user has requested to both wipe/reseed for dev AND provide a migration script to preserve existing accounts in production.

2. **Refactoring Need (Ponytail principles):**
   - We must reuse the existing `crypto` implementation rather than introducing new dependencies (like `bcrypt`).
   - Because `seed.js`, `server.js`, and the new migration script will all need `hashPassword`, it is most efficient and DRY to extract this logic into a small, focused module: `lib/auth.js`.
   - We can delete the plaintext fallback and the lazy migration block entirely. Smallest working diff, deletion over addition.

## Proposed Changes

### 1. Core Authentication Module
#### [NEW] `lib/auth.js`
Extract the existing hashing logic from `server.js` into this standalone module so it can be safely reused by scripts without booting the Express server.
- Move `HASH_PREFIX = "scrypt"`.
- Move `hashPassword` and `verifyPassword`.
- **CRITICAL CHANGE:** In `verifyPassword`, remove the legacy plaintext fallback. It should *only* attempt to verify the hash. If the stored password does not start with `scrypt$`, return `false`.
- Export both functions.

### 2. Server Cleanup
#### [MODIFY] `server.js`
- Remove the inline `hashPassword` and `verifyPassword` functions.
- Import them from `./lib/auth.js`.
- **CRITICAL CHANGE:** In the `/api/login` route, delete the lazy upgrade logic:
  ```javascript
  // DELETE THIS BLOCK:
  if (!String(user.password || "").startsWith(`${HASH_PREFIX}$`)) {
    const upgradedPassword = hashPassword(password);
    db.run(`UPDATE Users SET password = ? WHERE id = ?`, ...);
  }
  ```

### 3. Seeding Updates
#### [MODIFY] `seed.js`
- Import `hashPassword` from `./lib/auth.js`.
- When iterating through the `users` array, wrap the plaintext passwords in `hashPassword()` before insertion. For example:
  ```javascript
  [u.name, u.username, hashPassword(u.password), u.course, department, u.studentId]
  ```
- This ensures any new dev database initialized with `node seed.js` is secure from inception.

### 4. Database Migration
#### [NEW] `scripts/migrate_passwords.js`
Create a one-off script for existing environments where we cannot simply drop the database.
- Connect to `swappr.db`.
- Fetch all users where `password NOT LIKE 'scrypt$%'`.
- Iterate through these users, hash their plaintext passwords using `hashPassword` from `lib/auth.js`.
- Execute an `UPDATE` statement for each user to save their new hashed password.
- Print a success message summarizing how many accounts were migrated.

## Verification Plan

### Automated / Manual Verification
1. **Migration Verification:** Run `node scripts/migrate_passwords.js` on the existing `swappr.db`. Log in with an existing account to confirm the password still works and is hashed in the database.
2. **Seed Verification:** Delete `swappr.db`, run `node seed.js`, and verify that `sqlite3 swappr.db "SELECT password FROM Users"` returns only `scrypt$...` hashes.
3. **Login Verification:** Start the server (`node server.js`) and ensure logging in with "pass1234" still works for seeded accounts.
4. **Test Suite:** Run `npm test` to ensure we didn't break any unrelated components.
