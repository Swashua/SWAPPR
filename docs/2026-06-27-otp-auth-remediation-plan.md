# OTP Signup Hardening Plan

**Date:** 2026-06-27
**Status:** Implemented; pending manual SMTP verification
**Scope:** Registration email verification only

## Goal

Keep the teammate's OTP signup idea, but remove the localhost-only fragility and
turn it into a portable, documented, deployable feature.

This plan does **not** attempt to build full MFA or OTP login. It scopes OTP to
**signup email verification** only.

## Confirmed Product Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Email ownership | One school email maps to exactly one account |
| 2 | OTP feature scope | Signup email verification only |
| 3 | Mail transport | Any SMTP provider via environment config |
| 4 | Portability goal | Must work on machines other than the original teammate's localhost |
| 5 | Student identity field | `studentId` and `yearLevel` are different concepts and must not be conflated |

## Current Problems

### 1. OTP state is process-local

`server.js` stores OTP data in an in-memory `Map`.

Impact:
- restarting the server destroys every pending OTP
- multiple app instances cannot share verification state
- deployments behind restarts or scaling break the signup flow

### 2. Mail delivery is hard-coded to Gmail

The current transport uses:

```js
nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});
```

Impact:
- feature depends on one provider and one teammate's personal setup
- repo does not document required environment variables
- behavior is not portable across machines or hosting environments

### 3. Registration data model is incorrect

Frontend `regStudentId` is sent as `yearLevel`, and backend stores that value in
the `yearLevel` column.

Impact:
- student ID is silently misfiled as year level
- future profile/account features will read bad data
- teammates cannot reason about the schema safely

### 4. Email uniqueness is not enforced

`username` is unique, but `email` is not.

Impact:
- one school email can create multiple accounts
- OTP verification loses product meaning if email ownership is supposed to map
  to a single account

### 5. Abuse controls are frontend-only

The resend timer exists in `public/login.html`, but there is no real backend
cooldown or rate limit.

Impact:
- anyone can script repeated `/api/send-otp` calls
- mail sender can be throttled or flagged
- behavior is brittle in real deployment

### 6. Auth storage is still insecure

Passwords are stored and compared in plaintext.

Impact:
- even a hardened OTP flow would still sit on top of weak account security

### 7. No setup contract exists

There is no `.env.example`, no README section for OTP setup, and no operational
documentation for SMTP configuration.

Impact:
- feature depends on tribal knowledge
- other teammates cannot reproduce or deploy it confidently

## Approved Direction

### Keep

- email verification before account creation
- USC email format validation
- two-step registration UX

### Fix

- OTP persistence
- SMTP configuration
- default host binding safety
- account uniqueness rules
- registration field mapping
- backend abuse protection
- documentation

## Implemented So Far

### Portable OTP signup flow

The fragile localhost-only OTP prototype has been replaced with a portable
signup verification flow:

- OTP records are persisted in SQLite through `EmailOtps`
- OTP codes are stored as `scrypt` hashes, not raw codes
- OTP resend cooldown is enforced by the backend
- incorrect OTP attempts are counted by the backend
- verification is locked after 5 wrong attempts until a new code is requested
- already-registered school emails cannot request another signup OTP
- successful registration deletes the OTP record
- SMTP is configured with provider-neutral environment variables
- legacy Gmail env vars still work as a fallback

### Account data fixes

- one school email maps to exactly one account
- `studentId` is stored separately from `yearLevel`
- new/updated passwords use built-in `scrypt` hashing
- legacy plaintext passwords are upgraded to hashed values after successful login
- `.env.example` and README setup notes document the required runtime contract

### Local-only default host binding

The server now defaults to:

```js
const HOST = process.env.HOST || "127.0.0.1";
```

Reason:
- `0.0.0.0` listens on every network interface
- that is useful when intentionally exposing the app, but too broad as a
  default for local development
- `127.0.0.1` keeps the app reachable on the same machine through
  `http://localhost:3000` while avoiding accidental LAN exposure by default

Operational rule:
- local development should default to `HOST=127.0.0.1`
- wider access must be explicit by setting `HOST=0.0.0.0` or another intended
  interface in the environment

### Do Not Do Yet

- OTP login
- password reset flow
- authenticator apps
- SMS delivery

## Target Design

### Data model

Add persistent OTP storage in SQLite instead of an in-memory `Map`.

Implemented table shape:

```sql
CREATE TABLE IF NOT EXISTS EmailOtps (
  email TEXT PRIMARY KEY,
  otpHash TEXT,
  expires_at INTEGER NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  resendAvailableAt INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
```

The table keeps a legacy `otp` column with an empty default for compatibility
with existing SQLite databases, but new OTP codes are written to `otpHash`.

Also fix the user schema:

1. Keep `yearLevel` for actual year level only, if the product really needs it.
2. Add a real `studentId` column if student ID is intentionally collected.
3. Add a unique constraint for `email`.

Recommended user rule:

```sql
email TEXT UNIQUE
```

If the existing table cannot be altered cleanly in place, use an idempotent
migration approach or rebuild the table safely.

### SMTP configuration

Replace provider-specific transport creation with env-driven SMTP config.

Recommended env vars:

```env
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Behavior:
- app should fail clearly if OTP email is enabled but SMTP config is incomplete
- transport must work with Gmail, SendGrid SMTP, Mailgun SMTP, Brevo SMTP, or
  any standard SMTP provider

### OTP handling

Recommended backend behavior:

1. `/api/send-otp`
   - validate USC email format
   - reject if email already belongs to an existing account
   - enforce resend cooldown on the server
   - generate a 6-digit code
   - store only a hash of the code, not the raw code
   - upsert the OTP record in SQLite
   - send the email through SMTP

2. `/api/verify-otp`
   - validate email + code
   - reject expired codes
   - increment failed attempt counter
   - mark record `verified = 1` on success

3. `/api/register`
   - require a verified OTP record for the same email
   - require unique username and unique email
   - create the user
   - delete the OTP record after successful registration

### Registration fields

The form contract must be explicit.

If the product wants both:
- `studentId`
- `yearLevel`

then the UI and backend should carry both as separate fields.

If the product only wants student ID:
- remove `yearLevel` from registration entirely
- rename all relevant code to `studentId`

Current evidence suggests the present implementation accidentally uses
`yearLevel` as a container for `studentId`, which must be corrected.

### Passwords

Move password storage to hashed values before calling this auth flow
deployable.

Implemented approach:
- use Node's built-in `crypto.scryptSync`
- hash on register
- compare hashes on login
- upgrade legacy plaintext passwords after a successful login

This is not optional if the feature is meant to leave localhost safely.

## Implementation Order

### Phase 1: Stabilize the contract

1. Document the product rules:
   - one email per account
   - OTP is signup verification only
   - clarify whether `studentId`, `yearLevel`, or both are required
2. Add `.env.example`
3. Add README setup instructions for SMTP

### Phase 2: Fix data and backend behavior

1. Add `EmailOtps` table - done
2. Add `studentId` and unique `email` handling - done
3. Replace in-memory `otpStore` - done
4. Add backend resend cooldown and attempt limits - done
5. Reject `/api/send-otp` for already-registered emails - done

### Phase 3: Fix auth safety

1. Hash passwords - done
2. Update login path to verify password hashes - done

### Phase 4: Align frontend

1. Fix registration payload naming - done
2. Show better OTP errors - done through backend message passthrough:
   - email already registered
   - cooldown active
   - code expired
   - too many wrong attempts
3. Keep resend timer in UI, but treat backend as the source of truth - done

### Phase 5: Verify

Manual verification:

1. Start from a clean DB state
2. Register with a new USC email
3. Confirm OTP sends
4. Confirm OTP survives server restart only if persistence is correctly wired
5. Confirm the same email cannot register twice
6. Confirm cooldown and attempt limit work
7. Confirm login still works after password hashing migration

Automated verification:

1. unit-test OTP expiry/cooldown logic
2. unit-test email uniqueness guard
3. unit-test registration field mapping
4. integration-test register flow with a mocked transporter

## Recommended First Implementation Slice

Completed first implementation slice:

1. add SQLite-backed OTP storage
2. switch to env-driven SMTP config
3. enforce unique email
4. fix `studentId` vs `yearLevel`
5. add `.env.example` and README instructions

Additional guardrails completed in the same pass:

1. hash OTP codes at rest
2. add backend resend cooldown
3. add OTP failed-attempt lockout
4. hash account passwords

## Non-Goals

- redesigning the entire account system
- introducing OAuth or SSO
- building a production-grade anti-abuse platform
- adding phone-based OTP

## Recommendation

Treat the teammate implementation as a prototype spike, not a finished
foundation.

We should preserve the user experience idea, but replace the fragile parts
before trusting it beyond localhost.
