'use client';

// ============================================
// TRANSACTION CREATE PAGE
// Wizard for creating new transactions
// ============================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TransactionServiceTypeEnum,
  TransactionPriorityEnum,
  CreateTransactionSchema,
  type CreateTransactionInput,
} from '@/lib/validations/transaction';
import { useCreateTransaction } from '@/hooks/use-transactions';
import { useClients } from '@/hooks/use-clients';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewTransactionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const createMutation = useCreateTransaction();
  const { data: clients } = useClients();

  const form = useForm<CreateTransactionInput>({
    resolver: zodResolver(CreateTransactionSchema),
    defaultValues: {
      serviceType: 'PENDIRIAN_PT',
      priority: 'NORMAL',
    },
  });

  const serviceTypes = [
    { value: 'PENDIRIAN_PT', label: 'Pendirian PT' },
    { value: 'AJB', label: 'Akta Jual Beli' },
    { value: 'WARIS', label: 'Waris/Inheritance' },
    { value: 'LEGALISASI', label: 'Legalisasi Dokumen' },
    { value: 'PERUBAHAN_PT', label: 'Perubahan PT' },
    { value: 'PEMBERIAN_HAK', label: 'Pemberian Hak Tanggungan' },
    { value: 'SURAT_KUASA', label: 'Surat Kuasa' },
    { value: 'PERJANJIAN', label: 'Perjanjian' },
    { value: 'LAINNYA', label: 'Lainnya' },
  ];

  const priorities = [
    { value: 'LOW', label: 'Rendah' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'Tinggi' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  const onSubmit = async (data: CreateTransactionInput) => {
    const formData = new FormData();
    formData.append('serviceType', data.serviceType);
    formData.append('priority', data.priority);
    if (data.clientId) formData.append('clientId', data.clientId);
    if (data.parties) formData.append('parties', data.parties);
    if (data.scheduledDate) formData.append('scheduledDate', data.scheduledDate);
    if (data.notes) formData.append('notes', data.notes);
    if (data.internalNotes) formData.append('internalNotes', data.internalNotes);

    try {
      await createMutation.mutateAsync(formData);
      toast.success('Transaksi berhasil dibuat');
      router.push('/dashboard/transactions');
    } catch (error: any) {
      toast.error(error.message || 'Gagal membuat transaksi');
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const serviceTypeLabel = serviceTypes.find(s => s.value === form.watch('serviceType'))?.label || '';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/transactions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Transaksi Baru</h1>
        <p className="text-muted-foreground">Buat transaksi notaris baru</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Langkah {step} dari 3</div>
          <div className="text-sm text-muted-foreground">
            {step === 1 && 'Informasi Dasar'}
            {step === 2 && 'Informasi Tambahan'}
            {step === 3 && 'Review & Konfirmasi'}
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="pt-6">
              {step === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipe Layanan *</FormLabel>
                        <FormControl>
                          <Select {...field} onValueChange={(v) => { field.onChange(v); setSelectedService(v); }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe layanan" />
                            </SelectTrigger>
                            <SelectContent>
                              {serviceTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Jenis layanan notaris yang akan diberikan
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioritas</FormLabel>
                        <FormControl>
                          <Select {...field}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih prioritas" />
                            </SelectTrigger>
                            <SelectContent>
                              {priorities.map((priority) => (
                                <SelectItem key={priority.value} value={priority.value}>
                                  {priority.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Klien</FormLabel>
                        <FormControl>
                          <Select {...field}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih klien (opsional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Pilih klien...</SelectItem>
                              {clients?.map((client: any) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name} ({client.clientCode})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Terjadwal (Opsional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Tanggal yang dijadwalkan untuk proses transaksi
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Masukkan catatan transaksi..."
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Catatan yang akan terlihat oleh semua staff
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="internalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan Internal</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Masukkan catatan internal..."
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Catatan internal untuk staf notaris
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Review Transaksi</h3>
                    <p className="text-muted-foreground">
                      Periksa kembali informasi sebelum menyimpan
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipe Layanan</label>
                      <p className="font-medium">{serviceTypeLabel}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Prioritas</label>
                      <p className="font-medium">
                        {priorities.find(p => p.value === form.watch('priority'))?.label}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Klien</label>
                      <p className="font-medium">
                        {form.watch('clientId')
                          ? clients?.find((c: any) => c.id === form.watch('clientId'))?.name
                          : 'Tidak ada klien dipilih'}
                      </p>
                    </div>

                    {form.watch('scheduledDate') && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tanggal Terjadwal</label>
                        <p className="font-medium">{form.watch('scheduledDate')}</p>
                      </div>
                    )}

                    {form.watch('notes') && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Catatan</label>
                        <p className="font-medium">{form.watch('notes')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Sebelumnya
            </Button>

            {step < 3 ? (
              <Button type="button" onClick={nextStep}>
                Selanjutnya
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}