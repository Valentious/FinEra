# OTP email delivery (production)

FinEra sends registration OTPs via **Resend**, **SendGrid**, or **Amazon SES**. Configure **one** provider using environment variables.

## Quick setup

### Option A — Resend (simple)

1. Create an account at [resend.com](https://resend.com), add and verify your **domain** (not only `onboarding@resend.dev`).
2. Create an API key.
3. Set in `.env`:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM="FinEra <noreply@yourdomain.com>"
```

`EMAIL_FROM` must use an address on a **verified domain** in Resend.

### Option B — SendGrid

1. Create an API key with **Mail Send** permission.
2. Complete **Sender Authentication** (single sender or domain).
3. Set:

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxx
EMAIL_FROM="FinEra <noreply@yourdomain.com>"
# Critical: sandbox must be OFF in production
SENDGRID_SANDBOX_MODE=false
```

If `SENDGRID_SANDBOX_MODE=true`, SendGrid **accepts** requests but **does not deliver** mail to real inboxes (common pitfall).

### Option C — Amazon SES

1. Verify your domain or email in SES; move out of **sandbox** for production sends.
2. Set:

```env
EMAIL_PROVIDER=ses
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
EMAIL_FROM="noreply@yourdomain.com"
```

Use IAM credentials limited to `ses:SendEmail`.

## Domain authentication (deliverability)

For inbox placement (not spam), configure at your DNS provider:

| Record | Purpose |
|--------|---------|
| **SPF** | Authorize SendGrid / Resend / SES to send as your domain |
| **DKIM** | Cryptographic signature per provider instructions |
| **DMARC** | Policy, e.g. `v=DMARC1; p=none` → tighten to `quarantine` / `reject` after monitoring |

Each provider shows exact DNS records in their dashboard. **Do not** use random Gmail addresses as `EMAIL_FROM` for production.

## Observability

Structured logs (Pino):

- `OTP generated; attempting email delivery` — code created (OTP value never logged in production).
- `OTP email accepted by provider` — includes `provider`, `providerMessageId` when available.
- `OTP email delivery failed after retries` — includes error message (no API keys in logs).

## Development

If no provider is configured or sending fails:

- `NODE_ENV=development` — OTP is logged once with `[DEV ONLY]` (disable with `EMAIL_DEV_FALLBACK_LOG=false`).
- Never enable dev OTP logging in production.

## Rate limits (backend)

- **30 seconds** minimum between sends for the same email.
- **10** send attempts per email per rolling hour.
