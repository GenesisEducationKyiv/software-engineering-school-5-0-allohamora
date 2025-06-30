import { Registry, collectDefaultMetrics, Counter } from 'prom-client';

export { Counter };

export class MetricsService {
  private register = new Registry();

  constructor() {
    collectDefaultMetrics({ register: this.register });
  }

  public getMetricsContentType() {
    return this.register.contentType;
  }

  public async getMetrics() {
    return await this.register.metrics();
  }

  public getCounter(name: string, description: string, labelNames: string[] = []) {
    return new Counter({
      name,
      help: description,
      registers: [this.register],
      labelNames,
    });
  }
}
