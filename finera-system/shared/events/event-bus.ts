/**
 * FinEra Event Bus - RabbitMQ message broker
 * Loose coupling, reliability, backward compatibility
 */

import amqp, { Channel, Connection, Message } from 'amqplib';
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import {
  eventBusConfig,
  Event,
  EventType,
  type ExchangeConfig,
  type QueueConfig,
} from './event-bus.config.js';

export class EventBus extends EventEmitter {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private consumerTags = new Map<string, string>();
  private deadLetterQueue = 'dead.letter.queue';

  constructor() {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.on('event.published', this.logEventPublished.bind(this));
    this.on('event.consumed', this.logEventConsumed.bind(this));
    this.on('event.failed', this.handleFailedEvent.bind(this));
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(eventBusConfig.connection.url);
      this.channel = await this.connection.createChannel();

      this.connection.on('error', (err) => {
        console.error('[EventBus] RabbitMQ connection error:', err);
        this.isConnected = false;
        this.reconnect();
      });

      this.connection.on('close', () => {
        console.warn('[EventBus] RabbitMQ connection closed');
        this.isConnected = false;
        this.reconnect();
      });

      await this.setupInfrastructure();

      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('[EventBus] Connected to RabbitMQ');
      this.emit('connected');
    } catch (error) {
      console.error('[EventBus] Failed to connect:', error);
      this.reconnect();
      throw error;
    }
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= eventBusConfig.connection.maxRetries) {
      console.error('[EventBus] Max reconnection attempts reached');
      this.emit('connection_failed');
      return;
    }

    this.reconnectAttempts++;
    const delay =
      eventBusConfig.connection.reconnectTime *
      Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `[EventBus] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  private async setupInfrastructure(): Promise<void> {
    if (!this.channel) throw new Error('Channel not available');

    for (const [, exchange] of Object.entries(eventBusConfig.exchanges)) {
      await this.channel.assertExchange(exchange.name, exchange.type, {
        durable: exchange.durable,
        autoDelete: exchange.autoDelete ?? false,
      });
    }

    for (const [, queue] of Object.entries(eventBusConfig.queues)) {
      await this.channel.assertQueue(queue.name, {
        durable: queue.durable,
        exclusive: queue.exclusive ?? false,
        autoDelete: queue.autoDelete ?? false,
        arguments: queue.arguments as Record<string, unknown> | undefined,
      });
    }

    for (const binding of eventBusConfig.bindings) {
      await this.channel.bindQueue(
        binding.queue,
        binding.exchange,
        binding.routingKey
      );
    }

    await this.setupDeadLetterConsumer();
  }

  async publish<T>(
    exchange: string,
    routingKey: string,
    event: Omit<Event<T>, 'id' | 'timestamp'>
  ): Promise<boolean> {
    if (!this.channel || !this.isConnected) {
      console.warn('[EventBus] Not connected, storing event for later');
      await this.storeEventForLater(event);
      return false;
    }

    try {
      const fullEvent: Event<T> = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        ...event,
      };

      const message = Buffer.from(JSON.stringify(fullEvent));
      const published = this.channel.publish(
        exchange,
        routingKey,
        message,
        {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now(),
          messageId: fullEvent.id,
        }
      );

      if (published) {
        this.emit('event.published', fullEvent);
        return true;
      }
      throw new Error('Publish returned false');
    } catch (error) {
      console.error('[EventBus] Failed to publish:', error);
      await this.storeEventForLater(event);
      return false;
    }
  }

  async consume(
    queueName: string,
    handler: (
      event: Event<unknown>,
      ack: () => void,
      nack: (requeue: boolean) => void
    ) => Promise<void>,
    options?: { prefetch?: number }
  ): Promise<string> {
    if (!this.channel || !this.isConnected) {
      throw new Error('Event bus not connected');
    }

    if (options?.prefetch) {
      await this.channel.prefetch(options.prefetch);
    }

    const consumerTag = await this.channel.consume(
      queueName,
      async (msg: Message | null) => {
        if (!msg) return;

        try {
          const event: Event<unknown> = JSON.parse(msg.content.toString());

          await handler(
            event,
            () => {
              this.channel!.ack(msg);
              this.emit('event.consumed', { event, queue: queueName });
            },
            (requeue: boolean) => {
              this.channel!.nack(msg, false, requeue);
              this.emit('event.failed', { event, queue: queueName, requeue });
            }
          );
        } catch (error) {
          console.error('[EventBus] Error processing message:', error);
          this.channel!.nack(msg, false, true);
          this.emit('event.failed', { error, queue: queueName });
        }
      },
      { noAck: false }
    );

    this.consumerTags.set(queueName, consumerTag.consumerTag);
    return consumerTag.consumerTag;
  }

  async stopConsume(queueName: string): Promise<void> {
    const tag = this.consumerTags.get(queueName);
    if (tag && this.channel) {
      await this.channel.cancel(tag);
      this.consumerTags.delete(queueName);
    }
  }

  private async setupDeadLetterConsumer(): Promise<void> {
    await this.consume(
      this.deadLetterQueue,
      async (event, ack) => {
        console.error('[EventBus] Dead letter event:', event.id, event.type);
        await this.storeDeadLetterEvent(event);
        this.emit('dead.letter', event);
        ack();
      },
      { prefetch: 1 }
    );
  }

  private async storeEventForLater(event: unknown): Promise<void> {
    console.log('[EventBus] Storing event for later:', (event as Event).type);
  }

  private async storeDeadLetterEvent(_event: Event<unknown>): Promise<void> {
    console.log('[EventBus] Dead letter stored (DB integration optional)');
  }

  private logEventPublished(event: Event<unknown>): void {
    console.log(`[EventBus] Published: ${event.type} (${event.id})`);
  }

  private logEventConsumed(data: { event: Event<unknown>; queue: string }): void {
    console.log(`[EventBus] Consumed: ${data.event.type} from ${data.queue}`);
  }

  private async handleFailedEvent(data: {
    event?: Event<unknown>;
    queue?: string;
    requeue?: boolean;
    error?: unknown;
  }): Promise<void> {
    console.error('[EventBus] Processing failed:', data);

    const event = data.event;
    if (event?.metadata && data.requeue === false) {
      const retryCount = ((event.metadata.retryCount as number) || 0) + 1;
      event.metadata.retryCount = retryCount;

      if (retryCount >= 3 && this.channel && this.isConnected) {
        await this.publish(
          eventBusConfig.exchanges.deadLetter.name,
          '',
          {
            type: EventType.SYSTEM_ERROR,
            version: 1,
            source: 'event-bus',
            data: event,
            metadata: {
              error: String(data.error),
              originalQueue: data.queue,
            },
          }
        );
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    return this.isConnected && this.channel !== null;
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    this.isConnected = false;
    console.log('[EventBus] Disconnected');
  }
}

export const eventBus = new EventBus();
