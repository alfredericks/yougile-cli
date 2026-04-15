import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { hasConfig } from '../utils/config.js';
import { api } from '../api/client.js';
import { formatId, formatTimestamp, formatBoolean } from '../utils/formatters.js';

export function createProjectsCommand(): Command {
  const cmd = new Command('projects')
    .description('Manage projects');

  cmd.command('list')
    .description('List projects')
    .option('--title <title>', 'Filter by title')
    .option('--include-deleted', 'Include deleted projects')
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
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const spinner = ora('Loading projects...').start();

      try {
        const response = await api.projects.list({
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

        const projects = response.content;

        if (projects.length === 0) {
          console.log(chalk.yellow('No projects found.'));
          return;
        }

        console.log(chalk.bold(`\nFound ${projects.length} project(s):\n`));

        projects.forEach((project, index) => {
          const userCount = project.users ? Object.keys(project.users).length : 0;
          console.log(`  ${chalk.dim(`${index + 1}.`)} ${chalk.white(project.title)} ${chalk.dim(`(${formatId(project.id)})`)} ${chalk.dim(`- ${userCount} user(s)`)}`);
        });

        console.log(chalk.dim(`\nShowing ${projects.length} of ${response.paging.count} total`));
      } catch (error) {
        spinner.fail('Failed to load projects');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('get')
    .description('Get project by ID')
    .argument('<id>', 'Project ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options: { json?: boolean }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const spinner = ora('Loading project...').start();

      try {
        const project = await api.projects.get(id);
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(project));
          return;
        }

        const userCount = project.users ? Object.keys(project.users).length : 0;

        console.log(chalk.bold(`\nProject: ${project.title}\n`));
        console.log(`  ${chalk.dim('ID:')}        ${project.id}`);
        console.log(`  ${chalk.dim('Title:')}     ${project.title}`);
        console.log(`  ${chalk.dim('Created:')}   ${formatTimestamp(project.timestamp)}`);
        console.log(`  ${chalk.dim('Users:')}     ${userCount}`);
        console.log(`  ${chalk.dim('Deleted:')}   ${formatBoolean(project.deleted)}`);

        if (project.users && userCount > 0) {
          console.log(chalk.dim('\n  User IDs:'));
          for (const [userId, role] of Object.entries(project.users)) {
            console.log(`    ${chalk.dim('-')} ${userId} ${chalk.dim(`(${role})`)}`);
          }
        }
      } catch (error) {
        spinner.fail('Failed to load project');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('create')
    .description('Create a new project')
    .option('--title <title>', 'Project title')
    .action(async (options: { title?: string }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      let title = options.title;

      if (!title) {
        const { inputTitle } = await inquirer.prompt([{
          type: 'input',
          name: 'inputTitle',
          message: 'Project title:',
          validate: (input: string) => input.trim().length > 0 || 'Title is required',
        }]);
        title = inputTitle;
      }

      const spinner = ora('Creating project...').start();

      try {
        const result = await api.projects.create({ title: title! });
        spinner.succeed(chalk.green('Project created successfully!'));
        console.log(chalk.dim(`  ID: ${result.id}`));
        console.log(chalk.white(`  Title: ${title}`));
      } catch (error) {
        spinner.fail('Failed to create project');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('update')
    .description('Update a project')
    .argument('<id>', 'Project ID')
    .option('--title <title>', 'New title')
    .action(async (id: string, options: { title?: string }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      let title = options.title;

      if (!title) {
        const fetchSpinner = ora('Loading project...').start();
        try {
          const current = await api.projects.get(id);
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
          fetchSpinner.fail('Failed to load project');
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
          process.exit(1);
        }
      }

      const spinner = ora('Updating project...').start();

      try {
        await api.projects.update(id, { title: title! });
        spinner.succeed(chalk.green('Project updated successfully!'));
        console.log(chalk.dim(`  ID: ${id}`));
        console.log(chalk.white(`  Title: ${title}`));
      } catch (error) {
        spinner.fail('Failed to update project');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return cmd;
}
