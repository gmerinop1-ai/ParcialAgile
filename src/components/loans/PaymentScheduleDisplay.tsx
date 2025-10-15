// components/loans/PaymentScheduleDisplay.tsx
'use client';

import type { PaymentScheduleEntry, Customer } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/loanCalculator';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { COMPANY_CONFIG } from '@/config/company';

interface PaymentScheduleDisplayProps {
  schedule: PaymentScheduleEntry[];
  customer?: Customer | null; // Optional cliente info to include in downloads
  loan?: {
    amount: number;
    termMonths: number;
    interestRate?: number;
    startDate?: string;
  } | null; // Optional loan summary to include in downloads
  showCorporateHeader?: boolean; // Control when to show corporate branding (PDF only)
}

export function PaymentScheduleDisplay({ schedule, customer = null, loan = null, showCorporateHeader = false }: PaymentScheduleDisplayProps) {
  const { toast } = useToast();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showCorporateHeaderForPdf, setShowCorporateHeaderForPdf] = useState(showCorporateHeader);
  const tableContentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!tableContentRef.current) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo encontrar el contenido para generar el PDF.' });
      return;
    }
    setIsDownloadingPdf(true);
    
    // Temporarily show corporate header for PDF generation
    setShowCorporateHeaderForPdf(true);
    
    // Wait for re-render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // Temporarily make hidden elements visible for PDF generation
      const originalDisplayValues = new Map<HTMLElement, string>();
      const elementsToHideForPdf = tableContentRef.current.querySelectorAll('.hide-for-pdf');
      elementsToHideForPdf.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        originalDisplayValues.set(htmlEl, htmlEl.style.display);
        htmlEl.style.display = 'none';
      });


      const canvas = await html2canvas(tableContentRef.current, {
        scale: 3, // Increased scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Ensure white background
        onclone: (document: Document) => {
            // Apply print-friendly styles
            const allElements = document.querySelectorAll<HTMLElement>('*');
            allElements.forEach((el: HTMLElement) => {
                // Ensure text is black for PDF
                el.style.color = 'black';
                // Improve font rendering using setProperty for vendor prefixes
                el.style.setProperty('-webkit-font-smoothing', 'antialiased');
                el.style.setProperty('-moz-osx-font-smoothing', 'grayscale');
            });
        }
      });
      const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt', 
        format: 'a4',
        compress: false // Better quality
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;

      const pageMargin = 30; // Optimized margin
      const effectivePdfWidth = pdfWidth - (2 * pageMargin);
      const effectivePdfHeight = pdfHeight - (2 * pageMargin);
      
      const ratio = Math.min(effectivePdfWidth / imgWidth, effectivePdfHeight / imgHeight);
      
      const newImgWidth = imgWidth * ratio;
      const newImgHeight = imgHeight * ratio;

      const offsetX = pageMargin;
      const offsetY = pageMargin;

      pdf.addImage(imgData, 'PNG', offsetX, offsetY, newImgWidth, newImgHeight);
      
      // Generate filename with customer info if available
      const fileName = customer 
        ? `cronograma_${customer.dni}_${customer.apellidoPaterno.toLowerCase()}.pdf`
        : 'cronograma_pagos.pdf';
      
      pdf.save(fileName);
      
      toast({ title: 'Descarga Iniciada', description: 'El archivo PDF del cronograma se está descargando.' });

      // Restore original display values
      elementsToHideForPdf.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.display = originalDisplayValues.get(htmlEl) || '';
      });

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ variant: 'destructive', title: 'Error al generar PDF', description: 'No se pudo generar el PDF. Inténtalo de nuevo.' });
    } finally {
      // Restore original corporate header state
      setShowCorporateHeaderForPdf(showCorporateHeader);
      setIsDownloadingPdf(false);
    }
  };

  if (schedule.length === 0) {
    return <p className="text-muted-foreground">No hay cronograma para mostrar. Completa los datos del préstamo.</p>;
  }

  return (
    <div className="space-y-6">
      <div ref={tableContentRef} className="p-6 border rounded-lg bg-white overflow-x-auto">
        {/* Professional Header for PDF - only show when downloading PDF */}
        {showCorporateHeaderForPdf && (
          <div className="mb-6 border-b-2 pb-4" style={{ borderColor: COMPANY_CONFIG.colors.primary }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Logo placeholder - you can replace with actual logo */}
                <div 
                  className="rounded-lg flex items-center justify-center"
                  style={{ 
                    width: COMPANY_CONFIG.logo.size, 
                    height: COMPANY_CONFIG.logo.size,
                    backgroundColor: COMPANY_CONFIG.logo.backgroundColor,
                    color: COMPANY_CONFIG.logo.textColor
                  }}
                >
                  <span className="font-bold text-lg">{COMPANY_CONFIG.logo.initials}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: COMPANY_CONFIG.colors.primaryDark }}>
                    {COMPANY_CONFIG.name}
                  </h1>
                  <p className="text-sm" style={{ color: COMPANY_CONFIG.colors.secondary }}>
                    {COMPANY_CONFIG.tagline}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm" style={{ color: COMPANY_CONFIG.colors.secondary }}>
                <p>Fecha de emisión: {new Date().toLocaleDateString('es-PE')}</p>
                <p>Documento: {COMPANY_CONFIG.pdf.documentTitle}</p>
              </div>
            </div>
          </div>
        )}

        {/* Client and Loan Information */}
        {(customer || loan) && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Información del Préstamo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {customer && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700">Datos del Cliente</h3>
                  <p><span className="font-medium">Nombre:</span> {customer.nombres} {customer.apellidoPaterno} {customer.apellidoMaterno}</p>
                  <p><span className="font-medium">DNI:</span> {customer.dni}</p>
                </div>
              )}
              {loan && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700">Detalles del Préstamo</h3>
                  <p><span className="font-medium">Monto:</span> {formatCurrency(loan.amount)}</p>
                  <p><span className="font-medium">Plazo:</span> {loan.termMonths} meses</p>
                  <p><span className="font-medium">Tasa de Interés:</span> {loan.interestRate !== undefined ? `${(loan.interestRate * 100).toFixed(2)}% anual` : 'N/A'}</p>
                  {loan.startDate && <p><span className="font-medium">Fecha de Inicio:</span> {loan.startDate}</p>}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Cronograma de Pagos</h2>
          <Table className="border-collapse border border-gray-300">
            <TableHeader>
              <TableRow style={{ backgroundColor: COMPANY_CONFIG.colors.primary }}>
                <TableHead className="border border-gray-300 text-center text-white font-semibold">Mes</TableHead>
                <TableHead className="border border-gray-300 text-white font-semibold">Fecha de Pago</TableHead>
                <TableHead className="border border-gray-300 text-right text-white font-semibold">Monto de Pago</TableHead>
                <TableHead className="border border-gray-300 text-right text-white font-semibold">Amortización</TableHead>
                <TableHead className="border border-gray-300 text-right text-white font-semibold">Interés</TableHead>
                <TableHead className="border border-gray-300 text-right text-white font-semibold">Saldo Restante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map((entry, index) => (
                <TableRow key={entry.month} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <TableCell className="border border-gray-300 font-medium text-center">{entry.month}</TableCell>
                  <TableCell className="border border-gray-300">{formatDate(entry.paymentDate)}</TableCell>
                  <TableCell className="border border-gray-300 text-right font-medium">{formatCurrency(entry.paymentAmount)}</TableCell>
                  <TableCell className="border border-gray-300 text-right">{formatCurrency(entry.principal)}</TableCell>
                  <TableCell className="border border-gray-300 text-right">{formatCurrency(entry.interest)}</TableCell>
                  <TableCell className="border border-gray-300 text-right">{formatCurrency(entry.remainingBalance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer for PDF */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm" style={{ color: COMPANY_CONFIG.colors.secondary }}>
          <p>{COMPANY_CONFIG.pdf.footerText}</p>
          <p className="mt-2">
            {COMPANY_CONFIG.fullName} - Teléfono: {COMPANY_CONFIG.contact.phone} - Email: {COMPANY_CONFIG.contact.email}
          </p>
        </div>
      </div>

      <div className="flex justify-center hide-for-pdf">
        <Button onClick={handleDownloadPdf} variant="outline" className="whitespace-nowrap" disabled={isDownloadingPdf}>
          {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
          Descargar PDF
        </Button>
      </div>
    </div>
  );
}
