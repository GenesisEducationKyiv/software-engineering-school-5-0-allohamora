import { Counter, Histogram, MetricsService } from './metrics.service.js';

type Dependencies = {
  metricsService: MetricsService;
};

export class GrpcMetricsService {
  private requestCounter: Counter;
  private errorCounter: Counter;
  private requestDurationHistogram: Histogram;

  constructor({ metricsService }: Dependencies) {
    this.requestCounter = metricsService.createCounter({
      name: 'grpc_requests_total',
      help: 'Total number of gRPC requests',
      labelNames: ['path'],
    });

    this.errorCounter = metricsService.createCounter({
      name: 'grpc_errors_total',
      help: 'Total number of gRPC errors',
      labelNames: ['path', 'message', 'statusCode'],
    });

    this.requestDurationHistogram = metricsService.createHistogram({
      name: 'grpc_request_duration_seconds',
      help: 'Duration of gRPC requests in seconds',
      labelNames: ['path'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });
  }

  public increaseRequestCount(data: { path: string }) {
    this.requestCounter.inc(data);
  }

  public increaseErrorCount(data: { path: string; message: string; statusCode: number }) {
    this.errorCounter.inc(data);
  }

  public startRequestDurationTimer(data: { path: string }) {
    return this.requestDurationHistogram.startTimer(data);
  }
}
