import type { RequestHandler } from 'msw';
import { setupServer } from 'msw/node';
import { vitest } from 'vitest';

export const createMockServer = () => {
  const server = setupServer();
  const onUnhandledRequest = vitest.fn();

  return {
    onUnhandledRequest,
    start() {
      server.listen({
        onUnhandledRequest(req, print) {
          console.error(`[MSW] Request not in whitelist: ${req.method} ${req.url}`);

          onUnhandledRequest();

          print.error();
        },
      });
    },
    addHandlers(...handlers: RequestHandler[]) {
      server.use(...handlers);
    },
    clearHandlers() {
      server.resetHandlers();
    },
    stop() {
      server.close();
    },
  };
};

export type MockServer = ReturnType<typeof createMockServer>;
