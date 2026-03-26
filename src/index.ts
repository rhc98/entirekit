import { Command } from 'commander';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { GitClient } from './git/client.js';
import { runDoctor } from './commands/doctor.js';
import { runStats } from './commands/stats.js';
import { runSearch } from './commands/search.js';
import { runDiff } from './commands/diff.js';
import { runInstall } from './commands/install.js';
import { runRecent, runToday, runYesterday, runWeek } from './commands/quick.js';
import { runReport } from './commands/report.js';
import { runCost } from './commands/cost.js';
import { runShow } from './commands/show.js';
import { runSummary } from './commands/summary.js';
import { runHotspots } from './commands/hotspots.js';
import { runTimeline } from './commands/timeline.js';
import { runExport } from './commands/export.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const pkg = require(resolve(__dirname, '../package.json')) as { version: string };

const program = new Command();

function parsePositiveIntegerOption(value: string, optionName: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    console.error(`Invalid value for ${optionName}: "${value}". Use a positive integer.`);
    process.exit(1);
  }
  return parsed;
}

program
  .name('entirekit')
  .description('CLI toolkit for analyzing EntireKit data')
  .version(pkg.version);

// doctor
program
  .command('doctor')
  .description('Diagnose environment and setup status')
  .option('--fix', 'Apply safe fixes')
  .option('--json', 'Print machine-readable JSON output')
  .action(async (opts) => {
    const git = new GitClient();
    await runDoctor(git, opts);
  });

// stats
program
  .command('stats')
  .description('Show checkpoint statistics')
  .option('--limit <n>', 'Analyze up to N sessions', '10')
  .option('--branch <name>', 'Filter by branch name')
  .option('--since <date>', 'Include sessions on/after DATE (YYYY-MM-DD)')
  .option('--until <date>', 'Include sessions on/before DATE (YYYY-MM-DD)')
  .option('--json', 'Print machine-readable JSON output')
  .action(async (opts) => {
    const git = new GitClient();
    await runStats(git, {
      ...opts,
      limit: parsePositiveIntegerOption(opts.limit, '--limit'),
    });
  });

// search
program
  .command('search <keyword>')
  .description('Search checkpoints by keyword')
  .option('--limit <n>', 'Search up to N sessions', '20')
  .option('--branch <name>', 'Filter by branch name')
  .option('--since <date>', 'Include sessions on/after DATE')
  .option('--until <date>', 'Include sessions on/before DATE')
  .option('--json', 'Print machine-readable JSON output')
  .action(async (keyword, opts) => {
    const git = new GitClient();
    await runSearch(git, {
      keyword,
      ...opts,
      limit: parsePositiveIntegerOption(opts.limit, '--limit'),
    });
  });

// diff
program
  .command('diff <hash1> <hash2>')
  .description('Compare two checkpoints')
  .option('--json', 'Print machine-readable JSON output')
  .action(async (hash1, hash2, opts) => {
    const git = new GitClient();
    await runDiff(git, { hash1, hash2, ...opts });
  });

// install
program
  .command('install')
  .description('Guided install (AI profile + local skills + .entire + git alias)')
  .option('--ai <profile>', 'Select AI tool (claude|gemini|none)')
  .option('-y, --yes', 'Auto-approve confirmation prompts')
  .option('--force', 'Overwrite existing settings/files')
  .action(async (opts) => {
    await runInstall(opts);
  });

// quick commands
program
  .command('recent')
  .description('Show recent 10 checkpoints')
  .action(async () => {
    await runRecent(new GitClient());
  });

program
  .command('today')
  .description("Show today's checkpoints")
  .action(async () => {
    await runToday(new GitClient());
  });

program
  .command('yesterday')
  .description("Show yesterday's checkpoints")
  .action(async () => {
    await runYesterday(new GitClient());
  });

program
  .command('week')
  .description("Show last week's checkpoints")
  .action(async () => {
    await runWeek(new GitClient());
  });

// report
program
  .command('report')
  .description('Generate HTML dashboard report')
  .option('--limit <n>', 'Analyze only N most recent checkpoints')
  .option('--output <path>', 'Output file path')
  .option('--export-json <path>', 'Save aggregated report data as JSON')
  .option('--export-csv <path>', 'Save per-session data as CSV')
  .option('--no-open', "Don't auto-open the report in a browser")
  .option('--branch <name>', 'Filter by branch name')
  .option('--since <date>', 'Include checkpoints after DATE (YYYY-MM-DD)')
  .option('--until <date>', 'Include checkpoints before DATE (YYYY-MM-DD)')
  .action(async (opts) => {
    const git = new GitClient();
    await runReport(git, {
      limit: opts.limit ? parsePositiveIntegerOption(opts.limit, '--limit') : undefined,
      output: opts.output,
      exportJson: opts.exportJson,
      exportCsv: opts.exportCsv,
      noOpen: opts.open === false,
      branch: opts.branch,
      since: opts.since,
      until: opts.until,
    });
  });

// cost
program
  .command('cost')
  .description('Analyze estimated API costs')
  .option('--model <name>', 'Pricing model (opus-4.6, sonnet-4.5, haiku-4.5, etc.)', 'sonnet-4.5')
  .option('--limit <n>', 'Analyze up to N sessions')
  .option('--branch <name>', 'Filter by branch name')
  .option('--since <date>', 'Include sessions on/after DATE (YYYY-MM-DD)')
  .option('--until <date>', 'Include sessions on/before DATE (YYYY-MM-DD)')
  .option('--json', 'Print machine-readable JSON output')
  .action(async (opts) => {
    const git = new GitClient();
    await runCost(git, {
      model: opts.model,
      limit: opts.limit ? parsePositiveIntegerOption(opts.limit, '--limit') : undefined,
      branch: opts.branch,
      since: opts.since,
      until: opts.until,
      json: opts.json,
    });
  });

// show
program
  .command('show <hash>')
  .description('Show detailed info for a single checkpoint')
  .option('--json', 'Print machine-readable JSON output')
  .action(async (hash, opts) => {
    const git = new GitClient();
    await runShow(git, { hash, ...opts });
  });

// summary
program
  .command('summary')
  .description('Show daily work summary')
  .option('--limit <n>', 'Analyze up to N sessions')
  .option('--branch <name>', 'Filter by branch name')
  .option('--since <date>', 'Include sessions on/after DATE (YYYY-MM-DD)')
  .option('--until <date>', 'Include sessions on/before DATE (YYYY-MM-DD)')
  .option('--json', 'Print machine-readable JSON output')
  .action(async (opts) => {
    const git = new GitClient();
    await runSummary(git, {
      limit: opts.limit ? parsePositiveIntegerOption(opts.limit, '--limit') : undefined,
      branch: opts.branch,
      since: opts.since,
      until: opts.until,
      json: opts.json,
    });
  });

// hotspots
program
  .command('hotspots')
  .description('Identify files that attract repeated AI modifications')
  .option('--top <n>', 'Show top N hotspot files', '20')
  .option('--branch <name>', 'Filter by branch name')
  .option('--since <date>', 'Include sessions on/after DATE (YYYY-MM-DD)')
  .option('--until <date>', 'Include sessions on/before DATE (YYYY-MM-DD)')
  .option('--json', 'Print machine-readable JSON output')
  .action(async (opts) => {
    const git = new GitClient();
    await runHotspots(git, {
      top: parsePositiveIntegerOption(opts.top, '--top'),
      branch: opts.branch,
      since: opts.since,
      until: opts.until,
      json: opts.json,
    });
  });

// timeline
program
  .command('timeline')
  .description('Show terminal activity heatmap')
  .option('--weeks <n>', 'Number of weeks to display', '12')
  .option('--branch <name>', 'Filter by branch name')
  .option('--since <date>', 'Include sessions on/after DATE (YYYY-MM-DD)')
  .option('--until <date>', 'Include sessions on/before DATE (YYYY-MM-DD)')
  .option('--json', 'Print machine-readable JSON output')
  .action(async (opts) => {
    const git = new GitClient();
    await runTimeline(git, {
      weeks: parsePositiveIntegerOption(opts.weeks, '--weeks'),
      branch: opts.branch,
      since: opts.since,
      until: opts.until,
      json: opts.json,
    });
  });

// export
program
  .command('export <hash>')
  .description('Export a checkpoint as files or markdown')
  .option('--output <path>', 'Output directory or file path')
  .option('--format <type>', 'Export format: files or md', 'files')
  .action(async (hash, opts) => {
    const git = new GitClient();
    await runExport(git, { hash, output: opts.output, format: opts.format });
  });

program.parse(process.argv);
