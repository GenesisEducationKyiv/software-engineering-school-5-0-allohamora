import { Counter, Histogram, MetricsService } from '@weather-subscription/shared';

type Dependencies = {
  metricsService: MetricsService;
};

export class HttpMetricsService {
  private requestCounter: Counter;
  private errorCounter: Counter;
  private responseDurationHistogram: Histogram;

  constructor({ metricsService }: Dependencies) {
    this.requestCounter = metricsService.createCounter({
      name: 'gateway_requests_total',
      help: 'Total number of requests to the gateway',
      labelNames: ['method', 'path'],
    });

    this.errorCounter = metricsService.createCounter({
      name: 'gateway_errors_total',
      help: 'Total number of errors in the gateway',
      labelNames: ['method', 'path', 'message', 'statusCode'],
    });

    this.responseDurationHistogram = metricsService.createHistogram({
      name: 'gateway_response_duration_seconds',
      help: 'Response duration of the gateway in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });
  }

  public increaseRequestCount(data: { method: string; path: string }) {
    this.requestCounter.inc(data);
  }

  public increaseErrorCount(data: { method: string; path: string; message: string; statusCode: number }) {
    this.errorCounter.inc(data);
  }

  public startResponseDurationTimer(data: { method: string; path: string }) {
    return this.responseDurationHistogram.startTimer(data);
  }
}
