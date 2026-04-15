# Changelog

## [2.0.0] - 2026-04-15

### Full Yougile REST API v2 Coverage

Complete rewrite of the API layer and CLI commands to cover **all 65+ endpoints** of the Yougile REST API v2.

### New Commands

| Command | Subcommands | Description |
|---------|-------------|-------------|
| `yougile projects` | `list`, `get`, `create`, `update` | Manage projects |
| `yougile boards` | `list`, `get`, `create`, `update` | Manage boards |
| `yougile columns` | `list`, `get`, `create`, `update` | Manage columns with color support (1-16) |
| `yougile tasks` | `list`, `get`, `create`, `update` | Full task management with filters |
| `yougile users` | `list`, `get`, `invite`, `update`, `remove` | User management |
| `yougile company` | `get`, `update` | Company details |
| `yougile departments` | `list`, `get`, `create`, `update` | Department hierarchy |
| `yougile roles` | `list`, `get`, `create`, `update`, `delete` | Project roles & permissions |
| `yougile stickers` | `list`, `get`, `create`, `update`, `states` | String & sprint stickers |
| `yougile chats` | `list`, `get`, `create`, `update` | Group chats |
| `yougile messages` | `list`, `get`, `send`, `update` | Chat messages |
| `yougile webhooks` | `list`, `create`, `update` | Event subscriptions |
| `yougile files` | `upload` | File uploads |
| `yougile crm` | `create-contact`, `find-contact` | CRM integration |
| `yougile auth` | `list-keys`, `delete-key` | API key management |

### Enhanced Existing Commands

- **`yougile tasks list`** — new filters: `--assigned`, `--title`, `--sticker`, `--sticker-state`, `--include-deleted`
- **`yougile tasks create`** — full support: checklists, stickers, color, stopwatch, timer, time tracking
- **`--json`** flag on all list/get commands for scripting (`yougile tasks list --json | jq`)
- **`--limit`** / **`--offset`** pagination on all list commands

### Architecture

- **Type system**: 16 type definition files covering all API DTOs
- **Service layer**: 16 domain-specific API services (auth, tasks, projects, boards, columns, users, company, departments, roles, string-stickers, sprint-stickers, group-chats, chat-messages, webhooks, CRM, files)
- **Shared utilities**: reusable prompts, formatters, date parser, pagination
- **Base client**: generic HTTP methods with lazy auth initialization

### Backward Compatibility

All existing commands work unchanged:
- `yougile init` / `yougile create` (`c`) / `yougile list` (`ls`) / `yougile config` (`cfg`)

### Stats

- 7 → 58 source files
- ~800 → ~6200 lines of TypeScript
- 7 → 65+ API endpoints covered

## [1.0.0] - 2025-10-24

- Initial release
- Commands: `init`, `create`, `list`, `config`
- Auth via email/password or API key
- Interactive task creation with defaults
