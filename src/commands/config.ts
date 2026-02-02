import chalk from 'chalk';
import inquirer from 'inquirer';
import { loadConfig, saveConfig, getConfigPath, hasConfig } from '../utils/config.js';
import { initCommand } from './init.js';

export async function configCommand(): Promise<void> {
  if (!hasConfig()) {
    console.log(chalk.yellow('No configuration found.'));
    const { runInit } = await inquirer.prompt([{
      type: 'confirm',
      name: 'runInit',
      message: 'Run setup now?',
      default: true,
    }]);

    if (runInit) {
      await initCommand();
    }
    return;
  }

  const config = loadConfig()!;

  console.log(chalk.bold.cyan('\n⚙️  Yougile CLI Configuration\n'));
  console.log(chalk.dim(`Config file: ${getConfigPath()}\n`));

  console.log(chalk.white('API Settings:'));
  console.log(`  Host: ${chalk.cyan(config.apiHost)}`);
  console.log(`  Key:  ${chalk.cyan(config.apiKey.substring(0, 8) + '...')}`);

  console.log(chalk.white('\nDefaults:'));
  if (config.defaultProjectId) {
    console.log(`  Project: ${chalk.cyan(config.defaultProjectName || config.defaultProjectId)}`);
  } else {
    console.log(chalk.dim('  Project: not set'));
  }

  if (config.defaultBoardId) {
    console.log(`  Board:   ${chalk.cyan(config.defaultBoardName || config.defaultBoardId)}`);
  } else {
    console.log(chalk.dim('  Board:   not set'));
  }

  if (config.defaultColumnId) {
    console.log(`  Column:  ${chalk.cyan(config.defaultColumnName || config.defaultColumnId)}`);
  } else {
    console.log(chalk.dim('  Column:  not set'));
  }

  console.log('');

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { name: 'Nothing, exit', value: 'exit' },
      { name: 'Reconfigure (run init)', value: 'init' },
      { name: 'Clear defaults only', value: 'clearDefaults' },
      { name: 'Show full API key', value: 'showKey' },
    ],
  }]);

  switch (action) {
    case 'init':
      await initCommand();
      break;
    case 'clearDefaults':
      delete config.defaultProjectId;
      delete config.defaultProjectName;
      delete config.defaultBoardId;
      delete config.defaultBoardName;
      delete config.defaultColumnId;
      delete config.defaultColumnName;
      saveConfig(config);
      console.log(chalk.green('Defaults cleared.'));
      break;
    case 'showKey':
      console.log(chalk.yellow(`\nAPI Key: ${config.apiKey}\n`));
      break;
    case 'exit':
    default:
      break;
  }
}
