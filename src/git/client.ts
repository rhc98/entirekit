import { execa, ExecaError } from 'execa';
import type { CommitEntry } from '../types.js';

export class GitClient {
  constructor(private readonly cwd: string = process.cwd()) {}

  async isInsideWorkTree(): Promise<boolean> {
    try {
      const { stdout } = await execa('git', ['rev-parse', '--is-inside-work-tree'], { cwd: this.cwd });
      return stdout.trim() === 'true';
    } catch (error) {
      return false;
    }
  }

  async branchExists(branch: string): Promise<boolean> {
    try {
      await execa('git', ['rev-parse', '--verify', branch], { cwd: this.cwd });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getLocalAlias(name: string): Promise<string | null> {
    try {
      const { stdout } = await execa('git', ['config', '--local', '--get', `alias.${name}`], { cwd: this.cwd });
      return stdout.trim();
    } catch (error) {
      if (error instanceof Error && 'exitCode' in error && error.exitCode === 1) {
        return null;
      }
      throw error;
    }
  }

  async setLocalAlias(name: string, value: string): Promise<void> {
    await execa('git', ['config', '--local', `alias.${name}`, value], { cwd: this.cwd });
  }

  async logHashes(branch: string): Promise<string[]> {
    const { stdout } = await execa('git', ['log', branch, '--format=%H'], { cwd: this.cwd });
    return stdout.split('\n').filter(line => line.trim() !== '');
  }

  async logOneline(
    branch: string,
    opts?: { n?: number; since?: string; until?: string }
  ): Promise<CommitEntry[]> {
    const args = ['log', branch, '--oneline'];

    if (opts?.n) {
      args.push(`-${opts.n}`);
    }
    if (opts?.since) {
      args.push('--since', opts.since);
    }
    if (opts?.until) {
      args.push('--until', opts.until);
    }

    const { stdout } = await execa('git', args, { cwd: this.cwd });

    return stdout.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const hash = line.substring(0, 7);
        const subject = line.substring(8);
        return { hash, subject };
      });
  }

  async listTree(hash: string): Promise<string[]> {
    const { stdout } = await execa('git', ['ls-tree', '-r', '--name-only', hash], { cwd: this.cwd });
    return stdout.split('\n').filter(line => line.trim() !== '');
  }

  async showFile(hash: string, filePath: string): Promise<string> {
    const { stdout } = await execa('git', ['show', `${hash}:${filePath}`], { cwd: this.cwd });
    return stdout;
  }

  async revParseTopLevel(): Promise<string> {
    const { stdout } = await execa('git', ['rev-parse', '--show-toplevel'], { cwd: this.cwd });
    return stdout.trim();
  }

  async countRevisions(branch: string): Promise<number> {
    const { stdout } = await execa('git', ['rev-list', '--count', branch], { cwd: this.cwd });
    return parseInt(stdout.trim(), 10);
  }
}

export async function findMetadataPath(git: GitClient, hash: string): Promise<string | null> {
  const files = await git.listTree(hash);
  const metadataPattern = /\d+\/metadata\.json$/;
  const found = files.find(path => metadataPattern.test(path));
  return found ?? null;
}

export async function findFilePath(git: GitClient, hash: string, suffix: string): Promise<string | null> {
  const files = await git.listTree(hash);
  const found = files.find(path => path.endsWith(suffix));
  return found ?? null;
}
