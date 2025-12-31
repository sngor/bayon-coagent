/**
 * Performance Monitoring Tests
 * 
 * Tests for performance monitoring utilities including metrics collection,
 * Web Vitals tracking, and performance analysis.
 */

import {
  PerformanceMonitor,
  performanceMonitor,
  usePerformanceMonitor,
  measurePerformance,
  measureAsyncPerformance,
} from '@/lib/performance-monitoring';

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
};

// Mock PerformanceObserver
const mockPerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

// Setup global mocks
beforeAll(() => {
  global.performance = mockPerformance as any;
  global.PerformanceObserver = mockPerformanceObserver as any;
});

describe('Performance Monitoring', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    jest.clearAllMocks();
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('PerformanceMonitor', () => {
    describe('recordMetric', () => {
      it('should record a metric', () => {
        monitor.recordMetric('test_metric', 100, 'ms', { context: 'test' });

        const metrics = monitor.getMetrics('test_metric');
        expect(metrics).toHaveLength(1);
        expect(metrics[0].name).toBe('test_metric');
        expect(metrics[0].value).toBe(100);
        expect(metrics[0].unit).toBe('ms');
        expect(metrics[0].context).toEqual({ context: 'test' });
        expect(metrics[0].timestamp).toBeDefined();
      });

      it('should limit metrics to 100 per type', () => {
        // Record 150 metrics
        for (let i = 0; i < 150; i++) {
          monitor.recordMetric('test_metric', i, 'ms');
        }

        const metrics = monitor.getMetrics('test_metric');
        expect(metrics).toHaveLength(100);
        // Should keep the most recent 100
        expect(metrics[0].value).toBe(50);
        expect(metrics[99].value).toBe(149);
      });

      it('should handle different metric types', () => {
        monitor.recordMetric('duration', 100, 'ms');
        monitor.recordMetric('size', 1024, 'bytes');
        monitor.recordMetric('count', 5, 'count');
        monitor.recordMetric('percentage', 85.5, 'percentage');

        expect(monitor.getMetrics('duration')).toHaveLength(1);
        expect(monitor.getMetrics('size')).toHaveLength(1);
        expect(monitor.getMetrics('count')).toHaveLength(1);
        expect(monitor.getMetrics('percentage')).toHaveLength(1);
      });
    });

    describe('measureAsync', () => {
      it('should measure async function execution time', async () => {
        const asyncFunction = jest.fn().mockResolvedValue('result');
        mockPerformance.now
          .mockReturnValueOnce(1000)
          .mockReturnValueOnce(1100);

        const result = await monitor.measureAsync('async_test', asyncFunction, { test: true });

        expect(result).toBe('result');
        expect(asyncFunction).toHaveBeenCalled();

        const metrics = monitor.getMetrics('async_test');
        expect(metrics).toHaveLength(1);
        expect(metrics[0].value).toBe(100);
        expect(metrics[0].context?.success).toBe(true);
        expect(metrics[0].context?.test).toBe(true);
      });

      it('should handle async function errors', async () => {
        const error = new Error('Test error');
        const asyncFunction = jest.fn().mockRejectedValue(error);
        mockPerformance.now
          .mockReturnValueOnce(1000)
          .mockReturnValueOnce(1050);

        await expect(monitor.measureAsync('async_error_test', asyncFunction)).rejects.toThrow('Test error');

        const metrics = monitor.getMetrics('async_error_test');
        expect(metrics).toHaveLength(1);
        expect(metrics[0].value).toBe(50);
        expect(metrics[0].context?.success).toBe(false);
        expect(metrics[0].context?.error).toBe('Test error');
      });
    });

    describe('measure', () => {
      it('should measure sync function execution time', () => {
        const syncFunction = jest.fn().mockReturnValue('result');
        mockPerformance.now
          .mockReturnValueOnce(2000)
          .mockReturnValueOnce(2025);

        const result = monitor.measure('sync_test', syncFunction, { test: true });

        expect(result).toBe('result');
        expect(syncFunction).toHaveBeenCalled();

        const metrics = monitor.getMetrics('sync_test');
        expect(metrics).toHaveLength(1);
        expect(metrics[0].value).toBe(25);
        expect(metrics[0].context?.success).toBe(true);
        expect(metrics[0].context?.test).toBe(true);
      });

      it('should handle sync function errors', () => {
        const error = new Error('Sync error');
        const syncFunction = jest.fn().mockImplementation(() => {
          throw error;
        });
        mockPerformance.now
          .mockReturnValueOnce(2000)
          .mockReturnValueOnce(2010);

        expect(() => monitor.measure('sync_error_test', syncFunction)).toThrow('Sync error');

        const metrics = monitor.getMetrics('sync_error_test');
        expect(metrics).toHaveLength(1);
        expect(metrics[0].value).toBe(10);
        expect(metrics[0].context?.success).toBe(false);
        expect(metrics[0].context?.error).toBe('Sync error');
      });
    });

    describe('getAllMetrics', () => {
      it('should return all recorded metrics', () => {
        monitor.recordMetric('metric1', 100, 'ms');
        monitor.recordMetric('metric2', 200, 'bytes');
        monitor.recordMetric('metric1', 150, 'ms');

        const allMetrics = monitor.getAllMetrics();
        expect(allMetrics.size).toBe(2);
        expect(allMetrics.get('metric1')).toHaveLength(2);
        expect(allMetrics.get('metric2')).toHaveLength(1);
      });
    });

    describe('generateReport', () => {
      it('should generate performance report', () => {
        monitor.recordMetric('LCP', 2500, 'ms');
        monitor.recordMetric('FID', 50, 'ms');
        monitor.recordMetric('resource_script_duration', 100, 'ms');

        const report = monitor.generateReport();

        expect(report.pageUrl).toBeDefined();
        expect(report.userAgent).toBeDefined();
        expect(report.timestamp).toBeDefined();
        expect(report.webVitals).toBeDefined();
        expect(report.customMetrics).toBeDefined();
        expect(report.resourceTimings).toBeDefined();
      });
    });

    describe('clearMetrics', () => {
      it('should clear all metrics', () => {
        monitor.recordMetric('test1', 100, 'ms');
        monitor.recordMetric('test2', 200, 'ms');

        expect(monitor.getAllMetrics().size).toBe(2);

        monitor.clearMetrics();

        expect(monitor.getAllMetrics().size).toBe(0);
      });
    });
  });

  describe('usePerformanceMonitor hook', () => {
    it('should provide performance monitoring functions', () => {
      const hook = usePerformanceMonitor();

      expect(typeof hook.recordMetric).toBe('function');
      expect(typeof hook.measureAsync).toBe('function');
      expect(typeof hook.measure).toBe('function');
      expect(typeof hook.getMetrics).toBe('function');
      expect(typeof hook.generateReport).toBe('function');
    });
  });

  describe('Performance Decorators', () => {
    describe('measurePerformance', () => {
      it('should measure method performance', () => {
        class TestClass {
          @measurePerformance('test_method')
          testMethod(value: number): number {
            return value * 2;
          }
        }

        mockPerformance.now
          .mockReturnValueOnce(1000)
          .mockReturnValueOnce(1010);

        const instance = new TestClass();
        const result = instance.testMethod(5);

        expect(result).toBe(10);

        const metrics = performanceMonitor.getMetrics('test_method');
        expect(metrics).toHaveLength(1);
        expect(metrics[0].value).toBe(10);
      });

      it('should use default metric name', () => {
        class TestClass {
          @measurePerformance()
          anotherMethod(): string {
            return 'test';
          }
        }

        mockPerformance.now
          .mockReturnValueOnce(2000)
          .mockReturnValueOnce(2005);

        const instance = new TestClass();
        instance.anotherMethod();

        const metrics = performanceMonitor.getMetrics('TestClass.anotherMethod');
        expect(metrics).toHaveLength(1);
      });
    });

    describe('measureAsyncPerformance', () => {
      it('should measure async method performance', async () => {
        class TestClass {
          @measureAsyncPerformance('async_test_method')
          async asyncMethod(delay: number): Promise<string> {
            return new Promise(resolve => {
              setTimeout(() => resolve('done'), delay);
            });
          }
        }

        mockPerformance.now
          .mockReturnValueOnce(3000)
          .mockReturnValueOnce(3020);

        const instance = new TestClass();
        const result = await instance.asyncMethod(0);

        expect(result).toBe('done');

        const metrics = performanceMonitor.getMetrics('async_test_method');
        expect(metrics).toHaveLength(1);
        expect(metrics[0].value).toBe(20);
      });
    });
  });

  describe('Web Vitals Integration', () => {
    it('should initialize performance observers', () => {
      monitor.initialize();

      // Should create observers for different entry types
      expect(mockPerformanceObserver).toHaveBeenCalled();
    });

    it('should handle missing PerformanceObserver gracefully', () => {
      const originalPO = global.PerformanceObserver;
      delete (global as any).PerformanceObserver;

      expect(() => monitor.initialize()).not.toThrow();

      global.PerformanceObserver = originalPO;
    });
  });

  describe('Memory Monitoring', () => {
    it('should record memory metrics when available', () => {
      const mockMemory = {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
      };

      (global.performance as any).memory = mockMemory;

      monitor.initialize();

      // Simulate memory monitoring interval
      jest.advanceTimersByTime(30000);

      const usedMetrics = monitor.getMetrics('memory_used');
      const totalMetrics = monitor.getMetrics('memory_total');
      const limitMetrics = monitor.getMetrics('memory_limit');
      const percentageMetrics = monitor.getMetrics('memory_usage_percentage');

      expect(usedMetrics.length).toBeGreaterThan(0);
      expect(totalMetrics.length).toBeGreaterThan(0);
      expect(limitMetrics.length).toBeGreaterThan(0);
      expect(percentageMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock PerformanceObserver to throw
      global.PerformanceObserver = jest.fn().mockImplementation(() => {
        throw new Error('Observer error');
      });

      expect(() => monitor.initialize()).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('should handle metric recording errors', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // This should not throw even with invalid data
      expect(() => {
        monitor.recordMetric('', NaN, 'ms' as any);
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});

// Setup and teardown for timer mocks
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});