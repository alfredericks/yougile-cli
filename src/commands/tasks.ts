import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { hasConfig, loadConfig } from '../utils/config.js';
import { api } from '../api/client.js';
import { formatId, formatTimestamp, formatBoolean } from '../utils/formatters.js';
import { selectProject, selectBoard, selectColumn, selectUser } from '../utils/prompts.js';
import { parseDate } from '../utils/date.js';
import type { Task, TaskColor, TaskCreateData, TaskUpdateData } from '../types/task.js';

const TASK_COLORS: { name: string; value: TaskColor }[] = [
  { name: 'Primary (default)', value: 'task-primary' },
  { name: 'Gray', value: 'task-gray' },
  { name: 'Red', value: 'task-red' },
  { name: 'Pink', value: 'task-pink' },
  { name: 'Yellow', value: 'task-yellow' },
  { name: 'Green', value: 'task-green' },
  { name: 'Turquoise', value: 'task-turquoise' },
  { name: 'Blue', value: 'task-blue' },
  { name: 'Violet', value: 'task-violet' },
];

export function createTasksCommand(): Command {
  const cmd = new Command('tasks')
    .description('Manage tasks');

  // ---- list ----
  cmd.command('list')
    .description('List tasks in a column')
    .option('--column <id>', 'Column ID')
    .option('--title <search>', 'Filter by title')
    .option('--assigned <userId>', 'Filter by assigned user')
    .option('--sticker <stickerId>', 'Filter by sticker')
    .option('--sticker-state <stateId>', 'Filter by sticker state')
    .option('--include-deleted', 'Include deleted tasks')
    .option('--limit <n>', 'Limit results', '50')
    .option('--offset <n>', 'Offset', '0')
    .option('--json', 'Output as JSON')
    .action(async (options: {
      column?: string;
      title?: string;
      assigned?: string;
      sticker?: string;
      stickerState?: string;
      includeDeleted?: boolean;
      limit: string;
      offset: string;
      json?: boolean;
    }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      let columnId = options.column;

      if (!columnId) {
        const config = loadConfig()!;
        if (config.defaultColumnId) {
          columnId = config.defaultColumnId;
          if (!options.json) {
            console.log(chalk.dim(`\nColumn: ${config.defaultProjectName} -> ${config.defaultBoardName} -> ${config.defaultColumnName}\n`));
          }
        } else {
          const project = await selectProject();
          const board = await selectBoard(project.id);
          const column = await selectColumn(board.id);
          columnId = column.id;
        }
      }

      const spinner = ora('Loading tasks...').start();

      try {
        const response = await api.tasks.list({
          columnId,
          title: options.title,
          assignedTo: options.assigned,
          stickerId: options.sticker,
          stickerStateId: options.stickerState,
          includeDeleted: options.includeDeleted,
          limit: parseInt(options.limit),
          offset: parseInt(options.offset),
        });
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(response));
          return;
        }

        const tasks = response.content;

        if (tasks.length === 0) {
          console.log(chalk.yellow('No tasks found.'));
          return;
        }

        console.log(chalk.bold(`Found ${tasks.length} task(s):\n`));

        tasks.forEach((task, index) => {
          const status = task.completed ? chalk.green('\u2713') : chalk.dim('\u25CB');
          const title = task.completed
            ? chalk.dim.strikethrough(task.title)
            : chalk.white(task.title);

          console.log(`  ${status} ${chalk.dim(`${index + 1}.`)} ${title}`);

          if (task.description) {
            const desc = task.description.substring(0, 60);
            console.log(chalk.dim(`     ${desc}${task.description.length > 60 ? '...' : ''}`));
          }

          if (task.deadline?.deadline) {
            const deadlineDate = new Date(task.deadline.deadline);
            const isOverdue = deadlineDate < new Date() && !task.completed;
            const dateStr = deadlineDate.toLocaleDateString();
            console.log(isOverdue ? chalk.red(`     Deadline: ${dateStr}`) : chalk.dim(`     Deadline: ${dateStr}`));
          }
        });

        console.log(chalk.dim(`\nShowing ${tasks.length} of ${response.paging.count} total`));
      } catch (error) {
        spinner.fail('Failed to load tasks');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- get ----
  cmd.command('get')
    .description('Get task details by ID')
    .argument('<id>', 'Task ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options: { json?: boolean }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const spinner = ora('Loading task...').start();

      try {
        const task = await api.tasks.get(id);
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(task));
          return;
        }

        console.log(chalk.bold(`\nTask: ${task.title}\n`));
        console.log(`  ${chalk.dim('ID:')}             ${task.id}`);
        console.log(`  ${chalk.dim('Title:')}          ${task.title}`);
        console.log(`  ${chalk.dim('Column ID:')}      ${task.columnId ?? chalk.dim('n/a')}`);
        console.log(`  ${chalk.dim('Completed:')}      ${formatBoolean(task.completed)}`);
        console.log(`  ${chalk.dim('Archived:')}       ${formatBoolean(task.archived)}`);
        console.log(`  ${chalk.dim('Created:')}        ${formatTimestamp(task.timestamp)}`);

        if (task.description) {
          console.log(`  ${chalk.dim('Description:')}    ${task.description}`);
        }

        if (task.color) {
          console.log(`  ${chalk.dim('Color:')}          ${task.color}`);
        }

        if (task.createdBy) {
          console.log(`  ${chalk.dim('Created by:')}     ${task.createdBy}`);
        }

        if (task.idTaskCommon) {
          console.log(`  ${chalk.dim('Common ID:')}      ${task.idTaskCommon}`);
        }

        if (task.idTaskProject) {
          console.log(`  ${chalk.dim('Project ID:')}     ${task.idTaskProject}`);
        }

        if (task.assigned && task.assigned.length > 0) {
          console.log(`  ${chalk.dim('Assigned:')}`);
          task.assigned.forEach((userId) => {
            console.log(`    ${chalk.dim('-')} ${userId}`);
          });
        }

        if (task.deadline?.deadline) {
          const deadlineDate = new Date(task.deadline.deadline);
          const isOverdue = deadlineDate < new Date() && !task.completed;
          const dateStr = deadlineDate.toLocaleDateString();
          console.log(`  ${chalk.dim('Deadline:')}       ${isOverdue ? chalk.red(dateStr) : dateStr}`);
          if (task.deadline.startDate) {
            console.log(`  ${chalk.dim('Start date:')}     ${new Date(task.deadline.startDate).toLocaleDateString()}`);
          }
        }

        if (task.timeTracking) {
          console.log(`  ${chalk.dim('Time tracking:')}`);
          console.log(`    ${chalk.dim('Plan:')} ${task.timeTracking.plan}h`);
          console.log(`    ${chalk.dim('Work:')} ${task.timeTracking.work}h`);
        }

        if (task.checklists && task.checklists.length > 0) {
          console.log(`  ${chalk.dim('Checklists:')}`);
          task.checklists.forEach((checklist) => {
            console.log(`    ${chalk.white(checklist.title)}`);
            checklist.items.forEach((item) => {
              const check = item.isCompleted ? chalk.green('\u2713') : chalk.dim('\u25CB');
              console.log(`      ${check} ${item.title}`);
            });
          });
        }

        if (task.stickers && Object.keys(task.stickers).length > 0) {
          console.log(`  ${chalk.dim('Stickers:')}`);
          for (const [stickerId, stateId] of Object.entries(task.stickers)) {
            console.log(`    ${chalk.dim('-')} ${stickerId}: ${stateId}`);
          }
        }

        if (task.subtasks && task.subtasks.length > 0) {
          console.log(`  ${chalk.dim('Subtasks:')}`);
          task.subtasks.forEach((subtaskId) => {
            console.log(`    ${chalk.dim('-')} ${subtaskId}`);
          });
        }

        if (task.completedTimestamp) {
          console.log(`  ${chalk.dim('Completed at:')}   ${formatTimestamp(task.completedTimestamp)}`);
        }
        if (task.archivedTimestamp) {
          console.log(`  ${chalk.dim('Archived at:')}    ${formatTimestamp(task.archivedTimestamp)}`);
        }
        if (task.deleted) {
          console.log(`  ${chalk.dim('Deleted:')}        ${formatBoolean(task.deleted)}`);
        }
      } catch (error) {
        spinner.fail('Failed to load task');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- create ----
  cmd.command('create')
    .description('Create a new task')
    .option('-t, --title <title>', 'Task title')
    .option('-d, --description <desc>', 'Task description')
    .option('--column <id>', 'Column ID')
    .option('--color <color>', 'Task color')
    .option('-q, --quick', 'Quick mode - use defaults')
    .action(async (options: {
      title?: string;
      description?: string;
      column?: string;
      color?: string;
      quick?: boolean;
    }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const config = loadConfig()!;

      console.log(chalk.bold.cyan('\nCreate New Task\n'));

      // Resolve column
      let columnId = options.column;
      if (!columnId) {
        if (options.quick && config.defaultColumnId) {
          columnId = config.defaultColumnId;
          console.log(chalk.dim(`Using default: ${config.defaultProjectName} -> ${config.defaultBoardName} -> ${config.defaultColumnName}`));
        } else if (config.defaultColumnId) {
          const { useDefault } = await inquirer.prompt([{
            type: 'confirm',
            name: 'useDefault',
            message: `Use default column (${config.defaultColumnName})?`,
            default: true,
          }]);
          if (useDefault) {
            columnId = config.defaultColumnId;
          } else {
            const project = await selectProject();
            const board = await selectBoard(project.id);
            const column = await selectColumn(board.id);
            columnId = column.id;
          }
        } else {
          const project = await selectProject();
          const board = await selectBoard(project.id);
          const column = await selectColumn(board.id);
          columnId = column.id;
        }
      }

      // Title
      let title = options.title;
      if (!title) {
        const { inputTitle } = await inquirer.prompt([{
          type: 'input',
          name: 'inputTitle',
          message: 'Task title:',
          validate: (input: string) => input.trim().length > 0 || 'Title is required',
        }]);
        title = inputTitle;
      }

      // Description
      let description = options.description;
      if (description === undefined && !options.quick) {
        const { inputDescription } = await inquirer.prompt([{
          type: 'input',
          name: 'inputDescription',
          message: 'Description (optional, press Enter to skip):',
        }]);
        description = inputDescription || undefined;
      }

      // Deadline
      let deadline: TaskCreateData['deadline'];
      if (!options.quick) {
        const { hasDeadline } = await inquirer.prompt([{
          type: 'confirm',
          name: 'hasDeadline',
          message: 'Set deadline?',
          default: false,
        }]);

        if (hasDeadline) {
          const { deadlineDate } = await inquirer.prompt([{
            type: 'input',
            name: 'deadlineDate',
            message: 'Deadline (YYYY-MM-DD or DD.MM.YYYY):',
            validate: (input: string) => {
              const parsed = parseDate(input);
              return parsed !== null || 'Invalid date format. Use YYYY-MM-DD or DD.MM.YYYY';
            },
          }]);

          const parsedDate = parseDate(deadlineDate);
          if (parsedDate) {
            deadline = { deadline: parsedDate.getTime(), withTime: false };
          }
        }
      }

      // Assignee
      let assigned: string[] | undefined;
      if (!options.quick) {
        const { assignAssignee } = await inquirer.prompt([{
          type: 'confirm',
          name: 'assignAssignee',
          message: 'Assign to someone?',
          default: false,
        }]);

        if (assignAssignee) {
          const userSpinner = ora('Loading users...').start();
          try {
            const users = await api.getUsers();
            userSpinner.stop();

            if (users.length > 0) {
              const { selectedUsers } = await inquirer.prompt([{
                type: 'checkbox',
                name: 'selectedUsers',
                message: 'Select assignees:',
                choices: users.map((u, i) => ({
                  name: `${i + 1}) ${u.realName || u.email} <${u.email}>`,
                  value: u.id,
                  short: u.realName || u.email,
                })),
                pageSize: 10,
              }]);

              if (selectedUsers.length > 0) {
                assigned = selectedUsers;
              }
            } else {
              console.log(chalk.yellow('No users found.'));
            }
          } catch {
            userSpinner.fail('Failed to load users');
          }
        }
      }

      // Color
      let color: TaskColor | undefined = options.color as TaskColor | undefined;
      if (!color && !options.quick) {
        const { setColor } = await inquirer.prompt([{
          type: 'confirm',
          name: 'setColor',
          message: 'Set color?',
          default: false,
        }]);

        if (setColor) {
          const { selectedColor } = await inquirer.prompt([{
            type: 'list',
            name: 'selectedColor',
            message: 'Select color:',
            choices: TASK_COLORS,
            pageSize: 10,
          }]);
          color = selectedColor;
        }
      }

      // Build task data
      const taskData: TaskCreateData = {
        title: title!,
        columnId,
      };

      if (description) taskData.description = description;
      if (deadline) taskData.deadline = deadline;
      if (assigned) taskData.assigned = assigned;
      if (color) taskData.color = color;

      // Create
      const spinner = ora('Creating task...').start();
      try {
        const result = await api.tasks.create(taskData);
        spinner.succeed(chalk.green('Task created successfully!'));
        console.log(chalk.dim(`  ID: ${result.id}`));
        console.log(chalk.white(`  Title: ${taskData.title}`));
        if (taskData.description) {
          console.log(chalk.dim(`  Description: ${taskData.description.substring(0, 50)}${taskData.description.length > 50 ? '...' : ''}`));
        }
        if (taskData.deadline?.deadline) {
          console.log(chalk.dim(`  Deadline: ${new Date(taskData.deadline.deadline).toLocaleDateString()}`));
        }
        if (taskData.color) {
          console.log(chalk.dim(`  Color: ${taskData.color}`));
        }
      } catch (error) {
        spinner.fail('Failed to create task');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- update ----
  cmd.command('update')
    .description('Update a task')
    .argument('<id>', 'Task ID')
    .option('--title <title>', 'New title')
    .option('--description <desc>', 'New description')
    .option('--column <id>', 'Move to column ID')
    .option('--completed', 'Mark as completed')
    .option('--archived', 'Mark as archived')
    .option('--color <color>', 'Set color')
    .action(async (id: string, options: {
      title?: string;
      description?: string;
      column?: string;
      completed?: boolean;
      archived?: boolean;
      color?: string;
    }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const hasDirectOptions = options.title !== undefined
        || options.description !== undefined
        || options.column !== undefined
        || options.completed !== undefined
        || options.archived !== undefined
        || options.color !== undefined;

      const updateData: TaskUpdateData = {};

      if (hasDirectOptions) {
        // Use provided flags directly
        if (options.title !== undefined) updateData.title = options.title;
        if (options.description !== undefined) updateData.description = options.description;
        if (options.column !== undefined) updateData.columnId = options.column;
        if (options.completed !== undefined) updateData.completed = options.completed;
        if (options.archived !== undefined) updateData.archived = options.archived;
        if (options.color !== undefined) updateData.color = options.color as TaskColor;
      } else {
        // Interactive mode - fetch current task first
        const fetchSpinner = ora('Loading task...').start();
        let task: Task;
        try {
          task = await api.tasks.get(id);
          fetchSpinner.stop();
        } catch (error) {
          fetchSpinner.fail('Failed to load task');
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
          process.exit(1);
        }

        console.log(chalk.bold(`\nCurrent task: ${task.title}\n`));
        console.log(chalk.dim(`  Completed: ${task.completed ? 'yes' : 'no'}`));
        console.log(chalk.dim(`  Archived: ${task.archived ? 'yes' : 'no'}`));
        if (task.color) console.log(chalk.dim(`  Color: ${task.color}`));
        console.log('');

        const { fields } = await inquirer.prompt([{
          type: 'checkbox',
          name: 'fields',
          message: 'What do you want to update?',
          choices: [
            { name: 'Title', value: 'title' },
            { name: 'Description', value: 'description' },
            { name: 'Column (move)', value: 'column' },
            { name: 'Completed status', value: 'completed' },
            { name: 'Archived status', value: 'archived' },
            { name: 'Color', value: 'color' },
          ],
        }]);

        if ((fields as string[]).includes('title')) {
          const { newTitle } = await inquirer.prompt([{
            type: 'input',
            name: 'newTitle',
            message: 'New title:',
            default: task.title,
            validate: (input: string) => input.trim().length > 0 || 'Title is required',
          }]);
          updateData.title = newTitle;
        }

        if ((fields as string[]).includes('description')) {
          const { newDesc } = await inquirer.prompt([{
            type: 'input',
            name: 'newDesc',
            message: 'New description:',
            default: task.description || '',
          }]);
          updateData.description = newDesc;
        }

        if ((fields as string[]).includes('column')) {
          const project = await selectProject();
          const board = await selectBoard(project.id);
          const column = await selectColumn(board.id);
          updateData.columnId = column.id;
        }

        if ((fields as string[]).includes('completed')) {
          const { newCompleted } = await inquirer.prompt([{
            type: 'confirm',
            name: 'newCompleted',
            message: 'Mark as completed?',
            default: task.completed ?? false,
          }]);
          updateData.completed = newCompleted;
        }

        if ((fields as string[]).includes('archived')) {
          const { newArchived } = await inquirer.prompt([{
            type: 'confirm',
            name: 'newArchived',
            message: 'Mark as archived?',
            default: task.archived ?? false,
          }]);
          updateData.archived = newArchived;
        }

        if ((fields as string[]).includes('color')) {
          const { selectedColor } = await inquirer.prompt([{
            type: 'list',
            name: 'selectedColor',
            message: 'Select color:',
            choices: TASK_COLORS,
            pageSize: 10,
          }]);
          updateData.color = selectedColor;
        }

        if (Object.keys(updateData).length === 0) {
          console.log(chalk.yellow('No changes selected.'));
          return;
        }
      }

      const spinner = ora('Updating task...').start();
      try {
        await api.tasks.update(id, updateData);
        spinner.succeed(chalk.green('Task updated successfully!'));
        console.log(chalk.dim(`  ID: ${id}`));
        if (updateData.title) console.log(chalk.white(`  Title: ${updateData.title}`));
        if (updateData.columnId) console.log(chalk.dim(`  Moved to column: ${updateData.columnId}`));
        if (updateData.completed !== undefined) console.log(chalk.dim(`  Completed: ${updateData.completed}`));
        if (updateData.archived !== undefined) console.log(chalk.dim(`  Archived: ${updateData.archived}`));
        if (updateData.color) console.log(chalk.dim(`  Color: ${updateData.color}`));
      } catch (error) {
        spinner.fail('Failed to update task');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return cmd;
}
