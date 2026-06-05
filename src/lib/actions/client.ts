'use server';

// ============================================
// CLIENT SERVER ACTIONS
// CRUD operations with audit logging
// ============================================

import { db } from '@/lib/db';
import { logCreate, logUpdate, logDelete } from '@/lib/audit-logger';
import { ClientSchema, UpdateClientSchema, KycVerificationSchema } from '@/lib/validations/client';
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

// Helper function to generate client code
function generateClientCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `CLI-${year}-${random}`;
}

// Helper function to generate QR code
function generateQrCode(): string {
  return `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new client
 */
export async function createClient(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  // Validate role
  if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
    return {
      success: false,
      error: 'Anda tidak memiliki izin untuk menambah klien',
    };
  }

  try {
    const rawData = {
      clientType: formData.get('clientType'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      nik: formData.get('nik'),
      dateOfBirth: formData.get('dateOfBirth'),
      placeOfBirth: formData.get('placeOfBirth'),
      companyName: formData.get('companyName'),
      companyType: formData.get('companyType'),
      npwp: formData.get('npwp'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city'),
      province: formData.get('province'),
      postalCode: formData.get('postalCode'),
      notes: formData.get('notes'),
    };

    // Validate input
    const validatedData = ClientSchema.parse(rawData);

    // Generate client code and QR code
    const clientCode = generateClientCode();
    const qrCode = generateQrCode();

    // Determine name based on client type
    const name =
      validatedData.clientType === 'INDIVIDUAL'
        ? `${validatedData.firstName} ${validatedData.lastName}`.trim()
        : (validatedData.companyName || '').trim();

    // Create client
    const client = await db.client.create({
      data: {
        clientCode,
        qrCode,
        name,
        clientType: validatedData.clientType,
        firstName: validatedData.clientType === 'INDIVIDUAL' ? validatedData.firstName : null,
        lastName: validatedData.clientType === 'INDIVIDUAL' ? validatedData.lastName : null,
        nik: validatedData.clientType === 'INDIVIDUAL' ? validatedData.nik : null,
        dateOfBirth: validatedData.clientType === 'INDIVIDUAL' ? validatedData.dateOfBirth : null,
        placeOfBirth: validatedData.clientType === 'INDIVIDUAL' ? validatedData.placeOfBirth : null,
        companyName: validatedData.clientType === 'CORPORATE' ? validatedData.companyName : null,
        companyType: validatedData.clientType === 'CORPORATE' ? validatedData.companyType : null,
        npwp: validatedData.clientType === 'CORPORATE' ? validatedData.npwp : null,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        city: validatedData.city || null,
        province: validatedData.province || null,
        postalCode: validatedData.postalCode || null,
        notes: validatedData.notes || null,
        kycStatus: 'PENDING',
        createdByUserId: user.id,
      },
    });

    // Log audit
    await logCreate(
      user.id,
      'Client',
      client.id,
      {
        clientCode: client.clientCode,
        name: client.name,
        clientType: client.clientType,
        email: client.email,
      },
    );

    // Revalidate path
    revalidatePath('/dashboard/clients');

    return {
      success: true,
      client,
    };
  } catch (error: any) {
    console.error('Error creating client:', error);
    if (error.issues) {
      return {
        success: false,
        error: 'Validasi gagal: ' + error.issues.map((e: any) => e.message).join(', '),
      };
    }
    return {
      success: false,
      error: error.message || 'Gagal membuat klien',
    };
  }
}

/**
 * Get all clients with pagination and filters
 */
export async function getClients(filters?: {
  search?: string;
  clientType?: string;
  kycStatus?: string;
  status?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  try {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { clientCode: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } },
        { nik: { contains: filters.search } },
        { npwp: { contains: filters.search } },
      ];
    }

    if (filters?.clientType) {
      where.clientType = filters.clientType;
    }

    if (filters?.kycStatus) {
      where.kycStatus = filters.kycStatus;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const clients = await db.client.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      clients,
    };
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengambil data klien',
      clients: [],
    };
  }
}

/**
 * Get a single client by ID
 */
export async function getClientById(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  try {
    const client = await db.client.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        documents: {
          select: {
            id: true,
            documentNumber: true,
            documentType: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!client) {
      return {
        success: false,
        error: 'Klien tidak ditemukan',
      };
    }

    // Log read access
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.READ,
        entityType: 'Client',
        entityId: client.id,
        description: `Viewed client: ${client.clientCode} - ${client.name}`,
      },
    });

    return {
      success: true,
      client,
    };
  } catch (error: any) {
    console.error('Error fetching client:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengambil data klien',
    };
  }
}

/**
 * Update an existing client
 */
export async function updateClient(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  // Validate role
  if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
    return {
      success: false,
      error: 'Anda tidak memiliki izin untuk mengubah data klien',
    };
  }

  try {
    // Get existing client
    const existingClient = await db.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return {
        success: false,
        error: 'Klien tidak ditemukan',
      };
    }

    const rawData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      nik: formData.get('nik'),
      dateOfBirth: formData.get('dateOfBirth'),
      placeOfBirth: formData.get('placeOfBirth'),
      companyName: formData.get('companyName'),
      companyType: formData.get('companyType'),
      npwp: formData.get('npwp'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city'),
      province: formData.get('province'),
      postalCode: formData.get('postalCode'),
      notes: formData.get('notes'),
      status: formData.get('status'),
      kycStatus: formData.get('kycStatus'),
    };

    // Validate input
    const validatedData = UpdateClientSchema.parse(rawData);

    // Determine name based on client type
    let name = existingClient.name;
    if (validatedData.firstName && validatedData.lastName && existingClient.clientType === 'INDIVIDUAL') {
      name = `${validatedData.firstName} ${validatedData.lastName}`.trim();
    } else if (validatedData.companyName && existingClient.clientType === 'CORPORATE') {
      name = validatedData.companyName.trim();
    }

    // Update client
    const updatedClient = await db.client.update({
      where: { id },
      data: {
        name,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        nik: validatedData.nik,
        dateOfBirth: validatedData.dateOfBirth,
        placeOfBirth: validatedData.placeOfBirth,
        companyName: validatedData.companyName,
        companyType: validatedData.companyType,
        npwp: validatedData.npwp,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        city: validatedData.city || null,
        province: validatedData.province || null,
        postalCode: validatedData.postalCode || null,
        notes: validatedData.notes || null,
        status: validatedData.status as any,
        kycStatus: validatedData.kycStatus as any,
      },
    });

    // Log audit
    await logUpdate(
      user.id,
      'Client',
      updatedClient.id,
      existingClient,
      updatedClient,
    );

    // Revalidate path
    revalidatePath('/dashboard/clients');
    revalidatePath(`/dashboard/clients/${id}`);
    revalidatePath(`/dashboard/clients/${id}/edit`);

    return {
      success: true,
      client: updatedClient,
    };
  } catch (error: any) {
    console.error('Error updating client:', error);
    if (error.issues) {
      return {
        success: false,
        error: 'Validasi gagal: ' + error.issues.map((e: any) => e.message).join(', '),
      };
    }
    return {
      success: false,
      error: error.message || 'Gagal mengubah data klien',
    };
  }
}

/**
 * Verify KYC status
 */
export async function verifyKyc(clientId: string, kycStatus: 'VERIFIED' | 'REJECTED', notes?: string) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  // Only Admin can verify KYC
  if (user.role !== 'ADMIN') {
    return {
      success: false,
      error: 'Hanya Notaris yang dapat memverifikasi KYC',
    };
  }

  try {
    // Get existing client
    const existingClient = await db.client.findUnique({
      where: { id: clientId },
    });

    if (!existingClient) {
      return {
        success: false,
        error: 'Klien tidak ditemukan',
      };
    }

    // Update KYC status
    const updatedClient = await db.client.update({
      where: { id: clientId },
      data: {
        kycStatus: kycStatus as any,
        kycVerifiedAt: kycStatus === 'VERIFIED' ? new Date() : null,
        kycVerifiedBy: kycStatus === 'VERIFIED' ? user.id : null,
      },
    });

    // Log audit
    await logUpdate(
      user.id,
      'Client',
      updatedClient.id,
      {
        kycStatus: existingClient.kycStatus,
      },
      {
        kycStatus: updatedClient.kycStatus,
        notes,
      },
    );

    // Revalidate path
    revalidatePath('/dashboard/clients');
    revalidatePath(`/dashboard/clients/${clientId}`);

    return {
      success: true,
      client: updatedClient,
    };
  } catch (error: any) {
    console.error('Error verifying KYC:', error);
    return {
      success: false,
      error: error.message || 'Gagal memverifikasi KYC',
    };
  }
}

/**
 * Delete a client
 */
export async function deleteClient(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  // Only Admin can delete client
  if (user.role !== 'ADMIN') {
    return {
      success: false,
      error: 'Hanya Notaris yang dapat menghapus klien',
    };
  }

  try {
    // Get existing client
    const existingClient = await db.client.findUnique({
      where: { id },
      include: {
        documents: true,
      },
    });

    if (!existingClient) {
      return {
        success: false,
        error: 'Klien tidak ditemukan',
      };
    }

    // Check if client has documents
    if (existingClient.documents.length > 0) {
      return {
        success: false,
        error: 'Tidak dapat menghapus klien yang memiliki dokumen. Hapus dokumen terlebih dahulu.',
      };
    }

    // Delete client
    await db.client.delete({
      where: { id },
    });

    // Log audit
    await logDelete(
      user.id,
      'Client',
      existingClient.id,
      existingClient,
    );

    // Revalidate path
    revalidatePath('/dashboard/clients');

    return {
      success: true,
      message: 'Klien berhasil dihapus',
    };
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return {
      success: false,
      error: error.message || 'Gagal menghapus klien',
    };
  }
}