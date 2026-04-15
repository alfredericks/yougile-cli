export interface Project {
  deleted?: boolean;
  id: string;
  title: string;
  timestamp: number;
  users?: Record<string, string>;
}

export interface CreateProjectData {
  title: string;
  users?: Record<string, string>;
}

export interface UpdateProjectData {
  deleted?: boolean;
  title?: string;
  users?: Record<string, string>;
}
