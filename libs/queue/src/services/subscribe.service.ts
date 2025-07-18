import { Message } from '../messages/message.js';
import { QueueProvider, Subscriber } from 'src/providers/queue.provider.js';

type Dependencies = {
  queueProvider: QueueProvider;
};

export class SubscribeService {
  private subscriber: Subscriber;

  constructor({ queueProvider }: Dependencies) {
    this.subscriber = queueProvider.createSubscriber();
  }

  public async connect(): Promise<void> {
    await this.subscriber.connect();
  }

  public async disconnect(): Promise<void> {
    await this.subscriber.disconnect();
  }

  public async subscribe<T extends Message>(
    message: T,
    handler: (payload: T extends Message<infer A> ? A : never) => Promise<void>,
  ): Promise<void> {
    await this.subscriber.subscribe(message.getTopic(), handler as (data: Record<string, unknown>) => Promise<void>);
  }

  public async run() {
    await this.subscriber.run();
  }
}
