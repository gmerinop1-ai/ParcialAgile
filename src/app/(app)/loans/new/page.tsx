import { NewLoanForm } from '@/components/loans/NewLoanForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewLoanPage() {
  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Registrar Nuevo Préstamo</CardTitle>
          <CardDescription>
            Completa los datos del cliente y los detalles del préstamo. El cronograma de pagos se generará automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewLoanForm />
        </CardContent>
      </Card>
    </div>
  );
}
