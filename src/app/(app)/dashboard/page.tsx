import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, List, TrendingUp, Users, DollarSign, Calendar, ArrowRight, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <div className="space-y-8 p-6">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full transform translate-x-32 -translate-y-32"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl text-white">
              <TrendingUp className="h-6 w-6" />
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
              Sistema Activo
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Bienvenido a Financiera Robles
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl">
            Plataforma integral para la gestión profesional de préstamos, clientes y cronogramas de pago.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Link href="/loans/new" className="flex items-center">
                <PlusCircle className="mr-2 h-5 w-5" />
                Registrar Nuevo Préstamo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <Link href="/loans" className="flex items-center">
                <List className="mr-2 h-5 w-5" />
                Ver Préstamos Existentes
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Préstamos Activos
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">S/ 125,450</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clientes Activos
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">24</div>
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              8 nuevos este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pagos Pendientes
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">7</div>
            <p className="text-xs text-purple-600 flex items-center mt-1">
              <Calendar className="h-3 w-3 mr-1" />
              Próximos 7 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Acciones Rápidas</CardTitle>
          <CardDescription className="text-gray-600">
            Gestiona tus operaciones financieras de manera eficiente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center">
                <PlusCircle className="h-5 w-5 mr-2 text-blue-600" />
                Gestión de Préstamos
              </h3>
              <div className="space-y-2 pl-7">
                <Button asChild variant="ghost" className="w-full justify-start h-auto p-3 text-left">
                  <Link href="/loans/new">
                    <div>
                      <div className="font-medium">Registrar Préstamo</div>
                      <div className="text-sm text-gray-500">Crear un nuevo registro de préstamo</div>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start h-auto p-3 text-left">
                  <Link href="/loans">
                    <div>
                      <div className="font-medium">Ver Historial</div>
                      <div className="text-sm text-gray-500">Consultar préstamos existentes</div>
                    </div>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Cronogramas y Pagos
              </h3>
              <div className="space-y-2 pl-7">
                <Button variant="ghost" className="w-full justify-start h-auto p-3 text-left" disabled>
                  <div>
                    <div className="font-medium">Generar Cronograma</div>
                    <div className="text-sm text-gray-500">Crear calendario de pagos</div>
                  </div>
                </Button>
                <Button variant="ghost" className="w-full justify-start h-auto p-3 text-left" disabled>
                  <div>
                    <div className="font-medium">Registro de Pagos</div>
                    <div className="text-sm text-gray-500">Actualizar estado de pagos</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
