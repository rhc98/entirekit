import { describe, it, expect } from 'vitest';
import { matchesBranchFilter, matchesDateFilter, applyFilters } from '../../../src/utils/filters.js';
import type { CheckpointMetadata } from '../../../src/types.js';

describe('matchesBranchFilter', () => {
  it('should return true when filter is undefined', () => {
    expect(matchesBranchFilter('main', undefined)).toBe(true);
    expect(matchesBranchFilter(undefined, undefined)).toBe(true);
  });

  it('should return true on substring match (case-insensitive)', () => {
    expect(matchesBranchFilter('feature/user-auth', 'user')).toBe(true);
    expect(matchesBranchFilter('feature/user-auth', 'USER')).toBe(true);
    expect(matchesBranchFilter('feature/user-auth', 'Feature')).toBe(true);
    expect(matchesBranchFilter('main', 'main')).toBe(true);
  });

  it('should return false on no match', () => {
    expect(matchesBranchFilter('main', 'feature')).toBe(false);
    expect(matchesBranchFilter('develop', 'main')).toBe(false);
  });

  it('should return false when sessionBranch is undefined but filter is not', () => {
    expect(matchesBranchFilter(undefined, 'main')).toBe(false);
  });
});

describe('matchesDateFilter', () => {
  it('should handle undefined since/until', () => {
    expect(matchesDateFilter('2026-02-20T10:15:30Z', undefined, undefined)).toBe(true);
  });

  it('should filter correctly by since date', () => {
    expect(matchesDateFilter('2026-02-20T10:15:30Z', '2026-02-15', undefined)).toBe(true);
    expect(matchesDateFilter('2026-02-20T10:15:30Z', '2026-02-20', undefined)).toBe(true);
    expect(matchesDateFilter('2026-02-20T10:15:30Z', '2026-02-25', undefined)).toBe(false);
  });

  it('should filter correctly by until date', () => {
    expect(matchesDateFilter('2026-02-20T10:15:30Z', undefined, '2026-02-25')).toBe(true);
    expect(matchesDateFilter('2026-02-20T10:15:30Z', undefined, '2026-02-20')).toBe(true);
    expect(matchesDateFilter('2026-02-20T10:15:30Z', undefined, '2026-02-15')).toBe(false);
  });

  it('should handle both since and until', () => {
    expect(matchesDateFilter('2026-02-20T10:15:30Z', '2026-02-15', '2026-02-25')).toBe(true);
    expect(matchesDateFilter('2026-02-20T10:15:30Z', '2026-02-21', '2026-02-25')).toBe(false);
    expect(matchesDateFilter('2026-02-20T10:15:30Z', '2026-02-15', '2026-02-19')).toBe(false);
  });

  it('should handle undefined createdAt', () => {
    expect(matchesDateFilter(undefined, undefined, undefined)).toBe(true);
    expect(matchesDateFilter(undefined, '2026-02-15', undefined)).toBe(false);
    expect(matchesDateFilter(undefined, undefined, '2026-02-25')).toBe(false);
    expect(matchesDateFilter(undefined, '2026-02-15', '2026-02-25')).toBe(false);
  });
});

describe('applyFilters', () => {
  const sessions: (CheckpointMetadata & { __hash: string })[] = [
    {
      __hash: 'hash1',
      branch: 'main',
      created_at: '2026-02-20T10:00:00Z',
    },
    {
      __hash: 'hash2',
      branch: 'feature/auth',
      created_at: '2026-02-18T14:30:00Z',
    },
    {
      __hash: 'hash3',
      branch: 'feature/ui',
      created_at: '2026-02-22T09:15:00Z',
    },
    {
      __hash: 'hash4',
      branch: 'develop',
      created_at: '2026-02-15T12:00:00Z',
    },
  ];

  it('should return all sessions when no filters applied', () => {
    const result = applyFilters(sessions, {});
    expect(result).toHaveLength(4);
    expect(result).toEqual(sessions);
  });

  it('should filter by branch', () => {
    const result = applyFilters(sessions, { branch: 'feature' });
    expect(result).toHaveLength(2);
    expect(result.map(s => s.__hash)).toEqual(['hash2', 'hash3']);
  });

  it('should filter by since date', () => {
    const result = applyFilters(sessions, { since: '2026-02-19' });
    expect(result).toHaveLength(2);
    expect(result.map(s => s.__hash)).toEqual(['hash1', 'hash3']);
  });

  it('should filter by until date', () => {
    const result = applyFilters(sessions, { until: '2026-02-18' });
    expect(result).toHaveLength(2);
    expect(result.map(s => s.__hash)).toEqual(['hash2', 'hash4']);
  });

  it('should apply limit', () => {
    const result = applyFilters(sessions, { limit: 2 });
    expect(result).toHaveLength(2);
    expect(result.map(s => s.__hash)).toEqual(['hash1', 'hash2']);
  });

  it('should apply multiple filters', () => {
    const result = applyFilters(sessions, {
      branch: 'feature',
      since: '2026-02-17',
      until: '2026-02-21',
      limit: 1,
    });
    expect(result).toHaveLength(1);
    expect(result[0].__hash).toBe('hash2');
  });

  it('should handle empty result', () => {
    const result = applyFilters(sessions, { branch: 'nonexistent' });
    expect(result).toHaveLength(0);
  });
});
