import { BaseApiClient } from './BaseApiClient';
import type { ISubmissionJSON } from '@/types/interfaces';

/**
 * API client for submission endpoints.
 * Placeholder — endpoints will be implemented when backend is ready.
 */
export class SubmissionApiClient extends BaseApiClient {
  /** GET /submissions — list all submissions for current user */
  async getAll(): Promise<ISubmissionJSON[]> {
    return this.get<ISubmissionJSON[]>('/submissions');
  }

  /** GET /submissions/:id */
  async getById(id: string): Promise<ISubmissionJSON> {
    return this.get<ISubmissionJSON>(`/submissions/${id}`);
  }

  /** POST /submissions — create new submission */
  async create(data: Record<string, unknown>): Promise<ISubmissionJSON> {
    return this.post<ISubmissionJSON>('/submissions', data);
  }

  /** PUT /submissions/:id — update submission */
  async update(id: string, data: Record<string, unknown>): Promise<ISubmissionJSON> {
    return this.put<ISubmissionJSON>(`/submissions/${id}`, data);
  }

  /** POST /submissions/:id/finalize */
  async finalize(id: string): Promise<ISubmissionJSON> {
    return this.post<ISubmissionJSON>(`/submissions/${id}/finalize`);
  }

  /** POST /submissions/:id/verify */
  async verify(id: string, message?: string): Promise<ISubmissionJSON> {
    return this.post<ISubmissionJSON>(`/submissions/${id}/verify`, { message });
  }

  /** POST /submissions/:id/reject */
  async reject(id: string, reason: string): Promise<ISubmissionJSON> {
    return this.post<ISubmissionJSON>(`/submissions/${id}/reject`, { reason });
  }

  /** GET /submissions/pending-verification */
  async getPendingVerification(): Promise<ISubmissionJSON[]> {
    return this.get<ISubmissionJSON[]>('/submissions/pending-verification');
  }
}
