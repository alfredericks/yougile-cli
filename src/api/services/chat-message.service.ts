import { BaseClient } from '../base-client.js';
import type {
  ChatMessage,
  CreateChatMessageData,
  UpdateChatMessageData,
  ChatIdResponse,
  ApiListResponse,
} from '../../types/index.js';

export class ChatMessageService extends BaseClient {
  async list(
    chatId: string,
    params?: {
      fromUserId?: string;
      text?: string;
      label?: string;
      since?: number;
      includeSystem?: boolean;
      includeDeleted?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<ApiListResponse<ChatMessage>> {
    return this.getList<ChatMessage>(
      `chats/${chatId}/messages`,
      params as Record<string, unknown>,
    );
  }

  async get(chatId: string, messageId: number): Promise<ChatMessage> {
    return this.getById<ChatMessage>(`chats/${chatId}/messages/${messageId}`);
  }

  async send(chatId: string, data: CreateChatMessageData): Promise<ChatIdResponse> {
    return this.post<CreateChatMessageData, ChatIdResponse>(
      `chats/${chatId}/messages`,
      data,
    );
  }

  async update(
    chatId: string,
    messageId: number,
    data: UpdateChatMessageData,
  ): Promise<ChatIdResponse> {
    return this.put<UpdateChatMessageData, ChatIdResponse>(
      `chats/${chatId}/messages/${messageId}`,
      data,
    );
  }
}
