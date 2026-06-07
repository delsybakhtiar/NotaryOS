import { NextRequest, NextResponse } from 'next/server';
import { transitionTransactionStatus } from '@/lib/actions/transaction';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const newStatus = formData.get('newStatus') as string;
    const notes = formData.get('notes') as string | undefined;

    const result = await transitionTransactionStatus(params.id, newStatus, notes);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to transition status' },
      { status: 500 }
    );
  }
}