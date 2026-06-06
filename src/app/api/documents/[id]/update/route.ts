// ============================================
// DOCUMENT UPDATE API ROUTE
// POST /api/documents/[id]/update - Update document
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { updateDocument } from '@/lib/actions/document';
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

    console.log('[POST /api/documents/[id]/update] Document ID:', documentId);

    // Validate document ID
    if (!documentId) {
      console.error('[POST /api/documents/[id]/update] Document ID is missing');
      return NextResponse.json(
        { success: false, error: 'Document ID is missing' },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const result = await updateDocument(documentId, formData);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[POST /api/documents/[id]/update] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}