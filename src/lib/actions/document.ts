'use server';

// ============================================
// DOCUMENT SERVER ACTIONS
// CRUD operations with audit logging and version control
// ============================================

import { db } from '@/lib/db';
import { logCreate, logUpdate, logDelete } from '@/lib/audit-logger';
import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
  TransitionStatusSchema,
  CreateVersionSchema,
  isValidStatusTransition,
} from '@/lib/validations/document';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AuditAction, DocumentStatus, UserRole } from '@prisma/client';

// Helper function to get current user session
async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return session.user;
}

// Helper function to generate document number
function generateDocumentNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `AKTA-${year}-${random}`;
}

// Helper function to generate QR code
function generateQrCode(): string {
  return `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new document
 */
export async function createDocument(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  // Validate role - ADMIN and STAFF can create documents
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF) {
    return {
      success: false,
      error: 'Anda tidak memiliki izin untuk membuat dokumen',
    };
  }

  try {
    const rawData = {
      clientId: formData.get('clientId'),
      title: formData.get('title'),
      documentType: formData.get('documentType'),
      description: formData.get('description'),
      content: formData.get('content'),
      documentDate: formData.get('documentDate'),
      effectiveDate: formData.get('effectiveDate'),
      parties: formData.get('parties'),
      tags: formData.get('tags'),
      notes: formData.get('notes'),
    };

    // Validate input
    const validatedData = CreateDocumentSchema.parse(rawData);

    // Generate document number and QR code
    const documentNumber = generateDocumentNumber();
    const qrCode = generateQrCode();

    // Create document
    const document = await db.document.create({
      data: {
        documentNumber,
        qrCode,
        title: validatedData.title,
        documentType: validatedData.documentType as any,
        description: validatedData.description,
        content: validatedData.content,
        documentDate: validatedData.documentDate ? new Date(validatedData.documentDate as string) : null,
        effectiveDate: validatedData.effectiveDate ? new Date(validatedData.effectiveDate as string) : null,
        parties: validatedData.parties,
        tags: validatedData.tags,
        notes: validatedData.notes,
        status: DocumentStatus.DRAFT,
        clientId: validatedData.clientId,
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
      },
    });

    // Create initial version
    if (validatedData.content) {
      await db.documentVersion.create({
        data: {
          documentId: document.id,
          version: 1,
          content: validatedData.content,
          changeNotes: 'Initial version',
          createdBy: user.id,
        },
      });
    }

    // Log audit
    await logCreate(
      user.id,
      'Document',
      document.id,
      {
        documentNumber: document.documentNumber,
        title: document.title,
        documentType: document.documentType,
        status: document.status,
      },
    );

    // Revalidate path
    revalidatePath('/dashboard/documents');
    revalidatePath('/dashboard/documents/new');

    return {
      success: true,
      document,
    };
  } catch (error: any) {
    console.error('Error creating document:', error);
    if (error.issues) {
      return {
        success: false,
        error: 'Validasi gagal: ' + error.issues.map((e: any) => e.message).join(', '),
      };
    }
    return {
      success: false,
      error: error.message || 'Gagal membuat dokumen',
    };
  }
}

/**
 * Get all documents with pagination and filters
 */
export async function getDocuments(filters?: {
  search?: string;
  documentType?: string;
  status?: string;
  clientId?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  try {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { documentNumber: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    if (filters?.documentType) {
      where.documentType = filters.documentType;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    const documents = await db.document.findMany({
      where,
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
            role: true,
          },
        },
        versions: {
          select: {
            id: true,
            version: true,
            createdAt: true,
          },
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      documents,
    };
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengambil data dokumen',
      documents: [],
    };
  }
}

/**
 * Get a single document by ID
 */
export async function getDocumentById(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  try {
    const document = await db.document.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            clientCode: true,
            name: true,
            email: true,
            phone: true,
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
        versions: {
          orderBy: {
            version: 'desc',
          },
        },
      },
    });

    if (!document) {
      return {
        success: false,
        error: 'Dokumen tidak ditemukan',
      };
    }

    // Log read access
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.READ,
        entityType: 'Document',
        entityId: document.id,
        description: `Viewed document: ${document.documentNumber} - ${document.title}`,
      },
    });

    return {
      success: true,
      document,
    };
  } catch (error: any) {
    console.error('Error fetching document:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengambil data dokumen',
    };
  }
}

/**
 * Update an existing document
 */
export async function updateDocument(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  // Validate role
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF) {
    return {
      success: false,
      error: 'Anda tidak memiliki izin untuk mengubah dokumen',
    };
  }

  try {
    // Get existing document
    const existingDocument = await db.document.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      return {
        success: false,
        error: 'Dokumen tidak ditemukan',
      };
    }

    // Check if document is locked (signed or archived)
    if (existingDocument.status === DocumentStatus.ARCHIVED) {
      return {
        success: false,
        error: 'Dokumen yang sudah diarsipkan tidak dapat diubah',
      };
    }

    if (existingDocument.status === DocumentStatus.SIGNING) {
      return {
        success: false,
        error: 'Dokumen dalam proses penandatanganan tidak dapat diubah',
      };
    }

    const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      content: formData.get('content'),
      documentDate: formData.get('documentDate'),
      effectiveDate: formData.get('effectiveDate'),
      parties: formData.get('parties'),
      tags: formData.get('tags'),
      notes: formData.get('notes'),
      changeNotes: formData.get('changeNotes'),
    };

    // Validate input
    const validatedData = UpdateDocumentSchema.parse(rawData);

    // Track content changes for versioning
    let newContent = validatedData.content;
    let oldContent = existingDocument.content;

    // Update document
    const updatedDocument = await db.document.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        content: validatedData.content,
        documentDate: validatedData.documentDate ? new Date(validatedData.documentDate as string) : undefined,
        effectiveDate: validatedData.effectiveDate ? new Date(validatedData.effectiveDate as string) : undefined,
        parties: validatedData.parties,
        tags: validatedData.tags,
        notes: validatedData.notes,
      },
    });

    // Create new version if content changed
    if (newContent && newContent !== oldContent) {
      // Get latest version number
      const latestVersion = await db.documentVersion.findFirst({
        where: { documentId: id },
        orderBy: { version: 'desc' },
      });

      const newVersionNumber = (latestVersion?.version || 0) + 1;

      await db.documentVersion.create({
        data: {
          documentId: id,
          version: newVersionNumber,
          content: newContent,
          changeNotes: validatedData.changeNotes || 'Update',
          createdBy: user.id,
        },
      });
    }

    // Log audit
    await logUpdate(
      user.id,
      'Document',
      updatedDocument.id,
      existingDocument,
      updatedDocument,
    );

    // Revalidate paths
    revalidatePath('/dashboard/documents');
    revalidatePath(`/dashboard/documents/${id}`);

    return {
      success: true,
      document: updatedDocument,
    };
  } catch (error: any) {
    console.error('Error updating document:', error);
    if (error.issues) {
      return {
        success: false,
        error: 'Validasi gagal: ' + error.issues.map((e: any) => e.message).join(', '),
      };
    }
    return {
      success: false,
      error: error.message || 'Gagal mengubah dokumen',
    };
  }
}

/**
 * Transition document status with state machine validation
 */
export async function transitionDocumentStatus(
  id: string,
  newStatus: DocumentStatus,
  notes?: string,
) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  try {
    // Get existing document
    const existingDocument = await db.document.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      return {
        success: false,
        error: 'Dokumen tidak ditemukan',
      };
    }

    // Validate status transition using state machine
    if (!isValidStatusTransition(existingDocument.status, newStatus)) {
      const allowedTransitions = getAllowedTransitions(existingDocument.status).join(', ');
      return {
        success: false,
        error: `Transisi status tidak valid. Dari ${existingDocument.status}, Anda hanya dapat melanjutkan ke: ${allowedTransitions}`,
      };
    }

    // Role-based permission checks
    if (newStatus === DocumentStatus.SIGNING) {
      // Only ADMIN can move to SIGNING
      if (user.role !== UserRole.ADMIN) {
        return {
          success: false,
          error: 'Hanya Notaris yang dapat mengubah status ke PENANDATANGANAN',
        };
      }
    }

    if (newStatus === DocumentStatus.REVIEW) {
      // ADMIN and STAFF can move to REVIEW
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF) {
        return {
          success: false,
          error: 'Anda tidak memiliki izin untuk mengubah status ke REVIEW',
        };
      }
    }

    // Prepare update data
    const updateData: any = {
      status: newStatus,
    };

    // Set reviewer info if moving to REVIEW
    if (newStatus === DocumentStatus.REVIEW && !existingDocument.reviewedBy) {
      updateData.reviewedBy = user.id;
      updateData.reviewedAt = new Date();
    }

    // Set signer info if moving to SIGNING
    if (newStatus === DocumentStatus.SIGNING && !existingDocument.signedBy) {
      updateData.signedBy = user.id;
      updateData.signedAt = new Date();
      // Set document date if not set
      if (!existingDocument.documentDate) {
        updateData.documentDate = new Date();
      }
    }

    // Update document status
    const updatedDocument = await db.document.update({
      where: { id },
      data: updateData,
    });

    // Log audit with status change details
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.UPDATE,
        entityType: 'Document',
        entityId: updatedDocument.id,
        oldValue: JSON.stringify({ status: existingDocument.status }),
        newValue: JSON.stringify({ status: newStatus, notes }),
        description: `Status changed from ${existingDocument.status} to ${newStatus} for document: ${updatedDocument.documentNumber}`,
        metadata: JSON.stringify({ notes }),
      },
    });

    // Revalidate paths
    revalidatePath('/dashboard/documents');
    revalidatePath(`/dashboard/documents/${id}`);

    return {
      success: true,
      document: updatedDocument,
      message: `Status berhasil diubah dari ${existingDocument.status} ke ${newStatus}`,
    };
  } catch (error: any) {
    console.error('Error transitioning document status:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengubah status dokumen',
    };
  }
}

/**
 * Get allowed transitions for a document
 */
export async function getAllowedTransitions(documentId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const document = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return { success: false, error: 'Dokumen tidak ditemukan' };
    }

    // Get allowed transitions based on current status
    const transitions = getAllowedTransitionsFromStatus(document.status);

    return {
      success: true,
      transitions,
    };
  } catch (error: any) {
    console.error('Error getting allowed transitions:', error);
    return {
      success: false,
      error: error.message || 'Gagal mendapatkan transisi yang diizinkan',
    };
  }
}

/**
 * Helper function to get allowed transitions from status
 */
function getAllowedTransitionsFromStatus(currentStatus: DocumentStatus): DocumentStatus[] {
  const transitions: Record<DocumentStatus, DocumentStatus[]> = {
    DRAFT: [DocumentStatus.REVIEW, DocumentStatus.ARCHIVED],
    REVIEW: [DocumentStatus.DRAFT, DocumentStatus.SIGNING, DocumentStatus.ARCHIVED],
    SIGNING: [DocumentStatus.ARCHIVED],
    ARCHIVED: [],
  };

  return transitions[currentStatus] || [];
}

/**
 * Delete a document (soft delete or hard delete)
 */
export async function deleteDocument(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  // Only Admin can delete documents
  if (user.role !== UserRole.ADMIN) {
    return {
      success: false,
      error: 'Hanya Notaris yang dapat menghapus dokumen',
    };
  }

  try {
    // Get existing document
    const existingDocument = await db.document.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      return {
        success: false,
        error: 'Dokumen tidak ditemukan',
      };
    }

    // Check if document is signed
    if (existingDocument.status === DocumentStatus.SIGNING || existingDocument.signedAt) {
      return {
        success: false,
        error: 'Dokumen yang sudah ditandatangani tidak dapat dihapus',
      };
    }

    // Delete document (will cascade to versions)
    await db.document.delete({
      where: { id },
    });

    // Log audit
    await logDelete(
      user.id,
      'Document',
      existingDocument.id,
      existingDocument,
    );

    // Revalidate path
    revalidatePath('/dashboard/documents');

    return {
      success: true,
      message: 'Dokumen berhasil dihapus',
    };
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return {
      success: false,
      error: error.message || 'Gagal menghapus dokumen',
    };
  }
}