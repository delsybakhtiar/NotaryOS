import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { NewDocumentForm } from '@/components/documents/new-document-form';

export default async function NewDocumentPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch clients for dropdown
  const clients = await db.client.findMany({
    where: {
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      clientCode: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="p-6">
      <NewDocumentForm clients={clients} />
    </div>
  );
}