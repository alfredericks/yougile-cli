import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { hasConfig, loadConfig } from '../utils/config.js';
import { api } from '../api/client.js';
import { selectProject } from '../utils/prompts.js';
import { formatId, formatBoolean } from '../utils/formatters.js';

export function createBoardsCommand(): Command {
  const cmd = new Command('boards')
    .description('Manage boards');

  cmd.command('list')
    .description('List boards')
    .option('--project <id>', 'Project ID')
    .option('--title <title>', 'Filter by title')
    .option('--include-deleted', 'Include deleted boards')
    .option('--limit <n>', 'Limit results', '50')
    .option('--offset <n>', 'Offset', '0')
    .option('--json', 'Output as JSON')
    .action(async (options: {
      project?: string;
      title?: string;
      includeDeleted?: boolean;
      limit: string;
      offset: string;
      json?: boolean;
    }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      let projectId = options.project;

      if (!projectId) {
        const config = loadConfig()!;
        if (config.defaultProjectId) {
          projectId = config.defaultProjectId;
          console.log(chalk.dim(`Using default project: ${config.defaultProjectName || projectId}`));
        } else {
          const project = await selectProject();
          projectId = project.id;
        }
      }

      const spinner = ora('Loading boards...').start();

      try {
        const response = await api.boards.list({
          projectId,
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

        const boards = response.content;

        if (boards.length === 0) {
          console.log(chalk.yellow('No boards found.'));
          return;
        }

        console.log(chalk.bold(`\nFound ${boards.length} board(s):\n`));

        boards.forEach((board, index) => {
          console.log(`  ${chalk.dim(`${index + 1}.`)} ${chalk.white(board.title)} ${chalk.dim(`(${formatId(board.id)})`)}`);
        });

        console.log(chalk.dim(`\nShowing ${boards.length} of ${response.paging.count} total`));
      } catch (error) {
        spinner.fail('Failed to load boards');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('get')
    .description('Get board by ID')
    .argument('<id>', 'Board ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options: { json?: boolean }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const spinner = ora('Loading board...').start();

      try {
        const board = await api.boards.get(id);
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(board));
          return;
        }

        console.log(chalk.bold(`\nBoard: ${board.title}\n`));
        console.log(`  ${chalk.dim('ID:')}         ${board.id}`);
        console.log(`  ${chalk.dim('Title:')}      ${board.title}`);
        console.log(`  ${chalk.dim('Project ID:')} ${board.projectId}`);
        console.log(`  ${chalk.dim('Deleted:')}    ${formatBoolean(board.deleted)}`);

        if (board.stickers) {
          console.log(chalk.dim('\n  Stickers:'));
          for (const [key, value] of Object.entries(board.stickers)) {
            if (typeof value === 'boolean') {
              console.log(`    ${chalk.dim('-')} ${key}: ${formatBoolean(value)}`);
            }
          }
        }
      } catch (error) {
        spinner.fail('Failed to load board');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('create')
    .description('Create a new board')
    .option('--title <title>', 'Board title')
    .option('--project <id>', 'Project ID')
    .action(async (options: { title?: string; project?: string }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      let projectId = options.project;
      let title = options.title;

      if (!projectId) {
        const project = await selectProject();
        projectId = project.id;
      }

      if (!title) {
        const { inputTitle } = await inquirer.prompt([{
          type: 'input',
          name: 'inputTitle',
          message: 'Board title:',
          validate: (input: string) => input.trim().length > 0 || 'Title is required',
        }]);
        title = inputTitle;
      }

      const spinner = ora('Creating board...').start();

      try {
        const result = await api.boards.create({ title: title!, projectId: projectId! });
        spinner.succeed(chalk.green('Board created successfully!'));
        console.log(chalk.dim(`  ID: ${result.id}`));
        console.log(chalk.white(`  Title: ${title}`));
        console.log(chalk.dim(`  Project: ${projectId}`));
      } catch (error) {
        spinner.fail('Failed to create board');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('update')
    .description('Update a board')
    .argument('<id>', 'Board ID')
    .option('--title <title>', 'New title')
    .action(async (id: string, options: { title?: string }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      let title = options.title;

      if (!title) {
        const fetchSpinner = ora('Loading board...').start();
        try {
          const current = await api.boards.get(id);
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
          fetchSpinner.fail('Failed to load board');
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
          process.exit(1);
        }
      }

      const spinner = ora('Updating board...').start();

      try {
        await api.boards.update(id, { title: title! });
        spinner.succeed(chalk.green('Board updated successfully!'));
        console.log(chalk.dim(`  ID: ${id}`));
        console.log(chalk.white(`  Title: ${title}`));
      } catch (error) {
        spinner.fail('Failed to update board');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return cmd;
}
