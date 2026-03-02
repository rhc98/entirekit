import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GitClient } from '../git/client.js';
import { CHECKPOINT_BRANCH } from '../constants.js';
import { log } from '../utils/output.js';
import { execa } from 'execa';
import { select, confirm } from '@inquirer/prompts';

export interface InstallOptions {
  ai?: string;
  yes?: boolean;
  force?: boolean;
}

type AiProfile = 'claude' | 'gemini' | 'none';

export interface CheckpointSetupStatus {
  branchExists: boolean;
  checkpointCount: number;
}

export async function getCheckpointSetupStatus(
  git: Pick<GitClient, 'branchExists' | 'countRevisions'>
): Promise<CheckpointSetupStatus> {
  const branchExists = await git.branchExists(CHECKPOINT_BRANCH);
  if (!branchExists) {
    return {
      branchExists: false,
      checkpointCount: 0,
    };
  }

  const checkpointCount = await git.countRevisions(CHECKPOINT_BRANCH);
  return {
    branchExists: true,
    checkpointCount,
  };
}

export function resolvePackageRoot(startDir: string): string {
  let currentDir = startDir;

  while (true) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  log.error(`Unable to locate package root from: ${startDir}`);
  process.exit(1);
}

function normalizeAiProfile(value: string): AiProfile | null {
  const normalized = value.toLowerCase();
  switch (normalized) {
    case '1':
    case 'claude':
      return 'claude';
    case '2':
    case 'gemini':
      return 'gemini';
    case '3':
    case 'none':
    case 'script':
    case 'scripts':
    case 'script-only':
      return 'none';
    default:
      return null;
  }
}

async function selectAiProfile(opts: InstallOptions): Promise<AiProfile> {
  if (opts.ai) {
    const profile = normalizeAiProfile(opts.ai);
    if (!profile) {
      log.error(`Unsupported --ai value: ${opts.ai}`);
      process.exit(1);
    }
    return profile;
  }

  if (opts.yes) {
    log.info("In --yes mode, default profile is 'scripts only'.");
    return 'none';
  }

  const choice = await select({
    message: 'Select the AI tool currently in use:',
    choices: [
      { name: 'Claude', value: 'claude' },
      { name: 'Gemini', value: 'gemini' },
      { name: 'Not using one / scripts only', value: 'none' },
    ],
  });

  return choice as AiProfile;
}

function copyTree(src: string, dst: string, label: string): void {
  if (!fs.existsSync(src)) {
    log.error(`${label} source directory not found: ${src}`);
    process.exit(1);
  }

  // Ensure destination directory exists
  fs.mkdirSync(dst, { recursive: true });

  // Get absolute paths
  const srcAbs = fs.realpathSync(src);
  const dstAbs = fs.realpathSync(dst);

  if (srcAbs === dstAbs) {
    log.info(`Skipping ${label} copy because source and destination are the same.`);
    return;
  }

  fs.cpSync(src, dst, { recursive: true });
  log.ok(`${label} copied to ${dst}`);
}

export async function runInstall(opts: InstallOptions): Promise<void> {
  log.plain('======================================');
  log.plain('  EntireKit Setup');
  log.plain('======================================');
  log.plain('');

  // Check git
  log.plain('Checking dependencies...');
  try {
    await execa('git', ['--version']);
    log.ok('git is installed.');
  } catch {
    log.error('git is not installed.');
    process.exit(1);
  }
  log.plain('');

  // Check entire CLI
  log.plain('Checking Entire installation...');
  try {
    await execa('entire', ['--version']);
    log.ok('entire CLI is installed.');
  } catch {
    log.error('entire CLI not found.');
    log.plain('');
    log.plain('Entire setup guide:');
    log.plain('  - Official guide: https://github.com/entireio/cli');
    log.plain('  - Enable Entire integration in your AI tool (Claude Code, Gemini CLI, etc.).');
    log.plain('  - Run at least one session in this project to generate checkpoints.');
    log.plain('');
    log.plain('Installation aborted.');
    process.exit(1);
  }
  log.plain('');

  // Check checkpoint branch
  log.plain('Checking project Entire setup...');
  const git = new GitClient();
  const checkpointSetupStatus = await getCheckpointSetupStatus(git);
  if (!checkpointSetupStatus.branchExists) {
    log.warn(`branch '${CHECKPOINT_BRANCH}' was not found.`);
    log.info('Continuing installation without existing checkpoints.');
    log.plain('You can generate checkpoints later by running an Entire-enabled session in this project.');
  } else {
    log.ok(`'${CHECKPOINT_BRANCH}' exists (checkpoints: ${checkpointSetupStatus.checkpointCount}).`);
  }
  log.plain('');

  // Select AI profile
  const aiProfile = await selectAiProfile(opts);
  log.plain(`Selected profile: ${aiProfile}`);
  log.plain('');

  // Get project root
  const projectRoot = await git.revParseTopLevel();

  // Resolve package root from current module location (works for both src/ and dist/)
  const __filename = fileURLToPath(import.meta.url);
  const packageRoot = resolvePackageRoot(path.dirname(__filename));

  log.plain('Starting 2-step installation:');
  log.plain('  1) Local Skills copy (optional)');
  log.plain('  2) .entire resources copy');
  log.plain('');

  // Step 1: Copy Local Skills (if applicable)
  if (aiProfile !== 'none') {
    let packageSkillsDir = path.join(packageRoot, 'skills');
    if (!fs.existsSync(packageSkillsDir)) {
      packageSkillsDir = path.join(packageRoot, '.claude/skills');
    }

    if (!fs.existsSync(packageSkillsDir)) {
      log.error(`skills source directory not found: ${packageSkillsDir}`);
      log.plain('Installation aborted.');
      process.exit(1);
    }

    const targetSkillsDir =
      aiProfile === 'claude'
        ? path.join(projectRoot, '.claude/skills')
        : path.join(projectRoot, '.gemini/skills');

    if (fs.existsSync(targetSkillsDir) && !opts.force) {
      const shouldContinue = await confirm({
        message: 'Existing Local Skills directory found. Continue with merge copy?',
        default: false,
      });

      if (!shouldContinue) {
        log.plain('Installation canceled.');
        process.exit(0);
      }
    }

    copyTree(packageSkillsDir, targetSkillsDir, `Local Skills (${aiProfile})`);
  } else {
    log.info('Skipping Local Skills copy (scripts only profile).');
  }

  // Step 2: Copy .entire resources
  const packageEntireDir = path.join(packageRoot, '.entire');
  const targetEntireDir = path.join(projectRoot, '.entire');

  if (fs.existsSync(targetEntireDir) && !opts.force) {
    const shouldContinue = await confirm({
      message: 'Existing .entire directory found. Continue with merge copy?',
      default: false,
    });

    if (!shouldContinue) {
      log.plain('Installation canceled.');
      process.exit(0);
    }
  }

  copyTree(packageEntireDir, targetEntireDir, '.entire');

  // Make scripts executable
  const scriptsDir = path.join(targetEntireDir, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const scriptFiles = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.sh'));
    for (const file of scriptFiles) {
      try {
        fs.chmodSync(path.join(scriptsDir, file), 0o755);
      } catch {
        // Ignore errors
      }
    }
  }

  log.plain('');
  log.plain('Configuring git alias...');

  // Check for existing alias
  const existingAlias = await git.getLocalAlias('entirekit');
  if (existingAlias && !opts.force) {
    log.warn('existing entirekit alias found.');
    const shouldOverwrite = await confirm({
      message: 'Overwrite it?',
      default: false,
    });

    if (!shouldOverwrite) {
      log.plain('Installation canceled.');
      process.exit(0);
    }
  }

  // Set alias
  await git.setLocalAlias('entirekit', '!entirekit');
  log.ok('git alias configured.');

  log.plain('');
  log.plain('======================================');
  log.plain('  Setup Complete');
  log.plain('======================================');
  log.plain('');
  log.plain('Install summary:');
  log.plain(`  - AI profile: ${aiProfile}`);

  if (aiProfile === 'claude') {
    log.plain(`  - Local Skills: ${path.join(projectRoot, '.claude/skills')}`);
  } else if (aiProfile === 'gemini') {
    log.plain(`  - Local Skills: ${path.join(projectRoot, '.gemini/skills')}`);
  } else {
    log.plain('  - Local Skills: not installed');
  }

  log.plain(`  - .entire: ${targetEntireDir}`);
  log.plain('  - git alias.entirekit: !entirekit');
  log.plain('');
}
