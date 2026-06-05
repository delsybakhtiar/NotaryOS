// ============================================
// CLIENT VALIDATION SCHEMA
// Zod schemas for client form validation
// ============================================

import { z } from 'zod';

// Individual client schema
export const IndividualClientSchema = z.object({
  clientType: z.literal('INDIVIDUAL'),
  firstName: z.string().min(1, 'Nama depan wajib diisi'),
  lastName: z.string().min(1, 'Nama belakang wajib diisi'),
  nik: z.string().min(16, 'NIK harus 16 digit').max(16, 'NIK harus 16 digit').optional(),
  dateOfBirth: z.coerce.date().optional(),
  placeOfBirth: z.string().optional(),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
});

// Corporate client schema
export const CorporateClientSchema = z.object({
  clientType: z.literal('CORPORATE'),
  companyName: z.string().min(1, 'Nama perusahaan wajib diisi'),
  companyType: z.string().optional(),
  npwp: z.string().min(15, 'NPWP harus 15 digit').max(15, 'NPWP harus 15 digit').optional(),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
});

// Union schema for both types
export const ClientSchema = z.discriminatedUnion('clientType', [
  IndividualClientSchema,
  CorporateClientSchema,
]);

// Schema for update (all fields optional)
export const UpdateClientSchema = z.object({
  clientType: z.enum(['INDIVIDUAL', 'CORPORATE']).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nik: z.string().min(16, 'NIK harus 16 digit').max(16, 'NIK harus 16 digit').optional(),
  companyName: z.string().optional(),
  companyType: z.string().optional(),
  npwp: z.string().min(15, 'NPWP harus 15 digit').max(15, 'NPWP harus 15 digit').optional(),
  dateOfBirth: z.coerce.date().optional(),
  placeOfBirth: z.string().optional(),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED']).optional(),
  kycStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
});

// Schema for KYC verification
export const KycVerificationSchema = z.object({
  clientId: z.string().min(1, 'Client ID wajib diisi'),
  kycStatus: z.enum(['VERIFIED', 'REJECTED']),
  notes: z.string().optional(),
});

// Types
export type IndividualClientInput = z.infer<typeof IndividualClientSchema>;
export type CorporateClientInput = z.infer<typeof CorporateClientSchema>;
export type ClientInput = z.infer<typeof ClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type KycVerificationInput = z.infer<typeof KycVerificationSchema>;