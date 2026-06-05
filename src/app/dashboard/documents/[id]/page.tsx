import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getDocumentById } from '@/lib/actions/document';
import { db } from '@/lib/db';
import { DocumentDetail } from '@/components/documents/document-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Get document details
  const result = await getDocumentById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  // Get available clients
  const availableClients = await db.client.findMany({
    where: {
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      clientCode: true,
      clientType: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="p-6">
      <DocumentDetail
        document={result.data}
        userRole={session.user.role}
        availableClients={availableClients}
      />
    </div>
  );
}