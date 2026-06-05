// ============================================
// KYC DELETE API (Placeholder)
// Placeholder for KYC document delete
// ============================================

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, documentType } = body;

    if (!clientId || !documentType) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak lengkap' },
        { status: 400 },
      );
    }

    // TODO: Implement actual file delete
    // 1. Delete file from storage
    // 2. Update Client model (set fileUrl to null)
    // 3. Log audit

    console.log('Delete request:', { clientId, documentType });

    return NextResponse.json(
      {
        success: false,
        error: 'Fitur hapus KYC belum diimplementasi. Ini adalah placeholder UI.',
      },
      { status: 501 },
    );
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus file' },
      { status: 500 },
    );
  }
}