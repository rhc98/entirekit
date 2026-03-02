import { vi, it, expect, describe, beforeEach } from 'vitest';
import { GitClient, findMetadataPath, findFilePath } from '../../../src/git/client.js';

vi.mock('execa', () => ({
  execa: vi.fn(),
}));

const { execa } = await import('execa');
const mockedExeca = vi.mocked(execa);

describe('GitClient', () => {
  let git: GitClient;

  beforeEach(() => {
    vi.clearAllMocks();
    git = new GitClient('/test/cwd');
  });

  describe('logHashes', () => {
    it('should call git with correct args and parse output', async () => {
      mockedExeca.mockResolvedValueOnce({
        stdout: 'abc123\ndef456\nghi789',
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
      } as any);

      const result = await git.logHashes('main');

      expect(mockedExeca).toHaveBeenCalledWith('git', ['log', 'main', '--format=%H'], { cwd: '/test/cwd' });
      expect(result).toEqual(['abc123', 'def456', 'ghi789']);
    });

    it('should filter empty lines', async () => {
      mockedExeca.mockResolvedValueOnce({
        stdout: 'abc123\n\ndef456\n',
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
      } as any);

      const result = await git.logHashes('main');

      expect(result).toEqual(['abc123', 'def456']);
    });
  });

  describe('branchExists', () => {
    it('should return true when git exits 0', async () => {
      mockedExeca.mockResolvedValueOnce({
        stdout: '',
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
      } as any);

      const result = await git.branchExists('main');

      expect(mockedExeca).toHaveBeenCalledWith('git', ['rev-parse', '--verify', 'main'], { cwd: '/test/cwd' });
      expect(result).toBe(true);
    });

    it('should return false when git exits non-zero', async () => {
      mockedExeca.mockRejectedValueOnce(new Error('Not found'));

      const result = await git.branchExists('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getLocalAlias', () => {
    it('should return alias value when found', async () => {
      mockedExeca.mockResolvedValueOnce({
        stdout: 'log --oneline',
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
      } as any);

      const result = await git.getLocalAlias('lo');

      expect(mockedExeca).toHaveBeenCalledWith('git', ['config', '--local', '--get', 'alias.lo'], { cwd: '/test/cwd' });
      expect(result).toBe('log --oneline');
    });

    it('should return null when alias not found (exit 1)', async () => {
      const error = new Error('Not found') as any;
      error.exitCode = 1;
      mockedExeca.mockRejectedValueOnce(error);

      const result = await git.getLocalAlias('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error for non-exit-1 failures', async () => {
      const error = new Error('Permission denied') as any;
      error.exitCode = 128;
      mockedExeca.mockRejectedValueOnce(error);

      await expect(git.getLocalAlias('test')).rejects.toThrow('Permission denied');
    });
  });

  describe('isInsideWorkTree', () => {
    it('should return true when inside work tree', async () => {
      mockedExeca.mockResolvedValueOnce({
        stdout: 'true',
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
      } as any);

      const result = await git.isInsideWorkTree();

      expect(result).toBe(true);
    });

    it('should return false when not inside work tree', async () => {
      mockedExeca.mockRejectedValueOnce(new Error('Not a git repo'));

      const result = await git.isInsideWorkTree();

      expect(result).toBe(false);
    });
  });

  describe('listTree', () => {
    it('should list files in a commit', async () => {
      mockedExeca.mockResolvedValueOnce({
        stdout: 'src/index.ts\nsrc/utils.ts\nREADME.md',
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
      } as any);

      const result = await git.listTree('abc123');

      expect(mockedExeca).toHaveBeenCalledWith('git', ['ls-tree', '-r', '--name-only', 'abc123'], { cwd: '/test/cwd' });
      expect(result).toEqual(['src/index.ts', 'src/utils.ts', 'README.md']);
    });
  });

  describe('findMetadataPath', () => {
    it('should find path matching metadata.json pattern', async () => {
      mockedExeca.mockResolvedValueOnce({
        stdout: 'docs/README.md\n.claude/12345/metadata.json\nsrc/index.ts',
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
      } as any);

      const result = await findMetadataPath(git, 'abc123');

      expect(result).toBe('.claude/12345/metadata.json');
    });

    it('should return null when no metadata.json found', async () => {
      mockedExeca.mockResolvedValueOnce({
        stdout: 'docs/README.md\nsrc/index.ts',
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
      } as any);

      const result = await findMetadataPath(git, 'abc123');

      expect(result).toBeNull();
    });
  });

  describe('findFilePath', () => {
    it('should find path ending with suffix', async () => {
      mockedExeca.mockResolvedValueOnce({
        stdout: 'docs/README.md\n.claude/12345/report.html\nsrc/index.ts',
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
      } as any);

      const result = await findFilePath(git, 'abc123', 'report.html');

      expect(result).toBe('.claude/12345/report.html');
    });

    it('should return null when suffix not found', async () => {
      mockedExeca.mockResolvedValueOnce({
        stdout: 'docs/README.md\nsrc/index.ts',
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
      } as any);

      const result = await findFilePath(git, 'abc123', 'report.html');

      expect(result).toBeNull();
    });
  });

  describe('logOneline', () => {
    it('should parse oneline log output', async () => {
      mockedExeca.mockResolvedValueOnce({
        stdout: 'abc1234 Initial commit\ndef5678 Add feature',
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
      } as any);

      const result = await git.logOneline('main');

      expect(result).toEqual([
        { hash: 'abc1234', subject: 'Initial commit' },
        { hash: 'def5678', subject: 'Add feature' },
      ]);
    });

    it('should include optional flags', async () => {
      mockedExeca.mockResolvedValueOnce({
        stdout: 'abc1234 Recent commit',
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
      } as any);

      await git.logOneline('main', { n: 5, since: '2026-01-01', until: '2026-02-01' });

      expect(mockedExeca).toHaveBeenCalledWith(
        'git',
        ['log', 'main', '--oneline', '-5', '--since', '2026-01-01', '--until', '2026-02-01'],
        { cwd: '/test/cwd' }
      );
    });
  });
});
