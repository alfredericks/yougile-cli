/** GroupChatDto */
export interface GroupChat {
  id: string;
  deleted?: boolean;
  title: string;
  users?: Record<string, unknown>;
  userRoleMap?: Record<string, string>;
  roleConfigMap?: Record<string, unknown>;
}

/** CreateGroupChatDto */
export interface CreateGroupChatData {
  title: string;
  users: Record<string, unknown>;
  userRoleMap: Record<string, string>;
  roleConfigMap: Record<string, unknown>;
}

/** UpdateGroupChatDto */
export interface UpdateGroupChatData {
  deleted?: boolean;
  title?: string;
  users?: Record<string, unknown>;
  userRoleMap?: Record<string, string>;
  roleConfigMap?: Record<string, unknown>;
}

/** ChatMessageDto — note: id is a number, not a string */
export interface ChatMessage {
  id: number;
  deleted?: boolean;
  text?: string;
  textHtml?: string;
  timestamp?: number;
  fromUserId?: string;
  label?: string;
  editTimestamp?: number;
  reactions?: Record<string, unknown>;
}

/** CreateChatMessageDto */
export interface CreateChatMessageData {
  text?: string;
  textHtml?: string;
  label?: string;
}

/** UpdateChatMessageDto */
export interface UpdateChatMessageData {
  deleted?: boolean;
  text?: string;
  textHtml?: string;
}

/** ChatIdDto — response from creating a chat message */
export interface ChatIdResponse {
  chatId: string;
}
