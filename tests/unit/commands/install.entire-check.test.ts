import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execa } from 'execa';
import { runInstall } from '../../../src/commands/install.js';
import { GitClient } from '../../../src/git/client.js';
import { log } from '../../../src/utils/output.js';

vi.mock('execa');
vi.mock('../../../src/utils/output.js', () => ({
  log: {
    ok: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    plain: vi.fn(),
    info: vi.fn(),
  },
  printJson: vi.fn(),
}));

describe('runInstall - entire CLI checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checks entire CLI using "entire version"', async () => {
    vi.mocked(execa).mockImplementation(((command: string, args?: string[]) => {
      if (command === 'git' && args?.[0] === '--version') {
        return Promise.resolve({ stdout: 'git version 2.0.0' } as any);
      }
      if (command === 'entire' && args?.[0] === 'version') {
        return Promise.resolve({ stdout: 'Entire CLI 0.4.4' } as any);
      }
      throw new Error(`unexpected execa call: ${command} ${args?.join(' ') ?? ''}`);
    }) as any);

    vi.spyOn(GitClient.prototype, 'branchExists').mockRejectedValue(new Error('stop after entire check'));

    await expect(runInstall({ ai: 'none' })).rejects.toThrow('stop after entire check');
    expect(execa).toHaveBeenCalledWith('entire', ['version']);
  });

  it('prints not-found guidance when entire binary is missing (ENOENT)', async () => {
    const exitError = new Error('process.exit');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw exitError;
    }) as any);

    vi.mocked(execa).mockImplementation(((command: string, args?: string[]) => {
      if (command === 'git' && args?.[0] === '--version') {
        return Promise.resolve({ stdout: 'git version 2.0.0' } as any);
      }
      if (command === 'entire') {
        return Promise.reject(Object.assign(new Error('spawn entire ENOENT'), { code: 'ENOENT' }));
      }
      throw new Error(`unexpected execa call: ${command} ${args?.join(' ') ?? ''}`);
    }) as any);

    await expect(runInstall({ ai: 'none' })).rejects.toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(log.error).toHaveBeenCalledWith('entire CLI not found.');
    expect(log.error).not.toHaveBeenCalledWith('Failed to run entire CLI.');
  });

  it('prints runtime failure details when entire exists but command fails', async () => {
    const exitError = new Error('process.exit');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw exitError;
    }) as any);
    const shortMessage = 'Command failed with exit code 2: entire version';

    vi.mocked(execa).mockImplementation(((command: string, args?: string[]) => {
      if (command === 'git' && args?.[0] === '--version') {
        return Promise.resolve({ stdout: 'git version 2.0.0' } as any);
      }
      if (command === 'entire') {
        return Promise.reject(Object.assign(new Error(shortMessage), { shortMessage }));
      }
      throw new Error(`unexpected execa call: ${command} ${args?.join(' ') ?? ''}`);
    }) as any);

    await expect(runInstall({ ai: 'none' })).rejects.toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(log.error).toHaveBeenCalledWith('Failed to run entire CLI.');
    expect(log.plain).toHaveBeenCalledWith(`  ${shortMessage}`);
  });
});
