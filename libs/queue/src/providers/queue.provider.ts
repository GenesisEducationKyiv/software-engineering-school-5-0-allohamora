import { Messages } from 'src/types/message.types.js';

export interface Publisher {
  publish: <K extends keyof Messages>(topic: K, data: Messages[K]) => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface Subscriber {
  subscribe: <K extends keyof Messages>(topic: K, handler: (data: Messages[K]) => Promise<void>) => Promise<void>;
  run: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface QueueProvider {
  createPublisher(): Publisher;
  createSubscriber(): Subscriber;
}
