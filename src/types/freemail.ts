export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  isAdmin: boolean;
  isVerified: boolean;
  quotaBytes: number; // Max storage in bytes
  usedBytes: number;
  createdAt: string;
}

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  timestamp: string;
  read: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam';
  attachments?: EmailAttachment[];
  ownerId: string; // The user who owns this mailbox
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded for Redis or external URL
  contentType: string;
  size: number;
}

export interface DomainConfig {
  domain: string;
  ownerId: string;
  verified: boolean;
  mxRecord: string;
  spfRecord: string;
  dkimRecord: string;
  dmarcRecord: string;
}
