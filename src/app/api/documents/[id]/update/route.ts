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

    const formData = await request.formData();
    const result = await updateDocument(params.id, formData);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/documents/[id]/update:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}