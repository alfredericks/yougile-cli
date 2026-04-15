import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { hasConfig } from '../utils/config.js';
import { api } from '../api/client.js';

function requireConfig(): void {
  if (!hasConfig()) {
    console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
    process.exit(1);
  }
}

export function createFilesCommand(): Command {
  const cmd = new Command('files')
    .description('Manage file uploads');

  cmd.command('upload')
    .description('Upload a file to Yougile')
    .argument('<path>', 'Path to the file to upload')
    .action(async (filePath: string) => {
      requireConfig();

      const resolvedPath = resolve(filePath);

      if (!existsSync(resolvedPath)) {
        console.log(chalk.red(`Error: File not found: ${resolvedPath}`));
        process.exit(1);
      }

      const spinner = ora('Uploading file...').start();

      try {
        const result = await api.files.upload(resolvedPath);
        spinner.succeed(chalk.green('File uploaded successfully!'));
        console.log(`  ${chalk.dim('URL:')}      ${result.url}`);
        console.log(`  ${chalk.dim('Full URL:')} ${result.fullUrl}`);
      } catch (error) {
        spinner.fail('Failed to upload file');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return cmd;
}
