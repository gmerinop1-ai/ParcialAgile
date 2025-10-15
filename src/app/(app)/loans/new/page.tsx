import { NewLoanForm } from '@/components/loans/NewLoanForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Shield, Calculator } from 'lucide-react';

export default function NewLoanPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4 hover:bg-gray-100">
            <Link href="/loans" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Préstamos
            </Link>
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl text-white">
              <PlusCircle className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Registrar Nuevo Préstamo</h1>
              <p className="text-gray-600 mt-1">
                Complete la información del cliente y los términos del préstamo
              </p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Calculator className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Cálculo Automático</h3>
                    <p className="text-sm text-blue-700">
                      El cronograma de pagos se genera automáticamente según los términos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-green-900">Validación Segura</h3>
                    <p className="text-sm text-green-700">
                      Los datos se verifican automáticamente antes del registro
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Form */}
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                1
              </span>
              Información del Préstamo
            </CardTitle>
            <CardDescription className="text-gray-600">
              Complete todos los campos requeridos para procesar el préstamo correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <NewLoanForm />
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Todos los datos son validados automáticamente. El cronograma se generará al completar el registro.
          </p>
        </div>
      </div>
    </div>
  );
}
