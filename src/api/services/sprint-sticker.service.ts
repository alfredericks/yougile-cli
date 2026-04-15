import { BaseClient } from '../base-client.js';
import type {
  SprintSticker,
  SprintStickerState,
  CreateSprintSticker,
  UpdateSprintSticker,
  CreateSprintStickerState,
  UpdateSprintStickerState,
  ApiListResponse,
  WithIdResponse,
  WithStickerStateIdResponse,
} from '../../types/index.js';

export class SprintStickerService extends BaseClient {
  async list(params?: {
    name?: string;
    boardId?: string;
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiListResponse<SprintSticker>> {
    return this.getList<SprintSticker>('sprint-stickers', params as Record<string, unknown>);
  }

  async get(id: string): Promise<SprintSticker> {
    return this.getById<SprintSticker>(`sprint-stickers/${id}`);
  }

  async create(data: CreateSprintSticker): Promise<WithIdResponse> {
    return this.post<CreateSprintSticker, WithIdResponse>('sprint-stickers', data);
  }

  async update(id: string, data: UpdateSprintSticker): Promise<WithIdResponse> {
    return this.put<UpdateSprintSticker, WithIdResponse>(`sprint-stickers/${id}`, data);
  }

  async getState(
    stickerId: string,
    stickerStateId: string,
    includeDeleted?: boolean,
  ): Promise<SprintStickerState> {
    const params = includeDeleted != null ? { includeDeleted } : undefined;
    const path = `sprint-stickers/${stickerId}/states/${stickerStateId}`;
    if (params) {
      const response = await this.getList<SprintStickerState>(path, params as Record<string, unknown>);
      return response as unknown as SprintStickerState;
    }
    return this.getById<SprintStickerState>(path);
  }

  async createState(
    stickerId: string,
    data: CreateSprintStickerState,
  ): Promise<WithStickerStateIdResponse> {
    return this.post<CreateSprintStickerState, WithStickerStateIdResponse>(
      `sprint-stickers/${stickerId}/states`,
      data,
    );
  }

  async updateState(
    stickerId: string,
    stickerStateId: string,
    data: UpdateSprintStickerState,
  ): Promise<WithStickerStateIdResponse> {
    return this.put<UpdateSprintStickerState, WithStickerStateIdResponse>(
      `sprint-stickers/${stickerId}/states/${stickerStateId}`,
      data,
    );
  }
}
