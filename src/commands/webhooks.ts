import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { hasConfig } from '../utils/config.js';
import { api } from '../api/client.js';
import { formatId } from '../utils/formatters.js';

function requireConfig(): void {
  if (!hasConfig()) {
    console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
    process.exit(1);
  }
}

export function createWebhooksCommand(): Command {
  const cmd = new Command('webhooks')
    .description('Manage webhooks');

  cmd.command('list')
    .description('List webhooks')
    .option('--include-deleted', 'Include deleted webhooks')
    .option('--json', 'Output as JSON')
    .action(async (options: {
      includeDeleted?: boolean;
      json?: boolean;
    }) => {
      requireConfig();

      const spinner = ora('Loading webhooks...').start();

      try {
        const response = await api.webhooks.list({
          includeDeleted: options.includeDeleted,
        });
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(response));
          return;
        }

        const webhooks = response.content;

        if (webhooks.length === 0) {
          console.log(chalk.yellow('No webhooks found.'));
          return;
        }

        console.log(chalk.bold(`\nFound ${webhooks.length} webhook(s):\n`));

        webhooks.forEach((webhook, index) => {
          const status = webhook.disabled ? chalk.red('disabled') : chalk.green('enabled');
          const event = webhook.event ? chalk.cyan(webhook.event) : chalk.dim('(no event)');
          console.log(`  ${chalk.dim(`${index + 1}.`)} ${chalk.white(webhook.url)} ${event} ${status} ${chalk.dim(`(${formatId(webhook.id)})`)}`);
        });

        console.log(chalk.dim(`\nShowing ${webhooks.length} of ${response.paging.count} total`));
      } catch (error) {
        spinner.fail('Failed to load webhooks');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('create')
    .description('Create a new webhook')
    .option('--url <url>', 'Webhook URL')
    .option('--event <event>', 'Event type')
    .action(async (options: { url?: string; event?: string }) => {
      requireConfig();

      let url = options.url;
      let event = options.event;

      if (!url) {
        const { inputUrl } = await inquirer.prompt([{
          type: 'input',
          name: 'inputUrl',
          message: 'Webhook URL:',
          validate: (input: string) => input.trim().length > 0 || 'URL is required',
        }]);
        url = inputUrl;
      }

      if (!event) {
        const { inputEvent } = await inquirer.prompt([{
          type: 'input',
          name: 'inputEvent',
          message: 'Event type:',
        }]);
        event = inputEvent || undefined;
      }

      const spinner = ora('Creating webhook...').start();

      try {
        const data: { url: string; event?: string } = { url: url! };
        if (event) {
          data.event = event;
        }
        const result = await api.webhooks.create(data);
        spinner.succeed(chalk.green('Webhook created successfully!'));
        console.log(chalk.dim(`  ID: ${result.id}`));
        console.log(chalk.white(`  URL: ${url}`));
        if (event) console.log(chalk.white(`  Event: ${event}`));
      } catch (error) {
        spinner.fail('Failed to create webhook');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('update')
    .description('Update a webhook')
    .argument('<id>', 'Webhook ID')
    .option('--url <url>', 'New URL')
    .option('--event <event>', 'New event type')
    .option('--disabled', 'Disable the webhook')
    .option('--enabled', 'Enable the webhook')
    .action(async (id: string, options: {
      url?: string;
      event?: string;
      disabled?: boolean;
      enabled?: boolean;
    }) => {
      requireConfig();

      const updateData: { url?: string; event?: string; disabled?: boolean } = {};

      if (options.url) {
        updateData.url = options.url;
      }
      if (options.event) {
        updateData.event = options.event;
      }
      if (options.disabled) {
        updateData.disabled = true;
      }
      if (options.enabled) {
        updateData.disabled = false;
      }

      if (!options.url && !options.event && !options.disabled && !options.enabled) {
        console.log(chalk.yellow('No fields to update. Use --url, --event, --disabled, or --enabled.'));
        return;
      }

      const spinner = ora('Updating webhook...').start();

      try {
        await api.webhooks.update(id, updateData);
        spinner.succeed(chalk.green('Webhook updated successfully!'));
        console.log(chalk.dim(`  ID: ${id}`));
        if (updateData.url) console.log(chalk.white(`  URL: ${updateData.url}`));
        if (updateData.event) console.log(chalk.white(`  Event: ${updateData.event}`));
        if (updateData.disabled !== undefined) {
          console.log(chalk.white(`  Status: ${updateData.disabled ? 'disabled' : 'enabled'}`));
        }
      } catch (error) {
        spinner.fail('Failed to update webhook');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return cmd;
}
