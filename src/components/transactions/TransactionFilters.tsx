'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
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
  TransactionStatus,
  TransactionServiceType,
  TransactionPriority,
} from '@prisma/client';

interface TransactionFiltersProps {
  onFiltersChange: (filters: TransactionFilters) => void;
  availableClients?: Array<{ id: string; name: string; clientCode: string }>;
  availableStaff?: Array<{ id: string; name: string | null; email: string }>;
}

export interface TransactionFilters {
  search: string;
  status?: TransactionStatus;
  serviceType?: TransactionServiceType;
  priority?: TransactionPriority;
  clientId?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

const STATUS_OPTIONS = [
  { value: TransactionStatus.DRAFT, label: 'Draft' },
  { value: TransactionStatus.SUBMITTED, label: 'Diajukan' },
  { value: TransactionStatus.REVIEW, label: 'Review' },
  { value: TransactionStatus.PROCESSING, label: 'Diproses' },
  { value: TransactionStatus.READY_TO_SIGN, label: 'Siap TTD' },
  { value: TransactionStatus.SIGNING, label: 'Penandatanganan' },
  { value: TransactionStatus.SIGNED, label: 'Ditandatangani' },
  { value: TransactionStatus.DELIVERY, label: 'Pengiriman' },
  { value: TransactionStatus.COMPLETED, label: 'Selesai' },
  { value: TransactionStatus.ON_HOLD, label: 'Tertunda' },
  { value: TransactionStatus.CANCELLED, label: 'Dibatalkan' },
  { value: TransactionStatus.ARCHIVED, label: 'Arsip' },
];

const SERVICE_TYPE_OPTIONS = [
  { value: TransactionServiceType.PENDIRIAN_PT, label: 'Pendirian PT' },
  { value: TransactionServiceType.AJB, label: 'AJB' },
  { value: TransactionServiceType.WARIS, label: 'Waris' },
  { value: TransactionServiceType.LEGALISASI, label: 'Legalisasi' },
  { value: TransactionServiceType.PERUBAHAN_PT, label: 'Perubahan PT' },
  { value: TransactionServiceType.PEMBERIAN_HAK, label: 'Pemberian Hak' },
  { value: TransactionServiceType.SURAT_KUASA, label: 'Surat Kuasa' },
  { value: TransactionServiceType.PERJANJIAN, label: 'Perjanjian' },
  { value: TransactionServiceType.LAINNYA, label: 'Lainnya' },
];

const PRIORITY_OPTIONS = [
  { value: TransactionPriority.URGENT, label: 'Urgent' },
  { value: TransactionPriority.HIGH, label: 'Tinggi' },
  { value: TransactionPriority.NORMAL, label: 'Normal' },
  { value: TransactionPriority.LOW, label: 'Rendah' },
];

export function TransactionFilters({
  onFiltersChange,
  availableClients = [],
  availableStaff = [],
}: TransactionFiltersProps) {
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof TransactionFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: TransactionFilters = { search: '' };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status) count++;
    if (filters.serviceType) count++;
    if (filters.priority) count++;
    if (filters.clientId) count++;
    if (filters.assignedTo) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Cari transaksi, klien, atau PIC..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter
          {activeFilterCount > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="border rounded-lg p-4 space-y-4 bg-card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) =>
                  updateFilter('status', value === '' ? undefined : (value as TransactionStatus))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Status</SelectItem>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Layanan</label>
              <Select
                value={filters.serviceType || ''}
                onValueChange={(value) =>
                  updateFilter(
                    'serviceType',
                    value === '' ? undefined : (value as TransactionServiceType)
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Layanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Layanan</SelectItem>
                  {SERVICE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioritas</label>
              <Select
                value={filters.priority || ''}
                onValueChange={(value) =>
                  updateFilter('priority', value === '' ? undefined : (value as TransactionPriority))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Prioritas</SelectItem>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Klien</label>
              <Select
                value={filters.clientId || ''}
                onValueChange={(value) =>
                  updateFilter('clientId', value === '' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Klien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Klien</SelectItem>
                  {availableClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.clientCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned To Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">PIC</label>
              <Select
                value={filters.assignedTo || ''}
                onValueChange={(value) =>
                  updateFilter('assignedTo', value === '' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua PIC" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua PIC</SelectItem>
                  {availableStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name || staff.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Dari</label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Sampai</label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && !isExpanded && (
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {STATUS_OPTIONS.find((s) => s.value === filters.status)?.label}
              <button
                onClick={() => updateFilter('status', undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.serviceType && (
            <Badge variant="secondary" className="gap-1">
              Layanan: {SERVICE_TYPE_OPTIONS.find((s) => s.value === filters.serviceType)?.label}
              <button
                onClick={() => updateFilter('serviceType', undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.priority && (
            <Badge variant="secondary" className="gap-1">
              Prioritas: {PRIORITY_OPTIONS.find((p) => p.value === filters.priority)?.label}
              <button
                onClick={() => updateFilter('priority', undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.clientId && (
            <Badge variant="secondary" className="gap-1">
              Klien: {availableClients.find((c) => c.id === filters.clientId)?.name}
              <button
                onClick={() => updateFilter('clientId', undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.assignedTo && (
            <Badge variant="secondary" className="gap-1">
              PIC: {availableStaff.find((s) => s.id === filters.assignedTo)?.name || 'Staff'}
              <button
                onClick={() => updateFilter('assignedTo', undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}