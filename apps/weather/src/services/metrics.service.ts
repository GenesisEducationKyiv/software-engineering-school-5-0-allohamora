import { Registry, collectDefaultMetrics, Counter } from 'prom-client';

export { Counter };

export class MetricsService {
  private register = new Registry();

  constructor() {
    collectDefaultMetrics({ register: this.register });
  }

  public async collectMetrics() {
    return {
      metrics: await this.register.metrics(),
      contentType: this.register.contentType,
    };
  }

  public getCounter(name: string, description: string, labelNames: string[] = []) {
    return new Counter({
      name,
      help: description,
      registers: [this.register],
      labelNames,
    });
  }

  public clearMetrics() {
    this.register.clear();
  }
}
