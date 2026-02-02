import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, hasConfig } from '../utils/config.js';
import { api, Project, Board, Column, User, TaskCreateData } from '../api/client.js';

interface CreateOptions {
  title?: string;
  description?: string;
  quick?: boolean;
}

export async function createCommand(options: CreateOptions): Promise<void> {
  if (!hasConfig()) {
    console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
    process.exit(1);
  }

  const config = loadConfig()!;

  console.log(chalk.bold.cyan('\n📝 Create New Task\n'));

  let columnId: string;
  let columnName: string;

  // Quick mode - use defaults
  if (options.quick && config.defaultColumnId) {
    columnId = config.defaultColumnId;
    columnName = config.defaultColumnName || 'default';
    console.log(chalk.dim(`Using default: ${config.defaultProjectName} → ${config.defaultBoardName} → ${columnName}`));
  } else {
    // Interactive selection
    const selection = await selectColumn(config);
    columnId = selection.columnId;
    columnName = selection.columnName;
  }

  // Get task details
  const taskData = await getTaskDetails(options, columnId);

  // Create task
  const spinner = ora('Creating task...').start();
  try {
    const result = await api.createTask(taskData);
    spinner.succeed(chalk.green(`Task created successfully!`));
    console.log(chalk.dim(`  ID: ${result.id}`));
    console.log(chalk.dim(`  Column: ${columnName}`));
    console.log(chalk.white(`  Title: ${taskData.title}`));
    if (taskData.description) {
      console.log(chalk.dim(`  Description: ${taskData.description.substring(0, 50)}${taskData.description.length > 50 ? '...' : ''}`));
    }
    if (taskData.deadline?.deadline) {
      console.log(chalk.dim(`  Deadline: ${new Date(taskData.deadline.deadline).toLocaleDateString()}`));
    }
  } catch (error) {
    spinner.fail('Failed to create task');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

async function selectColumn(config: ReturnType<typeof loadConfig>): Promise<{ columnId: string; columnName: string }> {
  // Show current defaults if any
  if (config?.defaultColumnId) {
    console.log(chalk.dim(`Default: ${config.defaultProjectName} → ${config.defaultBoardName} → ${config.defaultColumnName}\n`));

    const { useDefault } = await inquirer.prompt([{
      type: 'confirm',
      name: 'useDefault',
      message: 'Use default location?',
      default: true,
    }]);

    if (useDefault) {
      return {
        columnId: config.defaultColumnId,
        columnName: config.defaultColumnName || 'default',
      };
    }
  }

  // Select project
  const projectSpinner = ora('Loading projects...').start();
  let projects: Project[];
  try {
    projects = await api.getProjects();
    projectSpinner.stop();
  } catch (error) {
    projectSpinner.fail('Failed to load projects');
    throw error;
  }

  if (projects.length === 0) {
    throw new Error('No projects found');
  }

  const { selectedProject } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedProject',
    message: 'Select project:',
    choices: projects.map((p, i) => ({
      name: `${i + 1}) ${p.title}`,
      value: p,
      short: p.title,
    })),
    pageSize: 10,
  }]);

  // Select board
  const boardSpinner = ora('Loading boards...').start();
  let boards: Board[];
  try {
    boards = await api.getBoards(selectedProject.id);
    boardSpinner.stop();
  } catch (error) {
    boardSpinner.fail('Failed to load boards');
    throw error;
  }

  if (boards.length === 0) {
    throw new Error('No boards found in this project');
  }

  const { selectedBoard } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedBoard',
    message: 'Select board:',
    choices: boards.map((b, i) => ({
      name: `${i + 1}) ${b.title}`,
      value: b,
      short: b.title,
    })),
    pageSize: 10,
  }]);

  // Select column
  const colSpinner = ora('Loading columns...').start();
  let columns: Column[];
  try {
    columns = await api.getColumns(selectedBoard.id);
    colSpinner.stop();
  } catch (error) {
    colSpinner.fail('Failed to load columns');
    throw error;
  }

  if (columns.length === 0) {
    throw new Error('No columns found in this board');
  }

  const { selectedColumn } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedColumn',
    message: 'Select column:',
    choices: columns.map((c, i) => ({
      name: `${i + 1}) ${c.title}`,
      value: c,
      short: c.title,
    })),
    pageSize: 10,
  }]);

  return {
    columnId: selectedColumn.id,
    columnName: selectedColumn.title,
  };
}

async function getTaskDetails(options: CreateOptions, columnId: string): Promise<TaskCreateData> {
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
  if (description === undefined) {
    const { inputDescription } = await inquirer.prompt([{
      type: 'input',
      name: 'inputDescription',
      message: 'Description (optional, press Enter to skip):',
    }]);
    description = inputDescription || undefined;
  }

  // Deadline
  const { hasDeadline } = await inquirer.prompt([{
    type: 'confirm',
    name: 'hasDeadline',
    message: 'Set deadline?',
    default: false,
  }]);

  let deadline: TaskCreateData['deadline'];
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
      deadline = {
        deadline: parsedDate.getTime(),
        withTime: false,
      };
    }
  }

  // Assignee
  const { assignAssignee } = await inquirer.prompt([{
    type: 'confirm',
    name: 'assignAssignee',
    message: 'Assign to someone?',
    default: false,
  }]);

  let assigned: string[] | undefined;
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
            name: `${i + 1}) ${u.realName || u.email} ${u.email ? `<${u.email}>` : ''}`,
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

  const taskData: TaskCreateData = {
    title: title!,
    columnId,
  };

  if (description) taskData.description = description;
  if (deadline) taskData.deadline = deadline;
  if (assigned) taskData.assigned = assigned;

  return taskData;
}

function parseDate(input: string): Date | null {
  // Try YYYY-MM-DD
  let match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    if (!isNaN(date.getTime())) return date;
  }

  // Try DD.MM.YYYY
  match = input.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) {
    const date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
    if (!isNaN(date.getTime())) return date;
  }

  // Try DD/MM/YYYY
  match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}
