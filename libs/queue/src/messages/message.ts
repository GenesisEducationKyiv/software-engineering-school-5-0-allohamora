export class Message<T = Record<string, unknown>> {
  private topic: string;

  constructor(topic: string) {
    this.topic = topic;
  }

  public create(payload: T) {
    return { topic: this.topic, payload };
  }

  public getTopic() {
    return this.topic;
  }
}
