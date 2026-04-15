import { BaseClient } from '../base-client.js';
import type {
  Project,
  CreateProjectData,
  UpdateProjectData,
  ApiListResponse,
  WithIdResponse,
} from '../../types/index.js';

export class ProjectService extends BaseClient {
  async list(params?: {
    title?: string;
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiListResponse<Project>> {
    return this.getList<Project>('projects', params as Record<string, unknown>);
  }

  async get(id: string): Promise<Project> {
    return this.getById<Project>(`projects/${id}`);
  }

  async create(data: CreateProjectData): Promise<WithIdResponse> {
    return this.post<CreateProjectData, WithIdResponse>('projects', data);
  }

  async update(id: string, data: UpdateProjectData): Promise<WithIdResponse> {
    return this.put<UpdateProjectData, WithIdResponse>(`projects/${id}`, data);
  }
}
