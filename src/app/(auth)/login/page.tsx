import { LoginForm } from '@/components/auth/LoginForm';
import Image from 'next/image';
import { siteConfig } from '@/config/site';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {/* Placeholder for a logo */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground lucide lucide-landmark"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {siteConfig.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Inicia sesión para administrar los préstamos.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
