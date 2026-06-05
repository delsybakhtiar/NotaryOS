# ============================================
# DATABASE SEEDING SCRIPT (PostgreSQL)
# For testing in staging environment
# ============================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ============================================
  // USERS
  // ============================================

  console.log('Seeding users...');

  const hashedPassword = await bcrypt.hash('Admin@123456', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@notaryos.com' },
    update: {},
    create: {
      email: 'admin@notaryos.com',
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@notaryos.com' },
    update: {},
    create: {
      email: 'staff@notaryos.com',
      name: 'Staff User',
      password: await bcrypt.hash('Staff@123456', 12),
      role: 'STAFF',
    },
  });

  const financeUser = await prisma.user.upsert({
    where: { email: 'finance@notaryos.com' },
    update: {},
    create: {
      email: 'finance@notaryos.com',
      name: 'Finance User',
      password: await bcrypt.hash('Finance@123456', 12),
      role: 'FINANCE',
    },
  });

  console.log('✓ Users seeded');

  // ============================================
  // CLIENTS
  // ============================================

  console.log('Seeding clients...');

  const client1 = await prisma.client.create({
    data: {
      clientCode: 'CLI-TEST-0001',
      name: 'John Doe',
      clientType: 'INDIVIDUAL',
      firstName: 'John',
      lastName: 'Doe',
      nik: '1234567890123456',
      email: 'john.doe@example.com',
      phone: '+6281234567890',
      address: 'Jl. Test No. 1',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      postalCode: '12345',
      kycStatus: 'VERIFIED',
      qrCode: `QR-TEST-${Date.now()}-1`,
      createdByUserId: adminUser.id,
      kycVerifiedAt: new Date(),
      kycVerifiedBy: adminUser.id,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      clientCode: 'CLI-TEST-0002',
      name: 'PT Test Company',
      clientType: 'CORPORATE',
      companyType: 'PT',
      npwp: '123456789012345',
      email: 'info@testcompany.com',
      phone: '+6289876543210',
      address: 'Jl. Corporate No. 1',
      city: 'Surabaya',
      province: 'Jawa Timur',
      postalCode: '54321',
      kycStatus: 'PENDING',
      qrCode: `QR-TEST-${Date.now()}-2`,
      createdByUserId: staffUser.id,
    },
  });

  console.log('✓ Clients seeded');

  // ============================================
  // DOCUMENTS
  // ============================================

  console.log('Seeding documents...');

  const doc1 = await prisma.document.create({
    data: {
      documentNumber: 'AKTA-TEST-0001',
      title: 'Test Akta Pendirian',
      documentType: 'AKTA_PENDIRIAN',
      description: 'Test document for staging',
      content: 'This is a test document content.',
      status: 'DRAFT',
      qrCode: `QR-DOC-${Date.now()}-1`,
      clientId: client1.id,
      createdById: adminUser.id,
    },
  });

  // Create initial version
  await prisma.documentVersion.create({
    data: {
      documentId: doc1.id,
      version: 1,
      content: doc1.content,
      changeNotes: 'Initial version',
      createdBy: adminUser.id,
    },
  });

  const doc2 = await prisma.document.create({
    data: {
      documentNumber: 'AKTA-TEST-0002',
      title: 'Test Akta Perubahan',
      documentType: 'AKTA_PERUBAHAN',
      description: 'Test document 2 for staging',
      content: 'This is another test document content.',
      status: 'REVIEW',
      qrCode: `QR-DOC-${Date.now()}-2`,
      clientId: client2.id,
      createdById: staffUser.id,
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
    },
  });

  // Create initial version
  await prisma.documentVersion.create({
    data: {
      documentId: doc2.id,
      version: 1,
      content: doc2.content,
      changeNotes: 'Initial version',
      createdBy: staffUser.id,
    },
  });

  console.log('✓ Documents seeded');

  // ============================================
  // AUDIT LOGS
  // ============================================

  console.log('Seeding audit logs...');

  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'CREATE',
      entityType: 'Client',
      entityId: client1.id,
      description: 'Created test client',
      oldValue: null,
      newValue: JSON.stringify({ name: client1.name }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: staffUser.id,
      action: 'CREATE',
      entityType: 'Document',
      entityId: doc1.id,
      description: 'Created test document',
      oldValue: null,
      newValue: JSON.stringify({ title: doc1.title }),
    },
  });

  console.log('✓ Audit logs seeded');

  // ============================================
  // SUMMARY
  // ============================================

  console.log('==========================================');
  console.log('🎉 Database seeding complete!');
  console.log('==========================================');
  console.log(`Users: 3`);
  console.log(`Clients: 2`);
  console.log(`Documents: 2`);
  console.log(`Audit Logs: 2`);
  console.log('==========================================');

  console.log('\nTest Credentials:');
  console.log('==========================================');
  console.log('Admin: admin@notaryos.com / Admin@123456');
  console.log('Staff: staff@notaryos.com / Staff@123456');
  console.log('Finance: finance@notaryos.com / Finance@123456');
  console.log('==========================================');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });