import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { hasConfig } from '../utils/config.js';
import { api } from '../api/client.js';
import { formatId } from '../utils/formatters.js';

export function createDepartmentsCommand(): Command {
  const cmd = new Command('departments')
    .description('Manage departments');

  // ---- list ----
  cmd.command('list')
    .description('List departments')
    .option('--title <title>', 'Filter by title')
    .option('--parent <parentId>', 'Filter by parent department ID')
    .option('--include-deleted', 'Include deleted departments')
    .option('--limit <n>', 'Limit results', '50')
    .option('--offset <n>', 'Offset', '0')
    .option('--json', 'Output as JSON')
    .action(async (options: {
      title?: string;
      parent?: string;
      includeDeleted?: boolean;
      limit: string;
      offset: string;
      json?: boolean;
    }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const spinner = ora('Loading departments...').start();

      try {
        const response = await api.departments.list({
          includeDeleted: options.includeDeleted,
          limit: parseInt(options.limit),
          offset: parseInt(options.offset),
        });
        spinner.stop();

        let departments = response.content;

        if (options.title) {
          const search = options.title.toLowerCase();
          departments = departments.filter(d => d.title.toLowerCase().includes(search));
        }

        if (options.parent) {
          departments = departments.filter(d => d.parentId === options.parent);
        }

        if (options.json) {
          console.log(JSON.stringify({ ...response, content: departments }));
          return;
        }

        if (departments.length === 0) {
          console.log(chalk.yellow('No departments found.'));
          return;
        }

        console.log(chalk.bold(`\nFound ${departments.length} department(s):\n`));

        departments.forEach((dept, index) => {
          const userCount = dept.users ? Object.keys(dept.users).length : 0;
          const parentInfo = dept.parentId ? chalk.dim(` parent: ${dept.parentId}`) : '';
          console.log(`  ${chalk.dim(`${index + 1}.`)} ${chalk.white(dept.title)} ${chalk.dim(`(${formatId(dept.id)})`)} ${chalk.dim(`- ${userCount} user(s)`)}${parentInfo}`);
        });

        console.log(chalk.dim(`\nShowing ${departments.length} of ${response.paging.count} total`));
      } catch (error) {
        spinner.fail('Failed to load departments');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- get ----
  cmd.command('get')
    .description('Get department details by ID')
    .argument('<id>', 'Department ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options: { json?: boolean }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const spinner = ora('Loading department...').start();

      try {
        const dept = await api.departments.get(id);
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(dept));
          return;
        }

        const userCount = dept.users ? Object.keys(dept.users).length : 0;

        console.log(chalk.bold(`\nDepartment: ${dept.title}\n`));
        console.log(`  ${chalk.dim('ID:')}        ${dept.id}`);
        console.log(`  ${chalk.dim('Title:')}     ${dept.title}`);
        if (dept.parentId) {
          console.log(`  ${chalk.dim('Parent ID:')} ${dept.parentId}`);
        }
        console.log(`  ${chalk.dim('Users:')}     ${userCount}`);

        if (dept.users && userCount > 0) {
          console.log(chalk.dim('\n  User IDs:'));
          for (const [userId, role] of Object.entries(dept.users)) {
            console.log(`    ${chalk.dim('-')} ${userId} ${chalk.dim(`(${role})`)}`);
          }
        }
      } catch (error) {
        spinner.fail('Failed to load department');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- create ----
  cmd.command('create')
    .description('Create a new department')
    .option('--title <title>', 'Department title')
    .option('--parent <parentId>', 'Parent department ID')
    .action(async (options: { title?: string; parent?: string }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      let title = options.title;

      if (!title) {
        const { inputTitle } = await inquirer.prompt([{
          type: 'input',
          name: 'inputTitle',
          message: 'Department title:',
          validate: (input: string) => input.trim().length > 0 || 'Title is required',
        }]);
        title = inputTitle;
      }

      const spinner = ora('Creating department...').start();

      try {
        const data: { title: string; parentId?: string } = { title: title! };
        if (options.parent) {
          data.parentId = options.parent;
        }

        const result = await api.departments.create(data);
        spinner.succeed(chalk.green('Department created successfully!'));
        console.log(chalk.dim(`  ID: ${result.id}`));
        console.log(chalk.white(`  Title: ${title}`));
        if (options.parent) {
          console.log(chalk.dim(`  Parent: ${options.parent}`));
        }
      } catch (error) {
        spinner.fail('Failed to create department');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- update ----
  cmd.command('update')
    .description('Update a department')
    .argument('<id>', 'Department ID')
    .option('--title <title>', 'New title')
    .action(async (id: string, options: { title?: string }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      let title = options.title;

      if (!title) {
        const fetchSpinner = ora('Loading department...').start();
        try {
          const current = await api.departments.get(id);
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
          fetchSpinner.fail('Failed to load department');
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
          process.exit(1);
        }
      }

      const spinner = ora('Updating department...').start();

      try {
        await api.departments.update(id, { title: title! });
        spinner.succeed(chalk.green('Department updated successfully!'));
        console.log(chalk.dim(`  ID: ${id}`));
        console.log(chalk.white(`  Title: ${title}`));
      } catch (error) {
        spinner.fail('Failed to update department');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return cmd;
}
