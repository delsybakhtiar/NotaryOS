// ============================================
// KYC VERIFICATION API ROUTE
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyKyc } from '@/lib/actions/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only ADMIN can verify KYC
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Hanya Notaris yang dapat memverifikasi KYC' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const clientId = formData.get('clientId') as string;
    const action = formData.get('action') as string;

    if (!clientId || !action) {
      return NextResponse.json(
        { success: false, error: 'clientId dan action harus disertakan' },
        { status: 400 }
      );
    }

    const kycStatus = action === 'verify' ? 'VERIFIED' : 'REJECTED';

    const result = await verifyKyc(clientId, kycStatus);

    if (!result.success) {
      return NextResponse.json(
        result,
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `KYC berhasil ${action === 'verify' ? 'disetujui' : 'ditolak'}`,
      client: result.client,
    });
  } catch (error: any) {
    console.error('Error in KYC verification API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Terjadi kesalahan pada server',
      },
      { status: 500 }
    );
  }
}