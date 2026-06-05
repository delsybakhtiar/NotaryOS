// ============================================
// DOCUMENT STATUS TRANSITION API ROUTE
// POST /api/documents/[id]/status - Transition document status
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { transitionDocumentStatus } from '@/lib/actions/document';
import { DocumentStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { newStatus, notes } = body;

    if (!newStatus) {
      return NextResponse.json(
        { success: false, error: 'Status baru harus diisi' },
        { status: 400 },
      );
    }

    const result = await transitionDocumentStatus(
      params.id,
      newStatus as DocumentStatus,
      notes,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/documents/[id]/status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}