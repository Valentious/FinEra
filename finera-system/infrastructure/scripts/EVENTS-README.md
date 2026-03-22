# FinEra Event-Driven Architecture (RabbitMQ)

## Overview

Event-driven architecture using RabbitMQ for loose coupling and reliability. **Backward compatible** – existing HTTP flows remain; events enhance the system.

## Quick Start

### 1. Start RabbitMQ

```powershell
cd finera-system/infrastructure/docker
docker compose up -d rabbitmq
```

RabbitMQ Management UI: http://localhost:15672 (user: finera, pass: finera_secure)

### 2. Enable Events

Add to `finera-system/.env`:

```
RABBITMQ_URL="amqp://finera:finera_secure@localhost:5672"
EVENT_BUS_ENABLED="true"
EVENT_CONSUMER_ENABLED="true"
```

### 3. Run Services

```powershell
cd finera-system
npm run start:dev
```

## Event Flow

| Event | Publisher | Consumers |
|-------|-----------|-----------|
| `user.registered` | auth-service | ledger, credit, learning, admin, notification |
| `transaction.completed` | ledger-service | credit, notification, admin |
| `credit.score.updated` | credit-engine | learning, notification |
| `learning.module.completed` | (future) | credit, notification |

## Configuration

- **Without RabbitMQ**: Services run normally; event publish is no-op; consumers are skipped.
- **With RabbitMQ**: Auth publishes `user.registered`; ledger/credit/notification consume when `EVENT_CONSUMER_ENABLED=true`.

## Key Files

- `shared/events/` – Event bus, config, types
- `backend/auth-service` – Publishes `user.registered`
- `backend/ledger-service` – Consumes `user.registered`, publishes `transaction.completed`
- `backend/credit-engine` – Consumes `user.registered`, `transaction.completed`, `learning.module.completed`
- `backend/notification-service` – Consumes user, transaction, credit, learning events

## Dead Letter Queue

Failed messages (after 3 retries) go to `dead.letter.queue` for manual review.
