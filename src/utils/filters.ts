import type { FilterOptions, CheckpointMetadata } from '../types.js';

export function matchesBranchFilter(sessionBranch: string | undefined, filter: string | undefined): boolean {
  if (!filter) {
    return true;
  }
  if (!sessionBranch) {
    return false;
  }
  return sessionBranch.toLowerCase().includes(filter.toLowerCase());
}

export function matchesDateFilter(
  createdAt: string | undefined,
  since: string | undefined,
  until: string | undefined
): boolean {
  if (!createdAt) {
    return !since && !until;
  }

  // Extract date portion from ISO datetime (first 10 chars): "2026-02-20"
  const date = createdAt.substring(0, 10);

  if (since && date < since) {
    return false;
  }

  if (until && date > until) {
    return false;
  }

  return true;
}

export function applyFilters(
  sessions: (CheckpointMetadata & { __hash: string })[],
  opts: FilterOptions
): (CheckpointMetadata & { __hash: string })[] {
  let filtered = sessions;

  // Apply branch filter
  if (opts.branch) {
    filtered = filtered.filter(session =>
      matchesBranchFilter(session.branch, opts.branch)
    );
  }

  // Apply date filters
  if (opts.since || opts.until) {
    filtered = filtered.filter(session =>
      matchesDateFilter(session.created_at, opts.since, opts.until)
    );
  }

  // Apply limit
  if (opts.limit && opts.limit > 0) {
    filtered = filtered.slice(0, opts.limit);
  }

  return filtered;
}
