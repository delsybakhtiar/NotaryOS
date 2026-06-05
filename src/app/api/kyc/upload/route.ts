// ============================================
// KYC UPLOAD API (Placeholder)
// Placeholder for KYC document upload
// ============================================

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 400 },
      );
    }

    // TODO: Implement actual file upload
    // 1. Validate file type (PDF, JPG, PNG)
    // 2. Validate file size (max 10MB)
    // 3. Upload to storage (local/cloud storage)
    // 4. Update Client model with fileUrl
    // 5. Log audit

    console.log('Upload request:', {
      clientId,
      documentType,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Fitur upload KYC belum diimplementasi. Ini adalah placeholder UI.',
      },
      { status: 501 },
    );
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengupload file' },
      { status: 500 },
    );
  }
}