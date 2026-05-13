import { BaseApiClient } from './BaseApiClient';
import type { IFormTemplateJSON } from '@/types/interfaces';

/**
 * API client for form template management endpoints.
 * Placeholder — endpoints will be implemented when backend is ready.
 */
export class TemplateApiClient extends BaseApiClient {
  /** GET /templates — list all templates */
  async getAll(): Promise<IFormTemplateJSON[]> {
    return this.get<IFormTemplateJSON[]>('/templates');
  }

  /** GET /templates/:id */
  async getById(id: string): Promise<IFormTemplateJSON> {
    return this.get<IFormTemplateJSON>(`/templates/${id}`);
  }

  /** POST /templates — create new template (admin) */
  async create(data: Record<string, unknown>): Promise<IFormTemplateJSON> {
    return this.post<IFormTemplateJSON>('/templates', data);
  }

  /** PUT /templates/:id — update template (admin) */
  async update(id: string, data: Record<string, unknown>): Promise<IFormTemplateJSON> {
    return this.put<IFormTemplateJSON>(`/templates/${id}`, data);
  }

  /** DELETE /templates/:id — delete template (admin) */
  async remove(id: string): Promise<void> {
    return this.delete(`/templates/${id}`);
  }
}
