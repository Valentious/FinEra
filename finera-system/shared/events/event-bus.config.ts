/**
 * FinEra Event Bus Configuration
 * RabbitMQ exchanges, queues, bindings for event-driven architecture
 */

export enum EventType {
  // User Events
  USER_REGISTERED = 'user.registered',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',

  // Transaction Events
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_COMPLETED = 'transaction.completed',
  TRANSACTION_REVERSED = 'transaction.reversed',

  // Credit Events
  CREDIT_SCORE_UPDATED = 'credit.score.updated',
  CREDIT_RISK_CHANGED = 'credit.risk.changed',

  // Learning Events
  MODULE_COMPLETED = 'learning.module.completed',
  TERM_INTERACTED = 'learning.term.interacted',
  RECOMMENDATION_GENERATED = 'learning.recommendation.generated',

  // System Events
  SYSTEM_HEALTH_CHECK = 'system.health.check',
  SYSTEM_ERROR = 'system.error',
}

export interface Event<T = unknown> {
  id: string;
  type: EventType;
  version: number;
  timestamp: string;
  source: string;
  data: T;
  metadata?: {
    correlationId?: string;
    userId?: string;
    traceId?: string;
    retryCount?: number;
    [key: string]: unknown;
  };
}

export interface ExchangeConfig {
  name: string;
  type: 'direct' | 'topic' | 'fanout' | 'headers';
  durable: boolean;
  autoDelete?: boolean;
}

export interface QueueConfig {
  name: string;
  durable: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  arguments?: Record<string, unknown>;
}

export interface BindingConfig {
  exchange: string;
  queue: string;
  routingKey: string;
}

export const eventBusConfig = {
  connection: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    heartbeat: 60,
    reconnectTime: 5000,
    maxRetries: 10,
  },

  exchanges: {
    user: {
      name: 'user.events',
      type: 'topic' as const,
      durable: true,
    } as ExchangeConfig,
    transaction: {
      name: 'transaction.events',
      type: 'topic' as const,
      durable: true,
    } as ExchangeConfig,
    credit: {
      name: 'credit.events',
      type: 'topic' as const,
      durable: true,
    } as ExchangeConfig,
    learning: {
      name: 'learning.events',
      type: 'topic' as const,
      durable: true,
    } as ExchangeConfig,
    system: {
      name: 'system.events',
      type: 'fanout' as const,
      durable: true,
    } as ExchangeConfig,
    deadLetter: {
      name: 'dead.letter.events',
      type: 'fanout' as const,
      durable: true,
      autoDelete: false,
    } as ExchangeConfig,
  },

  queues: {
    userService: {
      name: 'user.service.queue',
      durable: true,
      arguments: { 'x-dead-letter-exchange': 'dead.letter.events' },
    } as QueueConfig,
    ledgerService: {
      name: 'ledger.service.queue',
      durable: true,
      arguments: { 'x-dead-letter-exchange': 'dead.letter.events' },
    } as QueueConfig,
    creditEngine: {
      name: 'credit.engine.queue',
      durable: true,
      arguments: { 'x-dead-letter-exchange': 'dead.letter.events' },
    } as QueueConfig,
    learningService: {
      name: 'learning.service.queue',
      durable: true,
      arguments: { 'x-dead-letter-exchange': 'dead.letter.events' },
    } as QueueConfig,
    adminService: {
      name: 'admin.service.queue',
      durable: true,
      arguments: { 'x-dead-letter-exchange': 'dead.letter.events' },
    } as QueueConfig,
    notificationService: {
      name: 'notification.service.queue',
      durable: true,
      arguments: { 'x-dead-letter-exchange': 'dead.letter.events' },
    } as QueueConfig,
    deadLetter: {
      name: 'dead.letter.queue',
      durable: true,
    } as QueueConfig,
  },

  bindings: [
    { exchange: 'user.events', queue: 'ledger.service.queue', routingKey: 'user.registered' },
    { exchange: 'user.events', queue: 'credit.engine.queue', routingKey: 'user.registered' },
    { exchange: 'user.events', queue: 'learning.service.queue', routingKey: 'user.registered' },
    { exchange: 'user.events', queue: 'admin.service.queue', routingKey: 'user.*' },
    { exchange: 'user.events', queue: 'notification.service.queue', routingKey: 'user.*' },
    { exchange: 'transaction.events', queue: 'credit.engine.queue', routingKey: 'transaction.completed' },
    { exchange: 'transaction.events', queue: 'notification.service.queue', routingKey: 'transaction.*' },
    { exchange: 'transaction.events', queue: 'admin.service.queue', routingKey: 'transaction.*' },
    { exchange: 'credit.events', queue: 'learning.service.queue', routingKey: 'credit.score.updated' },
    { exchange: 'credit.events', queue: 'notification.service.queue', routingKey: 'credit.*' },
    { exchange: 'learning.events', queue: 'credit.engine.queue', routingKey: 'learning.module.completed' },
    { exchange: 'learning.events', queue: 'notification.service.queue', routingKey: 'learning.*' },
    { exchange: 'dead.letter.events', queue: 'dead.letter.queue', routingKey: '' },
  ],
};
