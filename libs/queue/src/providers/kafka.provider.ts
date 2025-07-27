import { Kafka, Partitioners } from 'kafkajs';
import { Publisher, QueueProvider, Subscriber } from './queue.provider.js';
import { LoggerService, Logger } from '@weather-subscription/shared';
import { Messages } from 'src/types/message.types.js';

type Dependencies = {
  config: {
    KAFKA_CLIENT_ID: string;
    KAFKA_BROKER: string;
    KAFKA_GROUP_ID: string;
  };
  loggerService: LoggerService;
};

type Handlers = {
  [K in keyof Messages]?: (data: Messages[K]) => Promise<void>;
} & {
  [key: string]: (data: unknown) => Promise<void>;
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

    this.logger.debug({ msg: 'Kafka publisher created' });

    return {
      publish: async (topic, data) => {
        await producer.send({
          topic,
          messages: [{ value: JSON.stringify(data) }],
        });

        this.logger.debug({ msg: 'Kafka publisher message sent', topic, data });
      },
      connect: async () => {
        await producer.connect();

        this.logger.info({ msg: 'Kafka publisher connected' });
      },
      disconnect: async () => {
        await producer.disconnect();

        this.logger.info({ msg: 'Kafka publisher disconnected' });
      },
    } as Publisher;
  }

  public createSubscriber() {
    const consumer = this.kafka.consumer({ groupId: this.groupId });
    const handlers: Handlers = {};

    this.logger.debug({ msg: 'Kafka subscriber created', groupId: this.groupId });

    return {
      subscribe: async <K extends keyof Messages>(topic: K, handler: Handlers[K]) => {
        await consumer.subscribe({ topic, fromBeginning: true });

        handlers[topic] = handler;

        this.logger.debug({ msg: 'Kafka subscribed', topic });
      },
      connect: async () => {
        await consumer.connect();

        this.logger.info({ msg: 'Kafka subscriber connected', groupId: this.groupId });
      },
      run: async () => {
        await consumer.run({
          autoCommit: true,
          eachMessage: async ({ message, topic }) => {
            if (!message.value) {
              return;
            }

            const handler = handlers[topic];
            if (!handler) {
              this.logger.error({ err: new Error(`No handler found for topic: ${topic}`) });
              return;
            }

            try {
              const data = JSON.parse(message.value.toString());
              await handler(data);
            } catch (err) {
              this.logger.error({ err });
              throw err;
            }
          },
        });
      },
      disconnect: async () => {
        await consumer.disconnect();

        this.logger.info({ msg: 'Kafka subscriber disconnected', groupId: this.groupId });
      },
    } as Subscriber;
  }
}
