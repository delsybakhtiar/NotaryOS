'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  Plus,
  FileEdit,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocumentStatus, DocumentType } from '@prisma/client';
import {
  getStatusLabel,
  getStatusColor,
} from '@/lib/document-state-machine';

interface Document {
  id: string;
  documentNumber: string;
  title: string;
  documentType: DocumentType;
  status: DocumentStatus;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  client: {
    id: string;
    name: string;
    clientCode: string;
  } | null;
}

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || doc.documentType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getDocumentTypeLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      [DocumentType.AKTA_PENDIRIAN]: 'Akta Pendirian',
      [DocumentType.AKTA_PERUBAHAN]: 'Akta Perubahan',
      [DocumentType.AKTA_PEMBERIAN_HAK_TANGGUNGAN]: 'APHT',
      [DocumentType.AKTA_WARIS]: 'Akta Waris',
      [DocumentType.SURAT_KUASA]: 'Surat Kuasa',
      [DocumentType.PERJANJIAN]: 'Perjanjian',
      [DocumentType.LAINNYA]: 'Lainnya',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dokumen</h1>
          <p className="text-muted-foreground mt-1">
            Kelola semua dokumen akta dan perjanjian
          </p>
        </div>
        <Link href="/dashboard/documents/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Buat Dokumen Baru
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cari dokumen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value={DocumentStatus.DRAFT}>Draft</SelectItem>
              <SelectItem value={DocumentStatus.REVIEW}>Under Review</SelectItem>
              <SelectItem value={DocumentStatus.SIGNING}>Signing</SelectItem>
              <SelectItem value={DocumentStatus.ARCHIVED}>Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipe Dokumen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              <SelectItem value={DocumentType.AKTA_PENDIRIAN}>Akta Pendirian</SelectItem>
              <SelectItem value={DocumentType.AKTA_PERUBAHAN}>Akta Perubahan</SelectItem>
              <SelectItem value={DocumentType.AKTA_PEMBERIAN_HAK_TANGGUNGAN}>APHT</SelectItem>
              <SelectItem value={DocumentType.AKTA_WARIS}>Akta Waris</SelectItem>
              <SelectItem value={DocumentType.SURAT_KUASA}>Surat Kuasa</SelectItem>
              <SelectItem value={DocumentType.PERJANJIAN}>Perjanjian</SelectItem>
              <SelectItem value={DocumentType.LAINNYA}>Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Document Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor Dokumen</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Klien</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat Oleh</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Tidak ada dokumen ditemukan
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.documentNumber}</TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/documents/${doc.id}`}
                      className="text-primary hover:underline"
                    >
                      {doc.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getDocumentTypeLabel(doc.documentType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {doc.client ? (
                      <Link
                        href={`/dashboard/clients/${doc.client.id}`}
                        className="text-muted-foreground hover:text-primary hover:underline"
                      >
                        {doc.client.name} ({doc.client.clientCode})
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(doc.status)}>
                      {getStatusLabel(doc.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {doc.createdBy?.name || doc.createdBy?.email || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/documents/${doc.id}`} className="cursor-pointer">
                            <FileEdit className="mr-2 h-4 w-4" />
                            Lihat & Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Menampilkan {filteredDocuments.length} dari {documents.length} dokumen
        </p>
      </div>
    </div>
  );
}