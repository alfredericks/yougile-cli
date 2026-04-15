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

export function createChatsCommand(): Command {
  const cmd = new Command('chats')
    .description('Manage group chats');

  cmd.command('list')
    .description('List group chats')
    .option('--title <title>', 'Filter by title')
    .option('--include-deleted', 'Include deleted chats')
    .option('--limit <n>', 'Limit results', '50')
    .option('--offset <n>', 'Offset', '0')
    .option('--json', 'Output as JSON')
    .action(async (options: {
      title?: string;
      includeDeleted?: boolean;
      limit: string;
      offset: string;
      json?: boolean;
    }) => {
      requireConfig();

      const spinner = ora('Loading chats...').start();

      try {
        const response = await api.groupChats.list({
          title: options.title,
          includeDeleted: options.includeDeleted,
          limit: parseInt(options.limit),
          offset: parseInt(options.offset),
        });
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(response));
          return;
        }

        const chats = response.content;

        if (chats.length === 0) {
          console.log(chalk.yellow('No chats found.'));
          return;
        }

        console.log(chalk.bold(`\nFound ${chats.length} chat(s):\n`));

        chats.forEach((chat, index) => {
          console.log(`  ${chalk.dim(`${index + 1}.`)} ${chalk.white(chat.title)} ${chalk.dim(`(${formatId(chat.id)})`)}`);
        });

        console.log(chalk.dim(`\nShowing ${chats.length} of ${response.paging.count} total`));
      } catch (error) {
        spinner.fail('Failed to load chats');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('get')
    .description('Get chat by ID')
    .argument('<id>', 'Chat ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options: { json?: boolean }) => {
      requireConfig();

      const spinner = ora('Loading chat...').start();

      try {
        const chat = await api.groupChats.get(id);
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(chat));
          return;
        }

        console.log(chalk.bold(`\nChat: ${chat.title}\n`));
        console.log(`  ${chalk.dim('ID:')}      ${chat.id}`);
        console.log(`  ${chalk.dim('Title:')}   ${chat.title}`);
        console.log(`  ${chalk.dim('Deleted:')} ${chat.deleted ? chalk.red('Yes') : chalk.green('No')}`);

        if (chat.users && Object.keys(chat.users).length > 0) {
          console.log(chalk.dim('\n  Users:'));
          for (const userId of Object.keys(chat.users)) {
            console.log(`    ${chalk.dim('-')} ${userId}`);
          }
        }
      } catch (error) {
        spinner.fail('Failed to load chat');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('create')
    .description('Create a new group chat')
    .option('--title <title>', 'Chat title')
    .action(async (options: { title?: string }) => {
      requireConfig();

      let title = options.title;

      if (!title) {
        const { inputTitle } = await inquirer.prompt([{
          type: 'input',
          name: 'inputTitle',
          message: 'Chat title:',
          validate: (input: string) => input.trim().length > 0 || 'Title is required',
        }]);
        title = inputTitle;
      }

      const spinner = ora('Creating chat...').start();

      try {
        const result = await api.groupChats.create({
          title: title!,
          users: {},
          userRoleMap: {},
          roleConfigMap: {},
        });
        spinner.succeed(chalk.green('Chat created successfully!'));
        console.log(chalk.dim(`  ID: ${result.id}`));
        console.log(chalk.white(`  Title: ${title}`));
      } catch (error) {
        spinner.fail('Failed to create chat');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('update')
    .description('Update a group chat')
    .argument('<id>', 'Chat ID')
    .option('--title <title>', 'New title')
    .action(async (id: string, options: { title?: string }) => {
      requireConfig();

      let title = options.title;

      if (!title) {
        const fetchSpinner = ora('Loading chat...').start();
        try {
          const current = await api.groupChats.get(id);
          fetchSpinner.stop();

          const { inputTitle } = await inquirer.prompt([{
            type: 'input',
            name: 'inputTitle',
            message: 'New title:',
            default: current.title,
            validate: (input: string) => input.trim().length > 0 || 'Title is required',
          }]);
          title = inputTitle;
        } catch (error) {
          fetchSpinner.fail('Failed to load chat');
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
          process.exit(1);
        }
      }

      const spinner = ora('Updating chat...').start();

      try {
        await api.groupChats.update(id, { title: title! });
        spinner.succeed(chalk.green('Chat updated successfully!'));
        console.log(chalk.dim(`  ID: ${id}`));
        console.log(chalk.white(`  Title: ${title}`));
      } catch (error) {
        spinner.fail('Failed to update chat');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return cmd;
}
