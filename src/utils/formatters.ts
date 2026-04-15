import chalk from 'chalk';

export function formatId(id: string): string {
  return chalk.dim(id.substring(0, 8));
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleDateString();
}

export function formatBoolean(value: boolean | undefined): string {
  return value ? chalk.green('\u2713') : chalk.red('\u2717');
}
