export interface Department {
  deleted?: boolean;
  id: string;
  title: string;
  parentId?: string;
  users?: Record<string, string>;
}

export interface CreateDepartmentData {
  title: string;
  parentId?: string;
  users?: Record<string, string>;
}

export interface UpdateDepartmentData {
  deleted?: boolean;
  title?: string;
  parentId?: string;
  users?: Record<string, string>;
}
