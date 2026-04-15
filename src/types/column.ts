export interface Column {
  id: string;
  deleted?: boolean;
  title: string;
  color?: number;
  boardId: string;
}

export interface CreateColumnData {
  title: string;
  boardId: string;
  color?: number;
}

export interface UpdateColumnData {
  deleted?: boolean;
  title?: string;
  color?: number;
  boardId?: string;
}
