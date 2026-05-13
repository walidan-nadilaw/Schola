import { SubmissionApiClient } from '@/api/SubmissionApi';
import { Submission } from '@/models/Submission';

/**
 * Service orchestrating Submission business logic.
 *
 * OOP patterns:
 * - Singleton: one shared instance
 * - Composition: delegates to SubmissionApiClient
 * - Factory Mapping: transforms raw API data into Domain Models (Submission objects)
 */
export class SubmissionService {
  private static instance: SubmissionService;
  private readonly api: SubmissionApiClient;

  private constructor() {
    this.api = new SubmissionApiClient();
  }

  static getInstance(): SubmissionService {
    if (!SubmissionService.instance) {
      SubmissionService.instance = new SubmissionService();
    }
    return SubmissionService.instance;
  }

  /** Fetch all submissions and map to Submission models */
  async getAllSubmissions(): Promise<Submission[]> {
    const rawData = await this.api.getAll();
    return rawData.map(Submission.fromJSON);
  }

  /** Fetch a specific submission by ID */
  async getSubmissionById(id: string): Promise<Submission> {
    const rawData = await this.api.getById(id);
    return Submission.fromJSON(rawData);
  }

  /** Create a new submission draft */
  async createSubmission(data: Record<string, unknown>): Promise<Submission> {
    const rawData = await this.api.create(data);
    return Submission.fromJSON(rawData);
  }

  /** Update an existing submission */
  async updateSubmission(id: string, data: Record<string, unknown>): Promise<Submission> {
    const rawData = await this.api.update(id, data);
    return Submission.fromJSON(rawData);
  }

  /** Submit a draft for verification */
  async finalizeSubmission(id: string): Promise<Submission> {
    const rawData = await this.api.finalize(id);
    return Submission.fromJSON(rawData);
  }

  /** Verify a submission (for verifier role) */
  async verifySubmission(id: string, message?: string): Promise<Submission> {
    const rawData = await this.api.verify(id, message);
    return Submission.fromJSON(rawData);
  }

  /** Reject a submission (for verifier role) */
  async rejectSubmission(id: string, reason: string): Promise<Submission> {
    const rawData = await this.api.reject(id, reason);
    return Submission.fromJSON(rawData);
  }

  /** Get all submissions awaiting the current user's verification */
  async getPendingVerification(): Promise<Submission[]> {
    const rawData = await this.api.getPendingVerification();
    return rawData.map(Submission.fromJSON);
  }
}
