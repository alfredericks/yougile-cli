import { BaseClient } from '../base-client.js';
import type {
  GroupChat,
  CreateGroupChatData,
  UpdateGroupChatData,
  ApiListResponse,
  WithIdResponse,
} from '../../types/index.js';

export class GroupChatService extends BaseClient {
  async list(params?: {
    title?: string;
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiListResponse<GroupChat>> {
    return this.getList<GroupChat>('group-chats', params as Record<string, unknown>);
  }

  async get(id: string): Promise<GroupChat> {
    return this.getById<GroupChat>(`group-chats/${id}`);
  }

  async create(data: CreateGroupChatData): Promise<WithIdResponse> {
    return this.post<CreateGroupChatData, WithIdResponse>('group-chats', data);
  }

  async update(id: string, data: UpdateGroupChatData): Promise<WithIdResponse> {
    return this.put<UpdateGroupChatData, WithIdResponse>(`group-chats/${id}`, data);
  }
}
