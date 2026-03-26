import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitClient } from '../../../src/git/client.js';
import { CHECKPOINT_BRANCH } from '../../../src/constants.js';

vi.mock('execa', () => ({
  execa: vi.fn(),
}));

const { execa } = await import('execa');
const mockedExeca = vi.mocked(execa);

function mockExecaResult(stdout: string) {
  return {
    stdout,
    stderr: '',
    exitCode: 0,
    failed: false,
    killed: false,
    signal: undefined,
    signalDescription: undefined,
    command: '',
    escapedCommand: '',
    cwd: '',
    isCanceled: false,
    timedOut: false,
    pipedFrom: undefined,
  } as any;
}

describe('quick commands', () => {
  let git: GitClient;

  beforeEach(() => {
    vi.clearAllMocks();
    git = new GitClient('/test/cwd');
  });

  describe('runRecent', () => {
    it('should show recent 10 checkpoints', async () => {
      mockedExeca.mockResolvedValueOnce(
        mockExecaResult('abc1234 Checkpoint 1\ndef5678 Checkpoint 2')
      );

      const { runRecent } = await import('../../../src/commands/quick.js');
      await runRecent(git);

      expect(mockedExeca).toHaveBeenCalledWith(
        'git',
        ['log', CHECKPOINT_BRANCH, '--oneline', '-10'],
        { cwd: '/test/cwd' }
      );
    });

    it('should warn when no checkpoints found', async () => {
      mockedExeca.mockResolvedValueOnce(mockExecaResult(''));

      const { log } = await import('../../../src/utils/output.js');
      const warnSpy = vi.spyOn(log, 'warn').mockImplementation(() => {});

      const { runRecent } = await import('../../../src/commands/quick.js');
      await runRecent(git);

      expect(warnSpy).toHaveBeenCalledWith('No checkpoints found.');
      warnSpy.mockRestore();
    });
  });

  describe('runToday', () => {
    it('should pass since=today', async () => {
      mockedExeca.mockResolvedValueOnce(mockExecaResult('abc1234 Today checkpoint'));

      const { runToday } = await import('../../../src/commands/quick.js');
      await runToday(git);

      expect(mockedExeca).toHaveBeenCalledWith(
        'git',
        ['log', CHECKPOINT_BRANCH, '--oneline', '--since', 'today'],
        { cwd: '/test/cwd' }
      );
    });
  });

  describe('runYesterday', () => {
    it('should pass since=yesterday until=today', async () => {
      mockedExeca.mockResolvedValueOnce(mockExecaResult('abc1234 Yesterday checkpoint'));

      const { runYesterday } = await import('../../../src/commands/quick.js');
      await runYesterday(git);

      expect(mockedExeca).toHaveBeenCalledWith(
        'git',
        ['log', CHECKPOINT_BRANCH, '--oneline', '--since', 'yesterday', '--until', 'today'],
        { cwd: '/test/cwd' }
      );
    });
  });

  describe('runWeek', () => {
    it('should pass since=1 week ago', async () => {
      mockedExeca.mockResolvedValueOnce(mockExecaResult('abc1234 Week checkpoint'));

      const { runWeek } = await import('../../../src/commands/quick.js');
      await runWeek(git);

      expect(mockedExeca).toHaveBeenCalledWith(
        'git',
        ['log', CHECKPOINT_BRANCH, '--oneline', '--since', '1 week ago'],
        { cwd: '/test/cwd' }
      );
    });
  });
});
