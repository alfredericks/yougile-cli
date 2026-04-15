import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { hasConfig } from '../utils/config.js';
import { api } from '../api/client.js';
import { formatTimestamp } from '../utils/formatters.js';

function requireConfig(): void {
  if (!hasConfig()) {
    console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
    process.exit(1);
  }
}

export function createMessagesCommand(): Command {
  const cmd = new Command('messages')
    .description('Manage chat messages');

  cmd.command('list')
    .description('List messages in a chat')
    .argument('<chatId>', 'Chat ID (for task chats, use the task ID)')
    .option('--from <userId>', 'Filter by sender user ID')
    .option('--text <search>', 'Filter by text content')
    .option('--since <timestamp>', 'Messages since timestamp')
    .option('--include-system', 'Include system messages')
    .option('--include-deleted', 'Include deleted messages')
    .option('--limit <n>', 'Limit results', '50')
    .option('--offset <n>', 'Offset', '0')
    .option('--json', 'Output as JSON')
    .action(async (chatId: string, options: {
      from?: string;
      text?: string;
      since?: string;
      includeSystem?: boolean;
      includeDeleted?: boolean;
      limit: string;
      offset: string;
      json?: boolean;
    }) => {
      requireConfig();

      const spinner = ora('Loading messages...').start();

      try {
        const response = await api.chatMessages.list(chatId, {
          fromUserId: options.from,
          text: options.text,
          since: options.since ? parseInt(options.since) : undefined,
          includeSystem: options.includeSystem,
          includeDeleted: options.includeDeleted,
          limit: parseInt(options.limit),
          offset: parseInt(options.offset),
        });
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(response));
          return;
        }

        const messages = response.content;

        if (messages.length === 0) {
          console.log(chalk.yellow('No messages found.'));
          return;
        }

        console.log(chalk.bold(`\nFound ${messages.length} message(s):\n`));

        messages.forEach((msg) => {
          const time = msg.timestamp ? formatTimestamp(msg.timestamp) : chalk.dim('unknown');
          const sender = msg.fromUserId ? chalk.cyan(msg.fromUserId.substring(0, 8)) : chalk.dim('system');
          const text = msg.text
            ? (msg.text.length > 80 ? msg.text.substring(0, 80) + '...' : msg.text)
            : chalk.dim('(no text)');
          console.log(`  ${chalk.dim(time)} ${sender} ${chalk.white(text)} ${chalk.dim(`#${msg.id}`)}`);
        });

        console.log(chalk.dim(`\nShowing ${messages.length} of ${response.paging.count} total`));
      } catch (error) {
        spinner.fail('Failed to load messages');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('get')
    .description('Get a specific message')
    .argument('<chatId>', 'Chat ID')
    .argument('<messageId>', 'Message ID (number)')
    .option('--json', 'Output as JSON')
    .action(async (chatId: string, messageId: string, options: { json?: boolean }) => {
      requireConfig();

      const spinner = ora('Loading message...').start();

      try {
        const msg = await api.chatMessages.get(chatId, parseInt(messageId));
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(msg));
          return;
        }

        console.log(chalk.bold(`\nMessage #${msg.id}\n`));
        console.log(`  ${chalk.dim('ID:')}        ${msg.id}`);
        console.log(`  ${chalk.dim('From:')}      ${msg.fromUserId || '(system)'}`);
        console.log(`  ${chalk.dim('Time:')}      ${msg.timestamp ? formatTimestamp(msg.timestamp) : 'unknown'}`);
        console.log(`  ${chalk.dim('Text:')}      ${msg.text || '(no text)'}`);
        if (msg.textHtml) {
          console.log(`  ${chalk.dim('HTML:')}      ${msg.textHtml}`);
        }
        if (msg.label) {
          console.log(`  ${chalk.dim('Label:')}     ${msg.label}`);
        }
        console.log(`  ${chalk.dim('Deleted:')}   ${msg.deleted ? chalk.red('Yes') : chalk.green('No')}`);
        if (msg.editTimestamp) {
          console.log(`  ${chalk.dim('Edited:')}    ${formatTimestamp(msg.editTimestamp)}`);
        }
      } catch (error) {
        spinner.fail('Failed to load message');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('send')
    .description('Send a message to a chat')
    .argument('<chatId>', 'Chat ID')
    .option('--text <text>', 'Message text')
    .action(async (chatId: string, options: { text?: string }) => {
      requireConfig();

      let text = options.text;

      if (!text) {
        const { inputText } = await inquirer.prompt([{
          type: 'input',
          name: 'inputText',
          message: 'Message text:',
          validate: (input: string) => input.trim().length > 0 || 'Text is required',
        }]);
        text = inputText;
      }

      const spinner = ora('Sending message...').start();

      try {
        const result = await api.chatMessages.send(chatId, { text: text! });
        spinner.succeed(chalk.green('Message sent successfully!'));
        console.log(chalk.dim(`  Chat ID: ${result.chatId}`));
      } catch (error) {
        spinner.fail('Failed to send message');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('update')
    .description('Update a message')
    .argument('<chatId>', 'Chat ID')
    .argument('<messageId>', 'Message ID (number)')
    .option('--text <text>', 'New message text')
    .action(async (chatId: string, messageId: string, options: { text?: string }) => {
      requireConfig();

      let text = options.text;

      if (!text) {
        const { inputText } = await inquirer.prompt([{
          type: 'input',
          name: 'inputText',
          message: 'New message text:',
          validate: (input: string) => input.trim().length > 0 || 'Text is required',
        }]);
        text = inputText;
      }

      const spinner = ora('Updating message...').start();

      try {
        await api.chatMessages.update(chatId, parseInt(messageId), { text: text! });
        spinner.succeed(chalk.green('Message updated successfully!'));
        console.log(chalk.dim(`  Chat ID: ${chatId}`));
        console.log(chalk.dim(`  Message ID: ${messageId}`));
      } catch (error) {
        spinner.fail('Failed to update message');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return cmd;
}
