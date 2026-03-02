import { GitClient } from '../git/client.js';
import { CHECKPOINT_BRANCH } from '../constants.js';
import { log, printJson } from '../utils/output.js';
import { execa } from 'execa';

export interface DoctorOptions {
  fix?: boolean;
  json?: boolean;
}

const EXPECTED_ALIAS = '!entirekit';

async function checkGitInstalled(): Promise<boolean> {
  try {
    await execa('git', ['--version']);
    return true;
  } catch {
    return false;
  }
}

export async function runDoctor(git: GitClient, opts: DoctorOptions): Promise<void> {
  const hasGit = await checkGitInstalled();
  let inGitRepo = false;
  let branchExists = false;
  let aliasExists = false;
  let aliasValue = '';
  let aliasOk = false;
  let fixApplied = false;

  if (hasGit) {
    inGitRepo = await git.isInsideWorkTree();

    if (inGitRepo) {
      branchExists = await git.branchExists(CHECKPOINT_BRANCH);

      const currentAlias = await git.getLocalAlias('entirekit');
      if (currentAlias !== null) {
        aliasExists = true;
        aliasValue = currentAlias;
        aliasOk = currentAlias === EXPECTED_ALIAS;
      }

      if (opts.fix && !aliasExists) {
        await git.setLocalAlias('entirekit', EXPECTED_ALIAS);
        aliasExists = true;
        aliasOk = true;
        aliasValue = EXPECTED_ALIAS;
        fixApplied = true;
      }
    }
  }

  if (opts.json) {
    printJson({
      dependencies: {
        git: hasGit,
      },
      repository: {
        in_git_repo: inGitRepo,
        checkpoint_branch_exists: branchExists,
      },
      alias: {
        exists: aliasExists,
        correct: aliasOk,
        value: aliasValue,
        expected: EXPECTED_ALIAS,
      },
      fix_applied: fixApplied,
    });
    return;
  }

  // Text output
  log.plain('🩺 EntireKit doctor');
  log.plain('===================');
  log.plain('');

  if (hasGit) {
    log.ok('git: installed');
  } else {
    log.error('git: missing');
  }

  log.plain('');

  if (inGitRepo) {
    log.ok('Git repository: detected');
  } else {
    log.error('Git repository: not detected (run inside a repository)');
  }

  if (inGitRepo) {
    if (branchExists) {
      log.ok(`Checkpoint branch (${CHECKPOINT_BRANCH}): found`);
    } else {
      log.warn(`Checkpoint branch (${CHECKPOINT_BRANCH}): not found`);
    }

    if (aliasExists) {
      if (aliasOk) {
        log.ok('alias.entirekit: configured correctly');
      } else {
        log.warn('alias.entirekit: set but differs from expected value');
        log.plain(`   current:  ${aliasValue}`);
        log.plain(`   expected: ${EXPECTED_ALIAS}`);
      }
    } else {
      log.warn('alias.entirekit: not configured');
    }
  }

  if (fixApplied) {
    log.plain('');
    log.ok('Applied fix: alias.entirekit has been configured.');
  }
}
