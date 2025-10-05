import { describe, it, expect } from 'vitest';
import { getLocalDateString } from '../../services/utils';

describe('getLocalDateString', () => {
  it('should format a date with single-digit month and day correctly', () => {
    const date = new Date(2023, 0, 1); // Corresponds to January 1, 2023
    expect(getLocalDateString(date)).toBe('2023-01-01');
  });

  it('should format a date with double-digit month and day correctly', () => {
    const date = new Date(2023, 9, 10); // Corresponds to October 10, 2023
    expect(getLocalDateString(date)).toBe('2023-10-10');
  });

  it('should handle the end of a month correctly', () => {
    const date = new Date(2024, 1, 29); // Corresponds to February 29, 2024 (a leap year)
    expect(getLocalDateString(date)).toBe('2024-02-29');
  });

  it('should handle the beginning of a year correctly', () => {
    const date = new Date(2025, 0, 1); // Corresponds to January 1, 2025
    expect(getLocalDateString(date)).toBe('2025-01-01');
  });

  it('should handle the end of a year correctly', () => {
    const date = new Date(2022, 11, 31); // Corresponds to December 31, 2022
    expect(getLocalDateString(date)).toBe('2022-12-31');
  });
});