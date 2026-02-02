import axios, { AxiosInstance } from 'axios';
import { loadConfig } from '../utils/config.js';

export interface Company {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface AuthCredentials {
  login: string;
  password: string;
}

export interface Project {
  id: string;
  title: string;
  deleted?: boolean;
}

export interface Board {
  id: string;
  title: string;
  projectId: string;
  deleted?: boolean;
}

export interface Column {
  id: string;
  title: string;
  boardId: string;
  deleted?: boolean;
  color?: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  realName?: string;
  isAdmin?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  assigned?: string[];
  deadline?: {
    deadline?: number;
    startDate?: number;
    withTime?: boolean;
  };
  completed?: boolean;
  archived?: boolean;
}

export interface TaskCreateData {
  title: string;
  columnId: string;
  description?: string;
  assigned?: string[];
  deadline?: {
    deadline?: number;
    startDate?: number;
    withTime?: boolean;
  };
}

export interface ApiListResponse<T> {
  content: T[];
  paging?: {
    limit: number;
    offset: number;
    count: number;
  };
}

class YougileClient {
  private client: AxiosInstance | null = null;
  private apiHost = 'https://yougile.com/api-v2/';

  // Auth methods (no API key required)
  async getCompanies(credentials: AuthCredentials): Promise<Company[]> {
    const response = await axios.post<{ content: Company[] }>(
      `${this.apiHost}auth/companies`,
      credentials,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data.content || [];
  }

  async createApiKey(credentials: AuthCredentials, companyId: string): Promise<string> {
    const response = await axios.post<{ key: string }>(
      `${this.apiHost}auth/keys`,
      { ...credentials, companyId },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data.key;
  }

  private getClient(): AxiosInstance {
    if (this.client) return this.client;

    const config = loadConfig();
    if (!config || !config.apiKey) {
      throw new Error('API key not configured. Run "yougile init" first.');
    }

    this.client = axios.create({
      baseURL: config.apiHost || 'https://yougile.com/api-v2/',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return this.client;
  }

  resetClient(): void {
    this.client = null;
  }

  async getProjects(): Promise<Project[]> {
    const response = await this.getClient().get<ApiListResponse<Project>>('projects');
    return response.data.content || [];
  }

  async getBoards(projectId?: string): Promise<Board[]> {
    const params = projectId ? { projectId } : {};
    const response = await this.getClient().get<ApiListResponse<Board>>('boards', { params });
    return response.data.content || [];
  }

  async getColumns(boardId: string): Promise<Column[]> {
    const response = await this.getClient().get<ApiListResponse<Column>>('columns', {
      params: { boardId },
    });
    return response.data.content || [];
  }

  async getUsers(): Promise<User[]> {
    const response = await this.getClient().get<ApiListResponse<User>>('users');
    return response.data.content || [];
  }

  async createTask(data: TaskCreateData): Promise<{ id: string }> {
    const response = await this.getClient().post<{ id: string }>('tasks', data);
    return response.data;
  }

  async getTasks(columnId?: string, projectId?: string): Promise<Task[]> {
    const params: Record<string, string> = {};
    if (columnId) params.columnId = columnId;
    if (projectId) params.projectId = projectId;
    const response = await this.getClient().get<ApiListResponse<Task>>('task-list', { params });
    return response.data.content || [];
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getProjects();
      return true;
    } catch {
      return false;
    }
  }
}

export const api = new YougileClient();
