import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  calculateCurrentDay,
  formatTextWithLineBreaks,
  normalizeDateToMidnight,
  parseDateString,
  getMondayOffset,
  getDayName,
  isPlanReadOnly,
  isPlanReady,
  canChangeTaskStatus,
  canChangeGoalProgress,
  getDisabledTooltip,
  computePlanDate,
  getPlanDateRange,
  computeDayNumberFromDate,
} from './utils';
import type { PlanStatus } from '@/types';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2 py-1', 'px-3')).toBe('py-1 px-3');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'active', false && 'inactive')).toBe('base active');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
    });
  });

  describe('calculateCurrentDay', () => {
    it('should return day number where Monday = 1', () => {
      const day = calculateCurrentDay();
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(7);
    });
  });

  describe('formatTextWithLineBreaks', () => {
    it('should convert newlines to <br> tags', () => {
      expect(formatTextWithLineBreaks('line1\nline2\nline3')).toBe('line1<br>line2<br>line3');
    });

    it('should handle empty string', () => {
      expect(formatTextWithLineBreaks('')).toBe('');
    });

    it('should handle null', () => {
      expect(formatTextWithLineBreaks(null)).toBe('');
    });

    it('should handle undefined', () => {
      expect(formatTextWithLineBreaks(undefined)).toBe('');
    });
  });

  describe('normalizeDateToMidnight', () => {
    it('should set time to midnight', () => {
      const date = new Date('2024-03-15T14:30:45.123Z');
      const normalized = normalizeDateToMidnight(date);
      
      expect(normalized.getHours()).toBe(0);
      expect(normalized.getMinutes()).toBe(0);
      expect(normalized.getSeconds()).toBe(0);
      expect(normalized.getMilliseconds()).toBe(0);
    });

    it('should not modify original date', () => {
      const date = new Date('2024-03-15T14:30:45.123Z');
      const originalTime = date.getTime();
      normalizeDateToMidnight(date);
      
      expect(date.getTime()).toBe(originalTime);
    });
  });

  describe('parseDateString', () => {
    it('should parse YYYY-MM-DD string correctly', () => {
      const date = parseDateString('2024-03-15');
      
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(2); // March is month 2 (0-indexed)
      expect(date.getDate()).toBe(15);
    });

    it('should set time to midnight', () => {
      const date = parseDateString('2024-03-15');
      
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
    });
  });

  describe('getMondayOffset', () => {
    it('should return 0 for Monday', () => {
      const monday = new Date('2024-01-15'); // Monday
      expect(getMondayOffset(monday)).toBe(0);
    });

    it('should return 1 for Sunday', () => {
      const sunday = new Date('2024-01-14'); // Sunday
      expect(getMondayOffset(sunday)).toBe(1);
    });

    it('should return negative offset for other days', () => {
      const wednesday = new Date('2024-01-17'); // Wednesday
      expect(getMondayOffset(wednesday)).toBe(-2);
    });
  });

  describe('getDayName', () => {
    it('should return correct day names', () => {
      expect(getDayName(1)).toBe('Monday');
      expect(getDayName(2)).toBe('Tuesday');
      expect(getDayName(3)).toBe('Wednesday');
      expect(getDayName(4)).toBe('Thursday');
      expect(getDayName(5)).toBe('Friday');
      expect(getDayName(6)).toBe('Saturday');
      expect(getDayName(7)).toBe('Sunday');
    });

    it('should return null for invalid day numbers', () => {
      expect(getDayName(0)).toBeNull();
      expect(getDayName(8)).toBeNull();
      expect(getDayName(-1)).toBeNull();
    });
  });

  describe('Plan Status Management', () => {
    describe('isPlanReadOnly', () => {
      it('should return true for completed and archived plans', () => {
        expect(isPlanReadOnly('completed')).toBe(true);
        expect(isPlanReadOnly('archived')).toBe(true);
      });

      it('should return false for other statuses', () => {
        expect(isPlanReadOnly('ready')).toBe(false);
        expect(isPlanReadOnly('active')).toBe(false);
      });
    });

    describe('isPlanReady', () => {
      it('should return true only for ready status', () => {
        expect(isPlanReady('ready')).toBe(true);
        expect(isPlanReady('active')).toBe(false);
        expect(isPlanReady('completed')).toBe(false);
        expect(isPlanReady('archived')).toBe(false);
      });
    });

    describe('canChangeTaskStatus', () => {
      it('should return true only for active status', () => {
        expect(canChangeTaskStatus('active')).toBe(true);
        expect(canChangeTaskStatus('ready')).toBe(false);
        expect(canChangeTaskStatus('completed')).toBe(false);
        expect(canChangeTaskStatus('archived')).toBe(false);
      });
    });

    describe('canChangeGoalProgress', () => {
      it('should return true only for active status', () => {
        expect(canChangeGoalProgress('active')).toBe(true);
        expect(canChangeGoalProgress('ready')).toBe(false);
        expect(canChangeGoalProgress('completed')).toBe(false);
        expect(canChangeGoalProgress('archived')).toBe(false);
      });
    });

    describe('getDisabledTooltip', () => {
      it('should return appropriate message for ready status', () => {
        expect(getDisabledTooltip('ready', 'task_status')).toContain('Task status');
        expect(getDisabledTooltip('ready', 'progress')).toContain('Progress');
        expect(getDisabledTooltip('ready', 'milestone')).toContain('Milestone');
        expect(getDisabledTooltip('ready', 'reflection')).toContain('Reflection');
        expect(getDisabledTooltip('ready', 'general')).toContain('disabled');
      });

      it('should return appropriate message for completed status', () => {
        expect(getDisabledTooltip('completed', 'general')).toContain('completed');
      });

      it('should return appropriate message for archived status', () => {
        expect(getDisabledTooltip('archived', 'general')).toContain('archived');
      });

      it('should return empty string for active status', () => {
        expect(getDisabledTooltip('active', 'general')).toBe('');
      });
    });
  });

  describe('Date calculations', () => {
    describe('getPlanDateRange', () => {
      it('should calculate correct date range for 12-week plan', () => {
        const startDate = new Date('2024-01-15');
        const range = getPlanDateRange(startDate);

        expect(range.start.getTime()).toBe(normalizeDateToMidnight(startDate).getTime());
        
        // 12 weeks * 7 days - 1 = 83 days from start (includes start day, so end is day 84)
        const expectedEndDate = new Date('2024-04-07'); // Jan 15 + 83 days
        expectedEndDate.setHours(23, 59, 59, 999);
        expect(range.end.getTime()).toBe(expectedEndDate.getTime());
      });
    });

    describe('computePlanDate', () => {
      it('should compute correct date for given week and day', () => {
        const planStartDate = new Date('2024-01-15'); // Monday
        
        // Week 1, Day 1 (Monday)
        expect(computePlanDate(planStartDate, 1, 1)).toBe('2024-01-15');
        
        // Week 1, Day 7 (Sunday)
        expect(computePlanDate(planStartDate, 1, 7)).toBe('2024-01-21');
        
        // Week 2, Day 1 (Monday)
        expect(computePlanDate(planStartDate, 2, 1)).toBe('2024-01-22');
      });

      it('should handle plans starting on non-Monday', () => {
        const planStartDate = new Date('2024-01-17'); // Wednesday
        
        // Should adjust to nearest Monday (Jan 15)
        const result = computePlanDate(planStartDate, 1, 1);
        const resultDate = parseDateString(result);
        expect(resultDate.getDay()).toBe(1); // Monday
      });
    });

    describe('computeDayNumberFromDate', () => {
      it('should compute correct week and day from date', () => {
        const planStartDate = new Date('2024-01-15'); // Monday
        
        // Same day as start
        const day1 = computeDayNumberFromDate(new Date('2024-01-15'), planStartDate);
        expect(day1).toEqual({ weekNumber: 1, dayNumber: 1 });
        
        // One week later
        const day8 = computeDayNumberFromDate(new Date('2024-01-22'), planStartDate);
        expect(day8).toEqual({ weekNumber: 2, dayNumber: 1 });
        
        // 7 days into week 1
        const day7 = computeDayNumberFromDate(new Date('2024-01-21'), planStartDate);
        expect(day7).toEqual({ weekNumber: 1, dayNumber: 7 });
      });

      it('should return null for dates outside plan range', () => {
        const planStartDate = new Date('2024-01-15');
        
        // Before plan start
        const before = computeDayNumberFromDate(new Date('2024-01-14'), planStartDate);
        expect(before).toBeNull();
        
        // After 12 weeks
        const after = computeDayNumberFromDate(new Date('2024-04-10'), planStartDate);
        expect(after).toBeNull();
      });
    });
  });
});
