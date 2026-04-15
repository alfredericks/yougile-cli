import { BaseClient } from '../base-client.js';
import type {
  StringSticker,
  StringStickerState,
  CreateStringSticker,
  UpdateStringSticker,
  CreateStringStickerState,
  UpdateStringStickerState,
  ApiListResponse,
  WithIdResponse,
  WithStickerStateIdResponse,
} from '../../types/index.js';

export class StringStickerService extends BaseClient {
  async list(params?: {
    name?: string;
    boardId?: string;
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiListResponse<StringSticker>> {
    return this.getList<StringSticker>('string-stickers', params as Record<string, unknown>);
  }

  async get(id: string): Promise<StringSticker> {
    return this.getById<StringSticker>(`string-stickers/${id}`);
  }

  async create(data: CreateStringSticker): Promise<WithIdResponse> {
    return this.post<CreateStringSticker, WithIdResponse>('string-stickers', data);
  }

  async update(id: string, data: UpdateStringSticker): Promise<WithIdResponse> {
    return this.put<UpdateStringSticker, WithIdResponse>(`string-stickers/${id}`, data);
  }

  async getState(
    stickerId: string,
    stickerStateId: string,
    includeDeleted?: boolean,
  ): Promise<StringStickerState> {
    const params = includeDeleted != null ? { includeDeleted } : undefined;
    const path = `string-stickers/${stickerId}/states/${stickerStateId}`;
    if (params) {
      const response = await this.getList<StringStickerState>(path, params as Record<string, unknown>);
      return response as unknown as StringStickerState;
    }
    return this.getById<StringStickerState>(path);
  }

  async createState(
    stickerId: string,
    data: CreateStringStickerState,
  ): Promise<WithStickerStateIdResponse> {
    return this.post<CreateStringStickerState, WithStickerStateIdResponse>(
      `string-stickers/${stickerId}/states`,
      data,
    );
  }

  async updateState(
    stickerId: string,
    stickerStateId: string,
    data: UpdateStringStickerState,
  ): Promise<WithStickerStateIdResponse> {
    return this.put<UpdateStringStickerState, WithStickerStateIdResponse>(
      `string-stickers/${stickerId}/states/${stickerStateId}`,
      data,
    );
  }
}
