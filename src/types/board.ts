export interface StickersConfig {
  timer?: boolean;
  deadline?: boolean;
  stopwatch?: boolean;
  timeTracking?: boolean;
  assignee?: boolean;
  repeat?: boolean;
  custom?: Record<string, boolean>;
}

export interface Board {
  deleted?: boolean;
  id: string;
  title: string;
  projectId: string;
  stickers?: StickersConfig;
}

export interface CreateBoardData {
  title: string;
  projectId: string;
  stickers?: StickersConfig;
}

export interface UpdateBoardData {
  deleted?: boolean;
  title?: string;
  projectId?: string;
  stickers?: StickersConfig;
}
