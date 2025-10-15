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
      <SidebarProvider defaultOpen className="bg-gray-50">
        <div className="flex min-h-screen">
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-auto bg-gray-50">
            <main className="min-h-screen">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
