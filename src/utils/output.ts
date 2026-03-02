import chalk from 'chalk';

export const log = {
  ok:    (msg: string) => console.log(chalk.green('✅') + ' ' + msg),
  warn:  (msg: string) => console.log(chalk.yellow('⚠️') + '  ' + msg),
  error: (msg: string) => console.error(chalk.red('❌') + ' ' + msg),
  plain: (msg: string) => console.log(msg),
  info:  (msg: string) => console.log(chalk.blue('ℹ') + ' ' + msg),
};

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}
