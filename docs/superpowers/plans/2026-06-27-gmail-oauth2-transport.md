# Gmail OAuth2 Transport Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Gmail App Password transport with OAuth2 in `createMailTransport()`, and harden OTP generation with `crypto.randomInt`.

**Architecture:** Two surgical edits to `server.js` — swap the Gmail auth block, add `GMAIL_USER` to the `mailFromAddress` fallback chain — plus updating `.env.example` to document the new vars. No new files, no new deps (nodemailer already supports OAuth2 natively).

**Tech Stack:** Node.js, Express, nodemailer (existing), dotenv (existing)

## Global Constraints

- Do NOT touch: `EmailOtps` schema, `/api/verify-otp`, `/api/register` OTP gate, `lib/otpPolicy.js`, any other routes
- No new npm dependencies
- `.env` must stay in `.gitignore` (already present — verify, don't add duplicate)
- All changes confined to `server.js` and `.env.example`

---

### Task 1: Swap Gmail transport to OAuth2 + harden OTP generation

**Files:**

- Modify: `server.js:72-80` (Gmail App Password block → OAuth2 block)
- Modify: `server.js:86-90` (mailFromAddress — add GMAIL_USER fallback)
- Modify: `server.js:247` (Math.random OTP → crypto.randomInt)

**Interfaces:**

- Consumes: `process.env.GMAIL_USER`, `process.env.GMAIL_CLIENT_ID`, `process.env.GMAIL_CLIENT_SECRET`, `process.env.GMAIL_REFRESH_TOKEN`
- Produces: `transporter` (nodemailer Transport | null), `mailFromAddress` (string)

- [ ] **Step 1: Replace the Gmail App Password block in `createMailTransport()**`

In `server.js`, find and replace lines 72–80:

```js
// BEFORE
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}
```

Replace with:

```js
// AFTER
if (
  process.env.GMAIL_USER &&
  process.env.GMAIL_CLIENT_ID &&
  process.env.GMAIL_CLIENT_SECRET &&
  process.env.GMAIL_REFRESH_TOKEN
) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
  });
}
```

- [ ] **Step 2: Add GMAIL_USER to mailFromAddress fallback chain**

In `server.js`, find lines 86–90:

```js
const mailFromAddress =
  process.env.SMTP_FROM ||
  process.env.SMTP_USER ||
  process.env.EMAIL_USER ||
  "";
```

Replace with:

```js
const mailFromAddress =
  process.env.SMTP_FROM ||
  process.env.SMTP_USER ||
  process.env.GMAIL_USER ||
  process.env.EMAIL_USER ||
  "";
```

- [ ] **Step 3: Replace Math.random OTP with crypto.randomInt**

In `server.js`, find line 247:

```js
const otp = String(Math.floor(100000 + Math.random() * 900000));
```

Replace with:

```js
const otp = String(crypto.randomInt(100000, 1000000));
```

(`crypto` is already imported at line 3 — no new import needed.)

- [ ] **Step 4: Verify the edit visually**

Read `server.js` lines 56–92 and line 247 to confirm all three changes look correct before running anything.

Expected state of `createMailTransport()`:

```js
function createMailTransport() {
  if (process.env.SMTP_HOST) {
    // ... SMTP block unchanged ...
  }

  if (
    process.env.GMAIL_USER &&
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN
  ) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      },
    });
  }

  return null;
}
```

- [ ] **Step 5: Smoke-test locally (no .env OAuth2 vars set)**

Run:

```bash
node -e "require('dotenv').config(); const s = require('./server.js')" 2>&1 | head -5
```

Expected: server starts, logs `Connected to SQLite database.` and `SWAPPR running on http://...` — no crash. Transport will be `null` (no OAuth2 vars set locally), which is fine; the `/api/send-otp` route already guards against null transporter.

- [ ] **Step 6: Commit**

```bash
git add server.js
git commit -m "feat: replace Gmail app-password transport with OAuth2, harden OTP with crypto.randomInt"
```

---

### Task 2: Update .env.example to document OAuth2 vars

**Files:**

- Modify: `.env.example`

**Interfaces:**

- Consumes: nothing
- Produces: documented env var template for `GMAIL_USER`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`

- [ ] **Step 1: Update .env.example**

Replace the current content of `.env.example` with:

```dotenv
PORT=3000
HOST=127.0.0.1

# Preferred: generic SMTP (SendGrid, Mailgun, self-hosted, etc.)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=no-reply@example.com

# Gmail OAuth2 (preferred over App Password)
# Setup: https://developers.google.com/oauthplayground
# 1. Create OAuth2 Desktop App credentials in Google Cloud Console
# 2. Enable Gmail API
# 3. Use OAuth2 Playground to authorize https://mail.google.com/ and get refresh token
GMAIL_USER=your-gmail@gmail.com
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token

# Legacy Gmail App Password (deprecated — remove after OAuth2 is working)
# EMAIL_USER=your-gmail-address@gmail.com
# EMAIL_PASS=your-app-password
```

- [ ] **Step 2: Verify .gitignore still excludes .env**

```bash
grep "^\.env$" .gitignore
```

Expected output: `.env`

If missing, add it:

```bash
echo ".env" >> .gitignore
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: document Gmail OAuth2 env vars in .env.example"
```

---

### Task 3: Deploy to nathanlab server

**Files:** (no file edits — deployment only)

> **Note:** This task runs on the remote server over SSH. Complete Tasks 1–2 and push to git before starting this. Ask the user you handle this or they will under your guidance.

- [ ] **Step 1: Push local commits to remote**

```bash
git push
```

- [ ] **Step 2: SSH to nathanlab and pull**

```bash
# On nathanlab (via Tailscale SSH):
cd /mnt/Storage2_New/website-hosting/SWAPPR
git pull
```

- [ ] **Step 3: Populate .env with real OAuth2 credentials**

```bash
nano .env
```

Add/update these lines with real values from Google Cloud Console + OAuth2 Playground:

```dotenv
GMAIL_USER=your-gmail@gmail.com
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
```

Remove or comment out `EMAIL_USER` / `EMAIL_PASS` if present.

- [ ] **Step 4: Restart via PM2**

```bash
pm2 restart swappr
pm2 save
```

- [ ] **Step 5: Verify startup**

```bash
pm2 logs swappr --lines 20
```

Expected: `Connected to SQLite database.` and `SWAPPR running on http://127.0.0.1:8084` — no OAuth2 errors.

- [ ] **Step 6: Smoke-test OTP endpoint**

```bash
curl -X POST http://localhost:8084/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"yournumber@usc.edu.ph"}'
```

Expected response: `{"success":true}`

Check inbox for the verification email. If it fails:

```bash
pm2 logs swappr --lines 50
```

Look for `[OTP] Email send failed:` — the OAuth2 error message will name the exact problem (expired refresh token, wrong client ID, scope missing, etc.).

---

## Self-Review

**Spec coverage:**

- ✅ OAuth2 transport replaces App Password block
- ✅ `GMAIL_USER` added to `mailFromAddress` fallback
- ✅ `crypto.randomInt` replaces `Math.random` OTP
- ✅ `.env.example` documents new vars
- ✅ `.gitignore` check for `.env`
- ✅ PM2 restart + smoke test steps included

**Placeholder scan:** None found.

**Type consistency:** `transporter` is nodemailer Transport in both tasks. `mailFromAddress` is string. No cross-task type mismatches.

**Do-not-touch check:** `EmailOtps` schema, `/api/verify-otp`, `/api/register`, `lib/otpPolicy.js` — none modified.
