import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, saveConfig, getConfigPath, YougileConfig } from '../utils/config.js';
import { api, Project, Board, Column, Company } from '../api/client.js';

export async function initCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n🚀 Yougile CLI Setup\n'));

  const existingConfig = loadConfig();

  if (existingConfig?.apiKey) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: 'Configuration already exists. Overwrite?',
      default: false,
    }]);

    if (!overwrite) {
      console.log(chalk.yellow('Setup cancelled.'));
      return;
    }
  }

  // Choose auth method
  const { authMethod } = await inquirer.prompt([{
    type: 'list',
    name: 'authMethod',
    message: 'How would you like to authenticate?',
    choices: [
      { name: '1) Login with email & password (creates new API key)', value: 'login' },
      { name: '2) Enter existing API key', value: 'apikey' },
    ],
  }]);

  let apiKey: string;
  const apiHost = 'https://yougile.com/api-v2/';

  if (authMethod === 'login') {
    // Login flow
    const { login, password } = await inquirer.prompt([
      {
        type: 'input',
        name: 'login',
        message: 'Email:',
        validate: (input: string) => input.includes('@') || 'Enter valid email',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
        validate: (input: string) => input.length > 0 || 'Password is required',
      },
    ]);

    // Get companies
    const companySpinner = ora('Getting your companies...').start();
    let companies: Company[];
    try {
      companies = await api.getCompanies({ login, password });
      companySpinner.stop();
    } catch (error) {
      companySpinner.fail('Authentication failed. Check your credentials.');
      if (error instanceof Error && error.message.includes('401')) {
        console.log(chalk.red('Invalid email or password.'));
      }
      return;
    }

    if (companies.length === 0) {
      console.log(chalk.red('No companies found for this account.'));
      return;
    }

    // Select company
    let selectedCompany: Company;
    if (companies.length === 1) {
      selectedCompany = companies[0];
      console.log(chalk.dim(`Company: ${selectedCompany.name}`));
    } else {
      const { company } = await inquirer.prompt([{
        type: 'list',
        name: 'company',
        message: 'Select company:',
        choices: companies.map((c, i) => ({
          name: `${i + 1}) ${c.name}${c.isAdmin ? ' (admin)' : ''}`,
          value: c,
        })),
      }]);
      selectedCompany = company;
    }

    // Create API key
    const keySpinner = ora('Creating API key...').start();
    try {
      apiKey = await api.createApiKey({ login, password }, selectedCompany.id);
      keySpinner.succeed('API key created!');
    } catch (error) {
      keySpinner.fail('Failed to create API key.');
      console.log(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      return;
    }
  } else {
    // Manual API key entry
    const { manualApiKey } = await inquirer.prompt([{
      type: 'password',
      name: 'manualApiKey',
      message: 'Enter your Yougile API key:',
      mask: '*',
      validate: (input: string) => input.length > 0 || 'API key is required',
    }]);
    apiKey = manualApiKey;
  }

  // Save config and test connection
  const config: YougileConfig = { apiKey, apiHost };
  saveConfig(config);
  api.resetClient();

  const spinner = ora('Testing connection...').start();

  try {
    const connected = await api.testConnection();
    if (!connected) {
      spinner.fail('Connection failed. Check your API key.');
      return;
    }
    spinner.succeed('Connected to Yougile!');
  } catch (error) {
    spinner.fail(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return;
  }

  // Setup default project
  const { setupDefaults } = await inquirer.prompt([{
    type: 'confirm',
    name: 'setupDefaults',
    message: 'Setup default project/board/column for quick task creation?',
    default: true,
  }]);

  if (setupDefaults) {
    await setupDefaultProject(config);
  }

  console.log(chalk.green(`\n✅ Configuration saved to ${getConfigPath()}`));
  console.log(chalk.cyan('\nYou can now use:'));
  console.log(chalk.white('  yougile create    - Create a new task'));
  console.log(chalk.white('  yougile list      - List tasks'));
  console.log(chalk.white('  yougile config    - View/edit configuration'));
}

async function setupDefaultProject(config: YougileConfig): Promise<void> {
  const spinner = ora('Loading projects...').start();

  let projects: Project[];
  try {
    projects = await api.getProjects();
    spinner.stop();
  } catch (error) {
    spinner.fail('Failed to load projects');
    return;
  }

  if (projects.length === 0) {
    console.log(chalk.yellow('No projects found.'));
    return;
  }

  const { selectedProject } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedProject',
    message: 'Select default project:',
    choices: projects.map((p, i) => ({
      name: `${i + 1}) ${p.title}`,
      value: p,
    })),
  }]);

  config.defaultProjectId = selectedProject.id;
  config.defaultProjectName = selectedProject.title;

  // Load boards
  const boardSpinner = ora('Loading boards...').start();
  let boards: Board[];
  try {
    boards = await api.getBoards(selectedProject.id);
    boardSpinner.stop();
  } catch {
    boardSpinner.fail('Failed to load boards');
    saveConfig(config);
    return;
  }

  if (boards.length === 0) {
    console.log(chalk.yellow('No boards found in this project.'));
    saveConfig(config);
    return;
  }

  const { selectedBoard } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedBoard',
    message: 'Select default board:',
    choices: boards.map((b, i) => ({
      name: `${i + 1}) ${b.title}`,
      value: b,
    })),
  }]);

  config.defaultBoardId = selectedBoard.id;
  config.defaultBoardName = selectedBoard.title;

  // Load columns
  const colSpinner = ora('Loading columns...').start();
  let columns: Column[];
  try {
    columns = await api.getColumns(selectedBoard.id);
    colSpinner.stop();
  } catch {
    colSpinner.fail('Failed to load columns');
    saveConfig(config);
    return;
  }

  if (columns.length === 0) {
    console.log(chalk.yellow('No columns found in this board.'));
    saveConfig(config);
    return;
  }

  const { selectedColumn } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedColumn',
    message: 'Select default column (where new tasks go):',
    choices: columns.map((c, i) => ({
      name: `${i + 1}) ${c.title}`,
      value: c,
    })),
  }]);

  config.defaultColumnId = selectedColumn.id;
  config.defaultColumnName = selectedColumn.title;

  saveConfig(config);
}
