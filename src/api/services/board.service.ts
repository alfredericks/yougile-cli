import { BaseClient } from '../base-client.js';
import type {
  Board,
  CreateBoardData,
  UpdateBoardData,
  ApiListResponse,
  WithIdResponse,
} from '../../types/index.js';

export class BoardService extends BaseClient {
  async list(params?: {
    projectId?: string;
    title?: string;
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiListResponse<Board>> {
    return this.getList<Board>('boards', params as Record<string, unknown>);
  }

  async get(id: string): Promise<Board> {
    return this.getById<Board>(`boards/${id}`);
  }

  async create(data: CreateBoardData): Promise<WithIdResponse> {
    return this.post<CreateBoardData, WithIdResponse>('boards', data);
  }

  async update(id: string, data: UpdateBoardData): Promise<WithIdResponse> {
    return this.put<UpdateBoardData, WithIdResponse>(`boards/${id}`, data);
  }
}
