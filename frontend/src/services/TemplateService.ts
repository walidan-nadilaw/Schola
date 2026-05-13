import { TemplateApiClient } from '@/api/TemplateApi';
import { FormTemplate } from '@/models/FormTemplate';

/**
 * Service orchestrating Form Template business logic.
 *
 * OOP patterns:
 * - Singleton: one shared instance
 * - Composition: delegates to TemplateApiClient
 * - Factory Mapping: transforms raw API data into FormTemplate objects
 */
export class TemplateService {
  private static instance: TemplateService;
  private readonly api: TemplateApiClient;

  private constructor() {
    this.api = new TemplateApiClient();
  }

  static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  /** Fetch all templates and map to FormTemplate models */
  async getAllTemplates(): Promise<FormTemplate[]> {
    const rawData = await this.api.getAll();
    return rawData.map(FormTemplate.fromJSON);
  }

  /** Fetch a specific template by ID */
  async getTemplateById(id: string): Promise<FormTemplate> {
    const rawData = await this.api.getById(id);
    return FormTemplate.fromJSON(rawData);
  }

  /** Create a new template */
  async createTemplate(data: Record<string, unknown>): Promise<FormTemplate> {
    const rawData = await this.api.create(data);
    return FormTemplate.fromJSON(rawData);
  }

  /** Update an existing template */
  async updateTemplate(id: string, data: Record<string, unknown>): Promise<FormTemplate> {
    const rawData = await this.api.update(id, data);
    return FormTemplate.fromJSON(rawData);
  }

  /** Remove a template */
  async removeTemplate(id: string): Promise<void> {
    await this.api.remove(id);
  }
}
