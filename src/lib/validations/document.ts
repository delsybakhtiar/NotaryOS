// ============================================
// DOCUMENT VALIDATION SCHEMAS
// Zod schemas for document validation
// ============================================

import { z } from 'zod';

// Document types and status
const DocumentTypeEnum = z.enum([
  'AKTA_PENDIRIAN',
  'AKTA_PERUBAHAN',
  'AKTA_PEMBERIAN_HAK_TANGGUNGAN',
  'AKTA_WARIS',
  'SURAT_KUASA',
  'PERJANJIAN',
  'LAINNYA',
]);

const DocumentStatusEnum = z.enum([
  'DRAFT',
  'REVIEW',
  'SIGNING',
  'ARCHIVED',
]);

// Document Status Transition Rules
// DRAFT -> REVIEW -> SIGNING -> ARCHIVED
// Can also go: REVIEW -> DRAFT (for revision)
// SIGNING -> DRAFT (for major revision)
const StatusTransitions: Record<string, string[]> = {
  DRAFT: ['REVIEW', 'ARCHIVED'],
  REVIEW: ['DRAFT', 'SIGNING', 'ARCHIVED'],
  SIGNING: ['ARCHIVED'],
  ARCHIVED: [],
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string,
): boolean {
  const allowedTransitions = StatusTransitions[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Get allowed transitions for a given status
 */
export function getAllowedTransitions(currentStatus: string): string[] {
  return StatusTransitions[currentStatus] || [];
}

/**
 * Schema for creating a new document
 */
export const CreateDocumentSchema = z.object({
  clientId: z.string().optional(),
  title: z.string().min(1, 'Judul dokumen harus diisi'),
  documentType: DocumentTypeEnum,
  description: z.string().optional(),
  content: z.string().optional(),
  documentDate: z.string().optional(), // Date string in ISO format
  effectiveDate: z.string().optional(), // Date string in ISO format
  parties: z.string().optional(), // JSON string of parties
  tags: z.string().optional(), // JSON string of tags
  notes: z.string().optional(),
});

/**
 * Schema for updating an existing document
 */
export const UpdateDocumentSchema = z.object({
  title: z.string().min(1, 'Judul dokumen harus diisi').optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  documentDate: z.string().optional(),
  effectiveDate: z.string().optional(),
  parties: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  changeNotes: z.string().min(1, 'Catatan perubahan harus diisi'), // Required for version control
});

/**
 * Schema for transitioning document status
 */
export const TransitionStatusSchema = z.object({
  newStatus: DocumentStatusEnum,
  notes: z.string().optional(),
});

/**
 * Schema for creating a new document version
 */
export const CreateVersionSchema = z.object({
  content: z.string(),
  changeNotes: z.string().optional(),
});

/**
 * Schema for document filters
 */
export const DocumentFiltersSchema = z.object({
  search: z.string().optional(),
  documentType: z.string().optional(),
  status: z.string().optional(),
  clientId: z.string().optional(),
});