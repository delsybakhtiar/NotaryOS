// ============================================
// CLIENTS LIST PAGE
// Server Component - Lists all clients with DataTable
// ============================================

import { getClients } from '@/lib/actions/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Search, MoreHorizontal, Eye, Edit, Trash2, ShieldCheck, ShieldX } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

async function ClientsPage({
  searchParams,
}: {
  searchParams: { search?: string; type?: string; kyc?: string; status?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check role permission
  if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
    redirect('/dashboard');
  }

  const filters = {
    search: searchParams.search,
    clientType: searchParams.type,
    kycStatus: searchParams.kyc,
    status: searchParams.status,
  };

  const result = await getClients(filters);

  const clients = result.success ? result.clients : [];

  const getKycBadgeVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'SUSPENDED':
        return 'destructive';
      case 'BLACKLISTED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Klien</h1>
          <p className="text-muted-foreground mt-1">
            Kelola data klien dan verifikasi KYC
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Klien
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Klien</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">KYC Pending</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter((c) => c.kycStatus === 'PENDING').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">KYC Verified</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter((c) => c.kycStatus === 'VERIFIED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Corporate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter((c) => c.clientType === 'CORPORATE').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-4" action="/dashboard/clients">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Cari nama, email, telepon, NIK, atau NPWP..."
                  className="pl-10"
                  defaultValue={searchParams.search || ''}
                />
              </div>
            </div>
            <select
              name="type"
              className="flex h-10 w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={searchParams.type || ''}
            >
              <option value="">Semua Tipe</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="CORPORATE">Corporate</option>
            </select>
            <select
              name="kyc"
              className="flex h-10 w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={searchParams.kyc || ''}
            >
              <option value="">Semua KYC</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <Button type="submit">Filter</Button>
            <Link href="/dashboard/clients">
              <Button variant="outline">Reset</Button>
            </Link>
          </form>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Klien</CardTitle>
          <CardDescription>
            {clients.length} klien ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Klien</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Status KYC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">Belum ada klien</p>
                        <Link href="/dashboard/clients/new">
                          <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Klien Pertama
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id} className="cursor-pointer hover:bg-accent">
                      <TableCell className="font-medium">{client.clientCode}</TableCell>
                      <TableCell>
                        <div>
                          <Link href={`/dashboard/clients/${client.id}`} className="font-medium hover:underline">
                            {client.name}
                          </Link>
                          {client.nik && <div className="text-xs text-muted-foreground">NIK: {client.nik}</div>}
                          {client.npwp && <div className="text-xs text-muted-foreground">NPWP: {client.npwp}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.clientType === 'INDIVIDUAL' ? 'default' : 'secondary'}>
                          {client.clientType === 'INDIVIDUAL' ? 'Individual' : 'Corporate'}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.email || '-'}</TableCell>
                      <TableCell>{client.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getKycBadgeVariant(client.kycStatus)}>
                          {client.kycStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(client.status)}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.createdBy ? (
                          <div>
                            <div className="font-medium text-sm">{client.createdBy.name}</div>
                            <div className="text-xs text-muted-foreground">{client.createdBy.email}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(client.createdAt), 'dd MMM yyyy', { locale: idLocale })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/clients/${client.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/clients/${client.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            {session.user.role === 'ADMIN' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/clients/${client.id}/kyc`}>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Verifikasi KYC
                                  </Link>
                                </DropdownMenuItem>
                              </>
                            )}
                            {session.user.role === 'ADMIN' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientsPage;