'use client';

import { useState } from 'react';
import {
  CheckCircle,
  Circle,
  PauseCircle,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Play,
  SkipForward,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'SKIPPED';
  taskType: string;
  order: number;
  assignedTo?: string | null;
  notes?: string | null;
  completedAt?: Date | null;
  completedBy?: string | null;
  completedNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskPanelProps {
  transactionId: string;
  tasks: Task[];
  availableStaff?: Array<{ id: string; name: string | null; email: string }>;
  onUpdateStatus: (
    taskId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'SKIPPED',
    notes?: string
  ) => Promise<void>;
  canEdit: boolean;
  userRole?: string;
  currentUserId?: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu',
  IN_PROGRESS: 'Diproses',
  COMPLETED: 'Selesai',
  BLOCKED: 'Terblokir',
  SKIPPED: 'Dilewati',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 hover:bg-green-200',
  BLOCKED: 'bg-red-100 text-red-800 hover:bg-red-200',
  SKIPPED: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
};

const STATUS_ICONS: Record<string, any> = {
  PENDING: Circle,
  IN_PROGRESS: Clock,
  COMPLETED: CheckCircle,
  BLOCKED: AlertTriangle,
  SKIPPED: SkipForward,
};

const TASK_TYPE_LABELS: Record<string, string> = {
  document: 'Dokumen',
  review: 'Review',
  signing: 'Penandatanganan',
  processing: 'Pemrosesan',
  delivery: 'Pengiriman',
  other: 'Lainnya',
};

export function TaskPanel({
  transactionId,
  tasks,
  availableStaff = [],
  onUpdateStatus,
  canEdit,
  userRole,
  currentUserId,
}: TaskPanelProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  const pendingTasks = sortedTasks.filter((t) => t.status === 'PENDING' || t.status === 'BLOCKED');
  const inProgressTasks = sortedTasks.filter((t) => t.status === 'IN_PROGRESS');
  const completedTasks = sortedTasks.filter((t) => t.status === 'COMPLETED' || t.status === 'SKIPPED');

  const getCompletionPercentage = () => {
    if (sortedTasks.length === 0) return 0;
    const completed = sortedTasks.filter(
      (t) => t.status === 'COMPLETED' || t.status === 'SKIPPED'
    ).length;
    return Math.round((completed / sortedTasks.length) * 100);
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedTask) return;

    setIsSubmitting(true);

    try {
      await onUpdateStatus(
        selectedTask.id,
        status as any,
        status === 'COMPLETED' || status === 'BLOCKED' ? statusNotes : undefined
      );
      toast.success(`Status tugas berhasil diubah ke ${STATUS_LABELS[status]}`);
      setStatusDialogOpen(false);
      setSelectedTask(null);
      setStatusNotes('');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengubah status tugas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canStartTask = (task: Task): boolean => {
    if (!canEdit) return false;

    // Check if all previous tasks are completed or skipped
    const taskIndex = sortedTasks.findIndex((t) => t.id === task.id);
    const previousTasks = sortedTasks.slice(0, taskIndex);

    return previousTasks.every(
      (t) => t.status === 'COMPLETED' || t.status === 'SKIPPED'
    );
  };

  const getNextStatuses = (currentStatus: string): string[] => {
    const transitions: Record<string, string[]> = {
      PENDING: ['IN_PROGRESS', 'SKIPPED', 'BLOCKED'],
      IN_PROGRESS: ['COMPLETED', 'BLOCKED', 'PENDING'],
      BLOCKED: ['PENDING', 'IN_PROGRESS', 'SKIPPED'],
      COMPLETED: [],
      SKIPPED: [],
    };
    return transitions[currentStatus] || [];
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const StatusIcon = STATUS_ICONS[task.status];
    const isAssignedToCurrentUser = task.assignedTo === currentUserId;

    return (
      <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-start justify-between gap-4">
          {/* Left Side - Icon and Content */}
          <div className="flex items-start gap-3 flex-1">
            <div
              className={`mt-0.5 ${
                task.status === 'COMPLETED'
                  ? 'text-green-600'
                  : task.status === 'IN_PROGRESS'
                  ? 'text-blue-600'
                  : task.status === 'BLOCKED'
                  ? 'text-red-600'
                  : 'text-muted-foreground'
              }`}
            >
              <StatusIcon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Title and Badge */}
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium">{task.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {TASK_TYPE_LABELS[task.taskType] || task.taskType}
                </Badge>
                <Badge className={STATUS_COLORS[task.status]}>
                  {STATUS_LABELS[task.status]}
                </Badge>
              </div>

              {/* Description */}
              {task.description && (
                <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Urutan: {task.order}</span>
                {task.assignedTo && (
                  <span>
                    PIC:{' '}
                    {availableStaff.find((s) => s.id === task.assignedTo)?.name || 'Staff'}
                  </span>
                )}
                {task.completedAt && (
                  <span>
                    Selesai:{' '}
                    {new Date(task.completedAt).toLocaleDateString('id-ID')}
                  </span>
                )}
              </div>

              {/* Notes */}
              {task.completedNotes && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  Catatan: {task.completedNotes}
                </p>
              )}

              {task.notes && task.status === 'BLOCKED' && (
                <p className="text-sm text-destructive mt-2">
                  🚫 {task.notes}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex items-center gap-2">
              {task.status === 'PENDING' && canStartTask(task) && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setSelectedTask(task);
                    handleStatusChange('IN_PROGRESS');
                  }}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Mulai
                </Button>
              )}

              {task.status === 'IN_PROGRESS' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTask(task);
                    setStatusDialogOpen(true);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Selesai
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {task.status === 'PENDING' && canStartTask(task) && (
                    <DropdownMenuItem onClick={() => handleStatusChange('IN_PROGRESS')}>
                      <Play className="mr-2 h-4 w-4" />
                      Mulai Tugas
                    </DropdownMenuItem>
                  )}

                  {task.status === 'IN_PROGRESS' && (
                    <DropdownMenuItem onClick={() => setStatusDialogOpen(true)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Selesaikan
                    </DropdownMenuItem>
                  )}

                  {task.status === 'IN_PROGRESS' && (
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleStatusChange('BLOCKED')}
                    >
                      <PauseCircle className="mr-2 h-4 w-4" />
                      Blokir
                    </DropdownMenuItem>
                  )}

                  {task.status === 'PENDING' && (
                    <DropdownMenuItem onClick={() => handleStatusChange('SKIPPED')}>
                      <SkipForward className="mr-2 h-4 w-4" />
                      Lewati
                    </DropdownMenuItem>
                  )}

                  {task.status === 'BLOCKED' && (
                    <DropdownMenuItem onClick={() => handleStatusChange('IN_PROGRESS')}>
                      <Play className="mr-2 h-4 w-4" />
                      Lanjutkan
                    </DropdownMenuItem>
                  )}

                  {task.status !== 'COMPLETED' && task.status !== 'SKIPPED' && (
                    <DropdownMenuItem onClick={() => setAssignDialogOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Catatan
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daftar Tugas</CardTitle>
            <CardDescription>
              {sortedTasks.length} tugas • {pendingTasks.length} menunggu •{' '}
              {inProgressTasks.length} berjalan • {completedTasks.length} selesai
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{getCompletionPercentage()}%</div>
            <div className="text-sm text-muted-foreground">Selesai</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${getCompletionPercentage()}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending & In Progress Tasks */}
        {(pendingTasks.length > 0 || inProgressTasks.length > 0) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tugas Aktif ({pendingTasks.length + inProgressTasks.length})
            </h4>
            {pendingTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {inProgressTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="space-y-3 mt-6">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Selesai ({completedTasks.length})
            </h4>
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {sortedTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada tugas untuk transaksi ini</p>
          </div>
        )}
      </CardContent>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selesaikan Tugas</DialogTitle>
            <DialogDescription>
              Selesaikan tugas "{selectedTask?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="statusNotes">Catatan Penyelesaian (Opsional)</Label>
              <Textarea
                id="statusNotes"
                placeholder="Masukkan catatan penyelesaian..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={() => handleStatusChange('COMPLETED')} disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Selesaikan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Catatan Tugas</DialogTitle>
            <DialogDescription>
              Update catatan untuk tugas "{selectedTask?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="taskNotes">Catatan</Label>
              <Textarea
                id="taskNotes"
                placeholder="Masukkan catatan..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={async () => {
                if (selectedTask) {
                  await onUpdateStatus(selectedTask.id, selectedTask.status, statusNotes);
                  setAssignDialogOpen(false);
                  setSelectedTask(null);
                  setStatusNotes('');
                }
              }}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}