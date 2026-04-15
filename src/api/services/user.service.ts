import { BaseClient } from '../base-client.js';
import type {
  User,
  CreateUserData,
  UpdateUserData,
  ApiListResponse,
  WithIdResponse,
} from '../../types/index.js';

export class UserService extends BaseClient {
  async list(params?: {
    email?: string;
    projectId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiListResponse<User>> {
    return this.getList<User>('users', params as Record<string, unknown>);
  }

  async get(id: string): Promise<User> {
    return this.getById<User>(`users/${id}`);
  }

  async invite(data: CreateUserData): Promise<WithIdResponse> {
    return this.post<CreateUserData, WithIdResponse>('users', data);
  }

  async update(id: string, data: UpdateUserData): Promise<WithIdResponse> {
    return this.put<UpdateUserData, WithIdResponse>(`users/${id}`, data);
  }

  async remove(id: string): Promise<void> {
    return this.del(`users/${id}`);
  }
}
