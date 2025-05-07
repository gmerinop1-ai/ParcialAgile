'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // If user is authenticated, redirect them from auth pages (e.g., /login) to the dashboard.
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    // Show loader or blank while checking auth state or if user is already logged in (and redirecting)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not loading and no user, show the auth page content (e.g., Login form)
  return <>{children}</>;
}
