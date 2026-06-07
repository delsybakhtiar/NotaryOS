import { z } from 'zod';

// ============================================
// TRANSACTION VALIDATION SCHEMAS
// ============================================

// Enums matching Prisma schema
export const TransactionStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'REVIEW',
  'PROCESSING',
  'READY_TO_SIGN',
  'SIGNING',
  'SIGNED',
  'DELIVERY',
  'COMPLETED',
  'ON_HOLD',
  'CANCELLED',
  'ARCHIVED',
]);

export const TransactionServiceTypeEnum = z.enum([
  'PENDIRIAN_PT',
  'AJB',
  'WARIS',
  'LEGALISASI',
  'PERUBAHAN_PT',
  'PEMBERIAN_HAK',
  'SURAT_KUASA',
  'PERJANJIAN',
  'LAINNYA',
]);

export const TransactionPriorityEnum = z.enum([
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
]);

export const TaskStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
  'SKIPPED',
]);

export const ChecklistStatusEnum = z.enum([
  'PENDING',
  'UPLOADED',
  'VERIFIED',
  'REJECTED',
]);

export const DeliveryStatusEnum = z.enum([
  'PENDING',
  'ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'FAILED',
  'RETURNED',
]);

// ============================================
// TRANSACTION VALIDATION
// ============================================

export const CreateTransactionSchema = z.object({
  serviceType: TransactionServiceTypeEnum,
  priority: TransactionPriorityEnum.default('NORMAL'),
  clientId: z.string().optional(),
  parties: z.string().optional(), // JSON string
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

export const UpdateTransactionSchema = z.object({
  serviceType: TransactionServiceTypeEnum.optional(),
  priority: TransactionPriorityEnum.optional(),
  clientId: z.string().optional(),
  assignedTo: z.string().optional(),
  parties: z.string().optional(),
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

export const TransactionStatusTransitionSchema = z.object({
  newStatus: TransactionStatusEnum,
  notes: z.string().optional(),
});

// ============================================
// TASK VALIDATION
// ============================================

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Judul tugas wajib diisi'),
  description: z.string().optional(),
  taskType: z.string().min(1, 'Tipe tugas wajib diisi'),
  order: z.number().int().min(0, 'Order harus bilangan bulat non-negatif'),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1, 'Judul tugas wajib diisi').optional(),
  description: z.string().optional(),
  status: TaskStatusEnum.optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  completedNotes: z.string().optional(),
});

// ============================================
// CHECKLIST VALIDATION
// ============================================

export const CreateChecklistItemSchema = z.object({
  documentType: z.string().min(1, 'Tipe dokumen wajib diisi'),
  documentName: z.string().min(1, 'Nama dokumen wajib diisi'),
  required: z.boolean().default(true),
});

export const UpdateChecklistItemSchema = z.object({
  status: ChecklistStatusEnum,
  fileId: z.string().optional(),
  verificationNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

// ============================================
// DELIVERY VALIDATION
// ============================================

export const CreateDeliverySchema = z.object({
  recipientName: z.string().min(1, 'Nama penerima wajib diisi'),
  recipientPhone: z.string().optional(),
  deliveryAddress: z.string().min(1, 'Alamat pengiriman wajib diisi'),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  specialInstructions: z.string().optional(),
  courierId: z.string().optional(),
  courierName: z.string().optional(),
  courierCompany: z.string().optional(),
});

export const UpdateDeliverySchema = z.object({
  status: DeliveryStatusEnum,
  trackingNumber: z.string().optional(),
  courierId: z.string().optional(),
  courierName: z.string().optional(),
  courierCompany: z.string().optional(),
  notes: z.string().optional(),
  failureReason: z.string().optional(),
  receivedBy: z.string().optional(),
});

// ============================================
// WORKFLOW STATE MACHINE
// ============================================

// Allowed status transitions
export const allowedStatusTransitions: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED', 'ARCHIVED'],
  SUBMITTED: ['REVIEW', 'CANCELLED'],
  REVIEW: ['PROCESSING', 'READY_TO_SIGN', 'ON_HOLD', 'CANCELLED'],
  PROCESSING: ['READY_TO_SIGN', 'ON_HOLD', 'CANCELLED'],
  READY_TO_SIGN: ['SIGNING', 'ON_HOLD', 'CANCELLED'],
  SIGNING: ['SIGNED', 'ON_HOLD'],
  SIGNED: ['DELIVERY', 'COMPLETED', 'ON_HOLD'],
  DELIVERY: ['DELIVERED', 'FAILED', 'COMPLETED'],
  COMPLETED: ['ARCHIVED'],
  ON_HOLD: ['REVIEW', 'PROCESSING', 'READY_TO_SIGN', 'SIGNING', 'DELIVERY', 'CANCELLED'],
  CANCELLED: ['ARCHIVED'],
  DELIVERED: ['COMPLETED', 'ARCHIVED'],
  FAILED: ['DELIVERY', 'CANCELLED'],
  ARCHIVED: [],
};

/**
 * Validate if status transition is allowed
 */
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const allowed = allowedStatusTransitions[currentStatus] || [];
  return allowed.includes(newStatus);
}

/**
 * Get allowed next statuses for a given current status
 */
export function getAllowedNextStatuses(currentStatus: string): string[] {
  return allowedStatusTransitions[currentStatus] || [];
}

// ============================================
// BUSINESS RULE VALIDATION
// ============================================

/**
 * Validate if user can perform action based on role and status
 */
export function canPerformAction(
  userRole: string,
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'sign' | 'deliver',
  transactionStatus?: string
): { allowed: boolean; reason?: string } {
  // Admin (Notaris) can do everything
  if (userRole === 'ADMIN') {
    return { allowed: true };
  }

  // Staff can create and update (but not sign)
  if (userRole === 'STAFF') {
    if (action === 'create' || action === 'update') {
      return { allowed: true };
    }
    if (action === 'approve' || action === 'reject' || action === 'sign' || action === 'delete') {
      return { allowed: false, reason: 'Staff tidak memiliki izin untuk tindakan ini' };
    }
  }

  // Finance can only view
  if (userRole === 'FINANCE') {
    if (action === 'create' || action === 'update' || action === 'delete') {
      return { allowed: false, reason: 'Finance hanya memiliki izin untuk melihat' };
    }
  }

  // Kurir can only deliver
  if (userRole === 'KURIR') {
    if (action === 'deliver') {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Kurir hanya dapat mengelola pengiriman' };
  }

  return { allowed: false, reason: 'Role tidak dikenali' };
}

/**
 * Validate if all required documents are present
 */
export function validateRequiredDocuments(
  checklists: Array<{ documentType: string; status: string; required: boolean }>
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const item of checklists) {
    if (item.required && item.status !== 'VERIFIED' && item.status !== 'UPLOADED') {
      missing.push(item.documentType);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validate if all tasks are completed
 */
export function validateTasksCompletion(
  tasks: Array<{ status: string }>
): { valid: boolean; incomplete: number } {
  const incomplete = tasks.filter(
    t => t.status !== 'COMPLETED' && t.status !== 'SKIPPED'
  ).length;

  return {
    valid: incomplete === 0,
    incomplete,
  };
}

// ============================================
// TYPE EXPORTS
// ============================================

export type TransactionStatus = z.infer<typeof TransactionStatusEnum>;
export type TransactionServiceType = z.infer<typeof TransactionServiceTypeEnum>;
export type TransactionPriority = z.infer<typeof TransactionPriorityEnum>;
export type TaskStatus = z.infer<typeof TaskStatusEnum>;
export type ChecklistStatus = z.infer<typeof ChecklistStatusEnum>;
export type DeliveryStatus = z.infer<typeof DeliveryStatusEnum>;

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type TransactionStatusTransitionInput = z.infer<typeof TransactionStatusTransitionSchema>;

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export type CreateChecklistItemInput = z.infer<typeof CreateChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof UpdateChecklistItemSchema>;

export type CreateDeliveryInput = z.infer<typeof CreateDeliverySchema>;
export type UpdateDeliveryInput = z.infer<typeof UpdateDeliverySchema>;