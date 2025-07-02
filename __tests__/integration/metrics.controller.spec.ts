import { ctx } from '__tests__/setup-integration-context.js';
import { HttpStatus } from 'src/secondary/types/http.types.js';
import { Server } from 'src/primary/adapters/server.js';
import { MetricsProvider } from 'src/secondary/adapters/metrics.provider.js';

describe('metrics controller (integration)', () => {
  let server: Server;
  let metricsProvider: MetricsProvider;

  beforeAll(() => {
    ({ server, metricsProvider } = ctx);
  });

  afterEach(() => {
    metricsProvider.clearMetrics();
  });

  const getMetrics = async (status = HttpStatus.OK) => {
    const res = await server.request('/api/metrics', {
      method: 'GET',
    });

    expect(res.headers.get('content-type')).toEqual('text/plain; version=0.0.4; charset=utf-8');

    expect(res.status).toBe(status);

    return res.text();
  };

  describe('GET /api/metrics', () => {
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

    it('creates counter with initial value of 0', async () => {
      metricsProvider.getCounter('test_initial_counter_total', 'A test counter to verify initial value');

      const data = await getMetrics();

      expect(data).toContain('test_initial_counter_total');
      expect(data).toContain('A test counter to verify initial value');
      expect(data).toContain('test_initial_counter_total 0');
      expect(data).toContain('# TYPE test_initial_counter_total counter');
    });

    it('returns updated counter values after increment', async () => {
      const testCounter = metricsProvider.getCounter('test_counter_total', 'A test counter for integration testing');

      testCounter.inc();

      const data = await getMetrics();

      expect(data).toContain('test_counter_total');
      expect(data).toContain('A test counter for integration testing');
      expect(data).toContain('test_counter_total 1');
      expect(data).toContain('# TYPE test_counter_total counter');
    });
  });
});
