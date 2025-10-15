// components/loans/PaymentScheduleDisplay.tsx
'use client';

import type { PaymentScheduleEntry } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Mail, Loader2, FileDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/loanCalculator';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PaymentScheduleDisplayProps {
  schedule: PaymentScheduleEntry[];
  customerEmail: string; // For pre-filling email input
}

export function PaymentScheduleDisplay({ schedule, customerEmail }: PaymentScheduleDisplayProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState(customerEmail);
  const [isEmailing, setIsEmailing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const tableContentRef = useRef<HTMLDivElement>(null);

  // Effect to update email if customerEmail prop changes
  useEffect(() => {
    setEmail(customerEmail);
  }, [customerEmail]);

  const handleDownloadPdf = async () => {
    if (!tableContentRef.current) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo encontrar el contenido para generar el PDF.' });
      return;
    }
    setIsDownloadingPdf(true);
    try {
      // Temporarily make hidden elements visible for PDF generation
      const originalDisplayValues = new Map<HTMLElement, string>();
      const elementsToHideForPdf = tableContentRef.current.querySelectorAll('.hide-for-pdf');
      elementsToHideForPdf.forEach(el => {
        const htmlEl = el as HTMLElement;
        originalDisplayValues.set(htmlEl, htmlEl.style.display);
        htmlEl.style.display = 'none';
      });


      const canvas = await html2canvas(tableContentRef.current, {
        scale: 2, 
        useCORS: true,
        logging: false, 
        onclone: (document) => {
            // You can add specific styles for printing here if needed
            // For example, to ensure all text is black
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                (el as HTMLElement).style.color = 'black';
            });
        }
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt', 
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;

      const pageMargin = 40; // Increased margin for better layout
      const effectivePdfWidth = pdfWidth - (2 * pageMargin);
      const effectivePdfHeight = pdfHeight - (2 * pageMargin);
      
      const ratio = Math.min(effectivePdfWidth / imgWidth, effectivePdfHeight / imgHeight);
      
      const newImgWidth = imgWidth * ratio;
      const newImgHeight = imgHeight * ratio;

      const offsetX = pageMargin + (effectivePdfWidth - newImgWidth) / 2;
      const offsetY = pageMargin + (effectivePdfHeight - newImgHeight) / 2;

      pdf.addImage(imgData, 'PNG', offsetX, offsetY, newImgWidth, newImgHeight);
      pdf.save('cronograma_pagos.pdf');
      
      toast({ title: 'Descarga Iniciada', description: 'El archivo PDF del cronograma se está descargando.' });

      // Restore original display values
      elementsToHideForPdf.forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.display = originalDisplayValues.get(htmlEl) || '';
      });

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ variant: 'destructive', title: 'Error al generar PDF', description: 'No se pudo generar el PDF. Inténtalo de nuevo.' });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadCsv = () => {
    if (schedule.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'No hay datos para descargar.' });
      return;
    }

    const headers = ['Mes', 'Fecha de Pago', 'Monto de Pago (S/)', 'Amortización (S/)', 'Interés (S/)', 'Saldo Restante (S/)'];
    const rows = schedule.map(entry => [
      entry.month,
      formatDate(entry.paymentDate),
      entry.paymentAmount.toFixed(2),
      entry.principal.toFixed(2), // 'principal' here refers to the data field, label is 'Amortización'
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, ingresa un correo electrónico válido.' });
      return;
    }

    setIsEmailing(true);
    // Simulate API call for emailing
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
      <div ref={tableContentRef} className="p-4 border rounded-lg bg-card overflow-x-auto">
        <Table>
          <TableCaption>Cronograma detallado de pagos del préstamo.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">Mes</TableHead>
              <TableHead>Fecha de Pago</TableHead>
              <TableHead className="text-right">Monto de Pago</TableHead>
              <TableHead className="text-right">Amortización</TableHead>
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

      <div className="flex flex-col sm:flex-row gap-4 items-end hide-for-pdf">
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
              disabled={isEmailing || isDownloadingPdf}
            />
            <Button onClick={handleEmailSchedule} disabled={isEmailing || isDownloadingPdf} variant="outline" className="whitespace-nowrap">
              {isEmailing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Enviar
            </Button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Button onClick={handleDownloadCsv} variant="outline" className="whitespace-nowrap w-full sm:w-auto" disabled={isEmailing || isDownloadingPdf}>
            <Download className="mr-2 h-4 w-4" /> Descargar CSV
          </Button>
          <Button onClick={handleDownloadPdf} variant="outline" className="whitespace-nowrap w-full sm:w-auto" disabled={isEmailing || isDownloadingPdf}>
            {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            Descargar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
