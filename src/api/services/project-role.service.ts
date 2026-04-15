import { BaseClient } from '../base-client.js';
import type {
  ProjectRole,
  CreateProjectRoleData,
  UpdateProjectRoleData,
  ApiListResponse,
  WithIdResponse,
} from '../../types/index.js';

export class ProjectRoleService extends BaseClient {
  async list(
    projectId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<ApiListResponse<ProjectRole>> {
    return this.getList<ProjectRole>(
      `projects/${projectId}/roles`,
      params as Record<string, unknown>,
    );
  }

  async get(projectId: string, id: string): Promise<ProjectRole> {
    return this.getById<ProjectRole>(`projects/${projectId}/roles/${id}`);
  }

  async create(
    projectId: string,
    data: CreateProjectRoleData,
  ): Promise<WithIdResponse> {
    return this.post<CreateProjectRoleData, WithIdResponse>(
      `projects/${projectId}/roles`,
      data,
    );
  }

  async update(
    projectId: string,
    id: string,
    data: UpdateProjectRoleData,
  ): Promise<WithIdResponse> {
    return this.put<UpdateProjectRoleData, WithIdResponse>(
      `projects/${projectId}/roles/${id}`,
      data,
    );
  }

  async remove(projectId: string, id: string): Promise<void> {
    return this.del(`projects/${projectId}/roles/${id}`);
  }
}
