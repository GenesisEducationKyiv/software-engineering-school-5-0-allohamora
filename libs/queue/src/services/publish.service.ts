import { Message } from '../messages/message.js';
import { Publisher, QueueProvider } from 'src/providers/queue.provider.js';

type Dependencies = {
  queueProvider: QueueProvider;
};

export class PublishService {
  private publisher: Publisher;

  constructor({ queueProvider }: Dependencies) {
    this.publisher = queueProvider.createPublisher();
  }

  public async connect(): Promise<void> {
    await this.publisher.connect();
  }

  public async disconnect(): Promise<void> {
    await this.publisher.disconnect();
  }

  public async publish({ topic, payload }: ReturnType<Message['create']>): Promise<void> {
    await this.publisher.publish(topic, payload);
  }
}
