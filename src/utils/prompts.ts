import inquirer from 'inquirer';
import ora from 'ora';
import { api, type Project, type Board, type Column, type User } from '../api/client.js';

export async function selectProject(): Promise<Project> {
  const spinner = ora('Loading projects...').start();
  let projects: Project[];
  try {
    projects = await api.getProjects();
    spinner.stop();
  } catch (error) {
    spinner.fail('Failed to load projects');
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

  return selectedProject;
}

export async function selectBoard(projectId: string): Promise<Board> {
  const spinner = ora('Loading boards...').start();
  let boards: Board[];
  try {
    boards = await api.getBoards(projectId);
    spinner.stop();
  } catch (error) {
    spinner.fail('Failed to load boards');
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

  return selectedBoard;
}

export async function selectColumn(boardId: string): Promise<Column> {
  const spinner = ora('Loading columns...').start();
  let columns: Column[];
  try {
    columns = await api.getColumns(boardId);
    spinner.stop();
  } catch (error) {
    spinner.fail('Failed to load columns');
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

  return selectedColumn;
}

export async function selectUser(): Promise<User> {
  const spinner = ora('Loading users...').start();
  let users: User[];
  try {
    users = await api.getUsers();
    spinner.stop();
  } catch (error) {
    spinner.fail('Failed to load users');
    throw error;
  }

  if (users.length === 0) {
    throw new Error('No users found');
  }

  const { selectedUser } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedUser',
    message: 'Select user:',
    choices: users.map((u, i) => ({
      name: `${i + 1}) ${u.realName || u.email} <${u.email}>`,
      value: u,
      short: u.realName || u.email,
    })),
    pageSize: 10,
  }]);

  return selectedUser;
}

export async function confirmAction(message: string, defaultValue = false): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirmed',
    message,
    default: defaultValue,
  }]);

  return confirmed;
}
