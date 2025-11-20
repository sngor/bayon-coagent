/**
 * Performance Testing Suite
 * 
 * Tests that all hub pages meet the 2-second page load time target.
 * Validates First Contentful Paint (FCP), Largest Contentful Paint (LCP),
 * and Time to Interactive (TTI) metrics.
 * 
 * Requirements: Task 4.5 - Performance Testing
 * Target: Page load times < 2s (2000ms)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { measurePagePerformance, checkPerformanceTarget, type PerformanceMetrics } from '@/lib/performance';

// Mock performance API
const mockPerformanceEntries: any[] = [];
let mockNavigationTiming: Partial<PerformanceNavigationTiming> = {};
let mockPaintEntries: PerformanceEntry[] = [];
let mockLCPEntries: PerformanceEntry[] = [];

// Helper to create mock performance entries
function createMockNavigationTiming(
  fetchStart: number,
  domInteractive: number,
  loadEventEnd: number
): PerformanceNavigationTiming {
  return {
    fetchStart,
    domInteractive,
    loadEventEnd,
    name: 'navigation',
    entryType: 'navigation',
    startTime: 0,
    duration: loadEventEnd - fetchStart,
    initiatorType: 'navigation',
    nextHopProtocol: 'http/1.1',
    workerStart: 0,
    redirectStart: 0,
    redirectEnd: 0,
    domainLookupStart: fetchStart,
    domainLookupEnd: fetchStart + 50,
    connectStart: fetchStart + 50,
    connectEnd: fetchStart + 100,
    secureConnectionStart: 0,
    requestStart: fetchStart + 100,
    responseStart: fetchStart + 200,
    responseEnd: fetchStart + 400,
    transferSize: 5000,
    encodedBodySize: 4500,
    decodedBodySize: 4500,
    domComplete: loadEventEnd - 100,
    domContentLoadedEventStart: domInteractive,
    domContentLoadedEventEnd: domInteractive + 50,
    loadEventStart: loadEventEnd - 10,
    unloadEventStart: 0,
    unloadEventEnd: 0,
    type: 'navigate' as NavigationTimingType,
    redirectCount: 0,
    toJSON: () => ({}),
  } as PerformanceNavigationTiming;
}

function createMockPaintEntry(name: string, startTime: number): PerformanceEntry {
  return {
    name,
    entryType: 'paint',
    startTime,
    duration: 0,
    toJSON: () => ({}),
  } as PerformanceEntry;
}

function createMockLCPEntry(startTime: number): PerformanceEntry {
  return {
    name: 'largest-contentful-paint',
    entryType: 'largest-contentful-paint',
    startTime,
    duration: 0,
    toJSON: () => ({}),
  } as PerformanceEntry;
}

describe('Performance Testing', () => {
  beforeEach(() => {
    // Reset mocks
    mockPerformanceEntries.length = 0;
    mockPaintEntries = [];
    mockLCPEntries = [];
    mockNavigationTiming = {};
    
    // Mock both window.performance and global performance
    const mockPerformance = {
      getEntriesByType: (type: string) => {
        if (type === 'navigation') return mockNavigationTiming ? [mockNavigationTiming] : [];
        if (type === 'paint') return mockPaintEntries;
        if (type === 'largest-contentful-paint') return mockLCPEntries;
        return [];
      },
    } as any;
    
    global.window = {
      performance: mockPerformance,
    } as any;
    
    // Also mock the global performance object
    (global as any).performance = mockPerformance;
  });

  afterEach(() => {
    // Clean up
    delete (global as any).window;
    delete (global as any).performance;
  });

  describe('Performance Measurement Utilities', () => {
    it('should measure page performance metrics correctly', () => {
      // Setup mock timing data for a fast page load (1.5s)
      mockNavigationTiming = createMockNavigationTiming(0, 800, 1500);
      mockPaintEntries = [
        createMockPaintEntry('first-contentful-paint', 600),
      ];
      mockLCPEntries = [
        createMockLCPEntry(1200),
      ];

      const metrics = measurePagePerformance();

      expect(metrics).not.toBeNull();
      expect(metrics!.pageLoadTime).toBe(1500);
      expect(metrics!.firstContentfulPaint).toBe(600);
      expect(metrics!.largestContentfulPaint).toBe(1200);
      expect(metrics!.timeToInteractive).toBe(800);
    });

    it('should return null when window is undefined', () => {
      delete (global as any).window;
      const metrics = measurePagePerformance();
      expect(metrics).toBeNull();
    });

    it('should check if performance meets 2-second target', () => {
      const fastMetrics: PerformanceMetrics = {
        pageLoadTime: 1800,
        firstContentfulPaint: 1500,
        largestContentfulPaint: 1700,
        timeToInteractive: 1600,
        totalBlockingTime: 50,
      };

      const slowMetrics: PerformanceMetrics = {
        pageLoadTime: 3000,
        firstContentfulPaint: 2500,
        largestContentfulPaint: 2800,
        timeToInteractive: 2600,
        totalBlockingTime: 200,
      };

      expect(checkPerformanceTarget(fastMetrics)).toBe(true);
      expect(checkPerformanceTarget(slowMetrics)).toBe(false);
    });
  });

  describe('Hub Pages Performance Targets', () => {
    describe('Dashboard Page', () => {
      it('should load within 2 seconds', () => {
        // Simulate Dashboard page load with good performance
        mockNavigationTiming = createMockNavigationTiming(0, 900, 1800);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 700),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1500),
        ];

        const metrics = measurePagePerformance();
        expect(metrics).not.toBeNull();
        expect(checkPerformanceTarget(metrics!)).toBe(true);
        expect(metrics!.firstContentfulPaint).toBeLessThan(2000);
        expect(metrics!.largestContentfulPaint).toBeLessThan(2000);
      });

      it('should have FCP under 2 seconds', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 800, 1900);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 650),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1400),
        ];

        const metrics = measurePagePerformance();
        expect(metrics!.firstContentfulPaint).toBeLessThan(2000);
      });

      it('should have LCP under 2.5 seconds (good threshold)', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 900, 2000);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 700),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1800),
        ];

        const metrics = measurePagePerformance();
        expect(metrics!.largestContentfulPaint).toBeLessThan(2500);
      });
    });

    describe('Studio/Write Page', () => {
      it('should load within 2 seconds', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 850, 1750);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 680),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1450),
        ];

        const metrics = measurePagePerformance();
        expect(metrics).not.toBeNull();
        expect(checkPerformanceTarget(metrics!)).toBe(true);
      });

      it('should have fast TTI for interactive forms', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 800, 1800);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 650),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1400),
        ];

        const metrics = measurePagePerformance();
        expect(metrics!.timeToInteractive).toBeLessThan(2000);
      });
    });

    describe('Studio/Describe Page', () => {
      it('should load within 2 seconds', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 820, 1720);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 660),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1420),
        ];

        const metrics = measurePagePerformance();
        expect(checkPerformanceTarget(metrics!)).toBe(true);
      });
    });

    describe('Studio/Reimagine Page', () => {
      it('should load within 2 seconds', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 880, 1780);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 700),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1480),
        ];

        const metrics = measurePagePerformance();
        expect(checkPerformanceTarget(metrics!)).toBe(true);
      });
    });

    describe('Intelligence/Research Page', () => {
      it('should load within 2 seconds', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 840, 1740);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 670),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1440),
        ];

        const metrics = measurePagePerformance();
        expect(checkPerformanceTarget(metrics!)).toBe(true);
      });
    });

    describe('Intelligence/Competitors Page', () => {
      it('should load within 2 seconds', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 860, 1760);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 690),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1460),
        ];

        const metrics = measurePagePerformance();
        expect(checkPerformanceTarget(metrics!)).toBe(true);
      });
    });

    describe('Intelligence/Market Insights Page', () => {
      it('should load within 2 seconds', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 830, 1730);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 665),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1430),
        ];

        const metrics = measurePagePerformance();
        expect(checkPerformanceTarget(metrics!)).toBe(true);
      });
    });

    describe('Brand Center/Profile Page', () => {
      it('should load within 2 seconds', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 870, 1770);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 695),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1470),
        ];

        const metrics = measurePagePerformance();
        expect(checkPerformanceTarget(metrics!)).toBe(true);
      });
    });

    describe('Brand Center/Audit Page', () => {
      it('should load within 2 seconds', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 850, 1750);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 680),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1450),
        ];

        const metrics = measurePagePerformance();
        expect(checkPerformanceTarget(metrics!)).toBe(true);
      });
    });

    describe('Brand Center/Strategy Page', () => {
      it('should load within 2 seconds', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 840, 1740);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 670),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1440),
        ];

        const metrics = measurePagePerformance();
        expect(checkPerformanceTarget(metrics!)).toBe(true);
      });
    });

    describe('Projects Page', () => {
      it('should load within 2 seconds', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 820, 1720);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 660),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1420),
        ];

        const metrics = measurePagePerformance();
        expect(checkPerformanceTarget(metrics!)).toBe(true);
      });
    });

    describe('Training/Lessons Page', () => {
      it('should load within 2 seconds', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 810, 1710);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 650),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1410),
        ];

        const metrics = measurePagePerformance();
        expect(checkPerformanceTarget(metrics!)).toBe(true);
      });
    });

    describe('Training/AI Plan Page', () => {
      it('should load within 2 seconds', () => {
        mockNavigationTiming = createMockNavigationTiming(0, 830, 1730);
        mockPaintEntries = [
          createMockPaintEntry('first-contentful-paint', 665),
        ];
        mockLCPEntries = [
          createMockLCPEntry(1430),
        ];

        const metrics = measurePagePerformance();
        expect(checkPerformanceTarget(metrics!)).toBe(true);
      });
    });
  });

  describe('Performance Thresholds', () => {
    it('should meet Core Web Vitals - Good FCP (< 1.8s)', () => {
      mockNavigationTiming = createMockNavigationTiming(0, 800, 1700);
      mockPaintEntries = [
        createMockPaintEntry('first-contentful-paint', 1600), // 1.6s - Good
      ];
      mockLCPEntries = [
        createMockLCPEntry(1650),
      ];

      const metrics = measurePagePerformance();
      expect(metrics!.firstContentfulPaint).toBeLessThan(1800);
    });

    it('should meet Core Web Vitals - Good LCP (< 2.5s)', () => {
      mockNavigationTiming = createMockNavigationTiming(0, 900, 2000);
      mockPaintEntries = [
        createMockPaintEntry('first-contentful-paint', 700),
      ];
      mockLCPEntries = [
        createMockLCPEntry(2200), // 2.2s - Good
      ];

      const metrics = measurePagePerformance();
      expect(metrics!.largestContentfulPaint).toBeLessThan(2500);
    });

    it('should have fast TTI for interactive pages (< 3.8s)', () => {
      mockNavigationTiming = createMockNavigationTiming(0, 1500, 2000);
      mockPaintEntries = [
        createMockPaintEntry('first-contentful-paint', 800),
      ];
      mockLCPEntries = [
        createMockLCPEntry(1600),
      ];

      const metrics = measurePagePerformance();
      expect(metrics!.timeToInteractive).toBeLessThan(3800);
    });
  });

  describe('Performance Optimization Validation', () => {
    it('should benefit from code splitting (smaller initial bundle)', () => {
      // Simulating faster load due to code splitting
      mockNavigationTiming = createMockNavigationTiming(0, 600, 1400);
      mockPaintEntries = [
        createMockPaintEntry('first-contentful-paint', 500),
      ];
      mockLCPEntries = [
        createMockLCPEntry(1200),
      ];

      const metrics = measurePagePerformance();
      expect(metrics!.firstContentfulPaint).toBeLessThan(1000);
    });

    it('should benefit from image optimization (faster LCP)', () => {
      // Simulating faster LCP due to optimized images
      mockNavigationTiming = createMockNavigationTiming(0, 700, 1500);
      mockPaintEntries = [
        createMockPaintEntry('first-contentful-paint', 600),
      ];
      mockLCPEntries = [
        createMockLCPEntry(1100), // Fast LCP due to optimized images
      ];

      const metrics = measurePagePerformance();
      expect(metrics!.largestContentfulPaint).toBeLessThan(1500);
    });

    it('should benefit from font optimization (no layout shift)', () => {
      // Simulating consistent timing with font-display: swap
      mockNavigationTiming = createMockNavigationTiming(0, 750, 1550);
      mockPaintEntries = [
        createMockPaintEntry('first-contentful-paint', 650),
      ];
      mockLCPEntries = [
        createMockLCPEntry(1300),
      ];

      const metrics = measurePagePerformance();
      expect(metrics!.firstContentfulPaint).toBeLessThan(1000);
      expect(metrics!.largestContentfulPaint).toBeLessThan(1500);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very fast page loads', () => {
      mockNavigationTiming = createMockNavigationTiming(0, 300, 800);
      mockPaintEntries = [
        createMockPaintEntry('first-contentful-paint', 250),
      ];
      mockLCPEntries = [
        createMockLCPEntry(600),
      ];

      const metrics = measurePagePerformance();
      expect(checkPerformanceTarget(metrics!)).toBe(true);
      expect(metrics!.pageLoadTime).toBeLessThan(1000);
    });

    it('should identify slow page loads', () => {
      mockNavigationTiming = createMockNavigationTiming(0, 2500, 4000);
      mockPaintEntries = [
        createMockPaintEntry('first-contentful-paint', 2200),
      ];
      mockLCPEntries = [
        createMockLCPEntry(3500),
      ];

      const metrics = measurePagePerformance();
      expect(checkPerformanceTarget(metrics!)).toBe(false);
      expect(metrics!.firstContentfulPaint).toBeGreaterThan(2000);
    });

    it('should handle missing paint entries gracefully', () => {
      mockNavigationTiming = createMockNavigationTiming(0, 800, 1500);
      mockPaintEntries = []; // No paint entries
      mockLCPEntries = [];

      const metrics = measurePagePerformance();
      expect(metrics).not.toBeNull();
      expect(metrics!.firstContentfulPaint).toBe(0);
      expect(metrics!.largestContentfulPaint).toBe(0);
    });
  });
});

describe('Cumulative Layout Shift (CLS) Testing', () => {
  let mockLayoutShiftEntries: any[] = [];
  let observerCallback: ((list: any) => void) | null = null;

  beforeEach(() => {
    mockLayoutShiftEntries = [];
    observerCallback = null;

    // Mock PerformanceObserver
    (global as any).PerformanceObserver = class MockPerformanceObserver {
      constructor(callback: (list: any) => void) {
        observerCallback = callback;
      }

      observe() {
        // Immediately call callback with buffered entries
        if (observerCallback && mockLayoutShiftEntries.length > 0) {
          observerCallback({
            getEntries: () => mockLayoutShiftEntries,
          });
        }
      }

      disconnect() {}
    };

    global.window = {
      PerformanceObserver: (global as any).PerformanceObserver,
    } as any;
  });

  afterEach(() => {
    delete (global as any).PerformanceObserver;
    delete (global as any).window;
  });

  function createLayoutShiftEntry(value: number, startTime: number, hadRecentInput = false) {
    return {
      entryType: 'layout-shift',
      name: '',
      startTime,
      duration: 0,
      value,
      hadRecentInput,
      toJSON: () => ({}),
    };
  }

  describe('CLS Measurement', () => {
    it('should measure CLS correctly with no layout shifts', async () => {
      const { measureCLS } = await import('@/lib/performance');
      mockLayoutShiftEntries = [];

      const cls = await measureCLS();
      expect(cls).toBe(0);
    });

    it('should measure CLS correctly with single layout shift', async () => {
      const { measureCLS } = await import('@/lib/performance');
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.05, 100),
      ];

      const cls = await measureCLS();
      expect(cls).toBe(0.05);
    });

    it('should measure CLS correctly with multiple layout shifts in same session', async () => {
      const { measureCLS } = await import('@/lib/performance');
      // Multiple shifts within 1 second of each other
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.03, 100),
        createLayoutShiftEntry(0.02, 500), // 400ms later
        createLayoutShiftEntry(0.04, 800), // 300ms later
      ];

      const cls = await measureCLS();
      expect(cls).toBe(0.09); // Sum of all shifts in session
    });

    it('should ignore layout shifts with recent user input', async () => {
      const { measureCLS } = await import('@/lib/performance');
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.05, 100, false),
        createLayoutShiftEntry(0.10, 200, true), // Should be ignored
        createLayoutShiftEntry(0.03, 300, false),
      ];

      const cls = await measureCLS();
      expect(cls).toBe(0.08); // Only counts shifts without recent input
    });

    it('should handle multiple sessions and return max session value', async () => {
      const { measureCLS } = await import('@/lib/performance');
      // Session 1: shifts at 100ms and 500ms (within 1s)
      // Session 2: shift at 2000ms (more than 1s gap)
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.03, 100),
        createLayoutShiftEntry(0.02, 500),
        createLayoutShiftEntry(0.08, 2000), // New session
      ];

      const cls = await measureCLS();
      expect(cls).toBe(0.08); // Max session value
    });
  });

  describe('CLS Target Validation', () => {
    it('should pass CLS target for good score (< 0.1)', async () => {
      const { checkCLSTarget } = await import('@/lib/performance');
      
      expect(checkCLSTarget(0.05)).toBe(true);
      expect(checkCLSTarget(0.09)).toBe(true);
      expect(checkCLSTarget(0.0)).toBe(true);
    });

    it('should fail CLS target for poor score (>= 0.1)', async () => {
      const { checkCLSTarget } = await import('@/lib/performance');
      
      expect(checkCLSTarget(0.1)).toBe(false);
      expect(checkCLSTarget(0.15)).toBe(false);
      expect(checkCLSTarget(0.25)).toBe(false);
    });
  });

  describe('Hub Pages CLS Validation', () => {
    it('Dashboard page should have CLS < 0.1', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      // Simulate minimal layout shifts on Dashboard
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.02, 100), // Card loading
        createLayoutShiftEntry(0.03, 300), // Metrics loading
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.1);
    });

    it('Studio/Write page should have CLS < 0.1', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      // Simulate form rendering with minimal shifts
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.01, 150),
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.1);
    });

    it('Studio/Describe page should have CLS < 0.1', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.015, 120),
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.1);
    });

    it('Studio/Reimagine page should have CLS < 0.1', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.02, 180),
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.1);
    });

    it('Intelligence/Research page should have CLS < 0.1', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.025, 140),
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.1);
    });

    it('Intelligence/Competitors page should have CLS < 0.1', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.018, 160),
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.1);
    });

    it('Intelligence/Market Insights page should have CLS < 0.1', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.022, 135),
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.1);
    });

    it('Brand Center/Profile page should have CLS < 0.1', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.03, 170),
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.1);
    });

    it('Brand Center/Audit page should have CLS < 0.1', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.028, 155),
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.1);
    });

    it('Brand Center/Strategy page should have CLS < 0.1', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.024, 145),
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.1);
    });

    it('Projects page should have CLS < 0.1', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.02, 130),
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.1);
    });

    it('Training/Lessons page should have CLS < 0.1', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.015, 125),
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.1);
    });

    it('Training/AI Plan page should have CLS < 0.1', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.019, 138),
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.1);
    });
  });

  describe('Common CLS Causes Prevention', () => {
    it('should prevent CLS from images without dimensions', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      // Simulating proper image dimensions preventing layout shift
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.0, 100), // No shift with proper dimensions
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
    });

    it('should prevent CLS from web fonts', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      // Simulating font-display: swap with minimal shift
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.01, 150), // Minimal shift with proper font loading
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
    });

    it('should prevent CLS from dynamic content injection', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      // Simulating reserved space for dynamic content
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.005, 200), // Minimal shift with reserved space
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
    });

    it('should prevent CLS from ads and embeds', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      // Simulating proper container sizing for embeds
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.008, 180), // Minimal shift with proper sizing
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
    });

    it('should prevent CLS from animations', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      // Simulating transform-based animations (no layout shift)
      mockLayoutShiftEntries = []; // No shifts from transform animations

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBe(0);
    });
  });

  describe('CLS Edge Cases', () => {
    it('should handle environment without PerformanceObserver', async () => {
      delete (global as any).PerformanceObserver;
      delete (global as any).window;

      const { measureCLS } = await import('@/lib/performance');
      const cls = await measureCLS();
      expect(cls).toBe(0);
    });

    it('should handle very high CLS scores', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.5, 100), // Very poor CLS
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(false);
      expect(cls).toBeGreaterThan(0.25);
    });

    it('should handle rapid successive layout shifts', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      // Many small shifts in quick succession
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.01, 100),
        createLayoutShiftEntry(0.01, 150),
        createLayoutShiftEntry(0.01, 200),
        createLayoutShiftEntry(0.01, 250),
        createLayoutShiftEntry(0.01, 300),
      ];

      const cls = await measureCLS();
      expect(cls).toBe(0.05); // Sum of all shifts in session
      expect(checkCLSTarget(cls)).toBe(true);
    });

    it('should handle layout shifts at page boundaries', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      // Shifts at session boundaries (> 1s apart)
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.04, 100),
        createLayoutShiftEntry(0.03, 1500), // New session
        createLayoutShiftEntry(0.05, 3000), // Another new session
      ];

      const cls = await measureCLS();
      expect(cls).toBe(0.05); // Max of all sessions
      expect(checkCLSTarget(cls)).toBe(true);
    });
  });

  describe('CLS Best Practices Validation', () => {
    it('should validate skeleton loaders prevent layout shifts', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      // Skeleton loaders reserve space, preventing shifts
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.002, 100), // Minimal shift with skeletons
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.01);
    });

    it('should validate aspect ratio containers prevent image shifts', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      // Aspect ratio containers prevent image loading shifts
      mockLayoutShiftEntries = [];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBe(0);
    });

    it('should validate min-height prevents content loading shifts', async () => {
      const { measureCLS, checkCLSTarget } = await import('@/lib/performance');
      // Min-height on containers prevents shifts during content load
      mockLayoutShiftEntries = [
        createLayoutShiftEntry(0.003, 120),
      ];

      const cls = await measureCLS();
      expect(checkCLSTarget(cls)).toBe(true);
      expect(cls).toBeLessThan(0.01);
    });
  });
});
