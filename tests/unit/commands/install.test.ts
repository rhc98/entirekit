import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { resolvePackageRoot, getCheckpointSetupStatus } from '../../../src/commands/install.js';

describe('resolvePackageRoot', () => {
  it('should find the nearest ancestor containing package.json', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'entirekit-install-test-'));
    const packageRoot = path.join(tmp, 'pkg');
    const nestedDir = path.join(packageRoot, 'dist', 'commands');
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(path.join(packageRoot, 'package.json'), '{"name":"entirekit"}', 'utf-8');

    const result = resolvePackageRoot(nestedDir);

    expect(result).toBe(packageRoot);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('should prefer the closest package root when nested package.json files exist', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'entirekit-install-test-'));
    const outerRoot = path.join(tmp, 'outer');
    const innerRoot = path.join(outerRoot, 'inner');
    const startDir = path.join(innerRoot, 'dist');

    fs.mkdirSync(startDir, { recursive: true });
    fs.writeFileSync(path.join(outerRoot, 'package.json'), '{"name":"outer"}', 'utf-8');
    fs.writeFileSync(path.join(innerRoot, 'package.json'), '{"name":"inner"}', 'utf-8');

    const result = resolvePackageRoot(startDir);

    expect(result).toBe(innerRoot);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});

describe('getCheckpointSetupStatus', () => {
  it('returns missing status when checkpoint branch does not exist', async () => {
    const git = {
      branchExists: vi.fn().mockResolvedValue(false),
      countRevisions: vi.fn(),
    };

    const result = await getCheckpointSetupStatus(git);

    expect(result).toEqual({
      branchExists: false,
      checkpointCount: 0,
    });
    expect(git.branchExists).toHaveBeenCalledTimes(1);
    expect(git.countRevisions).not.toHaveBeenCalled();
  });

  it('returns revision count when checkpoint branch exists', async () => {
    const git = {
      branchExists: vi.fn().mockResolvedValue(true),
      countRevisions: vi.fn().mockResolvedValue(7),
    };

    const result = await getCheckpointSetupStatus(git);

    expect(result).toEqual({
      branchExists: true,
      checkpointCount: 7,
    });
    expect(git.branchExists).toHaveBeenCalledTimes(1);
    expect(git.countRevisions).toHaveBeenCalledTimes(1);
  });
});
