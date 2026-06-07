'use client';

import { useState } from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TransactionStatus } from '@prisma/client';

interface TimelineEvent {
  id: string;
  timestamp: Date;
  event: string;
  description?: string;
  performedBy?: string;
  icon?: any;
  iconColor?: string;
}

interface TransactionTimelineProps {
  currentStatus: TransactionStatus;
  timelineEvents: TimelineEvent[];
}

const STATUS_STEPS: Record<string, Array<{ status: string; label: string; icon: any }>> = {
  default: [
    { status: 'DRAFT', label: 'Draft', icon: FileText },
    { status: 'SUBMITTED', label: 'Diajukan', icon: FileText },
    { status: 'REVIEW', label: 'Review', icon: CheckCircle },
    { status: 'PROCESSING', label: 'Diproses', icon: FileText },
    { status: 'READY_TO_SIGN', label: 'Siap TTD', icon: FileText },
    { status: 'SIGNING', label: 'Penandatanganan', icon: User },
    { status: 'SIGNED', label: 'Ditandatangani', icon: CheckCircle },
    { status: 'DELIVERY', label: 'Pengiriman', icon: Package },
    { status: 'COMPLETED', label: 'Selesai', icon: CheckCircle },
  ],
};

const STATUS_ORDER: Record<string, number> = {
  DRAFT: 1,
  SUBMITTED: 2,
  REVIEW: 3,
  PROCESSING: 4,
  READY_TO_SIGN: 5,
  SIGNING: 6,
  SIGNED: 7,
  DELIVERY: 8,
  DELIVERED: 9,
  COMPLETED: 10,
  ON_HOLD: 0,
  CANCELLED: -1,
  ARCHIVED: -2,
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  [TransactionStatus.DRAFT]: 'Draft',
  [TransactionStatus.SUBMITTED]: 'Diajukan',
  [TransactionStatus.REVIEW]: 'Review',
  [TransactionStatus.PROCESSING]: 'Diproses',
  [TransactionStatus.READY_TO_SIGN]: 'Siap TTD',
  [TransactionStatus.SIGNING]: 'Penandatanganan',
  [TransactionStatus.SIGNED]: 'Ditandatangani',
  [TransactionStatus.DELIVERY]: 'Pengiriman',
  [TransactionStatus.COMPLETED]: 'Selesai',
  [TransactionStatus.ON_HOLD]: 'Tertunda',
  [TransactionStatus.CANCELLED]: 'Dibatalkan',
  [TransactionStatus.ARCHIVED]: 'Arsip',
};

export function TransactionTimeline({
  currentStatus,
  timelineEvents,
}: TransactionTimelineProps) {
  const [viewMode, setViewMode] = useState<'steps' | 'events'>('steps');

  const steps = STATUS_STEPS.default;
  const currentStepIndex = steps.findIndex((s) => s.status === currentStatus);

  const isStepCompleted = (index: number): boolean => {
    return index < currentStepIndex;
  };

  const isStepCurrent = (index: number): boolean => {
    return index === currentStepIndex;
  };

  const isStepPending = (index: number): boolean => {
    return index > currentStepIndex;
  };

  const getStepStatus = (index: number): 'completed' | 'current' | 'pending' | 'skipped' => {
    if (currentStatus === TransactionStatus.ON_HOLD) {
      return index <= currentStepIndex ? 'completed' : 'pending';
    }
    if (currentStatus === TransactionStatus.CANCELLED) {
      return index <= currentStepIndex ? 'completed' : 'skipped';
    }
    if (currentStatus === TransactionStatus.ARCHIVED) {
      return 'completed';
    }

    if (isStepCompleted(index)) return 'completed';
    if (isStepCurrent(index)) return 'current';
    return 'pending';
  };

  const formatTimestamp = (date: Date): string => {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Timeline Transaksi</CardTitle>
            <CardDescription>
              Status saat ini: <span className="font-semibold">{STATUS_LABELS[currentStatus]}</span>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'steps' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('steps')}
            >
              Langkah
            </Button>
            <Button
              variant={viewMode === 'events' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('events')}
            >
              Event
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'steps' ? (
          <div className="space-y-6">
            {/* Stepper View */}
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

              <div className="space-y-0">
                {steps.map((step, index) => {
                  const status = getStepStatus(index);
                  const StepIcon = step.icon;
                  const isLast = index === steps.length - 1;

                  return (
                    <div key={step.status} className="relative flex gap-4 pb-8">
                      {isLast && (
                        <div className="absolute left-4 -bottom-4 w-0.5 h-4 bg-transparent" />
                      )}

                      {/* Icon */}
                      <div className="relative z-10">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                            status === 'completed'
                              ? 'bg-primary text-primary-foreground border-primary'
                              : status === 'current'
                              ? 'bg-white text-primary border-primary ring-4 ring-primary/10'
                              : status === 'skipped'
                              ? 'bg-muted text-muted-foreground border-muted'
                              : 'bg-background text-muted-foreground border-muted'
                          }`}
                        >
                          {status === 'completed' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : status === 'current' ? (
                            <StepIcon className="h-4 w-4" />
                          ) : status === 'skipped' ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <StepIcon className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`font-medium ${
                              status === 'current' ? 'text-primary' : status === 'skipped' ? 'text-muted-foreground line-through' : ''
                            }`}
                          >
                            {step.label}
                          </h4>
                          {status === 'current' && (
                            <Badge variant="secondary" className="text-xs">
                              Sedang Berjalan
                            </Badge>
                          )}
                          {status === 'skipped' && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Dilewati
                            </Badge>
                          )}
                        </div>
                        {status === 'completed' && (
                          <p className="text-sm text-muted-foreground mt-1">Selesai</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Events View */}
            {timelineEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada event tercatat</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

                {timelineEvents.map((event, index) => {
                  const EventIcon = event.icon || Clock;

                  return (
                    <div key={event.id} className="relative flex gap-4 pb-4 last:pb-0">
                      <div className="relative z-10">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                            event.iconColor
                              ? `bg-${event.iconColor}-100 text-${event.iconColor}-600 border-${event.iconColor}-200`
                              : 'bg-background text-muted-foreground border-muted'
                          }`}
                        >
                          <EventIcon className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{event.event}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                        {event.performedBy && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Oleh: {event.performedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}