'use client';

// ============================================
// AUDIT LOG VIEW COMPONENT
// View all system activities
// ============================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Shield, Search } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  status: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  ipAddress: string | null;
  timestamp: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

export default function AuditLogView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    action: 'ALL',
    status: 'ALL',
    entityType: 'ALL',
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(
        Object.entries(filters)
          .filter(([_, v]) => v !== '' && v !== 'ALL')
          .map(([k, v]) => [k, v] as [string, string])
      );

      const response = await fetch(`/api/settings/audit-log?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      case 'LOGIN':
        return 'outline';
      case 'APPROVE':
        return 'default';
      case 'REJECT':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'SUCCESS' ? 'default' : 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Log
          </CardTitle>
          <CardDescription>Riwayat aktivitas sistem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cari</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nama, email, deskripsi..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Aksi</label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="LOGIN">LOGIN</SelectItem>
                  <SelectItem value="LOGOUT">LOGOUT</SelectItem>
                  <SelectItem value="APPROVE">APPROVE</SelectItem>
                  <SelectItem value="REJECT">REJECT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem value="SUCCESS">SUCCESS</SelectItem>
                  <SelectItem value="FAILURE">FAILURE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Entity</label>
              <Select
                value={filters.entityType}
                onValueChange={(value) => setFilters({ ...filters, entityType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Document">Document</SelectItem>
                  <SelectItem value="Invoice">Invoice</SelectItem>
                  <SelectItem value="Payment">Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-muted-foreground">Memuat audit log...</p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground">Tidak ada audit log</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Aksi</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.user.name || '-'}</div>
                          <div className="text-xs text-muted-foreground">{log.user.email}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {log.user.role}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entityType || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.description || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}