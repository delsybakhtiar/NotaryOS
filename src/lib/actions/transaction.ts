'use server';

// ============================================
// TRANSACTION SERVER ACTIONS
// CRUD operations with audit logging
// ============================================

import { db } from '@/lib/db';
import { logCreate, logUpdate } from '@/lib/audit-logger';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionStatusTransitionSchema,
  isValidStatusTransition,
  getAllowedNextStatuses,
  canPerformAction,
} from '@/lib/validations/transaction';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AuditAction } from '@prisma/client';

// Helper function to get current user session
async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return session.user;
}

// Helper function to generate transaction number
function generateTransactionNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `TRX-${year}-${random}`;
}

// Helper function to generate QR code
function generateQrCode(): string {
  return `QR-TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to generate default checklist based on service type
function generateDefaultChecklist(serviceType: string): Array<{
  documentType: string;
  documentName: string;
  required: boolean;
}> {
  const checklistMap: Record<string, Array<{ documentType: string; documentName: string; required: boolean }>> = {
    PENDIRIAN_PT: [
      { documentType: 'AKTA_PENDIRIAN', documentName: 'Akta Pendirian', required: true },
      { documentType: 'SK_KEMENKUMHAM', documentName: 'SK Kemenkumham', required: true },
      { documentType: 'NPWP', documentName: 'NPWP Perusahaan', required: true },
      { documentType: 'NIB', documentName: 'NIB', required: true },
      { documentType: 'KTP_DIREKSI', documentName: 'KTP Direksi', required: true },
      { documentType: 'NPWP_DIREKSI', documentName: 'NPWP Direksi', required: true },
    ],
    AJB: [
      { documentType: 'AKTA_JUAL_BELI', documentName: 'Akta Jual Beli', required: true },
      { documentType: 'SERTIFIKAT_TANAH', documentName: 'Sertifikat Tanah', required: true },
      { documentType: 'KTP_PENJUAL', documentName: 'KTP Penjual', required: true },
      { documentType: 'KTP_PEMBELI', documentName: 'KTP Pembeli', required: true },
      { documentType: 'PBB_TERAKHIR', documentName: 'PBB Terakhir', required: true },
    ],
    WARIS: [
      { documentType: 'AKTA_WARIS', documentName: 'Akta Waris', required: true },
      { documentType: 'SURAT_KETERANGAN_KEMATIAN', documentName: 'Surat Keterangan Kematian', required: true },
      { documentType: 'KTP_ALMARHUM', documentName: 'KTP Almarhum', required: true },
      { documentType: 'KK_ALMARHUM', documentName: 'Kartu Keluarga Almarhum', required: true },
      { documentType: 'KTP_AHLI_WARIS', documentName: 'KTP Ahli Waris', required: true },
    ],
    LEGALISASI: [
      { documentType: 'DOKUMEN_ASLI', documentName: 'Dokumen Asli', required: true },
      { documentType: 'KTP_PEMOHON', documentName: 'KTP Pemohon', required: true },
    ],
    PERUBAHAN_PT: [
      { documentType: 'AKTA_PERUBAHAN', documentName: 'Akta Perubahan', required: true },
      { documentType: 'AKTA_LAMA', documentName: 'Akta Lama', required: true },
      { documentType: 'SK_KEMENKUMHAM_LAMA', documentName: 'SK Kemenkumham Lama', required: true },
    ],
    PEMBERIAN_HAK: [
      { documentType: 'AKTA_PEMBERIAN_HAK_TANGGUNGAN', documentName: 'Akta Pemberian Hak Tanggungan', required: true },
      { documentType: 'SERTIFIKAT_TANAH', documentName: 'Sertifikat Tanah', required: true },
      { documentType: 'KTP_DEBITUR', documentName: 'KTP Debitur', required: true },
      { documentType: 'NPWP_DEBITUR', documentName: 'NPWP Debitur', required: true },
    ],
    SURAT_KUASA: [
      { documentType: 'AKTA_SURAT_KUASA', documentName: 'Akta Surat Kuasa', required: true },
      { documentType: 'KTP_PEMBERI_KUASA', documentName: 'KTP Pemberi Kuasa', required: true },
      { documentType: 'KTP_PENERIMA_KUASA', documentName: 'KTP Penerima Kuasa', required: true },
    ],
    PERJANJIAN: [
      { documentType: 'AKTA_PERJANJIAN', documentName: 'Akta Perjanjian', required: true },
      { documentType: 'KTP_PIHAK', documentName: 'KTP Para Pihak', required: true },
    ],
    LAINNYA: [
      { documentType: 'DOKUMEN_PENDUKUNG', documentName: 'Dokumen Pendukung', required: false },
    ],
  };

  return checklistMap[serviceType] || [];
}

// Helper function to generate default tasks based on service type
function generateDefaultTasks(serviceType: string): Array<{
  title: string;
  description: string;
  taskType: string;
  order: number;
}> {
  const tasksMap: Record<string, Array<{ title: string; description: string; taskType: string; order: number }>> = {
    PENDIRIAN_PT: [
      { title: 'Verifikasi Dokumen', description: 'Verifikasi kelengkapan dokumen', taskType: 'document', order: 1 },
      { title: 'Draft Akta', description: 'Menyusun draf akta pendirian', taskType: 'document', order: 2 },
      { title: 'Review Draft', description: 'Review draf akta oleh Notaris', taskType: 'review', order: 3 },
      { title: 'Tanda Tangan', description: 'Proses penandatanganan akta', taskType: 'signing', order: 4 },
      { title: 'Pengurusan SK', description: 'Pengurusan SK Kemenkumham', taskType: 'processing', order: 5 },
    ],
    AJB: [
      { title: 'Verifikasi Dokumen', description: 'Verifikasi dokumen jual beli', taskType: 'document', order: 1 },
      { title: 'Draft Akta', description: 'Menyusun draf akta jual beli', taskType: 'document', order: 2 },
      { title: 'Review Draft', description: 'Review draf akta', taskType: 'review', order: 3 },
      { title: 'Tanda Tangan', description: 'Proses penandatanganan', taskType: 'signing', order: 4 },
    ],
    WARIS: [
      { title: 'Verifikasi Dokumen', description: 'Verifikasi dokumen waris', taskType: 'document', order: 1 },
      { title: 'Draft Akta', description: 'Menyusun draf akta waris', taskType: 'document', order: 2 },
      { title: 'Review Draft', description: 'Review draf akta', taskType: 'review', order: 3 },
      { title: 'Tanda Tangan', description: 'Proses penandatanganan', taskType: 'signing', order: 4 },
    ],
    LEGALISASI: [
      { title: 'Verifikasi Dokumen', description: 'Verifikasi dokumen yang akan dilegalisasi', taskType: 'document', order: 1 },
      { title: 'Legalisasi', description: 'Proses legalisasi', taskType: 'processing', order: 2 },
    ],
    PERUBAHAN_PT: [
      { title: 'Verifikasi Dokumen', description: 'Verifikasi dokumen perubahan', taskType: 'document', order: 1 },
      { title: 'Draft Akta', description: 'Menyusun draf akta perubahan', taskType: 'document', order: 2 },
      { title: 'Review Draft', description: 'Review draf akta', taskType: 'review', order: 3 },
      { title: 'Tanda Tangan', description: 'Proses penandatanganan', taskType: 'signing', order: 4 },
    ],
    PEMBERIAN_HAK: [
      { title: 'Verifikasi Dokumen', description: 'Verifikasi dokumen pemberian hak', taskType: 'document', order: 1 },
      { title: 'Draft Akta', description: 'Menyusun draf akta', taskType: 'document', order: 2 },
      { title: 'Review Draft', description: 'Review draf akta', taskType: 'review', order: 3 },
      { title: 'Tanda Tangan', description: 'Proses penandatanganan', taskType: 'signing', order: 4 },
    ],
    SURAT_KUASA: [
      { title: 'Verifikasi Dokumen', description: 'Verifikasi dokumen surat kuasa', taskType: 'document', order: 1 },
      { title: 'Draft Akta', description: 'Menyusun draf surat kuasa', taskType: 'document', order: 2 },
      { title: 'Tanda Tangan', description: 'Proses penandatanganan', taskType: 'signing', order: 3 },
    ],
    PERJANJIAN: [
      { title: 'Verifikasi Dokumen', description: 'Verifikasi dokumen perjanjian', taskType: 'document', order: 1 },
      { title: 'Draft Akta', description: 'Menyusun draf perjanjian', taskType: 'document', order: 2 },
      { title: 'Tanda Tangan', description: 'Proses penandatanganan', taskType: 'signing', order: 3 },
    ],
    LAINNYA: [
      { title: 'Verifikasi Dokumen', description: 'Verifikasi dokumen', taskType: 'document', order: 1 },
      { title: 'Review', description: 'Review dokumen', taskType: 'review', order: 2 },
    ],
  };

  return tasksMap[serviceType] || [];
}

/**
 * Create a new transaction
 */
export async function createTransaction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  // Validate role
  const permission = canPerformAction(user.role, 'create');
  if (!permission.allowed) {
    return {
      success: false,
      error: permission.reason,
    };
  }

  try {
    const rawData = {
      serviceType: formData.get('serviceType'),
      priority: formData.get('priority'),
      clientId: formData.get('clientId'),
      parties: formData.get('parties'),
      scheduledDate: formData.get('scheduledDate'),
      notes: formData.get('notes'),
      internalNotes: formData.get('internalNotes'),
    };

    // Validate input
    const validatedData = CreateTransactionSchema.parse(rawData);

    // Generate transaction number and QR code
    const transactionNumber = generateTransactionNumber();
    const qrCode = generateQrCode();

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        transactionNumber,
        qrCode,
        serviceType: validatedData.serviceType as any,
        priority: validatedData.priority as any,
        clientId: validatedData.clientId,
        parties: validatedData.parties,
        scheduledDate: validatedData.scheduledDate ? new Date(validatedData.scheduledDate as string) : null,
        notes: validatedData.notes,
        internalNotes: validatedData.internalNotes,
        createdByUserId: user.id,
      },
      include: {
        client: {
          select: {
            id: true,
            clientCode: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Generate default checklist
    const defaultChecklist = generateDefaultChecklist(validatedData.serviceType);
    await Promise.all(
      defaultChecklist.map((item) =>
        db.transactionChecklist.create({
          data: {
            transactionId: transaction.id,
            documentType: item.documentType,
            documentName: item.documentName,
            required: item.required,
          },
        })
      )
    );

    // Generate default tasks
    const defaultTasks = generateDefaultTasks(validatedData.serviceType);
    await Promise.all(
      defaultTasks.map((item) =>
        db.transactionTask.create({
          data: {
            transactionId: transaction.id,
            title: item.title,
            description: item.description,
            taskType: item.taskType,
            order: item.order,
          },
        })
      )
    );

    // Log audit
    await logCreate(
      user.id,
      'Transaction',
      transaction.id,
      {
        transactionNumber: transaction.transactionNumber,
        serviceType: transaction.serviceType,
        priority: transaction.priority,
      }
    );

    // Revalidate paths
    revalidatePath('/dashboard/transactions');

    return {
      success: true,
      transaction,
    };
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    if (error.issues) {
      return {
        success: false,
        error: 'Validasi gagal: ' + error.issues.map((e: any) => e.message).join(', '),
      };
    }
    return {
      success: false,
      error: error.message || 'Gagal membuat transaksi',
    };
  }
}

/**
 * Get all transactions with pagination and filters
 */
export async function getTransactions(filters?: {
  search?: string;
  serviceType?: string;
  status?: string;
  priority?: string;
  clientId?: string;
  assignedTo?: string;
  page?: number;
  pageSize?: number;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  try {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { transactionNumber: { contains: filters.search } },
        { client: { name: { contains: filters.search } } },
        { assignedUser: { name: { contains: filters.search } } },
      ];
    }

    if (filters?.serviceType) {
      where.serviceType = filters.serviceType;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    // Kurir can only see transactions assigned to them in delivery
    if (user.role === 'KURIR') {
      where.assignedTo = user.id;
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              clientCode: true,
              name: true,
              email: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          checklists: {
            select: {
              id: true,
              status: true,
              required: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: pageSize,
      }),
      db.transaction.count({ where }),
    ]);

    return {
      success: true,
      transactions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengambil data transaksi',
      transactions: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

/**
 * Get a single transaction by ID
 */
export async function getTransactionById(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  try {
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            clientCode: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            province: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        tasks: {
          orderBy: { order: 'asc' },
        },
        checklists: {
          orderBy: { required: 'desc' },
        },
        deliveries: {
          include: {
            courier: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!transaction) {
      return {
        success: false,
        error: 'Transaksi tidak ditemukan',
      };
    }

    // Log read access
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.READ,
        entityType: 'Transaction',
        entityId: transaction.id,
        description: `Viewed transaction: ${transaction.transactionNumber}`,
      },
    });

    // Get allowed next statuses
    const allowedNextStatuses = getAllowedNextStatuses(transaction.status);

    return {
      success: true,
      transaction,
      allowedNextStatuses,
    };
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengambil data transaksi',
    };
  }
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  // Validate role
  const permission = canPerformAction(user.role, 'update');
  if (!permission.allowed) {
    return {
      success: false,
      error: permission.reason,
    };
  }

  try {
    const existingTransaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return {
        success: false,
        error: 'Transaksi tidak ditemukan',
      };
    }

    const rawData = {
      serviceType: formData.get('serviceType'),
      priority: formData.get('priority'),
      clientId: formData.get('clientId'),
      assignedTo: formData.get('assignedTo'),
      parties: formData.get('parties'),
      scheduledDate: formData.get('scheduledDate'),
      notes: formData.get('notes'),
      internalNotes: formData.get('internalNotes'),
    };

    const validatedData = UpdateTransactionSchema.parse(rawData);

    const updateData: any = {};

    if (validatedData.serviceType) {
      updateData.serviceType = validatedData.serviceType;
    }
    if (validatedData.priority) {
      updateData.priority = validatedData.priority;
    }
    if (validatedData.clientId !== undefined) {
      updateData.clientId = validatedData.clientId;
    }
    if (validatedData.assignedTo) {
      updateData.assignedTo = validatedData.assignedTo;
      updateData.assignedAt = new Date();
    }
    if (validatedData.parties !== undefined) {
      updateData.parties = validatedData.parties;
    }
    if (validatedData.scheduledDate) {
      updateData.scheduledDate = new Date(validatedData.scheduledDate as string);
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }
    if (validatedData.internalNotes !== undefined) {
      updateData.internalNotes = validatedData.internalNotes;
    }

    const updatedTransaction = await db.transaction.update({
      where: { id },
      data: updateData,
    });

    // Log audit
    await logUpdate(
      user.id,
      'Transaction',
      updatedTransaction.id,
      existingTransaction,
      updatedTransaction
    );

    // Revalidate paths
    revalidatePath('/dashboard/transactions');
    revalidatePath(`/dashboard/transactions/${id}`);

    return {
      success: true,
      transaction: updatedTransaction,
    };
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    if (error.issues) {
      return {
        success: false,
        error: 'Validasi gagal: ' + error.issues.map((e: any) => e.message).join(', '),
      };
    }
    return {
      success: false,
      error: error.message || 'Gagal mengubah transaksi',
    };
  }
}

/**
 * Transition transaction status
 */
export async function transitionTransactionStatus(
  id: string,
  newStatus: string,
  notes?: string
) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  try {
    const existingTransaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return {
        success: false,
        error: 'Transaksi tidak ditemukan',
      };
    }

    // Validate status transition
    if (!isValidStatusTransition(existingTransaction.status, newStatus)) {
      const allowedTransitions = getAllowedNextStatuses(existingTransaction.status);
      return {
        success: false,
        error: `Transisi status tidak valid. Dari ${existingTransaction.status}, status yang diizinkan: ${allowedTransitions.join(', ')}`,
      };
    }

    // Role-based permission checks for specific transitions
    if (newStatus === 'SIGNING' || newStatus === 'SIGNED') {
      if (user.role !== 'ADMIN') {
        return {
          success: false,
          error: 'Hanya Notaris yang dapat mengubah status ke penandatanganan',
        };
      }
    }

    const updateData: any = {
      status: newStatus as any,
    };

    // Set completion time if completed
    if (newStatus === 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.actualCompletion = new Date();
    }

    const updatedTransaction = await db.transaction.update({
      where: { id },
      data: updateData,
    });

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.UPDATE,
        entityType: 'Transaction',
        entityId: updatedTransaction.id,
        oldValue: JSON.stringify({ status: existingTransaction.status }),
        newValue: JSON.stringify({ status: newStatus, notes }),
        description: `Status changed from ${existingTransaction.status} to ${newStatus} for transaction: ${updatedTransaction.transactionNumber}`,
        metadata: JSON.stringify({ notes }),
      },
    });

    // Revalidate paths
    revalidatePath('/dashboard/transactions');
    revalidatePath(`/dashboard/transactions/${id}`);

    return {
      success: true,
      transaction: updatedTransaction,
      message: `Status berhasil diubah dari ${existingTransaction.status} ke ${newStatus}`,
    };
  } catch (error: any) {
    console.error('Error transitioning transaction status:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengubah status transaksi',
    };
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  transactionId: string,
  taskId: string,
  status: string,
  notes?: string
) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  try {
    const existingTask = await db.transactionTask.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return {
        success: false,
        error: 'Tugas tidak ditemukan',
      };
    }

    const updateData: any = {
      status: status as any,
    };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.completedBy = user.id;
      updateData.completedNotes = notes;
    }

    const updatedTask = await db.transactionTask.update({
      where: { id: taskId },
      data: updateData,
    });

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.UPDATE,
        entityType: 'Task',
        entityId: updatedTask.id,
        oldValue: JSON.stringify({ status: existingTask.status }),
        newValue: JSON.stringify({ status, notes }),
        description: `Task status updated: ${updatedTask.title}`,
        metadata: JSON.stringify({ transactionId, notes }),
      },
    });

    // Revalidate paths
    revalidatePath(`/dashboard/transactions/${transactionId}`);

    return {
      success: true,
      task: updatedTask,
    };
  } catch (error: any) {
    console.error('Error updating task status:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengubah status tugas',
    };
  }
}

/**
 * Update checklist item status
 */
export async function updateChecklistItemStatus(
  transactionId: string,
  checklistId: string,
  status: string,
  fileId?: string,
  verificationNotes?: string,
  rejectionReason?: string
) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  try {
    const existingChecklist = await db.transactionChecklist.findUnique({
      where: { id: checklistId },
    });

    if (!existingChecklist) {
      return {
        success: false,
        error: 'Item checklist tidak ditemukan',
      };
    }

    const updateData: any = {
      status: status as any,
    };

    if (fileId) {
      updateData.fileId = fileId;
    }

    if (status === 'UPLOADED') {
      updateData.uploadedAt = new Date();
    }

    if (status === 'VERIFIED') {
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = user.id;
      updateData.verificationNotes = verificationNotes;
    }

    if (status === 'REJECTED') {
      updateData.rejectionReason = rejectionReason;
    }

    const updatedChecklist = await db.transactionChecklist.update({
      where: { id: checklistId },
      data: updateData,
    });

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.UPDATE,
        entityType: 'Checklist',
        entityId: updatedChecklist.id,
        oldValue: JSON.stringify({ status: existingChecklist.status }),
        newValue: JSON.stringify({ status, fileId }),
        description: `Checklist item updated: ${updatedChecklist.documentName}`,
        metadata: JSON.stringify({ transactionId, verificationNotes, rejectionReason }),
      },
    });

    // Revalidate paths
    revalidatePath(`/dashboard/transactions/${transactionId}`);

    return {
      success: true,
      checklist: updatedChecklist,
    };
  } catch (error: any) {
    console.error('Error updating checklist item:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengubah status checklist',
    };
  }
}

/**
 * Create or update delivery
 */
export async function updateDelivery(transactionId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  try {
    const rawData = {
      recipientName: formData.get('recipientName'),
      recipientPhone: formData.get('recipientPhone'),
      deliveryAddress: formData.get('deliveryAddress'),
      city: formData.get('city'),
      province: formData.get('province'),
      postalCode: formData.get('postalCode'),
      specialInstructions: formData.get('specialInstructions'),
      courierId: formData.get('courierId'),
      courierName: formData.get('courierName'),
      courierCompany: formData.get('courierCompany'),
    };

    // Check if delivery exists
    const existingDelivery = await db.delivery.findFirst({
      where: { transactionId },
    });

    let delivery;

    if (existingDelivery) {
      // Update existing delivery
      const updateData: any = {};
      if (rawData.recipientName) updateData.recipientName = rawData.recipientName;
      if (rawData.recipientPhone) updateData.recipientPhone = rawData.recipientPhone;
      if (rawData.deliveryAddress) updateData.deliveryAddress = rawData.deliveryAddress;
      if (rawData.city) updateData.city = rawData.city;
      if (rawData.province) updateData.province = rawData.province;
      if (rawData.postalCode) updateData.postalCode = rawData.postalCode;
      if (rawData.specialInstructions) updateData.specialInstructions = rawData.specialInstructions;
      if (rawData.courierId) {
        updateData.courierId = rawData.courierId;
        updateData.assignedAt = new Date();
      }
      if (rawData.courierName) updateData.courierName = rawData.courierName;
      if (rawData.courierCompany) updateData.courierCompany = rawData.courierCompany;

      delivery = await db.delivery.update({
        where: { id: existingDelivery.id },
        data: updateData,
      });
    } else {
      // Create new delivery
      delivery = await db.delivery.create({
        data: {
          transactionId,
          recipientName: rawData.recipientName as string,
          recipientPhone: rawData.recipientPhone as string | undefined,
          deliveryAddress: rawData.deliveryAddress as string,
          city: rawData.city as string | undefined,
          province: rawData.province as string | undefined,
          postalCode: rawData.postalCode as string | undefined,
          specialInstructions: rawData.specialInstructions as string | undefined,
          courierId: rawData.courierId as string | undefined,
          courierName: rawData.courierName as string | undefined,
          courierCompany: rawData.courierCompany as string | undefined,
        },
      });
    }

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.UPDATE,
        entityType: 'Delivery',
        entityId: delivery.id,
        description: `Delivery updated for transaction: ${transactionId}`,
      },
    });

    // Revalidate paths
    revalidatePath(`/dashboard/transactions/${transactionId}`);

    return {
      success: true,
      delivery,
    };
  } catch (error: any) {
    console.error('Error updating delivery:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengupdate pengiriman',
    };
  }
}

/**
 * Update delivery status
 */
export async function updateDeliveryStatus(
  transactionId: string,
  deliveryId: string,
  status: string,
  trackingNumber?: string,
  notes?: string,
  failureReason?: string
) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  try {
    const existingDelivery = await db.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!existingDelivery) {
      return {
        success: false,
        error: 'Pengiriman tidak ditemukan',
      };
    }

    const updateData: any = {
      status: status as any,
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (notes) {
      updateData.notes = notes;
    }

    if (failureReason) {
      updateData.failureReason = failureReason;
    }

    // Update timestamps based on status
    if (status === 'PICKED_UP') {
      updateData.pickedUpAt = new Date();
    } else if (status === 'IN_TRANSIT') {
      updateData.inTransitAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    } else if (status === 'FAILED') {
      updateData.attemptedAt = new Date();
    }

    const updatedDelivery = await db.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });

    // If delivered, update transaction status
    if (status === 'DELIVERED') {
      await db.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          actualCompletion: new Date(),
        },
      });
    }

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.UPDATE,
        entityType: 'Delivery',
        entityId: updatedDelivery.id,
        oldValue: JSON.stringify({ status: existingDelivery.status }),
        newValue: JSON.stringify({ status, trackingNumber }),
        description: `Delivery status updated to ${status}`,
        metadata: JSON.stringify({ notes, failureReason }),
      },
    });

    // Revalidate paths
    revalidatePath('/dashboard/transactions');
    revalidatePath(`/dashboard/transactions/${transactionId}`);

    return {
      success: true,
      delivery: updatedDelivery,
    };
  } catch (error: any) {
    console.error('Error updating delivery status:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengubah status pengiriman',
    };
  }
}