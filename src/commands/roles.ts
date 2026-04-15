import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { hasConfig } from '../utils/config.js';
import { api } from '../api/client.js';
import { formatId } from '../utils/formatters.js';
import { selectProject, confirmAction } from '../utils/prompts.js';
import type { ProjectPermissions } from '../types/project-role.js';

function getDefaultPermissions(): ProjectPermissions {
  const defaultTaskPerms = {
    show: true,
    delete: false,
    editTitle: false,
    editDescription: false,
    complete: false,
    close: false,
    assignUsers: 'no' as const,
    connect: false,
    editSubtasks: 'no' as const,
    editStickers: false,
    editPins: false,
    move: 'no' as const,
    sendMessages: true,
    sendFiles: true,
    editWhoToNotify: 'no' as const,
  };

  const defaultColumnPerms = {
    editTitle: false,
    delete: false,
    move: 'no' as const,
    addTask: false,
    allTasks: { ...defaultTaskPerms },
    withMeTasks: { ...defaultTaskPerms },
    myTasks: { ...defaultTaskPerms },
    createdByMeTasks: { ...defaultTaskPerms },
  };

  const defaultBoardPerms = {
    editTitle: false,
    delete: false,
    move: false,
    showStickers: true,
    editStickers: false,
    addColumn: false,
    columns: { ...defaultColumnPerms },
    settings: false,
  };

  return {
    editTitle: false,
    delete: false,
    addBoard: false,
    boards: { ...defaultBoardPerms },
    children: {},
  };
}

function getAdminPermissions(): ProjectPermissions {
  const adminTaskPerms = {
    show: true,
    delete: true,
    editTitle: true,
    editDescription: true,
    complete: true,
    close: true,
    assignUsers: 'yes' as const,
    connect: true,
    editSubtasks: 'yes' as const,
    editStickers: true,
    editPins: true,
    move: 'yes' as const,
    sendMessages: true,
    sendFiles: true,
    editWhoToNotify: 'yes' as const,
  };

  const adminColumnPerms = {
    editTitle: true,
    delete: true,
    move: 'yes' as const,
    addTask: true,
    allTasks: { ...adminTaskPerms },
    withMeTasks: { ...adminTaskPerms },
    myTasks: { ...adminTaskPerms },
    createdByMeTasks: { ...adminTaskPerms },
  };

  const adminBoardPerms = {
    editTitle: true,
    delete: true,
    move: true,
    showStickers: true,
    editStickers: true,
    addColumn: true,
    columns: { ...adminColumnPerms },
    settings: true,
  };

  return {
    editTitle: true,
    delete: true,
    addBoard: true,
    boards: { ...adminBoardPerms },
    children: {},
  };
}

function getWorkerPermissions(): ProjectPermissions {
  const workerTaskPerms = {
    show: true,
    delete: false,
    editTitle: true,
    editDescription: true,
    complete: true,
    close: false,
    assignUsers: 'add-self' as const,
    connect: true,
    editSubtasks: 'yes' as const,
    editStickers: true,
    editPins: true,
    move: 'board' as const,
    sendMessages: true,
    sendFiles: true,
    editWhoToNotify: 'self' as const,
  };

  const workerColumnPerms = {
    editTitle: false,
    delete: false,
    move: 'no' as const,
    addTask: true,
    allTasks: { ...workerTaskPerms },
    withMeTasks: { ...workerTaskPerms },
    myTasks: { ...workerTaskPerms },
    createdByMeTasks: { ...workerTaskPerms },
  };

  const workerBoardPerms = {
    editTitle: false,
    delete: false,
    move: false,
    showStickers: true,
    editStickers: false,
    addColumn: false,
    columns: { ...workerColumnPerms },
    settings: false,
  };

  return {
    editTitle: false,
    delete: false,
    addBoard: false,
    boards: { ...workerBoardPerms },
    children: {},
  };
}

function getObserverPermissions(): ProjectPermissions {
  const observerTaskPerms = {
    show: true,
    delete: false,
    editTitle: false,
    editDescription: false,
    complete: false,
    close: false,
    assignUsers: 'no' as const,
    connect: false,
    editSubtasks: 'no' as const,
    editStickers: false,
    editPins: false,
    move: 'no' as const,
    sendMessages: true,
    sendFiles: false,
    editWhoToNotify: 'no' as const,
  };

  const observerColumnPerms = {
    editTitle: false,
    delete: false,
    move: 'no' as const,
    addTask: false,
    allTasks: { ...observerTaskPerms },
    withMeTasks: { ...observerTaskPerms },
    myTasks: { ...observerTaskPerms },
    createdByMeTasks: { ...observerTaskPerms },
  };

  const observerBoardPerms = {
    editTitle: false,
    delete: false,
    move: false,
    showStickers: true,
    editStickers: false,
    addColumn: false,
    columns: { ...observerColumnPerms },
    settings: false,
  };

  return {
    editTitle: false,
    delete: false,
    addBoard: false,
    boards: { ...observerBoardPerms },
    children: {},
  };
}

async function resolveProjectId(projectOption?: string): Promise<string> {
  if (projectOption) return projectOption;
  const project = await selectProject();
  return project.id;
}

export function createRolesCommand(): Command {
  const cmd = new Command('roles')
    .description('Manage project roles');

  // ---- list ----
  cmd.command('list')
    .description('List project roles')
    .option('--project <id>', 'Project ID')
    .option('--name <search>', 'Filter by name')
    .option('--limit <n>', 'Limit results', '50')
    .option('--offset <n>', 'Offset', '0')
    .option('--json', 'Output as JSON')
    .action(async (options: {
      project?: string;
      name?: string;
      limit: string;
      offset: string;
      json?: boolean;
    }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const projectId = await resolveProjectId(options.project);

      const spinner = ora('Loading roles...').start();

      try {
        const response = await api.projectRoles.list(projectId, {
          limit: parseInt(options.limit),
          offset: parseInt(options.offset),
        });
        spinner.stop();

        let roles = response.content;

        if (options.name) {
          const search = options.name.toLowerCase();
          roles = roles.filter(r => r.name.toLowerCase().includes(search));
        }

        if (options.json) {
          console.log(JSON.stringify({ ...response, content: roles }));
          return;
        }

        if (roles.length === 0) {
          console.log(chalk.yellow('No roles found.'));
          return;
        }

        console.log(chalk.bold(`\nFound ${roles.length} role(s):\n`));

        roles.forEach((role, index) => {
          const desc = role.description ? chalk.dim(` - ${role.description}`) : '';
          console.log(`  ${chalk.dim(`${index + 1}.`)} ${chalk.white(role.name)}${desc} ${chalk.dim(`(${formatId(role.id)})`)}`);
        });

        console.log(chalk.dim(`\nShowing ${roles.length} of ${response.paging.count} total`));
      } catch (error) {
        spinner.fail('Failed to load roles');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- get ----
  cmd.command('get')
    .description('Get role details by ID')
    .argument('<roleId>', 'Role ID')
    .option('--project <id>', 'Project ID')
    .option('--json', 'Output as JSON')
    .action(async (roleId: string, options: { project?: string; json?: boolean }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const projectId = await resolveProjectId(options.project);

      const spinner = ora('Loading role...').start();

      try {
        const role = await api.projectRoles.get(projectId, roleId);
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(role));
          return;
        }

        console.log(chalk.bold(`\nRole: ${role.name}\n`));
        console.log(`  ${chalk.dim('ID:')}          ${role.id}`);
        console.log(`  ${chalk.dim('Name:')}        ${role.name}`);
        if (role.description) {
          console.log(`  ${chalk.dim('Description:')} ${role.description}`);
        }

        // Permissions summary
        const perms = role.permissions;
        console.log(chalk.bold('\n  Permissions summary:'));
        console.log(`    ${chalk.dim('Project:')} editTitle=${perms.editTitle}, delete=${perms.delete}, addBoard=${perms.addBoard}`);
        console.log(`    ${chalk.dim('Boards:')}  editTitle=${perms.boards.editTitle}, delete=${perms.boards.delete}, move=${perms.boards.move}, settings=${perms.boards.settings}`);
        console.log(`    ${chalk.dim('Columns:')} editTitle=${perms.boards.columns.editTitle}, delete=${perms.boards.columns.delete}, addTask=${perms.boards.columns.addTask}`);
        console.log(`    ${chalk.dim('Tasks:')}   show=${perms.boards.columns.allTasks.show}, editTitle=${perms.boards.columns.allTasks.editTitle}, delete=${perms.boards.columns.allTasks.delete}, complete=${perms.boards.columns.allTasks.complete}`);
      } catch (error) {
        spinner.fail('Failed to load role');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- create ----
  cmd.command('create')
    .description('Create a new project role')
    .option('--project <id>', 'Project ID')
    .option('--name <name>', 'Role name')
    .action(async (options: { project?: string; name?: string }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const projectId = await resolveProjectId(options.project);

      let name = options.name;

      if (!name) {
        const { inputName } = await inquirer.prompt([{
          type: 'input',
          name: 'inputName',
          message: 'Role name:',
          validate: (input: string) => input.trim().length > 0 || 'Name is required',
        }]);
        name = inputName;
      }

      const { description } = await inquirer.prompt([{
        type: 'input',
        name: 'description',
        message: 'Role description (optional):',
      }]);

      const { preset } = await inquirer.prompt([{
        type: 'list',
        name: 'preset',
        message: 'Permissions preset:',
        choices: [
          { name: 'Admin - Full access', value: 'admin' },
          { name: 'Worker - Can edit tasks and content', value: 'worker' },
          { name: 'Observer - Read-only access', value: 'observer' },
          { name: 'Custom - Default permissions (edit later)', value: 'custom' },
        ],
      }]);

      let permissions: ProjectPermissions;
      switch (preset) {
        case 'admin':
          permissions = getAdminPermissions();
          break;
        case 'worker':
          permissions = getWorkerPermissions();
          break;
        case 'observer':
          permissions = getObserverPermissions();
          break;
        default:
          permissions = getDefaultPermissions();
          break;
      }

      const spinner = ora('Creating role...').start();

      try {
        const data: { name: string; description?: string; permissions: ProjectPermissions } = {
          name: name!,
          permissions,
        };
        if (description) {
          data.description = description;
        }

        const result = await api.projectRoles.create(projectId, data);
        spinner.succeed(chalk.green('Role created successfully!'));
        console.log(chalk.dim(`  ID: ${result.id}`));
        console.log(chalk.white(`  Name: ${name}`));
        console.log(chalk.dim(`  Preset: ${preset}`));
      } catch (error) {
        spinner.fail('Failed to create role');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- update ----
  cmd.command('update')
    .description('Update a project role')
    .argument('<roleId>', 'Role ID')
    .option('--project <id>', 'Project ID')
    .option('--name <name>', 'New role name')
    .action(async (roleId: string, options: { project?: string; name?: string }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const projectId = await resolveProjectId(options.project);

      let name = options.name;

      if (!name) {
        const fetchSpinner = ora('Loading role...').start();
        try {
          const current = await api.projectRoles.get(projectId, roleId);
          fetchSpinner.stop();

          const { inputName } = await inquirer.prompt([{
            type: 'input',
            name: 'inputName',
            message: 'New name:',
            default: current.name,
            validate: (input: string) => input.trim().length > 0 || 'Name is required',
          }]);
          name = inputName;
        } catch (error) {
          fetchSpinner.fail('Failed to load role');
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
          process.exit(1);
        }
      }

      const spinner = ora('Updating role...').start();

      try {
        await api.projectRoles.update(projectId, roleId, { name: name! });
        spinner.succeed(chalk.green('Role updated successfully!'));
        console.log(chalk.dim(`  ID: ${roleId}`));
        console.log(chalk.white(`  Name: ${name}`));
      } catch (error) {
        spinner.fail('Failed to update role');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- delete ----
  cmd.command('delete')
    .description('Delete a project role')
    .argument('<roleId>', 'Role ID')
    .option('--project <id>', 'Project ID')
    .action(async (roleId: string, options: { project?: string }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const projectId = await resolveProjectId(options.project);

      const confirmed = await confirmAction(`Delete role "${roleId}"?`);
      if (!confirmed) {
        console.log(chalk.dim('Cancelled.'));
        return;
      }

      const spinner = ora('Deleting role...').start();

      try {
        await api.projectRoles.remove(projectId, roleId);
        spinner.succeed(chalk.green('Role deleted successfully.'));
      } catch (error) {
        spinner.fail('Failed to delete role');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return cmd;
}
