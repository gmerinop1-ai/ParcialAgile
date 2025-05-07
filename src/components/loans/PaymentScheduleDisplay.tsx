'use client';

import type { PaymentScheduleEntry } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Printer, Mail, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/loanCalculator';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';

interface PaymentScheduleDisplayProps {
  schedule: PaymentScheduleEntry[];
  customerEmail: string; // For pre-filling email input
}

export function PaymentScheduleDisplay({ schedule, customerEmail }: PaymentScheduleDisplayProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState(customerEmail);
  const [isEmailing, setIsEmailing] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  // Effect to update email if customerEmail prop changes
  useEffect(() => {
    setEmail(customerEmail);
  }, [customerEmail]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Cronograma de Pagos",
    onAfterPrint: () => toast({ title: 'Impresión', description: 'Documento enviado a la impresora.' }),
  });

  const handleDownloadCsv = () => {
    if (schedule.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'No hay datos para descargar.' });
      return;
    }

    const headers = ['Mes', 'Fecha de Pago', 'Monto de Pago (USD)', 'Principal (USD)', 'Interés (USD)', 'Saldo Restante (USD)'];
    const rows = schedule.map(entry => [
      entry.month,
      formatDate(entry.paymentDate),
      entry.paymentAmount.toFixed(2),
      entry.principal.toFixed(2),
      entry.interest.toFixed(2),
      entry.remainingBalance.toFixed(2),
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cronograma_pagos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Descarga Iniciada', description: 'El archivo CSV del cronograma se está descargando.' });
  };

  const handleEmailSchedule = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, ingresa un correo electrónico.' });
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, ingresa un correo electrónico válido.' });
      return;
    }

    setIsEmailing(true);
    // Placeholder for email sending logic. In a real app, this would call a backend service.
    // For now, simulate a delay and success.
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    setIsEmailing(false);
    toast({ 
      title: 'Correo Enviado (Simulado)', 
      description: `El cronograma ha sido enviado a ${email}.`,
      className: "bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-200"
    });
  };

  if (schedule.length === 0) {
    return <p className="text-muted-foreground">No hay cronograma para mostrar. Completa los datos del préstamo.</p>;
  }

  return (
    <div className="space-y-6">
      <div ref={componentRef} className="p-4 border rounded-lg bg-card"> {/* Added padding for printing */}
        <Table>
          <TableCaption>Cronograma detallado de pagos del préstamo.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">Mes</TableHead>
              <TableHead>Fecha de Pago</TableHead>
              <TableHead className="text-right">Monto de Pago</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Interés</TableHead>
              <TableHead className="text-right">Saldo Restante</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map((entry) => (
              <TableRow key={entry.month}>
                <TableCell className="font-medium text-center">{entry.month}</TableCell>
                <TableCell>{formatDate(entry.paymentDate)}</TableCell>
                <TableCell className="text-right">{formatCurrency(entry.paymentAmount)}</TableCell>
                <TableCell className="text-right">{formatCurrency(entry.principal)}</TableCell>
                <TableCell className="text-right">{formatCurrency(entry.interest)}</TableCell>
                <TableCell className="text-right">{formatCurrency(entry.remainingBalance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-grow space-y-2">
          <Label htmlFor="emailSchedule">Enviar Cronograma por Correo</Label>
          <div className="flex gap-2">
            <Input
              id="emailSchedule"
              type="email"
              placeholder="cliente@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={handleEmailSchedule} disabled={isEmailing} variant="outline" className="whitespace-nowrap">
              {isEmailing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Enviar
            </Button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Button onClick={handleDownloadCsv} variant="outline" className="whitespace-nowrap w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Descargar CSV
          </Button>
          <Button onClick={handlePrint} variant="outline" className="whitespace-nowrap w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>
    </div>
  );
}
