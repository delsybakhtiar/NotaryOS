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

    const result = await getDocumentById(params.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/documents/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    const result = await deleteDocument(params.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in DELETE /api/documents/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}