import { NextRequest, NextResponse } from 'next/server';
import { updateChecklistItemStatus } from '@/lib/actions/transaction';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; checklistId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const status = formData.get('status') as string;
    const fileId = formData.get('fileId') as string | undefined;
    const verificationNotes = formData.get('verificationNotes') as string | undefined;
    const rejectionReason = formData.get('rejectionReason') as string | undefined;

    const result = await updateChecklistItemStatus(
      params.id,
      params.checklistId,
      status,
      fileId,
      verificationNotes,
      rejectionReason
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update checklist status' },
      { status: 500 }
    );
  }
}