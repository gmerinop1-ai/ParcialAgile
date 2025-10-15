import { LoanListClient } from '@/components/loans/LoanListClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, FileText, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LoansPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            Gestión de Préstamos
          </h1>
          <p className="text-gray-600">
            Administra y supervisa todos los préstamos registrados en el sistema
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <Link href="/loans/new">
              <PlusCircle className="mr-2 h-5 w-5" />
              Nuevo Préstamo
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Préstamos</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Activos
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monto Total</p>
                <p className="text-2xl font-bold text-gray-900">S/ 125,450</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Capital
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pagos Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">7</p>
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                Próximos
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="bg-gray-50/50 border-b border-gray-200">
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Historial de Préstamos
              </CardTitle>
              <CardDescription className="text-gray-600">
                Lista completa de todos los préstamos registrados con detalles y estado actual
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <LoanListClient />
        </CardContent>
      </Card>
    </div>
  );
}
