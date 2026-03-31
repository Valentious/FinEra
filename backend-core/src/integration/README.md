# Integration layer

**Purpose:** Adapters for external systems (payment service providers, KYC vendors, SMS/email providers, FX rate feeds).  

**Rules:**

- No core double-entry or balance rules here — call **Ledger Service** for money movement.
- Retry, circuit breaking, and webhook signature verification live next to each adapter.
- Map external IDs to internal IDs in a dedicated table or column; never expose raw provider tokens to the UI.

Suggested layout as the project grows:

```
integration/
├── README.md
├── payments/       # PSP webhooks & payouts
├── kyc/            # Document verification callbacks
├── messaging/      # SMS gateway (if distinct from Notification Service delivery)
└── fx/             # Rate feed fetchers (used by ledger-service/fx.service)
```
