'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/audit-logger';
import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
  TransitionStatusSchema,
  FilterDocumentsSchema,
  type CreateDocumentInput,
  type UpdateDocumentInput,
  type TransitionStatusInput,
} from '@/lib/validations/document';
import {
  isValidTransition,
  canTransitionDocument,
  getTransitionDetails,
} from '@/lib/document-state-machine';
import { DocumentStatus, DocumentType } from '@prisma/client';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';

// Helper: Generate document number
function generateDocumentNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `AKTA-${year}-${random}`;
}

// Helper: Generate QR code
function generateQRCode(): string {
  return `DOC-${nanoid(20)}`;
}

// Helper: Get current session
async function getSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session;
}

/**
 * Create a new document
 */
export async function createDocument(data: CreateDocumentInput) {
  try {
    const session = await getSession();
    const userId = session.user.id;

    // Validate input
    const validated = CreateDocumentSchema.parse(data);

    // Create document
    const document = await db.document.create({
      data: {
        documentNumber: generateDocumentNumber(),
        documentType: validated.documentType as DocumentType,
        title: validated.title,
        description: validated.description,
        content: validated.content,
        clientId: validated.clientId,
        documentDate: validated.documentDate,
        effectiveDate: validated.effectiveDate,
        parties: validated.parties,
        notes: validated.notes,
        tags: validated.tags,
        qrCode: generateQRCode(),
        status: DocumentStatus.DRAFT,
        createdByUserId: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            clientCode: true,
          },
        },
      },
    });

    // Create initial version
    await db.documentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        content: validated.content,
        changeNotes: 'Initial version',
        createdBy: userId,
      },
    });

    // Audit log
    await auditLog({
      userId,
      action: 'CREATE',
      entityType: 'Document',
      entityId: document.id,
      newValue: JSON.stringify({
        documentNumber: document.documentNumber,
        title: document.title,
        type: document.documentType,
        status: document.status,
      }),
      description: `Created new document: ${document.documentNumber} - ${document.title}`,
    });

    revalidatePath('/dashboard/documents');
    revalidatePath('/dashboard/documents/[id]');

    return {
      success: true,
      data: document,
    };
  } catch (error: any) {
    console.error('Error creating document:', error);

    if (error.name === 'ZodError') {
      return {
        success: false,
        error: error.errors?.[0]?.message || 'Validation error',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to create document',
    };
  }
}

/**
 * Update a document
 */
export async function updateDocument(data: UpdateDocumentInput) {
  try {
    const session = await getSession();
    const userId = session.user.id;

    // Validate input
    const validated = UpdateDocumentSchema.parse(data);

    // Get existing document
    const existingDocument = await db.document.findUnique({
      where: { id: validated.id },
    });

    if (!existingDocument) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    // Prepare update data
    const updateData: any = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.documentType !== undefined)
      updateData.documentType = validated.documentType as DocumentType;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.content !== undefined) {
      updateData.content = validated.content;

      // Create new version when content changes
      const latestVersion = await db.documentVersion.findFirst({
        where: { documentId: validated.id },
        orderBy: { version: 'desc' },
      });

      const newVersionNumber = (latestVersion?.version || 0) + 1;

      await db.documentVersion.create({
        data: {
          documentId: validated.id,
          version: newVersionNumber,
          content: validated.content,
          changeNotes: 'Content updated',
          createdBy: userId,
        },
      });
    }
    if (validated.clientId !== undefined)
      updateData.clientId = validated.clientId;
    if (validated.documentDate !== undefined)
      updateData.documentDate = validated.documentDate;
    if (validated.effectiveDate !== undefined)
      updateData.effectiveDate = validated.effectiveDate;
    if (validated.parties !== undefined) updateData.parties = validated.parties;
    if (validated.notes !== undefined) updateData.notes = validated.notes;
    if (validated.tags !== undefined) updateData.tags = validated.tags;

    // Update document
    const updatedDocument = await db.document.update({
      where: { id: validated.id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            clientCode: true,
          },
        },
      },
    });

    // Audit log
    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'Document',
      entityId: updatedDocument.id,
      oldValue: JSON.stringify({
        title: existingDocument.title,
        content: existingDocument.content,
      }),
      newValue: JSON.stringify({
        title: updatedDocument.title,
        content: updatedDocument.content,
      }),
      description: `Updated document: ${updatedDocument.documentNumber} - ${updatedDocument.title}`,
    });

    revalidatePath('/dashboard/documents');
    revalidatePath('/dashboard/documents/[id]');

    return {
      success: true,
      data: updatedDocument,
    };
  } catch (error: any) {
    console.error('Error updating document:', error);

    if (error.name === 'ZodError') {
      return {
        success: false,
        error: error.errors?.[0]?.message || 'Validation error',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to update document',
    };
  }
}

/**
 * Transition document status
 */
export async function transitionStatus(data: TransitionStatusInput) {
  try {
    const session = await getSession();
    const userId = session.user.id;

    // Get user role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Validate input
    const validated = TransitionStatusSchema.parse(data);

    // Get existing document
    const existingDocument = await db.document.findUnique({
      where: { id: validated.documentId },
    });

    if (!existingDocument) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    const currentStatus = existingDocument.status as DocumentStatus;
    const newStatus = validated.toStatus as DocumentStatus;

    // Check if transition is valid
    if (!isValidTransition(currentStatus, newStatus)) {
      return {
        success: false,
        error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
      };
    }

    // Check if user has permission
    if (!canTransitionDocument(user.role, currentStatus, newStatus)) {
      return {
        success: false,
        error: 'You do not have permission to perform this status transition',
      };
    }

    // Get transition details
    const transitionDetails = getTransitionDetails(currentStatus, newStatus);

    // Update document status
    const updatedDocument = await db.document.update({
      where: { id: validated.documentId },
      data: {
        status: newStatus,
        reviewedBy: newStatus === DocumentStatus.REVIEW ? userId : existingDocument.reviewedBy,
        reviewedAt: newStatus === DocumentStatus.REVIEW ? new Date() : existingDocument.reviewedAt,
        signedBy: newStatus === DocumentStatus.SIGNING ? userId : existingDocument.signedBy,
        signedAt: newStatus === DocumentStatus.SIGNING ? new Date() : existingDocument.signedAt,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            clientCode: true,
          },
        },
      },
    });

    // Audit log
    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'Document',
      entityId: updatedDocument.id,
      oldValue: JSON.stringify({ status: currentStatus }),
      newValue: JSON.stringify({ status: newStatus }),
      description: `Transitioned document ${updatedDocument.documentNumber} from ${currentStatus} to ${newStatus}: ${transitionDetails?.description}`,
    });

    revalidatePath('/dashboard/documents');
    revalidatePath('/dashboard/documents/[id]');

    return {
      success: true,
      data: updatedDocument,
      message: `Document status updated to ${newStatus}`,
    };
  } catch (error: any) {
    console.error('Error transitioning document status:', error);

    if (error.name === 'ZodError') {
      return {
        success: false,
        error: error.errors?.[0]?.message || 'Validation error',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to transition document status',
    };
  }
}

/**
 * Get documents with filters
 */
export async function getDocuments(filters?: {
  status?: DocumentStatus;
  documentType?: DocumentType;
  clientId?: string;
  search?: string;
}) {
  try {
    const session = await getSession();
    const userId = session.user.id;

    // Build where clause
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.documentType) {
      where.documentType = filters.documentType;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { documentNumber: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    // Get documents
    const documents = await db.document.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            clientCode: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Audit log (READ action)
    await auditLog({
      userId,
      action: 'READ',
      entityType: 'Document',
      description: 'Viewed document list',
    });

    return {
      success: true,
      data: documents,
    };
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch documents',
    };
  }
}

/**
 * Get document by ID
 */
export async function getDocumentById(documentId: string) {
  try {
    const session = await getSession();
    const userId = session.user.id;

    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            clientCode: true,
            clientType: true,
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
        error: 'Document not found',
      };
    }

    // Audit log (READ action)
    await auditLog({
      userId,
      action: 'READ',
      entityType: 'Document',
      entityId: document.id,
      description: `Viewed document: ${document.documentNumber} - ${document.title}`,
    });

    return {
      success: true,
      data: document,
    };
  } catch (error: any) {
    console.error('Error fetching document:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch document',
    };
  }
}

/**
 * Delete a document (soft delete by archiving)
 */
export async function deleteDocument(documentId: string) {
  try {
    const session = await getSession();
    const userId = session.user.id;

    // Get existing document
    const existingDocument = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!existingDocument) {
      return {
        success: false,
        error: 'Document not found',
      };
    }

    // Delete document (this will cascade delete versions)
    const deletedDocument = await db.document.delete({
      where: { id: documentId },
    });

    // Audit log
    await auditLog({
      userId,
      action: 'DELETE',
      entityType: 'Document',
      entityId: documentId,
      oldValue: JSON.stringify({
        documentNumber: existingDocument.documentNumber,
        title: existingDocument.title,
      }),
      description: `Deleted document: ${existingDocument.documentNumber} - ${existingDocument.title}`,
    });

    revalidatePath('/dashboard/documents');
    revalidatePath('/dashboard/documents/[id]');

    return {
      success: true,
      data: deletedDocument,
    };
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete document',
    };
  }
}