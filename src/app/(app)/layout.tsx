import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthGuard>
      <SidebarProvider defaultOpen className="bg-background">
        <AppSidebar />
        <SidebarInset className="p-4 md:p-8 overflow-auto">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
