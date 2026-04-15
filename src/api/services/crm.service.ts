import { BaseClient } from '../base-client.js';
import type {
  CreateContactPersonData,
  ContactPersonEntry,
  CrmDirectoryEntry,
} from '../../types/index.js';

export class CrmService extends BaseClient {
  async createContactPerson(
    data: CreateContactPersonData,
  ): Promise<ContactPersonEntry> {
    return this.post<CreateContactPersonData, ContactPersonEntry>(
      'crm/contact-persons',
      data,
    );
  }

  async findContactByExternalId(
    provider: string,
    chatId: string,
  ): Promise<CrmDirectoryEntry> {
    return this.getById<CrmDirectoryEntry>(
      `crm/contacts/by-external-id?provider=${encodeURIComponent(provider)}&chatId=${encodeURIComponent(chatId)}`,
    );
  }
}
