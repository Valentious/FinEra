# Messaging (RabbitMQ)

FinEra uses **RabbitMQ** for domain events (replaces the old in-memory ring buffer for delivery).

## Topology

| Name | Kind | Role |
|------|------|------|
| `finera.events` | topic (durable) | Publishers use routing key `domain.event` |
| `finera.events.main` | queue (durable) | Consumers; bound to `domain.event` and `replay` |
| `finera.events.retry` | queue (durable) | Per-queue TTL → dead-letters back to `replay` (delayed retry) |
| `finera.dlx` | fanout (durable) | Dead-letter exchange |
| `finera.events.dlq` | queue (durable) | Failed / poison messages after max attempts |

## Behaviour

- **Durable queues & exchanges** — survive broker restart (messages still need `persistent` flag on publish).
- **Persistent messages** — `publish(..., { persistent: true })`.
- **Retry** — on handler failure, message is re-queued to `finera.events.retry`; after `RABBITMQ_RETRY_DELAY_MS` it returns to the main queue via routing key `replay`. `attempt` in the JSON body increments until `RABBITMQ_RETRY_MAX` attempts are exhausted.
- **DLQ** — after max attempts, or invalid envelope (nack), messages land in `finera.events.dlq` (fanout from `finera.dlx`).

## Environment

- `RABBITMQ_URL` — e.g. `amqp://user:pass@localhost:5672` (omit to fall back to synchronous dispatch on publish only).
- `RABBITMQ_RETRY_MAX` — max delivery attempts (default `3`).
- `RABBITMQ_RETRY_DELAY_MS` — retry queue TTL / delay (default `30000`).

## Persistence (Postgres)

Every publish also inserts into `domain_events` (append-only) for the admin activity API and audit.

## Local Docker

```bash
docker compose up -d rabbitmq
```

Management UI: `http://localhost:15672` (see compose for default user/password).
