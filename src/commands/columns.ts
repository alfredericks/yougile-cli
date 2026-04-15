import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { hasConfig, loadConfig } from '../utils/config.js';
import { api } from '../api/client.js';
import { selectProject, selectBoard } from '../utils/prompts.js';
import { formatId, formatBoolean } from '../utils/formatters.js';

export function createColumnsCommand(): Command {
  const cmd = new Command('columns')
    .description('Manage columns');

  cmd.command('list')
    .description('List columns')
    .option('--board <id>', 'Board ID')
    .option('--title <title>', 'Filter by title')
    .option('--include-deleted', 'Include deleted columns')
    .option('--limit <n>', 'Limit results', '50')
    .option('--offset <n>', 'Offset', '0')
    .option('--json', 'Output as JSON')
    .action(async (options: {
      board?: string;
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

      let boardId = options.board;

      if (!boardId) {
        const config = loadConfig()!;
        if (config.defaultBoardId) {
          boardId = config.defaultBoardId;
          console.log(chalk.dim(`Using default board: ${config.defaultBoardName || boardId}`));
        } else {
          const project = await selectProject();
          const board = await selectBoard(project.id);
          boardId = board.id;
        }
      }

      const spinner = ora('Loading columns...').start();

      try {
        const response = await api.columns.list({
          boardId,
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

        const columns = response.content;

        if (columns.length === 0) {
          console.log(chalk.yellow('No columns found.'));
          return;
        }

        console.log(chalk.bold(`\nFound ${columns.length} column(s):\n`));

        columns.forEach((column, index) => {
          const colorInfo = column.color !== undefined ? chalk.dim(` [color: ${column.color}]`) : '';
          console.log(`  ${chalk.dim(`${index + 1}.`)} ${chalk.white(column.title)} ${chalk.dim(`(${formatId(column.id)})`)}${colorInfo}`);
        });

        console.log(chalk.dim(`\nShowing ${columns.length} of ${response.paging.count} total`));
      } catch (error) {
        spinner.fail('Failed to load columns');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('get')
    .description('Get column by ID')
    .argument('<id>', 'Column ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options: { json?: boolean }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const spinner = ora('Loading column...').start();

      try {
        const column = await api.columns.get(id);
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(column));
          return;
        }

        console.log(chalk.bold(`\nColumn: ${column.title}\n`));
        console.log(`  ${chalk.dim('ID:')}       ${column.id}`);
        console.log(`  ${chalk.dim('Title:')}    ${column.title}`);
        console.log(`  ${chalk.dim('Board ID:')} ${column.boardId}`);
        console.log(`  ${chalk.dim('Color:')}    ${column.color !== undefined ? column.color : chalk.dim('none')}`);
        console.log(`  ${chalk.dim('Deleted:')}  ${formatBoolean(column.deleted)}`);
      } catch (error) {
        spinner.fail('Failed to load column');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('create')
    .description('Create a new column')
    .option('--title <title>', 'Column title')
    .option('--board <id>', 'Board ID')
    .option('--color <n>', 'Column color')
    .action(async (options: { title?: string; board?: string; color?: string }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      let boardId = options.board;
      let title = options.title;

      if (!boardId) {
        const project = await selectProject();
        const board = await selectBoard(project.id);
        boardId = board.id;
      }

      if (!title) {
        const { inputTitle } = await inquirer.prompt([{
          type: 'input',
          name: 'inputTitle',
          message: 'Column title:',
          validate: (input: string) => input.trim().length > 0 || 'Title is required',
        }]);
        title = inputTitle;
      }

      const createData: { title: string; boardId: string; color?: number } = {
        title: title!,
        boardId: boardId!,
      };

      if (options.color !== undefined) {
        createData.color = parseInt(options.color);
      }

      const spinner = ora('Creating column...').start();

      try {
        const result = await api.columns.create(createData);
        spinner.succeed(chalk.green('Column created successfully!'));
        console.log(chalk.dim(`  ID: ${result.id}`));
        console.log(chalk.white(`  Title: ${title}`));
        console.log(chalk.dim(`  Board: ${boardId}`));
        if (createData.color !== undefined) {
          console.log(chalk.dim(`  Color: ${createData.color}`));
        }
      } catch (error) {
        spinner.fail('Failed to create column');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('update')
    .description('Update a column')
    .argument('<id>', 'Column ID')
    .option('--title <title>', 'New title')
    .option('--color <n>', 'New color')
    .action(async (id: string, options: { title?: string; color?: string }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      let title = options.title;

      if (!title && options.color === undefined) {
        const fetchSpinner = ora('Loading column...').start();
        try {
          const current = await api.columns.get(id);
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
          fetchSpinner.fail('Failed to load column');
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
          process.exit(1);
        }
      }

      const updateData: { title?: string; color?: number } = {};
      if (title) {
        updateData.title = title;
      }
      if (options.color !== undefined) {
        updateData.color = parseInt(options.color);
      }

      const spinner = ora('Updating column...').start();

      try {
        await api.columns.update(id, updateData);
        spinner.succeed(chalk.green('Column updated successfully!'));
        console.log(chalk.dim(`  ID: ${id}`));
        if (updateData.title) {
          console.log(chalk.white(`  Title: ${updateData.title}`));
        }
        if (updateData.color !== undefined) {
          console.log(chalk.dim(`  Color: ${updateData.color}`));
        }
      } catch (error) {
        spinner.fail('Failed to update column');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return cmd;
}
