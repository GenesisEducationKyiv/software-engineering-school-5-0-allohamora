import { ServerError, ServerMiddleware, Status } from 'nice-grpc';
import { Counter, Histogram, MetricsService } from './metrics.service.js';
import { Exception } from 'src/exception.js';

type Dependencies = {
  metricsService: MetricsService;
};

export class GrpcService {
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
      buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
    });
  }

  public createErrorMiddleware() {
    const { requestCounter, errorCounter, requestDurationHistogram } = this;

    return async function* (call, context) {
      requestCounter.inc({ path: call.method.path });
      const endTimer = requestDurationHistogram.startTimer({ path: call.method.path });

      try {
        return yield* call.next(call.request, context);
      } catch (err) {
        const message = err instanceof Exception ? err.message : 'internal server error';
        const statusCode = err instanceof Exception ? err.getGrpcStatus() : Status.INTERNAL;

        errorCounter.inc({ path: call.method.path, message, statusCode });

        throw new ServerError(statusCode, message);
      } finally {
        endTimer();
      }
    } as ServerMiddleware;
  }
}
