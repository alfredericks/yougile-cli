#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { createCommand } from './commands/create.js';
import { listCommand } from './commands/list.js';
import { configCommand } from './commands/config.js';

const program = new Command();

program
  .name('yougile')
  .description('Interactive CLI client for Yougile task management')
  .version('1.0.0');

program
  .command('init')
  .description('Configure Yougile CLI with your API key and defaults')
  .action(initCommand);

program
  .command('create')
  .alias('c')
  .description('Create a new task interactively')
  .option('-t, --title <title>', 'Task title (skip prompt)')
  .option('-d, --description <desc>', 'Task description (skip prompt)')
  .option('-q, --quick', 'Quick mode - use all defaults, only ask for title')
  .action(createCommand);

program
  .command('list')
  .alias('ls')
  .description('List tasks')
  .option('-a, --all', 'List all tasks in project')
  .option('-p, --project <id>', 'Project ID')
  .action(listCommand);

program
  .command('config')
  .alias('cfg')
  .description('View or edit configuration')
  .action(configCommand);

// Default command - show help or create task
program
  .argument('[action]', 'Action to perform')
  .action(async (action) => {
    if (action === '-c' || action === '--create') {
      await createCommand({});
    } else if (!action) {
      program.help();
    } else {
      console.log(chalk.red(`Unknown command: ${action}`));
      console.log(chalk.dim('Run "yougile --help" for available commands'));
    }
  });

program.parse();
