import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { api } from '../api/client.js';
import { formatTimestamp, formatBoolean } from '../utils/formatters.js';
import { confirmAction } from '../utils/prompts.js';

export function createAuthCommand(): Command {
  const cmd = new Command('auth')
    .description('Manage API keys');

  // ---- list-keys ----
  cmd.command('list-keys')
    .description('List API keys for your account')
    .action(async () => {
      const { login } = await inquirer.prompt([{
        type: 'input',
        name: 'login',
        message: 'Login (email):',
        validate: (input: string) => input.trim().length > 0 || 'Login is required',
      }]);

      const { password } = await inquirer.prompt([{
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
        validate: (input: string) => input.trim().length > 0 || 'Password is required',
      }]);

      const { companyId } = await inquirer.prompt([{
        type: 'input',
        name: 'companyId',
        message: 'Company ID (optional, press Enter to skip):',
      }]);

      const spinner = ora('Fetching API keys...').start();

      try {
        const credentials: { login: string; password: string; companyId?: string } = {
          login,
          password,
        };
        if (companyId) {
          credentials.companyId = companyId;
        }

        const response = await api.auth.listKeys(credentials);
        spinner.stop();

        const keys = response.content;

        if (keys.length === 0) {
          console.log(chalk.yellow('No API keys found.'));
          return;
        }

        console.log(chalk.bold(`\nFound ${keys.length} API key(s):\n`));

        keys.forEach((key, index) => {
          const deletedStatus = key.deleted ? chalk.red(' [deleted]') : chalk.green(' [active]');
          console.log(`  ${chalk.dim(`${index + 1}.`)} ${chalk.white(key.key)}${deletedStatus}`);
          console.log(`     ${chalk.dim('Company:')}  ${key.companyId}`);
          console.log(`     ${chalk.dim('Created:')}  ${formatTimestamp(key.timestamp)}`);
          console.log(`     ${chalk.dim('Deleted:')}  ${formatBoolean(key.deleted)}`);
        });
      } catch (error) {
        spinner.fail('Failed to fetch API keys');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- delete-key ----
  cmd.command('delete-key')
    .description('Delete an API key')
    .argument('<key>', 'API key to delete')
    .action(async (key: string) => {
      const confirmed = await confirmAction(`Delete API key "${key}"?`);
      if (!confirmed) {
        console.log(chalk.dim('Cancelled.'));
        return;
      }

      const spinner = ora('Deleting API key...').start();

      try {
        await api.auth.deleteKey(key);
        spinner.succeed(chalk.green('API key deleted successfully.'));
      } catch (error) {
        spinner.fail('Failed to delete API key');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return cmd;
}
