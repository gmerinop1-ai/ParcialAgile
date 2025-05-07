'use client';

import { useEffect, useState } from 'react';
import type { Loan } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { getLoansByUserIdAction } from '@/app/actions/loanActions';
import { LoanDataTable } from './LoanDataTable';
import { columns } from './LoanTableColumns'; // We'll create this next
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';

export function LoanListClient() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchLoans = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await getLoansByUserIdAction(user.uid);
          if (result.success && result.loans) {
            setLoans(result.loans);
          } else {
            setError(result.error || 'Error desconocido al cargar préstamos.');
          }
        } catch (err: any) {
          setError(err.message || 'Error al conectar con el servidor.');
        } finally {
          setLoading(false);
        }
      };
      fetchLoans();
    } else {
      // Handle case where user is somehow null after AuthGuard (should not happen)
      setLoading(false);
      setError("Usuario no autenticado.");
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
     return (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Error al Cargar Préstamos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
  }
  
  if (loans.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No hay Préstamos Registrados</AlertTitle>
        <AlertDescription>
          Aún no has registrado ningún préstamo. Empieza por <a href="/loans/new" className="font-medium text-primary hover:underline">registrar un nuevo préstamo</a>.
        </AlertDescription>
      </Alert>
    );
  }

  return <LoanDataTable columns={columns} data={loans} />;
}
