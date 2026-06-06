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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Await params in Next.js 16
    const resolvedParams = await params;
    const documentId = resolvedParams.id;

    console.log('[POST /api/documents/[id]/status] Document ID:', documentId);

    // Validate document ID
    if (!documentId) {
      console.error('[POST /api/documents/[id]/status] Document ID is missing');
      return NextResponse.json(
        { success: false, error: 'Document ID is missing' },
        { status: 400 },
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
      documentId,
      newStatus as DocumentStatus,
      notes,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[POST /api/documents/[id]/status] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}