# SWAPPR Gmail OAuth2 Setup — Agent Handoff

## What you are doing

Setting up Gmail OAuth2 credentials so SWAPPR can send OTP verification emails.
SWAPPR is a Node.js/Express app running on a self-hosted Linux server (nathanlab) via PM2.

The code is already written and deployed. You are only getting credentials from Google and putting them in the `.env` file on the server.

---

## What the app expects

Four env vars in `/mnt/Storage2_New/website-hosting/SWAPPR/.env` on nathanlab:

```
GMAIL_USER=           # the Gmail address that sends OTPs
GMAIL_CLIENT_ID=      # from Google Cloud Console
GMAIL_CLIENT_SECRET=  # from Google Cloud Console
GMAIL_REFRESH_TOKEN=  # from OAuth2 Playground
```

The nodemailer transport config (already in `server.js`) is:

```js
nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAuth2",
    user: process.env.GMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  },
});
```

---

## Step-by-step: get the credentials

### 1. Google Cloud Console — create OAuth2 credentials

1. Go to https://console.cloud.google.com
2. Create a project (or use an existing one)
3. Enable the **Gmail API**: APIs & Services → Library → search "Gmail API" → Enable
4. Go to APIs & Services → **Credentials** → Create Credentials → **OAuth client ID**
5. Application type: **Web application**
6. Name: anything (e.g. "SWAPPR Mailer")
7. Under **Authorized redirect URIs**, add: `https://developers.google.com/oauthplayground`
8. Click Create — copy the **Client ID** and **Client Secret**

### 2. OAuth Consent Screen (if prompted)

- User type: **External** (unless Google Workspace org)
- Add scope: `https://mail.google.com/`
- Add the Gmail address (GMAIL_USER) as a **test user**

### 3. OAuth2 Playground — get refresh token

1. Go to https://developers.google.com/oauthplayground
2. Click the gear icon (top right) → check **"Use your own OAuth credentials"**
3. Paste your Client ID and Client Secret
4. In the left panel, find **"Gmail API v1"** or manually type `https://mail.google.com/` → click Authorize
5. Sign in with the Gmail account that will send emails (GMAIL_USER)
6. Click **"Exchange authorization code for tokens"**
7. Copy the **Refresh token** — this is `GMAIL_REFRESH_TOKEN`

> Note: The access token expires in ~1 hour. The refresh token does not expire unless revoked or unused for 6 months. SWAPPR uses the refresh token; nodemailer handles access token renewal automatically.

---

## Step-by-step: deploy to nathanlab

SSH into nathanlab (via Tailscale) and run:

```bash
cd /mnt/Storage2_New/website-hosting/SWAPPR
nano .env
```

Add or update these lines (remove any old `EMAIL_USER` / `EMAIL_PASS` lines):

```
GMAIL_USER=your-gmail@gmail.com
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
```

Save, then restart:

```bash
pm2 restart swappr
pm2 save
pm2 logs swappr --lines 20
```

Expected logs: `Connected to SQLite database.` and `SWAPPR running on http://127.0.0.1:8084` — no errors.

---

## Smoke test

```bash
curl -X POST http://localhost:8084/api/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"yournumber@usc.edu.ph"}'
```

Expected: `{"success":true}` and an email in the inbox.

If it fails:

```bash
pm2 logs swappr --lines 50
```

Look for `[OTP] Email send failed:` — the error message will name the exact problem (wrong client ID, scope missing, refresh token invalid, etc.).

---

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `invalid_client` | Wrong Client ID or Secret | Re-check Google Cloud Console credentials |
| `invalid_grant` | Refresh token expired or revoked | Repeat OAuth2 Playground step 3 to get a new refresh token |
| `access_denied` | Gmail address not added as test user | Add it in OAuth Consent Screen → Test Users |
| `insufficient_permission` | Wrong scope | Re-authorize with `https://mail.google.com/` scope |
| `{"success":false,"message":"Email verification is not configured"}` | Env vars missing or .env not loaded | Check `pm2 env swappr` to confirm vars are visible |

---

## What NOT to change

- Do not touch `server.js`, `lib/otpPolicy.js`, or any route files — the code is complete
- Do not add new npm packages
- Do not commit `.env` to git — it is in `.gitignore`
