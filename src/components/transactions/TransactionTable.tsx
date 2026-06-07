'use client';

// ============================================
// TRANSACTION TABLE COMPONENT
// Reusable table for displaying transactions
// ============================================

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Transaction {
  id: string;
  transactionNumber: string;
  serviceType: string;
  status: string;
  priority: string;
  createdAt: string;
  client?: {
    id: string;
    name: string;
    clientCode: string;
  };
  assignedUser?: {
    id: string;
    name: string;
  };
  slaDeadline?: string;
  checklists?: Array<{
    required: boolean;
    status: string;
  }>;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onRowClick?: (transaction: Transaction) => void;
}

// Service type labels
const serviceTypeLabels: Record<string, string> = {
  PENDIRIAN_PT: 'Pendirian PT',
  AJB: 'Akta Jual Beli',
  WARIS: 'Waris',
  LEGALISASI: 'Legalisasi',
  PERUBAHAN_PT: 'Perubahan PT',
  PEMBERIAN_HAK: 'Pemberian Hak Tanggungan',
  SURAT_KUASA: 'Surat Kuasa',
  PERJANJIAN: 'Perjanjian',
  LAINNYA: 'Lainnya',
};

// Status labels and colors
const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
  SUBMITTED: { label: 'Diajukan', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  REVIEW: { label: 'Review', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  PROCESSING: { label: 'Proses', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  READY_TO_SIGN: { label: 'Siap TTD', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
  SIGNING: { label: 'TTD', color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200' },
  SIGNED: { label: 'Ditandatangani', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  DELIVERY: { label: 'Pengiriman', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  COMPLETED: { label: 'Selesai', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  ON_HOLD: { label: 'Ditahan', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
  ARCHIVED: { label: 'Diarsipkan', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
};

// Priority labels and colors
const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Rendah', color: 'bg-gray-100 text-gray-600' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-600' },
  HIGH: { label: 'Tinggi', color: 'bg-orange-100 text-orange-600' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-600' },
};

export function TransactionTable({ transactions, onRowClick }: TransactionTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Transaksi</TableHead>
            <TableHead>Tipe Layanan</TableHead>
            <TableHead>Klien</TableHead>
            <TableHead>PIC</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioritas</TableHead>
            <TableHead>Dibuat</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Tidak ada transaksi
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => {
              const statusInfo = statusConfig[transaction.status] || statusConfig.DRAFT;
              const priorityInfo = priorityConfig[transaction.priority] || priorityConfig.NORMAL;
              const serviceLabel = serviceTypeLabels[transaction.serviceType] || transaction.serviceType;
              const completedDocs = transaction.checklists?.filter(c => c.status === 'VERIFIED' || c.status === 'UPLOADED').length || 0;
              const totalDocs = transaction.checklists?.length || 0;

              return (
                <TableRow
                  key={transaction.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick?.(transaction)}
                >
                  <TableCell className="font-medium">{transaction.transactionNumber}</TableCell>
                  <TableCell>{serviceLabel}</TableCell>
                  <TableCell>
                    {transaction.client ? (
                      <div>
                        <div className="font-medium">{transaction.client.name}</div>
                        <div className="text-xs text-muted-foreground">{transaction.client.clientCode}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.assignedUser ? (
                      <div className="text-sm">{transaction.assignedUser.name}</div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusInfo.color}>
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={priorityInfo.color}>
                      {priorityInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(transaction.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                          <Link href={`/dashboard/transactions/${transaction.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Lihat Detail
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}