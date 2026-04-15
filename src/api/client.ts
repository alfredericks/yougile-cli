import { AuthService } from './services/auth.service.js';
import { UserService } from './services/user.service.js';
import { CompanyService } from './services/company.service.js';
import { ProjectService } from './services/project.service.js';
import { ProjectRoleService } from './services/project-role.service.js';
import { DepartmentService } from './services/department.service.js';
import { BoardService } from './services/board.service.js';
import { ColumnService } from './services/column.service.js';
import { TaskService } from './services/task.service.js';
import { StringStickerService } from './services/string-sticker.service.js';
import { SprintStickerService } from './services/sprint-sticker.service.js';
import { GroupChatService } from './services/group-chat.service.js';
import { ChatMessageService } from './services/chat-message.service.js';
import { WebhookService } from './services/webhook.service.js';
import { CrmService } from './services/crm.service.js';
import { FileService } from './services/file.service.js';
import type { TaskCreateData as _TaskCreateData } from '../types/task.js';

// Re-export types for backward compatibility
export type {
  ApiListResponse,
  WithIdResponse,
} from '../types/common.js';

export type {
  AuthCredentials,
  Company,
} from '../types/auth.js';

export type {
  User,
} from '../types/user.js';

export type {
  Project,
} from '../types/project.js';

export type {
  Board,
} from '../types/board.js';

export type {
  Column,
} from '../types/column.js';

export type {
  Task,
  TaskCreateData,
} from '../types/task.js';

// Legacy interfaces kept for backward compatibility
// (the canonical types now live in src/types/)

class YougileClient {
  // Service instances
  readonly auth = new AuthService();
  readonly users = new UserService();
  readonly company = new CompanyService();
  readonly projects = new ProjectService();
  readonly projectRoles = new ProjectRoleService();
  readonly departments = new DepartmentService();
  readonly boards = new BoardService();
  readonly columns = new ColumnService();
  readonly tasks = new TaskService();
  readonly stringStickers = new StringStickerService();
  readonly sprintStickers = new SprintStickerService();
  readonly groupChats = new GroupChatService();
  readonly chatMessages = new ChatMessageService();
  readonly webhooks = new WebhookService();
  readonly crm = new CrmService();
  readonly files = new FileService();

  // ---------------------------------------------------------------------------
  // Backward-compatible wrapper methods
  // ---------------------------------------------------------------------------

  async getCompanies(credentials: { login: string; password: string }) {
    const result = await this.auth.getCompanies(credentials);
    return result.content || [];
  }

  async createApiKey(
    credentials: { login: string; password: string },
    companyId: string,
  ): Promise<string> {
    const result = await this.auth.createKey({ ...credentials, companyId });
    return result.key;
  }

  async getProjects() {
    const result = await this.projects.list();
    return result.content || [];
  }

  async getBoards(projectId?: string) {
    const result = await this.boards.list(projectId ? { projectId } : undefined);
    return result.content || [];
  }

  async getColumns(boardId: string) {
    const result = await this.columns.list({ boardId });
    return result.content || [];
  }

  async getUsers() {
    const result = await this.users.list();
    return result.content || [];
  }

  async createTask(data: _TaskCreateData) {
    return this.tasks.create(data);
  }

  async getTasks(columnId?: string, _projectId?: string) {
    const params = columnId ? { columnId } : undefined;
    const result = await this.tasks.list(params);
    return result.content || [];
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getProjects();
      return true;
    } catch {
      return false;
    }
  }

  resetClient(): void {
    this.auth.resetClient();
    this.users.resetClient();
    this.company.resetClient();
    this.projects.resetClient();
    this.projectRoles.resetClient();
    this.departments.resetClient();
    this.boards.resetClient();
    this.columns.resetClient();
    this.tasks.resetClient();
    this.stringStickers.resetClient();
    this.sprintStickers.resetClient();
    this.groupChats.resetClient();
    this.chatMessages.resetClient();
    this.webhooks.resetClient();
    this.crm.resetClient();
    this.files.resetClient();
  }
}

export const api = new YougileClient();
