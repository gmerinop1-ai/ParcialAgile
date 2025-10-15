'use client';

import { useState, useEffect, useCallback } from 'react';
import { LoanListClient } from '@/components/loans/LoanListClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, FileText, Filter, Users, DollarSign, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardMetricsAction } from '@/app/actions/loanActions';
import { formatCurrency } from '@/lib/loanCalculator';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function LoansPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    if (!user?.uid) return;
    
    // Add a small delay to prevent flashing when data loads quickly
    const startTime = Date.now();
    setLoading(true);
    
    try {
      const result = await getDashboardMetricsAction(user.uid);
      if (result.success && result.metrics) {
        setMetrics(result.metrics);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      // Ensure minimum loading time to prevent flashing
      const elapsed = Date.now() - startTime;
      const minLoadTime = 300; // 300ms minimum
      
      if (elapsed < minLoadTime) {
        setTimeout(() => setLoading(false), minLoadTime - elapsed);
      } else {
        setLoading(false);
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadMetrics();
    }
  }, [user, loadMetrics]);
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
      {!loading || metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Préstamos</p>
                    {loading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">{metrics?.totalActiveLoans || 0}</p>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Activos
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Monto Total Prestado</p>
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(metrics?.totalLoanedAmount || 0)}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Capital
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-amber-600" />
                  <div>
                    <p className="text-sm text-gray-600">Pagos Pendientes</p>
                    {loading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">{metrics?.pendingPayments.length || 0}</p>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  Próximos 2 días
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-l-4 border-l-gray-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
