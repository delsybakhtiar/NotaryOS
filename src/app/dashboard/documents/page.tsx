'use client';

// ============================================
// DOCUMENTS LIST PAGE
// Table with status filter and search
// ============================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Document type labels
const DocumentTypeLabels: Record<string, string> = {
  AKTA_PENDIRIAN: 'Akta Pendirian',
  AKTA_PERUBAHAN: 'Akta Perubahan',
  AKTA_PEMBERIAN_HAK_TANGGUNGAN: 'APHT',
  AKTA_WARIS: 'Akta Waris',
  SURAT_KUASA: 'Surat Kuasa',
  PERJANJIAN: 'Perjanjian',
  LAINNYA: 'Lainnya',
};

// Status badge variants
const StatusBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'default',
  REVIEW: 'secondary',
  SIGNING: 'destructive',
  ARCHIVED: 'outline',
};

// Status labels
const StatusLabels: Record<string, string> = {
  DRAFT: 'Draf',
  REVIEW: 'Review',
  SIGNING: 'Tanda Tangan',
  ARCHIVED: 'Arsip',
};

interface Document {
  id: string;
  documentNumber: string;
  title: string;
  documentType: string;
  status: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  client?: {
    id: string;
    clientCode: string;
    name: string;
  } | null;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  versions: Array<{
    id: string;
    version: number;
    createdAt: Date;
  }>;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchDocuments();
  }, [searchQuery, statusFilter, typeFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (searchQuery) {
        filters.search = searchQuery;
      }

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (typeFilter !== 'all') {
        filters.documentType = typeFilter;
      }

      const response = await fetch('/api/documents?' + new URLSearchParams(filters));
      const data = await response.json();

      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dokumen</h2>
          <p className="text-muted-foreground">
            Kelola semua dokumen dan akta kantor notaris
          </p>
        </div>
        <Link href="/dashboard/documents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Buat Dokumen
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dokumen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              Semua dokumen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draf</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter((d) => d.status === 'DRAFT').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Menunggu review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter((d) => d.status === 'REVIEW').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Dalam proses review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tanda Tangan</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter((d) => d.status === 'SIGNING').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Siap ditandatangani
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
          <CardDescription>
            Cari dan filter dokumen berdasarkan kriteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari dokumen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draf</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="SIGNING">Tanda Tangan</SelectItem>
                <SelectItem value="ARCHIVED">Arsip</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Tipe Dokumen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="AKTA_PENDIRIAN">Akta Pendirian</SelectItem>
                <SelectItem value="AKTA_PERUBAHAN">Akta Perubahan</SelectItem>
                <SelectItem value="AKTA_PEMBERIAN_HAK_TANGGUNGAN">APHT</SelectItem>
                <SelectItem value="AKTA_WARIS">Akta Waris</SelectItem>
                <SelectItem value="SURAT_KUASA">Surat Kuasa</SelectItem>
                <SelectItem value="PERJANJIAN">Perjanjian</SelectItem>
                <SelectItem value="LAINNYA">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Klien</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Versi</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Memuat dokumen...
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-8 w-8" />
                      <p>Tidak ada dokumen ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">
                      {document.documentNumber}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate font-medium">
                        {document.title}
                      </div>
                      {document.description && (
                        <div className="max-w-xs truncate text-sm text-muted-foreground">
                          {document.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {DocumentTypeLabels[document.documentType] || document.documentType}
                    </TableCell>
                    <TableCell>
                      {document.client ? (
                        <div className="text-sm">
                          <div className="font-medium">{document.client.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {document.client.clientCode}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={StatusBadgeVariant[document.status]}>
                        {StatusLabels[document.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        v{document.versions[0]?.version || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(document.createdAt), 'dd MMM yyyy', {
                          locale: id,
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/documents/${document.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}