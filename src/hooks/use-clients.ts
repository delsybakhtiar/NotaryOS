'use client';

// ============================================
// CLIENT HOOKS
// TanStack Query hooks for client data
// ============================================

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// Fetch all clients
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Gagal mengambil data klien');
      }
      return response.json();
    },
  });
}

// Fetch single client by ID
export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${id}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data klien');
      }
      return response.json();
    },
    enabled: !!id,
  });
}