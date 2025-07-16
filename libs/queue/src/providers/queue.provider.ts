export interface Publisher {
  publish: (topic: string, data: Record<string, unknown>) => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface Subscriber {
  subscribe: (topic: string, handler: (data: Record<string, unknown>) => Promise<void>) => Promise<void>;
  run: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface QueueProvider {
  createPublisher(): Publisher;
  createSubscriber(): Subscriber;
}
