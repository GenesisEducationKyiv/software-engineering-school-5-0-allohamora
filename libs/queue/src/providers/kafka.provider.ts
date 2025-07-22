import { Kafka, Partitioners } from 'kafkajs';
import { Publisher, QueueProvider, Subscriber } from './queue.provider.js';
import { LoggerService, Logger } from '@weather-subscription/shared';

type Dependencies = {
  config: {
    KAFKA_CLIENT_ID: string;
    KAFKA_BROKER: string;
    KAFKA_GROUP_ID: string;
  };
  loggerService: LoggerService;
};

export class KafkaProvider implements QueueProvider {
  private kafka: Kafka;

  private logger: Logger;

  private groupId: string;

  constructor({ config, loggerService }: Dependencies) {
    this.logger = loggerService.createLogger('KafkaProvider');

    this.kafka = new Kafka({
      clientId: config.KAFKA_CLIENT_ID,
      brokers: [config.KAFKA_BROKER],
      logCreator: () => {
        return ({ namespace, log: { message, ...extra } }) => {
          this.logger.info({ namespace, msg: message, ...extra });
        };
      },
    });

    this.groupId = config.KAFKA_GROUP_ID;
  }

  public createPublisher() {
    const producer = this.kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });

    return {
      publish: async (topic, data) => {
        await producer.send({
          topic,
          messages: [{ value: JSON.stringify(data) }],
        });
      },
      connect: async () => {
        await producer.connect();
      },
      disconnect: async () => {
        await producer.disconnect();
      },
    } as Publisher;
  }

  public createSubscriber() {
    const consumer = this.kafka.consumer({ groupId: this.groupId });
    const handlers: { topic: string; handler: (data: Record<string, unknown>) => Promise<void> }[] = [];

    return {
      subscribe: async (topic, handler) => {
        await consumer.subscribe({ topic, fromBeginning: true });

        handlers.push({ topic, handler });
      },
      connect: async () => {
        await consumer.connect();
      },
      run: async () => {
        await consumer.run({
          autoCommit: true,
          eachMessage: async ({ message, topic }) => {
            if (!message.value) {
              return;
            }

            const handler = handlers.find((item) => item.topic === topic)?.handler;
            if (!handler) {
              this.logger.error({ err: new Error(`No handler found for topic: ${topic}`) });
              return;
            }

            const data = JSON.parse(message.value.toString());
            await handler(data);
          },
        });
      },
      disconnect: async () => {
        await consumer.disconnect();
      },
    } as Subscriber;
  }
}
