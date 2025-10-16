'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, List, TrendingUp, Users, DollarSign, Calendar, ArrowRight, CheckCircle, Wallet, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardMetricsAction } from "@/app/actions/loanActions";
import { formatCurrency } from "@/lib/loanCalculator";
import { PendingPaymentsDialog } from "@/components/dashboard/PendingPaymentsDialog";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardMetrics {
  totalActiveLoans: number;
  totalLoanedAmount: number;
  availableCapital: number;
  pendingPayments: Array<{
    loanId: string;
    customerName: string;
    customerDni: string;
    amount: number;
    dueDate: string;
    daysUntilDue: number;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPendingPayments, setShowPendingPayments] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadMetrics();
    }
  }, [user]);

  // Refresh metrics when the page becomes visible again (user returns from other pages)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.uid) {
        loadMetrics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh when window gains focus
    const handleFocus = () => {
      if (user?.uid) {
        loadMetrics();
      }
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const loadMetrics = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const result = await getDashboardMetricsAction(user.uid);
      if (result.success && result.metrics) {
        setMetrics(result.metrics);
      }
    } catch (error) {
      console.error('Error loading dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };
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
        {/* Total Active Loans */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Préstamos Activos
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <div className="text-2xl font-bold text-gray-900">{metrics?.totalActiveLoans || 0}</div>
            )}
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              Préstamos registrados
            </p>
          </CardContent>
        </Card>

        {/* Total Loaned Amount */}
        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Monto Prestado
            </CardTitle>
            <Wallet className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics?.totalLoanedAmount || 0)}
              </div>
            )}
            <p className="text-xs text-orange-600 flex items-center mt-1">
              <DollarSign className="h-3 w-3 mr-1" />
              Total en préstamos activos
            </p>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card 
          className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setShowPendingPayments(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pagos Pendientes
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12 mb-2" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">
                  {metrics?.pendingPayments.length || 0}
                </div>
                {(metrics?.pendingPayments.length || 0) > 0 && (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
              </div>
            )}
            <p className="text-xs text-purple-600 flex items-center mt-1">
              <Calendar className="h-3 w-3 mr-1" />
              Próximos 2 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Summary */}
      {!loading && metrics && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <DollarSign className="h-5 w-5" />
              Resumen de Préstamos
            </CardTitle>
            <CardDescription className="text-blue-700">
              Información sobre los préstamos activos en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.totalActiveLoans}
                </div>
                <div className="text-sm text-blue-500 mt-1">Préstamos Activos</div>
                <div className="text-xs text-gray-500 mt-1">Total de préstamos registrados</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(metrics.totalLoanedAmount)}
                </div>
                <div className="text-sm text-orange-500 mt-1">Monto Total Prestado</div>
                <div className="text-xs text-gray-500 mt-1">Suma de todos los préstamos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Payments Dialog */}
      <PendingPaymentsDialog
        open={showPendingPayments}
        onOpenChange={setShowPendingPayments}
        pendingPayments={metrics?.pendingPayments || []}
      />
    </div>
  );
}
