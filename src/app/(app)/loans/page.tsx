import { LoanListClient } from '@/components/loans/LoanListClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function LoansPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-primary">Historial de Préstamos</CardTitle>
            <CardDescription>
              Visualiza todos los préstamos registrados en el sistema.
            </CardDescription>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/loans/new">
              <PlusCircle className="mr-2 h-5 w-5" />
              Nuevo Préstamo
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <LoanListClient />
        </CardContent>
      </Card>
    </div>
  );
}
