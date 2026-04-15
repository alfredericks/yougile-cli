export type TaskColor =
  | 'task-primary'
  | 'task-gray'
  | 'task-red'
  | 'task-pink'
  | 'task-yellow'
  | 'task-green'
  | 'task-turquoise'
  | 'task-blue'
  | 'task-violet';

export type TaskType = 'task' | 'deal';

export interface Deadline {
  deadline: number;
  startDate?: number;
  withTime?: boolean;
  history?: string[];
  blockedPoints?: string[];
  links?: string[];
}

export interface UpdateDeadline {
  deadline?: number;
  startDate?: number;
  withTime?: boolean;
  history?: string[];
  blockedPoints: string[];
  links: string[];
  deleted?: boolean;
  empty?: boolean;
}

export interface TimeTracking {
  plan: number;
  work: number;
}

export interface UpdateTimeTracking {
  plan?: number;
  work?: number;
  deleted?: boolean;
}

export interface CheckListItem {
  title: string;
  isCompleted: boolean;
}

export interface CheckList {
  title: string;
  items: CheckListItem[];
}

export interface Stopwatch {
  running: boolean;
  seconds: number;
  atMoment: number;
}

export interface CreateStopwatch {
  running: boolean;
}

export interface UpdateStopwatch {
  running?: boolean;
  deleted?: boolean;
}

export interface Timer {
  seconds: number;
  since: number;
  running: boolean;
}

export interface CreateTimer {
  seconds: number;
  running: boolean;
}

export interface UpdateTimer {
  seconds?: number;
  running?: boolean;
  deleted?: boolean;
}

export interface DealReadData {
  dealAmount?: number;
  customFields?: Record<string, unknown>;
  organizationId?: string;
  contactPersonIds?: string[];
}

export interface DealData {
  dealAmount?: number | null;
  contactPersonIds?: string[] | null;
  organizationId?: string | null;
  customFields?: Record<string, unknown>;
}

export interface Task {
  id: string;
  deleted?: boolean;
  title: string;
  timestamp: number;
  columnId?: string;
  description?: string;
  archived?: boolean;
  archivedTimestamp?: number;
  completed?: boolean;
  completedTimestamp?: number;
  subtasks?: string[];
  assigned?: string[];
  createdBy?: string;
  deadline?: Deadline;
  timeTracking?: TimeTracking;
  checklists?: CheckList[];
  stickers?: Record<string, string>;
  color?: TaskColor;
  idTaskCommon?: string;
  idTaskProject?: string;
  type?: TaskType;
  stopwatch?: Stopwatch;
  timer?: Timer;
  deal?: DealReadData;
  extensionData?: Record<string, unknown>;
}

export interface TaskCreateData {
  title: string;
  columnId?: string;
  description?: string;
  archived?: boolean;
  completed?: boolean;
  subtasks?: string[];
  assigned?: string[];
  deadline?: Deadline;
  timeTracking?: TimeTracking;
  checklists?: CheckList[];
  stickers?: Record<string, string>;
  color?: TaskColor;
  idTaskCommon?: string;
  idTaskProject?: string;
  stopwatch?: CreateStopwatch;
  timer?: CreateTimer;
  deal?: DealData;
  extensionData?: Record<string, unknown>;
}

export interface TaskUpdateData {
  deleted?: boolean;
  title?: string;
  columnId?: string;
  description?: string;
  archived?: boolean;
  completed?: boolean;
  subtasks?: string[];
  assigned?: string[];
  deadline?: UpdateDeadline;
  timeTracking?: UpdateTimeTracking;
  checklists?: CheckList[];
  stickers?: Record<string, string>;
  color?: TaskColor;
  idTaskCommon?: string;
  idTaskProject?: string;
  timer?: UpdateTimer;
  stopwatch?: UpdateStopwatch;
  deal?: DealData;
  extensionData?: Record<string, unknown>;
}

export interface TaskChatSubscribers {
  content: string[];
}
