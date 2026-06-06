'use client';

// ============================================
// USER MANAGEMENT COMPONENT
// Add, edit, delete users
// ============================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Key, Shield } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/users');
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User berhasil ditambahkan');
        setShowAddForm(false);
        setFormData({ name: '', email: '', password: '', role: 'STAFF' });
        fetchUsers();
      } else {
        toast.error(data.error || 'Gagal menambah user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/settings/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          isActive: editingUser.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User berhasil diperbarui');
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'STAFF' });
        fetchUsers();
      } else {
        toast.error(data.error || 'Gagal memperbarui user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch(`/api/settings/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User berhasil dihapus');
        fetchUsers();
      } else {
        toast.error(data.error || 'Gagal menghapus user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/settings/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`User berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
        fetchUsers();
      } else {
        toast.error(data.error || 'Gagal mengubah status');
      }
    } catch (error) {
      console.error('Error toggling user:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email,
      password: '',
      role: user.role,
    });
    setShowAddForm(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'default';
      case 'STAFF':
        return 'secondary';
      case 'FINANCE':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Add User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editingUser ? 'Edit User' : 'Tambah User Baru'}
            </span>
            {showAddForm && !editingUser && (
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Batal
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            {editingUser ? 'Edit informasi user' : 'Tambah user baru ke sistem'}
          </CardDescription>
        </CardHeader>
        {showAddForm ? (
          <CardContent>
            <form onSubmit={editingUser ? handleEdit : handleAdd} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nama User"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    disabled={!!editingUser}
                    required
                  />
                  {editingUser && <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>}
                </div>

                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimal 8 karakter"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin (Notaris)</SelectItem>
                      <SelectItem value="STAFF">Staff Operasional</SelectItem>
                      <SelectItem value="FINANCE">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Tambah User'}
                </Button>
                {editingUser && (
                  <Button type="button" variant="outline" onClick={() => {
                    setEditingUser(null);
                    setShowAddForm(false);
                    setFormData({ name: '', email: '', password: '', role: 'STAFF' });
                  }}>
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        ) : (
          <CardContent>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah User
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Daftar Pengguna
          </CardTitle>
          <CardDescription>Kelola semua pengguna di sistem</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Memuat users...</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground">Belum ada user</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || '-'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Aktif' : 'Non-aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString('id-ID')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(user.id, user.isActive)}
                          >
                            {user.isActive ? 'Non-aktifkan' : 'Aktifkan'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus User?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  User {user.name || user.email} akan dihapus permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(user.id)}>
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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