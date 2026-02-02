# Yougile CLI

[![npm version](https://img.shields.io/npm/v/yougile-cli.svg)](https://www.npmjs.com/package/yougile-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Interactive command-line client for [Yougile](https://yougile.com) task management.

## Features

- **Interactive task creation** — guided prompts for project, board, column, assignee, deadline
- **Auto authentication** — login with email/password, API key created automatically
- **Quick mode** — save defaults and create tasks in seconds
- **Cross-platform** — works on macOS, Linux, Windows

## Installation

```bash
npm install -g yougile-cli
```

## Quick Start

```bash
# Setup (one time)
yougile init

# Create task interactively
yougile create

# Quick create (uses saved defaults)
yougile c -q
```

## Setup

Run `yougile init` to configure:

```
$ yougile init

🚀 Yougile CLI Setup

? How would you like to authenticate?
❯ 1) Login with email & password (creates new API key)
  2) Enter existing API key

? Email: user@example.com
? Password: ********
✔ API key created!
✔ Connected to Yougile!

? Setup default project/board/column? Yes
? Select default project: My Project
? Select default board: Sprint Board
? Select default column: To Do

✅ Configuration saved!
```

## Usage

### Create Task

```bash
yougile create
# or
yougile c
```

Interactive prompts:
1. **Where?** — Select project → board → column (or use defaults)
2. **Title** — Task name
3. **Description** — Optional details
4. **Deadline** — Optional due date (YYYY-MM-DD or DD.MM.YYYY)
5. **Assignee** — Optional team member

### Quick Create

Skip location selection, use saved defaults:

```bash
yougile c -q
```

### Create with Parameters

```bash
yougile create --title "Fix login bug" --description "Users can't login with SSO"
```

### List Tasks

```bash
yougile list      # Tasks from default column
yougile ls -a     # All tasks
```

### Configuration

```bash
yougile config    # View/edit settings
```

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `yougile init` | | Initial setup |
| `yougile create` | `c` | Create task |
| `yougile list` | `ls` | List tasks |
| `yougile config` | `cfg` | View/edit config |

### Options for `create`

| Option | Description |
|--------|-------------|
| `-t, --title <title>` | Task title |
| `-d, --description <desc>` | Task description |
| `-q, --quick` | Quick mode (use defaults) |

## Configuration File

Settings stored in `~/.config/yougile/config.json`:

```json
{
  "apiKey": "...",
  "apiHost": "https://yougile.com/api-v2/",
  "defaultProjectId": "...",
  "defaultProjectName": "My Project",
  "defaultBoardId": "...",
  "defaultBoardName": "Sprint Board",
  "defaultColumnId": "...",
  "defaultColumnName": "To Do"
}
```

## Requirements

- Node.js >= 18.0.0
- Yougile account

## API

This CLI uses [Yougile REST API v2](https://ru.yougile.com/api-v2).

## License

MIT

## Contributing

Issues and PRs welcome at [GitHub](https://github.com/alfredericks/yougile-cli).
