import { ctx } from '__tests__/setup-integration-context.js';
import { HttpStatus } from 'src/types/http.types.js';
import { Server } from 'src/server.js';
import { MetricsService } from 'src/services/metrics.service.js';

describe('metrics controller (integration)', () => {
  let server: Server;
  let metricsService: MetricsService;

  beforeAll(() => {
    ({ server, metricsService } = ctx);
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

      expect(data).toContain('process_cpu_user_seconds_total');
      expect(data).toContain('process_cpu_system_seconds_total');
      expect(data).toContain('process_cpu_seconds_total');
      expect(data).toContain('process_start_time_seconds');
      expect(data).toContain('process_resident_memory_bytes');
      expect(data).toContain('nodejs_heap_size_total_bytes');
      expect(data).toContain('nodejs_heap_size_used_bytes');
      expect(data).toContain('nodejs_external_memory_bytes');
      expect(data).toContain('nodejs_heap_space_size_total_bytes');
    });

    it('creates counter with initial value of 0', async () => {
      metricsService.getCounter('test_initial_counter_total', 'A test counter to verify initial value');

      const data = await getMetrics();

      expect(data).toContain('test_initial_counter_total');
      expect(data).toContain('A test counter to verify initial value');
      expect(data).toContain('test_initial_counter_total 0');
      expect(data).toContain('# TYPE test_initial_counter_total counter');
    });

    it('returns updated counter values after increment', async () => {
      const testCounter = metricsService.getCounter('test_counter_total', 'A test counter for integration testing');

      testCounter.inc();

      const data = await getMetrics();

      expect(data).toContain('test_counter_total');
      expect(data).toContain('A test counter for integration testing');
      expect(data).toContain('test_counter_total 1');
      expect(data).toContain('# TYPE test_counter_total counter');
    });
  });
});
