import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { hasConfig } from '../utils/config.js';
import { api } from '../api/client.js';
import { formatTimestamp } from '../utils/formatters.js';

export function createCompanyCommand(): Command {
  const cmd = new Command('company')
    .description('Manage company');

  // ---- get ----
  cmd.command('get')
    .description('Show company details')
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const spinner = ora('Loading company...').start();

      try {
        const company = await api.company.get();
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(company));
          return;
        }

        console.log(chalk.bold(`\nCompany: ${company.title}\n`));
        console.log(`  ${chalk.dim('ID:')}        ${company.id}`);
        console.log(`  ${chalk.dim('Title:')}     ${company.title}`);
        console.log(`  ${chalk.dim('Created:')}   ${formatTimestamp(company.timestamp)}`);

        if (company.apiData && Object.keys(company.apiData).length > 0) {
          console.log(`  ${chalk.dim('API data:')}  ${JSON.stringify(company.apiData)}`);
        }
      } catch (error) {
        spinner.fail('Failed to load company');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- update ----
  cmd.command('update')
    .description('Update company')
    .option('--title <title>', 'New company title')
    .action(async (options: { title?: string }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      let title = options.title;

      if (!title) {
        const fetchSpinner = ora('Loading company...').start();
        try {
          const current = await api.company.get();
          fetchSpinner.stop();

          const { inputTitle } = await inquirer.prompt([{
            type: 'input',
            name: 'inputTitle',
            message: 'New company title:',
            default: current.title,
            validate: (input: string) => input.trim().length > 0 || 'Title is required',
          }]);
          title = inputTitle;
        } catch (error) {
          fetchSpinner.fail('Failed to load company');
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
          process.exit(1);
        }
      }

      const spinner = ora('Updating company...').start();

      try {
        await api.company.update({ title: title! });
        spinner.succeed(chalk.green('Company updated successfully!'));
        console.log(chalk.white(`  Title: ${title}`));
      } catch (error) {
        spinner.fail('Failed to update company');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return cmd;
}
