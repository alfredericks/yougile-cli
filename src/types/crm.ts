/** Fields for a contact person */
export interface ContactPersonFields {
  position?: string;
  phone?: string;
  additionalPhone?: string;
  email?: string;
  address?: string;
}

/** CreateContactPersonDto */
export interface CreateContactPersonData {
  projectId: string;
  title: string;
  fields?: ContactPersonFields;
}

/** ContactPersonEntryDto */
export interface ContactPersonEntry {
  id: string;
  title: string;
  deleted?: boolean;
  timestamp?: number;
  createdBy?: string;
  fields?: ContactPersonFields;
}

/** CrmDirectoryEntryDto */
export interface CrmDirectoryEntry {
  id: string;
  title: string;
  deleted?: boolean;
  timestamp?: number;
  createdBy?: string;
  fields?: Record<string, unknown>;
}
