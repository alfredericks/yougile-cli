import { BaseClient } from '../base-client.js';
import type {
  Task,
  TaskCreateData,
  TaskUpdateData,
  TaskChatSubscribers,
  ApiListResponse,
  WithIdResponse,
} from '../../types/index.js';

export class TaskService extends BaseClient {
  async list(params?: {
    columnId?: string;
    title?: string;
    assignedTo?: string;
    stickerId?: string;
    stickerStateId?: string;
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiListResponse<Task>> {
    return this.getList<Task>('task-list', params as Record<string, unknown>);
  }

  async get(id: string): Promise<Task> {
    return this.getById<Task>(`tasks/${id}`);
  }

  async create(data: TaskCreateData): Promise<WithIdResponse> {
    return this.post<TaskCreateData, WithIdResponse>('tasks', data);
  }

  async update(id: string, data: TaskUpdateData): Promise<WithIdResponse> {
    return this.put<TaskUpdateData, WithIdResponse>(`tasks/${id}`, data);
  }

  async getChatSubscribers(id: string): Promise<TaskChatSubscribers> {
    return this.getById<TaskChatSubscribers>(`tasks/${id}/chat-subscribers`);
  }

  async updateChatSubscribers(
    id: string,
    data: TaskChatSubscribers,
  ): Promise<WithIdResponse> {
    return this.put<TaskChatSubscribers, WithIdResponse>(
      `tasks/${id}/chat-subscribers`,
      data,
    );
  }
}
