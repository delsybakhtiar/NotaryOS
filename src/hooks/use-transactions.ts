'use client';

// ============================================
// TRANSACTION MANAGEMENT HOOKS
// TanStack Query hooks for transaction operations
// ============================================

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
export interface TransactionFilters {
  search?: string;
  serviceType?: string;
  status?: string;
  priority?: string;
  clientId?: string;
  assignedTo?: string;
  page?: number;
  pageSize?: number;
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  qrCode: string;
  serviceType: string;
  status: string;
  priority: string;
  clientId: string | null;
  assignedTo: string | null;
  parties: string | null;
  scheduledDate: Date | null;
  notes: string | null;
  internalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  client?: {
    id: string;
    clientCode: string;
    name: string;
    email: string | null;
  };
  assignedUser?: {
    id: string;
    name: string;
    email: string | null;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  checklists?: Array<{
    id: string;
    status: string;
    required: boolean;
  }>;
}

export interface TransactionDetail extends Transaction {
  client?: {
    id: string;
    clientCode: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
  };
  assignedUser?: {
    id: string;
    name: string;
    email: string | null;
    role: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string | null;
    role: string;
  };
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    taskType: string;
    order: number;
    assignedTo: string | null;
    completedAt: Date | null;
    completedBy: string | null;
    completedNotes: string | null;
    notes: string | null;
  }>;
  checklists: Array<{
    id: string;
    documentType: string;
    documentName: string;
    required: boolean;
    status: string;
    fileId: string | null;
    uploadedAt: Date | null;
    verifiedAt: Date | null;
    verifiedBy: string | null;
    verificationNotes: string | null;
    rejectionReason: string | null;
  }>;
  deliveries: Array<{
    id: string;
    transactionId: string;
    recipientName: string;
    recipientPhone: string | null;
    deliveryAddress: string;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    specialInstructions: string | null;
    courierId: string | null;
    courierName: string | null;
    courierCompany: string | null;
    status: string;
    trackingNumber: string | null;
    assignedAt: Date | null;
    pickedUpAt: Date | null;
    inTransitAt: Date | null;
    deliveredAt: Date | null;
    receivedBy: string | null;
    notes: string | null;
    failureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    courier?: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
    };
  }>;
  allowedNextStatuses?: string[];
}

export interface PaginatedTransactionsResponse {
  success: boolean;
  transactions: Transaction[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface TransactionResponse {
  success: boolean;
  transaction?: Transaction | TransactionDetail;
  allowedNextStatuses?: string[];
  error?: string;
  message?: string;
}

export interface DeliveryResponse {
  success: boolean;
  delivery?: any;
  error?: string;
}

export interface TaskResponse {
  success: boolean;
  task?: any;
  error?: string;
}

export interface ChecklistResponse {
  success: boolean;
  checklist?: any;
  error?: string;
}

// ============================================
// QUERY KEYS
// ============================================

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

// ============================================
// QUERIES
// ============================================

/**
 * Hook for fetching transactions list with filters and pagination
 * @param filters - Transaction filters (search, serviceType, status, priority, clientId, assignedTo, page, pageSize)
 * @param options - Additional useQuery options
 */
export function useTransactions(
  filters: TransactionFilters = {},
  options?: Partial<UseQueryOptions<PaginatedTransactionsResponse>>
) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async (): Promise<PaginatedTransactionsResponse> => {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.serviceType) params.append('serviceType', filters.serviceType);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.clientId) params.append('clientId', filters.clientId);
      if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

      const response = await fetch(`/api/transactions?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      return data;
    },
    ...options,
  });
}

/**
 * Hook for fetching a single transaction by ID
 * @param id - Transaction ID
 * @param options - Additional useQuery options
 */
export function useTransaction(
  id: string,
  options?: Partial<UseQueryOptions<TransactionResponse>>
) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: async (): Promise<TransactionResponse> => {
      const response = await fetch(`/api/transactions/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transaction');
      }

      const data = await response.json();
      return data;
    },
    enabled: !!id,
    ...options,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Hook for creating a new transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData): Promise<TransactionResponse> => {
      const response = await fetch('/api/transactions/new', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Transaksi berhasil dibuat');
        // Invalidate transactions list
        queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      } else {
        toast.error(data.error || 'Gagal membuat transaksi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat transaksi');
    },
  });
}

/**
 * Hook for updating an existing transaction
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string;
      formData: FormData;
    }): Promise<TransactionResponse> => {
      const response = await fetch(`/api/transactions/${id}/update`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success('Transaksi berhasil diubah');
        // Invalidate transaction detail and list
        queryClient.invalidateQueries({ queryKey: transactionKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      } else {
        toast.error(data.error || 'Gagal mengubah transaksi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengubah transaksi');
    },
  });
}

/**
 * Hook for transitioning transaction status
 */
export function useTransitionTransactionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      newStatus,
      notes,
    }: {
      id: string;
      newStatus: string;
      notes?: string;
    }): Promise<TransactionResponse> => {
      const formData = new FormData();
      formData.append('newStatus', newStatus);
      if (notes) formData.append('notes', notes);

      const response = await fetch(`/api/transactions/${id}/status`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transition transaction status');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success(data.message || 'Status transaksi berhasil diubah');
        // Invalidate transaction detail and list
        queryClient.invalidateQueries({ queryKey: transactionKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      } else {
        toast.error(data.error || 'Gagal mengubah status transaksi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengubah status transaksi');
    },
  });
}

/**
 * Hook for updating task status
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      taskId,
      status,
      notes,
    }: {
      transactionId: string;
      taskId: string;
      status: string;
      notes?: string;
    }): Promise<TaskResponse> => {
      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('status', status);
      if (notes) formData.append('notes', notes);

      const response = await fetch(`/api/transactions/${transactionId}/tasks/${taskId}/status`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success('Status tugas berhasil diubah');
        // Invalidate transaction detail
        queryClient.invalidateQueries({ queryKey: transactionKeys.detail(variables.transactionId) });
      } else {
        toast.error(data.error || 'Gagal mengubah status tugas');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengubah status tugas');
    },
  });
}

/**
 * Hook for updating checklist item status
 */
export function useUpdateChecklistItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      checklistId,
      status,
      fileId,
      verificationNotes,
      rejectionReason,
    }: {
      transactionId: string;
      checklistId: string;
      status: string;
      fileId?: string;
      verificationNotes?: string;
      rejectionReason?: string;
    }): Promise<ChecklistResponse> => {
      const formData = new FormData();
      formData.append('checklistId', checklistId);
      formData.append('status', status);
      if (fileId) formData.append('fileId', fileId);
      if (verificationNotes) formData.append('verificationNotes', verificationNotes);
      if (rejectionReason) formData.append('rejectionReason', rejectionReason);

      const response = await fetch(`/api/transactions/${transactionId}/checklist/${checklistId}/status`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update checklist item status');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success('Status checklist berhasil diubah');
        // Invalidate transaction detail
        queryClient.invalidateQueries({ queryKey: transactionKeys.detail(variables.transactionId) });
      } else {
        toast.error(data.error || 'Gagal mengubah status checklist');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengubah status checklist');
    },
  });
}

/**
 * Hook for updating delivery information
 */
export function useUpdateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      formData,
    }: {
      transactionId: string;
      formData: FormData;
    }): Promise<DeliveryResponse> => {
      const response = await fetch(`/api/transactions/${transactionId}/delivery`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update delivery');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success('Pengiriman berhasil diupdate');
        // Invalidate transaction detail
        queryClient.invalidateQueries({ queryKey: transactionKeys.detail(variables.transactionId) });
        queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      } else {
        toast.error(data.error || 'Gagal mengupdate pengiriman');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupdate pengiriman');
    },
  });
}

/**
 * Hook for updating delivery status
 */
export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      deliveryId,
      status,
      trackingNumber,
      notes,
      failureReason,
    }: {
      transactionId: string;
      deliveryId: string;
      status: string;
      trackingNumber?: string;
      notes?: string;
      failureReason?: string;
    }): Promise<DeliveryResponse> => {
      const formData = new FormData();
      formData.append('deliveryId', deliveryId);
      formData.append('status', status);
      if (trackingNumber) formData.append('trackingNumber', trackingNumber);
      if (notes) formData.append('notes', notes);
      if (failureReason) formData.append('failureReason', failureReason);

      const response = await fetch(`/api/transactions/${transactionId}/delivery/${deliveryId}/status`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update delivery status');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success('Status pengiriman berhasil diubah');
        // Invalidate transaction detail and list
        queryClient.invalidateQueries({ queryKey: transactionKeys.detail(variables.transactionId) });
        queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      } else {
        toast.error(data.error || 'Gagal mengubah status pengiriman');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengubah status pengiriman');
    },
  });
}