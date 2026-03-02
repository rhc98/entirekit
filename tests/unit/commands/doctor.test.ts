import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runDoctor } from '../../../src/commands/doctor.js';
import { GitClient } from '../../../src/git/client.js';
import { CHECKPOINT_BRANCH } from '../../../src/constants.js';
import * as output from '../../../src/utils/output.js';
import { execa } from 'execa';

vi.mock('execa');
vi.mock('../../../src/utils/output.js');

describe('runDoctor', () => {
  let mockGit: GitClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGit = new GitClient();
  });

  it('should output JSON format with all checks passing', async () => {
    // Mock git installed
    vi.mocked(execa).mockResolvedValue({ stdout: 'git version 2.0.0' } as any);

    // Mock git client methods
    vi.spyOn(mockGit, 'isInsideWorkTree').mockResolvedValue(true);
    vi.spyOn(mockGit, 'branchExists').mockResolvedValue(true);
    vi.spyOn(mockGit, 'getLocalAlias').mockResolvedValue('!entirekit');

    const printJsonSpy = vi.spyOn(output, 'printJson');

    await runDoctor(mockGit, { json: true });

    expect(printJsonSpy).toHaveBeenCalledWith({
      dependencies: {
        git: true,
      },
      repository: {
        in_git_repo: true,
        checkpoint_branch_exists: true,
      },
      alias: {
        exists: true,
        correct: true,
        value: '!entirekit',
        expected: '!entirekit',
      },
      fix_applied: false,
    });
  });

  it('should output JSON format when alias is missing', async () => {
    vi.mocked(execa).mockResolvedValue({ stdout: 'git version 2.0.0' } as any);
    vi.spyOn(mockGit, 'isInsideWorkTree').mockResolvedValue(true);
    vi.spyOn(mockGit, 'branchExists').mockResolvedValue(true);
    vi.spyOn(mockGit, 'getLocalAlias').mockResolvedValue(null);

    const printJsonSpy = vi.spyOn(output, 'printJson');

    await runDoctor(mockGit, { json: true });

    expect(printJsonSpy).toHaveBeenCalledWith({
      dependencies: {
        git: true,
      },
      repository: {
        in_git_repo: true,
        checkpoint_branch_exists: true,
      },
      alias: {
        exists: false,
        correct: false,
        value: '',
        expected: '!entirekit',
      },
      fix_applied: false,
    });
  });

  it('should apply fix when --fix is used and alias is missing', async () => {
    vi.mocked(execa).mockResolvedValue({ stdout: 'git version 2.0.0' } as any);
    vi.spyOn(mockGit, 'isInsideWorkTree').mockResolvedValue(true);
    vi.spyOn(mockGit, 'branchExists').mockResolvedValue(true);
    vi.spyOn(mockGit, 'getLocalAlias').mockResolvedValue(null);
    const setAliasSpy = vi.spyOn(mockGit, 'setLocalAlias').mockResolvedValue();

    const printJsonSpy = vi.spyOn(output, 'printJson');

    await runDoctor(mockGit, { json: true, fix: true });

    expect(setAliasSpy).toHaveBeenCalledWith('entirekit', '!entirekit');
    expect(printJsonSpy).toHaveBeenCalledWith({
      dependencies: {
        git: true,
      },
      repository: {
        in_git_repo: true,
        checkpoint_branch_exists: true,
      },
      alias: {
        exists: true,
        correct: true,
        value: '!entirekit',
        expected: '!entirekit',
      },
      fix_applied: true,
    });
  });

  it('should detect incorrect alias value', async () => {
    vi.mocked(execa).mockResolvedValue({ stdout: 'git version 2.0.0' } as any);
    vi.spyOn(mockGit, 'isInsideWorkTree').mockResolvedValue(true);
    vi.spyOn(mockGit, 'branchExists').mockResolvedValue(true);
    vi.spyOn(mockGit, 'getLocalAlias').mockResolvedValue('!bash /old/path/entirekit.sh');

    const printJsonSpy = vi.spyOn(output, 'printJson');

    await runDoctor(mockGit, { json: true });

    expect(printJsonSpy).toHaveBeenCalledWith({
      dependencies: {
        git: true,
      },
      repository: {
        in_git_repo: true,
        checkpoint_branch_exists: true,
      },
      alias: {
        exists: true,
        correct: false,
        value: '!bash /old/path/entirekit.sh',
        expected: '!entirekit',
      },
      fix_applied: false,
    });
  });
});
