/** WebhookFilters */
export interface WebhookFilter {
  name: string;
  value: string[];
}

/** WebhookDto */
export interface Webhook {
  id: string;
  deleted?: boolean;
  url: string;
  event?: string;
  disabled?: boolean;
  lastSuccess?: number;
  failuresSinceLastSuccess?: number;
  filters?: WebhookFilter[];
}

/** CreateWebhookDto */
export interface CreateWebhookData {
  url: string;
  event?: string;
  disabled?: boolean;
  filters?: WebhookFilter[];
}

/** UpdateWebhookDto */
export interface UpdateWebhookData {
  deleted?: boolean;
  url?: string;
  event?: string;
  disabled?: boolean;
  filters?: WebhookFilter[];
}
