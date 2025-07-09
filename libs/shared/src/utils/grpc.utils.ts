import { ServerError, ServerMiddleware, Status } from 'nice-grpc';
import { Exception } from 'src/exception.js';

export const grpcErrorMiddleware: ServerMiddleware = async function* (call, context) {
  try {
    yield* call.next(call.request, context);
  } catch (err) {
    if (err instanceof Exception) {
      const message = err instanceof Exception ? err.message : 'internal server error';
      const statusCode = err instanceof Exception ? err.getGrpcStatus() : Status.INTERNAL;

      throw new ServerError(statusCode, message);
    }

    throw new ServerError(Status.UNKNOWN, 'internal server error');
  }
};
