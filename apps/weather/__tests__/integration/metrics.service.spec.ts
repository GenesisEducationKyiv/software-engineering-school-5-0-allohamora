import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MetricsService } from 'src/services/metrics.service.js';

describe('MetricsService (integration)', () => {
  let metricsService: MetricsService;

  beforeEach(() => {
    metricsService = new MetricsService();
  });

  afterEach(() => {
    metricsService.clearMetrics();
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
      const counter = metricsService.getCounter('test_counter', 'Test counter metric');
      counter.inc();

      const data = await getMetrics();

      expect(data).toContain('test_counter');
      expect(data).toContain('Test counter metric');
    });

    it('includes counter metrics with labels', async () => {
      const counter = metricsService.getCounter('test_counter_with_labels', 'Test counter with labels', [
        'method',
        'status',
      ]);
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
      const counter = metricsService.getCounter('test_counter', 'Test counter metric');
      counter.inc();

      const before = await getMetrics();
      expect(before).toContain('test_counter');

      metricsService.clearMetrics();
      const after = await getMetrics();

      expect(after).not.toContain('test_counter');
    });
  });
});
