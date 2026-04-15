import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { hasConfig } from '../utils/config.js';
import { api } from '../api/client.js';
import { selectProject } from '../utils/prompts.js';

function requireConfig(): void {
  if (!hasConfig()) {
    console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
    process.exit(1);
  }
}

export function createCrmCommand(): Command {
  const cmd = new Command('crm')
    .description('Manage CRM contacts');

  cmd.command('create-contact')
    .description('Create a new contact person')
    .option('--project <id>', 'Project ID')
    .option('--title <name>', 'Contact name')
    .action(async (options: { project?: string; title?: string }) => {
      requireConfig();

      let projectId = options.project;
      let title = options.title;

      if (!projectId) {
        try {
          const project = await selectProject();
          projectId = project.id;
        } catch (error) {
          console.error(chalk.red(error instanceof Error ? error.message : 'Failed to select project'));
          process.exit(1);
        }
      }

      if (!title) {
        const { inputTitle } = await inquirer.prompt([{
          type: 'input',
          name: 'inputTitle',
          message: 'Contact name:',
          validate: (input: string) => input.trim().length > 0 || 'Name is required',
        }]);
        title = inputTitle;
      }

      const spinner = ora('Creating contact...').start();

      try {
        const result = await api.crm.createContactPerson({
          projectId: projectId!,
          title: title!,
        });
        spinner.succeed(chalk.green('Contact created successfully!'));
        console.log(chalk.dim(`  ID: ${result.id}`));
        console.log(chalk.white(`  Title: ${result.title}`));
      } catch (error) {
        spinner.fail('Failed to create contact');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('find-contact')
    .description('Find a contact by external ID')
    .option('--provider <provider>', 'Provider name')
    .option('--chat-id <chatId>', 'External chat ID')
    .action(async (options: { provider?: string; chatId?: string }) => {
      requireConfig();

      if (!options.provider || !options.chatId) {
        console.log(chalk.red('Error: Both --provider and --chat-id are required.'));
        process.exit(1);
      }

      const spinner = ora('Searching for contact...').start();

      try {
        const contact = await api.crm.findContactByExternalId(options.provider, options.chatId);
        spinner.stop();

        console.log(chalk.bold(`\nContact: ${contact.title}\n`));
        console.log(`  ${chalk.dim('ID:')}        ${contact.id}`);
        console.log(`  ${chalk.dim('Title:')}     ${contact.title}`);
        console.log(`  ${chalk.dim('Deleted:')}   ${contact.deleted ? chalk.red('Yes') : chalk.green('No')}`);
        if (contact.timestamp) {
          console.log(`  ${chalk.dim('Created:')}   ${new Date(contact.timestamp).toLocaleDateString()}`);
        }
        if (contact.createdBy) {
          console.log(`  ${chalk.dim('Created by:')} ${contact.createdBy}`);
        }
        if (contact.fields && Object.keys(contact.fields).length > 0) {
          console.log(chalk.dim('\n  Fields:'));
          for (const [key, value] of Object.entries(contact.fields)) {
            console.log(`    ${chalk.dim(key + ':')} ${String(value)}`);
          }
        }
      } catch (error) {
        spinner.fail('Failed to find contact');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return cmd;
}
