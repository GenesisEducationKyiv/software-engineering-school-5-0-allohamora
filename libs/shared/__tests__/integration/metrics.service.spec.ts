import { afterEach, beforeEach, beforeAll, afterAll, describe, expect, it, vitest, Mock } from 'vitest';
import { MetricsService } from 'src/services/metrics.service.js';
import { createMock } from '__tests__/utils/mock.utils.js';
import { createMockServer } from '__tests__/utils/mock-server.utils.js';
import { LoggerService } from 'src/index.js';
import { DefaultBodyType, http, HttpResponse } from 'msw';
import { scheduler } from 'node:timers/promises';

const SEND_DELAY = 10;
const CHECK_DELAY = SEND_DELAY + 5;

describe('MetricsService (integration)', () => {
  let metricsService: MetricsService;
  let errorSpy: Mock;

  const mockServer = createMockServer();

  const pushgatewayApi = {
    mock: (fn: (requestBody: string) => HttpResponse<DefaultBodyType>) => {
      return http.put('http://localhost:9091/metrics/job/test', async ({ request }) => {
        const requestBody = await request.text();
        return fn(requestBody);
      });
    },
    ok: (asserts: (body: string) => void) => {
      return pushgatewayApi.mock((body) => {
        asserts(body);
        return HttpResponse.text('', { status: 200 });
      });
    },
    serverError: () => pushgatewayApi.mock(() => HttpResponse.text('Internal Server Error', { status: 500 })),
  };

  beforeAll(() => {
    mockServer.start();
  });

  beforeEach(() => {
    errorSpy = vitest.fn();

    metricsService = new MetricsService({
      loggerService: createMock<LoggerService>({
        createLogger: () => ({
          debug: vitest.fn(),
          info: vitest.fn(),
          warn: vitest.fn(),
          error: errorSpy,
        }),
      }),
      config: {
        PROMETHEUS_JOB_NAME: 'test',
        PROMETHEUS_PUSHGATEWAY_URL: 'http://localhost:9091',
        PROMETHEUS_PUSH_DELAY: SEND_DELAY,
      },
    });
  });

  afterEach(() => {
    metricsService.clearMetrics();

    // Check for unhandled requests like in the e2e test
    expect(mockServer.onUnhandledRequest).not.toHaveBeenCalled();
    mockServer.onUnhandledRequest.mockClear();

    mockServer.clearHandlers();

    errorSpy.mockRestore();
  });

  afterAll(() => {
    mockServer.stop();
  });

  const getMetrics = async () => {
    const result = await metricsService.collectMetrics();
    return result.metrics;
  };

  describe('metrics service', () => {
    it('returns default Node.js metrics', async () => {
      const data = await getMetrics();

      const expectedMetrics = [
        'process_cpu_user_seconds_total',
        'process_cpu_system_seconds_total',
        'process_cpu_seconds_total',
        'process_start_time_seconds',
        'process_resident_memory_bytes',
        'nodejs_heap_size_total_bytes',
        'nodejs_heap_size_used_bytes',
        'nodejs_external_memory_bytes',
        'nodejs_heap_space_size_total_bytes',
      ];

      for (const metric of expectedMetrics) {
        expect(data).toContain(metric);
      }
    });

    it('includes custom metrics when created', async () => {
      const counter = metricsService.createCounter({
        name: 'test_counter',
        help: 'Test counter metric',
      });
      counter.inc();

      const data = await getMetrics();

      expect(data).toContain('test_counter');
      expect(data).toContain('Test counter metric');
    });

    it('includes counter metrics with labels', async () => {
      const counter = metricsService.createCounter({
        name: 'test_counter_with_labels',
        help: 'Test counter with labels',
        labelNames: ['method', 'status'],
      });
      counter.inc({ method: 'GET', status: '200' });

      const data = await getMetrics();

      expect(data).toContain('test_counter_with_labels');
      expect(data).toContain('method="GET"');
      expect(data).toContain('status="200"');
    });

    it('collects metrics with correct content type', async () => {
      const result = await metricsService.collectMetrics();

      expect(result.contentType).toBe('text/plain; version=0.0.4; charset=utf-8');
    });

    it('clears metrics successfully', async () => {
      const counter = metricsService.createCounter({
        name: 'test_counter',
        help: 'Test counter metric',
      });
      counter.inc();

      const before = await getMetrics();
      expect(before).toContain('test_counter');

      metricsService.clearMetrics();
      const after = await getMetrics();

      expect(after).not.toContain('test_counter');
    });

    describe('push metrics interval', () => {
      it('startSendingMetrics starts periodic pushing to pushgateway', async () => {
        mockServer.addHandlers(
          pushgatewayApi.ok((body) => {
            expect(body).toContain('test_push_counter 1');
          }),
        );

        const counter = metricsService.createCounter({
          name: 'test_push_counter',
          help: 'Test counter for push',
        });
        counter.inc();

        metricsService.startSendingMetrics();

        await scheduler.wait(CHECK_DELAY);

        metricsService.stopSendingMetrics();

        expect.assertions(1);
      });

      it('stopSendingMetrics stops periodic pushing', async () => {
        mockServer.addHandlers(
          pushgatewayApi.ok((body) => {
            expect(body).toContain('test_push_counter 1');
          }),
        );

        const counter = metricsService.createCounter({
          name: 'test_push_counter',
          help: 'Test counter for push',
        });
        counter.inc();

        metricsService.startSendingMetrics();
        await scheduler.wait(CHECK_DELAY);

        metricsService.stopSendingMetrics();
        await scheduler.wait(CHECK_DELAY);

        expect.assertions(1);
      });

      it('startSendingMetrics and stopSendingMetrics can be called multiple times safely', async () => {
        mockServer.addHandlers(
          pushgatewayApi.ok((body) => {
            expect(body).toContain('test_push_counter 1');
          }),
        );

        const counter = metricsService.createCounter({
          name: 'test_push_counter',
          help: 'Test counter for push',
        });
        counter.inc();

        metricsService.startSendingMetrics();
        metricsService.startSendingMetrics();
        metricsService.startSendingMetrics();
        await scheduler.wait(CHECK_DELAY);

        metricsService.stopSendingMetrics();
        metricsService.stopSendingMetrics();
        metricsService.stopSendingMetrics();
        await scheduler.wait(CHECK_DELAY);

        expect.assertions(1);
      });
    });

    describe('sendMetrics', () => {
      it('handles push errors gracefully', async () => {
        mockServer.addHandlers(pushgatewayApi.serverError());

        await metricsService.sendMetrics();

        expect(errorSpy).toHaveBeenCalled();
      });

      it('sends metrics data in request body', async () => {
        mockServer.addHandlers(
          pushgatewayApi.ok((body) => {
            expect(body).toContain('test_push_counter 1');
            expect(body).toContain('nodejs_heap_size_total_bytes');
          }),
        );

        const counter = metricsService.createCounter({
          name: 'test_push_counter',
          help: 'Test counter for push',
        });
        counter.inc();

        await metricsService.sendMetrics();

        expect.assertions(2);
      });
    });
  });
});
