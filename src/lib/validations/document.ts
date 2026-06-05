import { z } from 'zod';

// Document Type Enum
export const DocumentTypeEnum = z.enum([
  'AKTA_PENDIRIAN',
  'AKTA_PERUBAHAN',
  'AKTA_PEMBERIAN_HAK_TANGGUNGAN',
  'AKTA_WARIS',
  'SURAT_KUASA',
  'PERJANJIAN',
  'LAINNYA',
]);

// Document Status Enum
export const DocumentStatusEnum = z.enum(['DRAFT', 'REVIEW', 'SIGNING', 'ARCHIVED']);

// Create Document Schema
export const CreateDocumentSchema = z.object({
  title: z.string().min(1, 'Judul dokumen wajib diisi').max(500, 'Judul terlalu panjang'),
  documentType: DocumentTypeEnum,
  description: z.string().max(1000, 'Deskripsi terlalu panjang').optional(),
  content: z.string().min(1, 'Konten dokumen wajib diisi'),
  clientId: z.string().optional(),
  documentDate: z.coerce.date().optional(),
  effectiveDate: z.coerce.date().optional(),
  parties: z.string().optional(), // JSON array
  notes: z.string().max(1000, 'Catatan terlalu panjang').optional(),
  tags: z.string().optional(), // JSON array
});

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;

// Update Document Schema
export const UpdateDocumentSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, 'Judul dokumen wajib diisi').max(500, 'Judul terlalu panjang').optional(),
  documentType: DocumentTypeEnum.optional(),
  description: z.string().max(1000, 'Deskripsi terlalu panjang').optional(),
  content: z.string().min(1, 'Konten dokumen wajib diisi').optional(),
  clientId: z.string().cuid().optional(),
  documentDate: z.coerce.date().optional(),
  effectiveDate: z.coerce.date().optional(),
  parties: z.string().optional(), // JSON array
  notes: z.string().max(1000, 'Catatan terlalu panjang').optional(),
  tags: z.string().optional(), // JSON array
});

export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;

// Transition Status Schema
export const TransitionStatusSchema = z.object({
  documentId: z.string().cuid(),
  toStatus: DocumentStatusEnum,
  notes: z.string().max(500, 'Catatan terlalu panjang').optional(),
});

export type TransitionStatusInput = z.infer<typeof TransitionStatusSchema>;

// Filter Documents Schema
export const FilterDocumentsSchema = z.object({
  status: DocumentStatusEnum.optional(),
  documentType: DocumentTypeEnum.optional(),
  clientId: z.string().cuid().optional(),
  search: z.string().optional(),
});

export type FilterDocumentsInput = z.infer<typeof FilterDocumentsSchema>;