'use client';

// ============================================
// SETTINGS PAGE - MAIN
// Tab navigation for different settings categories
// ============================================

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building2, Users, FileText, Shield, UserCheck, AlertTriangle } from 'lucide-react';
import ProfileSettings from './profile';
import NotarisSettings from './notaris';
import UserManagement from './users';
import AuditLogView from './audit-log';
import DataSubjectRequests from './data-subject-requests';
import DataBreachManagement from './data-breach';

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">
          Kelola pengaturan sistem, pengguna, dan audit log
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 md:w-auto md:inline-grid">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="notaris" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden md:inline">Kantor Notaris</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Pengguna</span>
          </TabsTrigger>
          <TabsTrigger value="data-subject" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="hidden md:inline">Hak Subjek Data</span>
          </TabsTrigger>
          <TabsTrigger value="data-breach" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden md:inline">Insiden Data</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">Audit Log</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <ProfileSettings />
        </TabsContent>

        {/* Notaris Settings */}
        <TabsContent value="notaris" className="space-y-4">
          <NotarisSettings />
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        {/* Data Subject Requests */}
        <TabsContent value="data-subject" className="space-y-4">
          <DataSubjectRequests />
        </TabsContent>

        {/* Data Breach Management */}
        <TabsContent value="data-breach" className="space-y-4">
          <DataBreachManagement />
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit" className="space-y-4">
          <AuditLogView />
        </TabsContent>
      </Tabs>
    </div>
  );
}