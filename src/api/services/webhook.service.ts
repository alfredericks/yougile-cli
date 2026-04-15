import { BaseClient } from '../base-client.js';
import type {
  Webhook,
  CreateWebhookData,
  UpdateWebhookData,
  ApiListResponse,
  WithIdResponse,
} from '../../types/index.js';

export class WebhookService extends BaseClient {
  async list(params?: {
    includeDeleted?: boolean;
  }): Promise<ApiListResponse<Webhook>> {
    return this.getList<Webhook>('webhooks', params as Record<string, unknown>);
  }

  async create(data: CreateWebhookData): Promise<WithIdResponse> {
    return this.post<CreateWebhookData, WithIdResponse>('webhooks', data);
  }

  async update(id: string, data: UpdateWebhookData): Promise<WithIdResponse> {
    return this.put<UpdateWebhookData, WithIdResponse>(`webhooks/${id}`, data);
  }
}
