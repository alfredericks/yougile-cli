import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { hasConfig } from '../utils/config.js';
import { api } from '../api/client.js';
import { formatId } from '../utils/formatters.js';
import type { StickerIcon } from '../types/sticker.js';

function getStickerService(type: string) {
  return type === 'sprint' ? api.sprintStickers : api.stringStickers;
}

function requireConfig(): void {
  if (!hasConfig()) {
    console.log(chalk.red('Error: Not configured. Run "yougile init" first.'));
    process.exit(1);
  }
}

const ICON_CHOICES: { name: string; value: StickerIcon }[] = [
  { name: 'star', value: 'star' },
  { name: 'flag', value: 'flag' },
  { name: 'check', value: 'check' },
  { name: 'bolt', value: 'bolt' },
  { name: 'prio', value: 'prio' },
  { name: 'heart', value: 'heart' },
  { name: 'flame', value: 'flame' },
  { name: 'bookmark', value: 'bookmark' },
  { name: '(none)', value: '' },
];

export function createStickersCommand(): Command {
  const cmd = new Command('stickers')
    .description('Manage string and sprint stickers');

  cmd.command('list')
    .description('List stickers')
    .option('--board <id>', 'Filter by board ID')
    .option('--name <search>', 'Filter by name')
    .option('--type <type>', 'Sticker type: string or sprint', 'string')
    .option('--include-deleted', 'Include deleted stickers')
    .option('--limit <n>', 'Limit results', '50')
    .option('--offset <n>', 'Offset', '0')
    .option('--json', 'Output as JSON')
    .action(async (options: {
      board?: string;
      name?: string;
      type: string;
      includeDeleted?: boolean;
      limit: string;
      offset: string;
      json?: boolean;
    }) => {
      requireConfig();

      const service = getStickerService(options.type);
      const spinner = ora('Loading stickers...').start();

      try {
        const response = await service.list({
          boardId: options.board,
          name: options.name,
          includeDeleted: options.includeDeleted,
          limit: parseInt(options.limit),
          offset: parseInt(options.offset),
        });
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(response));
          return;
        }

        const stickers = response.content;

        if (stickers.length === 0) {
          console.log(chalk.yellow('No stickers found.'));
          return;
        }

        console.log(chalk.bold(`\nFound ${stickers.length} sticker(s):\n`));

        stickers.forEach((sticker, index) => {
          const statesCount = sticker.states ? sticker.states.length : 0;
          const icon = sticker.icon ? ` [${sticker.icon}]` : '';
          console.log(`  ${chalk.dim(`${index + 1}.`)} ${chalk.white(sticker.name)}${chalk.cyan(icon)} ${chalk.dim(`(${statesCount} states)`)} ${chalk.dim(`(${formatId(sticker.id)})`)}`);
        });

        console.log(chalk.dim(`\nShowing ${stickers.length} of ${response.paging.count} total`));
      } catch (error) {
        spinner.fail('Failed to load stickers');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('get')
    .description('Get sticker by ID')
    .argument('<id>', 'Sticker ID')
    .option('--type <type>', 'Sticker type: string or sprint', 'string')
    .option('--json', 'Output as JSON')
    .action(async (id: string, options: { type: string; json?: boolean }) => {
      requireConfig();

      const service = getStickerService(options.type);
      const spinner = ora('Loading sticker...').start();

      try {
        const sticker = await service.get(id);
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(sticker));
          return;
        }

        console.log(chalk.bold(`\nSticker: ${sticker.name}\n`));
        console.log(`  ${chalk.dim('ID:')}     ${sticker.id}`);
        console.log(`  ${chalk.dim('Name:')}   ${sticker.name}`);
        console.log(`  ${chalk.dim('Icon:')}   ${sticker.icon || '(none)'}`);

        if (sticker.states && sticker.states.length > 0) {
          console.log(chalk.bold('\n  States:\n'));
          sticker.states.forEach((state, index) => {
            const parts = [
              `  ${chalk.dim(`${index + 1}.`)} ${chalk.white(state.name)}`,
            ];
            if ('color' in state && (state as { color?: string }).color) {
              parts.push(chalk.cyan(`color: ${(state as { color?: string }).color}`));
            }
            if ('begin' in state && (state as { begin?: number }).begin != null) {
              parts.push(chalk.cyan(`begin: ${(state as { begin?: number }).begin}`));
            }
            if ('end' in state && (state as { end?: number }).end != null) {
              parts.push(chalk.cyan(`end: ${(state as { end?: number }).end}`));
            }
            parts.push(chalk.dim(`(${state.id})`));
            console.log(parts.join(' '));
          });
        } else {
          console.log(chalk.dim('\n  No states defined.'));
        }
      } catch (error) {
        spinner.fail('Failed to load sticker');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('create')
    .description('Create a new sticker')
    .option('--type <type>', 'Sticker type: string or sprint', 'string')
    .option('--name <name>', 'Sticker name')
    .option('--icon <icon>', 'Sticker icon')
    .action(async (options: { type: string; name?: string; icon?: string }) => {
      requireConfig();

      let name = options.name;
      let icon = options.icon as StickerIcon | undefined;

      if (!name) {
        const { inputName } = await inquirer.prompt([{
          type: 'input',
          name: 'inputName',
          message: 'Sticker name:',
          validate: (input: string) => input.trim().length > 0 || 'Name is required',
        }]);
        name = inputName;
      }

      if (!icon) {
        const { selectedIcon } = await inquirer.prompt([{
          type: 'list',
          name: 'selectedIcon',
          message: 'Select icon:',
          choices: ICON_CHOICES,
          pageSize: 10,
        }]);
        icon = selectedIcon;
      }

      const service = getStickerService(options.type);
      const spinner = ora('Creating sticker...').start();

      try {
        const createData: { name: string; icon?: StickerIcon } = { name: name! };
        if (icon) {
          createData.icon = icon;
        }
        const result = await service.create(createData);
        spinner.succeed(chalk.green('Sticker created successfully!'));
        console.log(chalk.dim(`  ID: ${result.id}`));
        console.log(chalk.white(`  Name: ${name}`));
        if (icon) {
          console.log(chalk.white(`  Icon: ${icon}`));
        }
      } catch (error) {
        spinner.fail('Failed to create sticker');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.command('update')
    .description('Update a sticker')
    .argument('<id>', 'Sticker ID')
    .option('--type <type>', 'Sticker type: string or sprint', 'string')
    .option('--name <name>', 'New name')
    .option('--icon <icon>', 'New icon')
    .action(async (id: string, options: { type: string; name?: string; icon?: string }) => {
      requireConfig();

      const service = getStickerService(options.type);
      const updateData: { name?: string; icon?: StickerIcon } = {};

      if (options.name) {
        updateData.name = options.name;
      }
      if (options.icon) {
        updateData.icon = options.icon as StickerIcon;
      }

      if (!options.name && !options.icon) {
        const fetchSpinner = ora('Loading sticker...').start();
        try {
          const current = await service.get(id);
          fetchSpinner.stop();

          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'name',
              message: 'New name:',
              default: current.name,
              validate: (input: string) => input.trim().length > 0 || 'Name is required',
            },
            {
              type: 'list',
              name: 'icon',
              message: 'Select icon:',
              choices: ICON_CHOICES,
              default: current.icon || '',
            },
          ]);
          updateData.name = answers.name;
          updateData.icon = answers.icon;
        } catch (error) {
          fetchSpinner.fail('Failed to load sticker');
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
          process.exit(1);
        }
      }

      const spinner = ora('Updating sticker...').start();

      try {
        await service.update(id, updateData);
        spinner.succeed(chalk.green('Sticker updated successfully!'));
        console.log(chalk.dim(`  ID: ${id}`));
        if (updateData.name) console.log(chalk.white(`  Name: ${updateData.name}`));
        if (updateData.icon) console.log(chalk.white(`  Icon: ${updateData.icon}`));
      } catch (error) {
        spinner.fail('Failed to update sticker');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  // States subcommand group
  const states = new Command('states')
    .description('Manage sticker states');

  states.command('list')
    .description('List states of a sticker')
    .argument('<stickerId>', 'Sticker ID')
    .option('--type <type>', 'Sticker type: string or sprint', 'string')
    .option('--json', 'Output as JSON')
    .action(async (stickerId: string, options: { type: string; json?: boolean }) => {
      requireConfig();

      const service = getStickerService(options.type);
      const spinner = ora('Loading sticker states...').start();

      try {
        const sticker = await service.get(stickerId);
        spinner.stop();

        const statesArr = sticker.states || [];

        if (options.json) {
          console.log(JSON.stringify(statesArr));
          return;
        }

        if (statesArr.length === 0) {
          console.log(chalk.yellow('No states found for this sticker.'));
          return;
        }

        console.log(chalk.bold(`\nStates for "${sticker.name}":\n`));

        statesArr.forEach((state, index) => {
          const parts = [
            `  ${chalk.dim(`${index + 1}.`)} ${chalk.white(state.name)}`,
          ];
          if ('color' in state && (state as { color?: string }).color) {
            parts.push(chalk.cyan(`color: ${(state as { color?: string }).color}`));
          }
          if ('begin' in state && (state as { begin?: number }).begin != null) {
            parts.push(chalk.cyan(`begin: ${(state as { begin?: number }).begin}`));
          }
          if ('end' in state && (state as { end?: number }).end != null) {
            parts.push(chalk.cyan(`end: ${(state as { end?: number }).end}`));
          }
          parts.push(chalk.dim(`(${state.id})`));
          console.log(parts.join(' '));
        });
      } catch (error) {
        spinner.fail('Failed to load sticker states');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  states.command('create')
    .description('Create a new state for a sticker')
    .argument('<stickerId>', 'Sticker ID')
    .option('--type <type>', 'Sticker type: string or sprint', 'string')
    .option('--name <name>', 'State name')
    .option('--color <color>', 'State color (for string stickers)')
    .action(async (stickerId: string, options: { type: string; name?: string; color?: string }) => {
      requireConfig();

      let name = options.name;
      let color = options.color;

      if (!name) {
        const { inputName } = await inquirer.prompt([{
          type: 'input',
          name: 'inputName',
          message: 'State name:',
          validate: (input: string) => input.trim().length > 0 || 'Name is required',
        }]);
        name = inputName;
      }

      if (!color && options.type !== 'sprint') {
        const { inputColor } = await inquirer.prompt([{
          type: 'input',
          name: 'inputColor',
          message: 'State color (e.g. #ff0000):',
        }]);
        color = inputColor || undefined;
      }

      const service = getStickerService(options.type);
      const spinner = ora('Creating state...').start();

      try {
        const data: { name: string; color?: string } = { name: name! };
        if (color) {
          data.color = color;
        }
        const result = await service.createState(stickerId, data);
        spinner.succeed(chalk.green('State created successfully!'));
        console.log(chalk.dim(`  State ID: ${result.id}`));
        console.log(chalk.white(`  Name: ${name}`));
        if (color) console.log(chalk.white(`  Color: ${color}`));
      } catch (error) {
        spinner.fail('Failed to create state');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  states.command('update')
    .description('Update a sticker state')
    .argument('<stickerId>', 'Sticker ID')
    .argument('<stateId>', 'State ID')
    .option('--type <type>', 'Sticker type: string or sprint', 'string')
    .option('--name <name>', 'New state name')
    .option('--color <color>', 'New state color (for string stickers)')
    .action(async (stickerId: string, stateId: string, options: { type: string; name?: string; color?: string }) => {
      requireConfig();

      const service = getStickerService(options.type);
      const updateData: { name?: string; color?: string } = {};

      if (options.name) {
        updateData.name = options.name;
      }
      if (options.color) {
        updateData.color = options.color;
      }

      if (!options.name && !options.color) {
        console.log(chalk.yellow('No fields to update. Use --name or --color.'));
        return;
      }

      const spinner = ora('Updating state...').start();

      try {
        await service.updateState(stickerId, stateId, updateData);
        spinner.succeed(chalk.green('State updated successfully!'));
        console.log(chalk.dim(`  Sticker ID: ${stickerId}`));
        console.log(chalk.dim(`  State ID: ${stateId}`));
        if (updateData.name) console.log(chalk.white(`  Name: ${updateData.name}`));
        if (updateData.color) console.log(chalk.white(`  Color: ${updateData.color}`));
      } catch (error) {
        spinner.fail('Failed to update state');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    });

  cmd.addCommand(states);

  return cmd;
}
