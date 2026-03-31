# Notification Service

**Target bounded context:** delivery of email, SMS, push, and in-app notifications. Templates, provider selection, and delivery status belong here.

**Current state:** HTTP routes may still be mounted from `admin-service/notification.routes.ts` via the API gateway. When splitting deployables:

1. Move route handlers and Prisma queries for notifications into this folder (or a separate package).
2. Subscribe to domain events (`LoanApproved`, `KycSubmitted`, …) from `infrastructure/messaging/` instead of only synchronous calls.
3. Keep **Ledger** and **Credit Engine** imports out of this service; pass user and amount as event payload fields only.
