import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { loadConfig, hasConfig } from '../utils/config.js';
import { api, Task, Project, Board, Column } from '../api/client.js';

interface ListOptions {
  all?: boolean;
  project?: string;
}

export async function listCommand(options: ListOptions): Promise<void> {
  if (!hasConfig()) {
    console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
    process.exit(1);
  }

  const config = loadConfig()!;

  console.log(chalk.bold.cyan('\n📋 Tasks\n'));

  let columnId: string | undefined;
  let columnName: string | undefined;

  if (options.all) {
    // List all tasks (project-wide)
    columnId = undefined;
  } else if (config.defaultColumnId && !options.project) {
    // Use default column
    columnId = config.defaultColumnId;
    columnName = config.defaultColumnName;
    console.log(chalk.dim(`Column: ${config.defaultProjectName} → ${config.defaultBoardName} → ${columnName}\n`));
  } else {
    // Interactive selection
    const selection = await selectColumnForList();
    columnId = selection.columnId;
    columnName = selection.columnName;
  }

  const spinner = ora('Loading tasks...').start();

  try {
    const tasks = await api.getTasks(columnId);
    spinner.stop();

    if (tasks.length === 0) {
      console.log(chalk.yellow('No tasks found.'));
      return;
    }

    console.log(chalk.bold(`Found ${tasks.length} task(s):\n`));

    tasks.forEach((task, index) => {
      const status = task.completed ? chalk.green('✓') : chalk.dim('○');
      const title = task.completed ? chalk.dim.strikethrough(task.title) : chalk.white(task.title);

      console.log(`${status} ${chalk.dim(`${index + 1}.`)} ${title}`);

      if (task.description) {
        const desc = task.description.substring(0, 60);
        console.log(chalk.dim(`   ${desc}${task.description.length > 60 ? '...' : ''}`));
      }

      if (task.deadline?.deadline) {
        const deadlineDate = new Date(task.deadline.deadline);
        const isOverdue = deadlineDate < new Date() && !task.completed;
        const dateStr = deadlineDate.toLocaleDateString();
        console.log(isOverdue ? chalk.red(`   ⏰ ${dateStr}`) : chalk.dim(`   📅 ${dateStr}`));
      }
    });

  } catch (error) {
    spinner.fail('Failed to load tasks');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

async function selectColumnForList(): Promise<{ columnId: string; columnName: string }> {
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

  const { selectedProject } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedProject',
    message: 'Select project:',
    choices: projects.map((p, i) => ({
      name: `${i + 1}) ${p.title}`,
      value: p,
    })),
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

  const { selectedBoard } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedBoard',
    message: 'Select board:',
    choices: boards.map((b, i) => ({
      name: `${i + 1}) ${b.title}`,
      value: b,
    })),
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

  const { selectedColumn } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedColumn',
    message: 'Select column:',
    choices: columns.map((c, i) => ({
      name: `${i + 1}) ${c.title}`,
      value: c,
    })),
  }]);

  return {
    columnId: selectedColumn.id,
    columnName: selectedColumn.title,
  };
}
