// ============================================
// DOCUMENT DETAIL API ROUTE
// GET /api/documents/[id] - Get document by ID
// DELETE /api/documents/[id] - Delete document
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, deleteDocument } from '@/lib/actions/document';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
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

    console.log('[GET /api/documents/[id]] Document ID:', documentId);

    // Validate document ID
    if (!documentId) {
      console.error('[GET /api/documents/[id]] Document ID is missing');
      return NextResponse.json(
        { success: false, error: 'Document ID is missing' },
        { status: 400 },
      );
    }

    const result = await getDocumentById(documentId);
    console.log('[GET /api/documents/[id]] Result:', result.success ? 'Success' : 'Failed');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[GET /api/documents/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    console.log('[DELETE /api/documents/[id]] Document ID:', documentId);

    // Validate document ID
    if (!documentId) {
      console.error('[DELETE /api/documents/[id]] Document ID is missing');
      return NextResponse.json(
        { success: false, error: 'Document ID is missing' },
        { status: 400 },
      );
    }

    const result = await deleteDocument(documentId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[DELETE /api/documents/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}