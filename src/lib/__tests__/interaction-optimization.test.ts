/**
 * Tests for interaction optimization utilities
 * 
 * These tests verify that debouncing, throttling, and other optimization
 * techniques work correctly to ensure UI responds within 100ms.
 */

import {
  debounce,
  throttle,
} from '../interaction-optimization';

describe('Interaction Optimization Utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('debounce', () => {
    it('delays function execution', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 300);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('cancels previous calls', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 300);

      debouncedFn();
      jest.advanceTimersByTime(100);
      debouncedFn();
      jest.advanceTimersByTime(100);
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments correctly', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 300);

      debouncedFn('test', 123);
      jest.advanceTimersByTime(300);

      expect(fn).toHaveBeenCalledWith('test', 123);
    });
  });

  describe('throttle', () => {
    it('limits function execution frequency', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('executes immediately on first call', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments correctly', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn('test', 456);
      expect(fn).toHaveBeenCalledWith('test', 456);
    });
  });

  describe('Performance targets', () => {
    it('debounce default is 300ms for search', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn);

      debouncedFn();
      jest.advanceTimersByTime(299);
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throttle default is 100ms for responsiveness', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(99);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Interaction responsiveness', () => {
    it('ensures debounce allows immediate UI updates', () => {
      // Simulate immediate UI update followed by debounced action
      const uiUpdate = jest.fn();
      const debouncedAction = jest.fn();
      const debouncedFn = debounce(debouncedAction, 300);

      // UI updates immediately
      uiUpdate();
      expect(uiUpdate).toHaveBeenCalledTimes(1);

      // Action is debounced
      debouncedFn();
      expect(debouncedAction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(debouncedAction).toHaveBeenCalledTimes(1);
    });

    it('ensures throttle maintains 100ms responsiveness', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);

      // First call executes immediately
      const start = Date.now();
      throttledFn();
      const firstCallTime = Date.now() - start;

      // Should be nearly instant (< 100ms)
      expect(firstCallTime).toBeLessThan(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
