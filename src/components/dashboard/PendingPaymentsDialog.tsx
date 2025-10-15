'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/loanCalculator";
import { Calendar, User, CreditCard, Clock } from "lucide-react";

interface PendingPayment {
  loanId: string;
  customerName: string;
  customerDni: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
}

interface PendingPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingPayments: PendingPayment[];
}

export function PendingPaymentsDialog({ open, onOpenChange, pendingPayments }: PendingPaymentsDialogProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDueBadgeColor = (daysUntilDue: number) => {
    if (daysUntilDue === 0) return "destructive"; // Hoy
    if (daysUntilDue === 1) return "secondary"; // Mañana
    return "default"; // En 2 días
  };

  const getDueText = (daysUntilDue: number) => {
    if (daysUntilDue === 0) return "Vence hoy";
    if (daysUntilDue === 1) return "Vence mañana";
    return `Vence en ${daysUntilDue} días`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Pagos Pendientes - Próximos 2 Días
          </DialogTitle>
          <DialogDescription>
            Lista de cuotas que vencen hoy, mañana o en 2 días
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {pendingPayments.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent className="space-y-2">
                <Clock className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="text-lg font-medium text-gray-600">No hay pagos pendientes</p>
                <p className="text-sm text-gray-500">Todos los pagos están al día</p>
              </CardContent>
            </Card>
          ) : (
            pendingPayments.map((payment, index) => (
              <Card key={`${payment.loanId}-${index}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={getDueBadgeColor(payment.daysUntilDue)}>
                        {getDueText(payment.daysUntilDue)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="text-xs text-gray-500">Monto de cuota</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Cliente:</span>
                        <span>{payment.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">DNI:</span>
                        <span>{payment.customerDni}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Fecha de vencimiento:</span>
                      </div>
                      <div className="text-sm text-gray-600 ml-6">
                        {formatDate(payment.dueDate)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      ID del Préstamo: {payment.loanId}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {pendingPayments.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                Total: {pendingPayments.length} pago{pendingPayments.length !== 1 ? 's' : ''} pendiente{pendingPayments.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-sm text-blue-600 mt-1">
              Monto total a cobrar: {formatCurrency(pendingPayments.reduce((sum, p) => sum + p.amount, 0))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}