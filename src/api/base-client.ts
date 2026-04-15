import axios, { AxiosInstance } from 'axios';
import { loadConfig } from '../utils/config.js';
import type { ApiListResponse } from '../types/index.js';

export class BaseClient {
  private client: AxiosInstance | null = null;
  private apiHost = 'https://yougile.com/api-v2/';

  protected getClient(): AxiosInstance {
    if (this.client) return this.client;

    const config = loadConfig();
    if (!config || !config.apiKey) {
      throw new Error('API key not configured. Run "yougile init" first.');
    }

    this.client = axios.create({
      baseURL: config.apiHost || this.apiHost,
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

  protected async getList<T>(path: string, params?: Record<string, unknown>): Promise<ApiListResponse<T>> {
    const response = await this.getClient().get<ApiListResponse<T>>(path, { params });
    return response.data;
  }

  protected async getById<T>(path: string): Promise<T> {
    const response = await this.getClient().get<T>(path);
    return response.data;
  }

  protected async post<TReq, TRes>(path: string, data: TReq): Promise<TRes> {
    const response = await this.getClient().post<TRes>(path, data);
    return response.data;
  }

  protected async put<TReq, TRes>(path: string, data: TReq): Promise<TRes> {
    const response = await this.getClient().put<TRes>(path, data);
    return response.data;
  }

  protected async del<T = void>(path: string): Promise<T> {
    const response = await this.getClient().delete<T>(path);
    return response.data;
  }

  protected async postUnauth<TReq, TRes>(path: string, data: TReq): Promise<TRes> {
    const response = await axios.post<TRes>(
      `${this.apiHost}${path}`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }
}
