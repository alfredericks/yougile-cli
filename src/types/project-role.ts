export interface TaskPermissions {
  show: boolean;
  delete: boolean;
  editTitle: boolean;
  editDescription: boolean;
  complete: boolean;
  close: boolean;
  assignUsers: 'no' | 'yes' | 'add-self' | 'set-self' | 'change-from-self';
  connect: boolean;
  editSubtasks: 'no' | 'yes' | 'complete';
  editStickers: boolean;
  editPins: boolean;
  move: 'no' | 'project' | 'yes' | 'board';
  sendMessages: boolean;
  sendFiles: boolean;
  editWhoToNotify: 'no' | 'yes' | 'self';
}

export interface ColumnPermissions {
  editTitle: boolean;
  delete: boolean;
  move: 'no' | 'project' | 'yes';
  addTask: boolean;
  allTasks: TaskPermissions;
  withMeTasks: TaskPermissions;
  myTasks: TaskPermissions;
  createdByMeTasks: TaskPermissions;
}

export interface BoardPermissions {
  editTitle: boolean;
  delete: boolean;
  move: boolean;
  showStickers: boolean;
  editStickers: boolean;
  addColumn: boolean;
  columns: ColumnPermissions;
  settings: boolean;
}

export interface ProjectPermissions {
  editTitle: boolean;
  delete: boolean;
  addBoard: boolean;
  boards: BoardPermissions;
  children: Record<string, unknown>;
}

export interface ProjectRole {
  id: string;
  name: string;
  description?: string;
  permissions: ProjectPermissions;
}

export interface CreateProjectRoleData {
  name: string;
  description?: string;
  permissions: ProjectPermissions;
}

export interface UpdateProjectRoleData {
  name?: string;
  description?: string;
  permissions?: ProjectPermissions;
}
