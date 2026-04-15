import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { hasConfig } from '../utils/config.js';
import { api } from '../api/client.js';
import { formatId, formatTimestamp, formatBoolean } from '../utils/formatters.js';
import { confirmAction } from '../utils/prompts.js';

export function createUsersCommand(): Command {
  const cmd = new Command('users')
    .description('Manage users');

  // ---- list ----
  cmd.command('list')
    .description('List users')
    .option('--email <email>', 'Filter by email')
    .option('--project <id>', 'Filter by project ID')
    .option('--limit <n>', 'Limit results', '50')
    .option('--offset <n>', 'Offset', '0')
    .option('--json', 'Output as JSON')
    .action(async (options: {
      email?: string;
      project?: string;
      limit: string;
      offset: string;
      json?: boolean;
    }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const spinner = ora('Loading users...').start();

      try {
        const response = await api.users.list({
          email: options.email,
          projectId: options.project,
          limit: parseInt(options.limit),
          offset: parseInt(options.offset),
        });
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(response));
          return;
        }

        const users = response.content;

        if (users.length === 0) {
          console.log(chalk.yellow('No users found.'));
          return;
        }

        console.log(chalk.bold(`\nFound ${users.length} user(s):\n`));

        users.forEach((user, index) => {
          const statusIndicator = user.status === 'online'
            ? chalk.green('\u25CF')
            : chalk.dim('\u25CB');
          const adminBadge = user.isAdmin ? chalk.yellow(' [admin]') : '';
          const name = user.realName || user.email;

          console.log(`  ${chalk.dim(`${index + 1}.`)} ${statusIndicator} ${chalk.white(name)} ${chalk.dim(`<${user.email}>`)}${adminBadge}`);
          console.log(chalk.dim(`     Last activity: ${formatTimestamp(user.lastActivity)}`));
        });

        console.log(chalk.dim(`\nShowing ${users.length} of ${response.paging.count} total`));
      } catch (error) {
        spinner.fail('Failed to load users');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- get ----
  cmd.command('get')
    .description('Get user details by ID')
    .argument('<id>', 'User ID')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options: { json?: boolean }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      const spinner = ora('Loading user...').start();

      try {
        const user = await api.users.get(id);
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(user));
          return;
        }

        console.log(chalk.bold(`\nUser: ${user.realName || user.email}\n`));
        console.log(`  ${chalk.dim('ID:')}             ${user.id}`);
        console.log(`  ${chalk.dim('Name:')}           ${user.realName}`);
        console.log(`  ${chalk.dim('Email:')}          ${user.email}`);
        console.log(`  ${chalk.dim('Status:')}         ${user.status === 'online' ? chalk.green('online') : chalk.dim('offline')}`);
        console.log(`  ${chalk.dim('Admin:')}          ${formatBoolean(user.isAdmin)}`);
        console.log(`  ${chalk.dim('Last activity:')}  ${formatTimestamp(user.lastActivity)}`);
      } catch (error) {
        spinner.fail('Failed to load user');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- invite ----
  cmd.command('invite')
    .description('Invite a user to the company')
    .option('--email <email>', 'User email')
    .option('--admin', 'Grant admin rights')
    .action(async (options: {
      email?: string;
      admin?: boolean;
    }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      let email = options.email;
      let isAdmin = options.admin ?? false;

      if (!email) {
        const { inputEmail } = await inquirer.prompt([{
          type: 'input',
          name: 'inputEmail',
          message: 'User email:',
          validate: (input: string) => {
            if (input.trim().length === 0) return 'Email is required';
            if (!input.includes('@')) return 'Invalid email address';
            return true;
          },
        }]);
        email = inputEmail;
      }

      if (options.admin === undefined) {
        const { makeAdmin } = await inquirer.prompt([{
          type: 'confirm',
          name: 'makeAdmin',
          message: 'Grant admin rights?',
          default: false,
        }]);
        isAdmin = makeAdmin;
      }

      const spinner = ora('Inviting user...').start();

      try {
        const result = await api.users.invite({ email: email!, isAdmin });
        spinner.succeed(chalk.green('User invited successfully!'));
        console.log(chalk.dim(`  ID: ${result.id}`));
        console.log(chalk.white(`  Email: ${email}`));
        console.log(chalk.dim(`  Admin: ${isAdmin ? 'yes' : 'no'}`));
      } catch (error) {
        spinner.fail('Failed to invite user');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- update ----
  cmd.command('update')
    .description('Update a user')
    .argument('<id>', 'User ID')
    .option('--admin', 'Grant admin rights')
    .option('--no-admin', 'Revoke admin rights')
    .action(async (id: string, options: {
      admin?: boolean;
    }) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      let isAdmin = options.admin;

      if (isAdmin === undefined) {
        const fetchSpinner = ora('Loading user...').start();
        try {
          const user = await api.users.get(id);
          fetchSpinner.stop();

          console.log(chalk.bold(`\nUser: ${user.realName || user.email}`));
          console.log(chalk.dim(`  Current admin status: ${user.isAdmin ? 'yes' : 'no'}\n`));

          const { newAdmin } = await inquirer.prompt([{
            type: 'confirm',
            name: 'newAdmin',
            message: 'Grant admin rights?',
            default: user.isAdmin ?? false,
          }]);
          isAdmin = newAdmin;
        } catch (error) {
          fetchSpinner.fail('Failed to load user');
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
          process.exit(1);
        }
      }

      const spinner = ora('Updating user...').start();

      try {
        await api.users.update(id, { isAdmin });
        spinner.succeed(chalk.green('User updated successfully!'));
        console.log(chalk.dim(`  ID: ${id}`));
        console.log(chalk.dim(`  Admin: ${isAdmin ? 'yes' : 'no'}`));
      } catch (error) {
        spinner.fail('Failed to update user');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // ---- remove ----
  cmd.command('remove')
    .description('Remove a user from the company')
    .argument('<id>', 'User ID')
    .action(async (id: string) => {
      if (!hasConfig()) {
        console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
        process.exit(1);
      }

      // Fetch user info for confirmation message
      const fetchSpinner = ora('Loading user...').start();
      let userName: string;
      try {
        const user = await api.users.get(id);
        fetchSpinner.stop();
        userName = user.realName || user.email;
      } catch (error) {
        fetchSpinner.fail('Failed to load user');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }

      const confirmed = await confirmAction(`Remove user "${userName}" from the company?`);
      if (!confirmed) {
        console.log(chalk.dim('Cancelled.'));
        return;
      }

      const spinner = ora('Removing user...').start();

      try {
        await api.users.remove(id);
        spinner.succeed(chalk.green(`User "${userName}" removed successfully.`));
      } catch (error) {
        spinner.fail('Failed to remove user');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  return cmd;
}
