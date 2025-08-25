import { ServerError, ServerMiddleware, Status } from 'nice-grpc';
import { Exception } from 'src/exception.js';
import { GrpcMetricsService } from './grpc-metrics.service.js';

type Dependencies = {
  grpcMetricsService: GrpcMetricsService;
};

export class GrpcService {
  private grpcMetricsService: GrpcMetricsService;

  constructor({ grpcMetricsService }: Dependencies) {
    this.grpcMetricsService = grpcMetricsService;
  }

  public createErrorMiddleware() {
    const { grpcMetricsService } = this;

    return async function* (call, context) {
      const { path } = call.method;

      grpcMetricsService.increaseRequestCount({ path });
      const endTimer = grpcMetricsService.startRequestDurationTimer({ path });

      try {
        return yield* call.next(call.request, context);
      } catch (err) {
        const message = err instanceof Exception ? err.message : 'internal server error';
        const statusCode = err instanceof Exception ? err.getGrpcStatus() : Status.INTERNAL;

        grpcMetricsService.increaseErrorCount({ path, message, statusCode });

        throw new ServerError(statusCode, message);
      } finally {
        endTimer();
      }
    } as ServerMiddleware;
  }
}
