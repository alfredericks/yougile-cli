import { BaseClient } from '../base-client.js';
import type {
  Column,
  CreateColumnData,
  UpdateColumnData,
  ApiListResponse,
  WithIdResponse,
} from '../../types/index.js';

export class ColumnService extends BaseClient {
  async list(params?: {
    boardId?: string;
    title?: string;
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiListResponse<Column>> {
    return this.getList<Column>('columns', params as Record<string, unknown>);
  }

  async get(id: string): Promise<Column> {
    return this.getById<Column>(`columns/${id}`);
  }

  async create(data: CreateColumnData): Promise<WithIdResponse> {
    return this.post<CreateColumnData, WithIdResponse>('columns', data);
  }

  async update(id: string, data: UpdateColumnData): Promise<WithIdResponse> {
    return this.put<UpdateColumnData, WithIdResponse>(`columns/${id}`, data);
  }
}
