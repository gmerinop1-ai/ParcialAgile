
'use client';

import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card'; 
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, UserCircle, CalendarDays, Coins, Info, Building2 } from 'lucide-react';
import type { Customer, Company, Loan, PaymentScheduleEntry } from '@/types'; 
import { calculatePaymentSchedule, MAX_DAILY_LOAN_AMOUNT, MAX_MONTHLY_LOAN_AMOUNT, MAX_LOAN_TERM_MONTHS, formatCurrency, testPaymentSchedule } from '@/lib/loanCalculator';
import { PaymentScheduleDisplay } from './PaymentScheduleDisplay';
import { createLoanAction } from '@/app/actions/loanActions';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';

const loanFormSchema = z.object({
  document: z.string()
    .min(8, { message: 'El documento debe tener al menos 8 dígitos.' })
    .max(11, { message: 'El documento debe tener máximo 11 dígitos.' })
    .regex(/^\d+$/, { message: 'El documento solo debe contener números.' })
    .refine((val) => val.length === 8 || val.length === 11, { 
      message: 'Ingrese un DNI válido (8 dígitos) o RUC válido (11 dígitos).' 
    }),
  amount: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().positive({ message: 'El monto debe ser positivo.' })
      .max(MAX_DAILY_LOAN_AMOUNT, { message: `El monto máximo diario es ${formatCurrency(MAX_DAILY_LOAN_AMOUNT)}.` })
  ),
  termMonths: z.preprocess( // Changed from termYears to termMonths
    (val) => parseInt(String(val), 10),
    z.number().int().min(1, { message: 'El plazo mínimo es 1 mes.' }) // Updated message
      .max(MAX_LOAN_TERM_MONTHS, { message: `El plazo máximo es ${MAX_LOAN_TERM_MONTHS} meses.` }) // Updated message
  ),
});

type LoanFormInputs = z.infer<typeof loanFormSchema>;

export function NewLoanForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingDocument, setIsFetchingDocument] = useState(false);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleEntry[]>([]);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<'dni' | 'ruc' | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger, 
  } = useForm<LoanFormInputs>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      termMonths: 12, // Default to 12 months (1 year)
    }
  });

  const documentValue = watch('document');
  const amountValue = watch('amount');
  const termMonthsValue = watch('termMonths'); // Changed from termYearsValue

  // Helper function to determine document type
  const getDocumentType = (doc: string): 'dni' | 'ruc' | null => {
    if (doc.length === 8) return 'dni';
    if (doc.length === 11) return 'ruc';
    return null;
  };

  useEffect(() => {
    const debouncedUpdate = setTimeout(() => {
      if (documentValue) { 
        let currentError: string | null = null;
        const currentDocType = getDocumentType(documentValue);
        
        if (documentValue.length < 8 || documentValue.length > 11) {
          currentError = 'Ingrese un DNI válido (8 dígitos) o RUC válido (11 dígitos).';
        } else if (!/^\d+$/.test(documentValue)) {
          currentError = 'El documento solo debe contener números.';
        } else if (documentValue.length !== 8 && documentValue.length !== 11) {
          currentError = 'Ingrese un DNI válido (8 dígitos) o RUC válido (11 dígitos).';
        }

        setDocumentError(currentError);
        setDocumentType(currentDocType);

        if (currentError) { 
          if (customerData) setCustomerData(null); 
          if (companyData) setCompanyData(null);
          if (paymentSchedule.length > 0) setPaymentSchedule([]); 
        }
      } else { 
        setDocumentError(null);
        setDocumentType(null);
        if (customerData) setCustomerData(null);
        if (companyData) setCompanyData(null);
        if (paymentSchedule.length > 0) setPaymentSchedule([]);
      }
    }, 300); 

    return () => clearTimeout(debouncedUpdate);
  }, [documentValue, customerData, companyData, paymentSchedule.length]);

  const handleFetchDocument = useCallback(async () => {
    const isValidDocumentField = await trigger('document');

    if (!isValidDocumentField) {
      setCustomerData(null);
      setCompanyData(null);
      setPaymentSchedule([]);
      setDocumentError(errors.document?.message || 'Por favor, ingrese un documento válido.');
      return;
    }
    
    setDocumentError(null); 
    setIsFetchingDocument(true);
    setCustomerData(null); 
    setCompanyData(null);
    setPaymentSchedule([]);  

    try {
      const currentDocType = getDocumentType(documentValue);
      
      if (currentDocType === 'dni') {
        // Fetch DNI data
        const response = await fetch(`/api/reniec?dni=${documentValue}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al buscar DNI.');
        }
        const data: Customer = await response.json();
        setCustomerData(data);
        toast({ title: 'Datos del cliente encontrados', description: `${data.nombres} ${data.apellidoPaterno}` });
      } else if (currentDocType === 'ruc') {
        // Fetch RUC data
        const response = await fetch(`/api/sunat?ruc=${documentValue}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al buscar RUC.');
        }
        const data: Company = await response.json();
        setCompanyData(data);
        toast({ title: 'Datos de la empresa encontrados', description: data.razonSocial });
      }
    } catch (error: any) {
      setCustomerData(null);
      setCompanyData(null);
      setDocumentError(error.message || 'No se pudo obtener los datos del documento.'); 
      toast({ variant: 'destructive', title: 'Error de búsqueda', description: error.message || 'No se pudo obtener los datos del documento.' });
    } finally {
      setIsFetchingDocument(false);
    }
  }, [documentValue, toast, trigger, errors.document]);


  useEffect(() => {
    if ((customerData || companyData) && amountValue > 0 && termMonthsValue > 0 && !errors.amount && !errors.termMonths) {
      const schedule = calculatePaymentSchedule(amountValue, termMonthsValue, new Date());
      setPaymentSchedule(schedule);
    } else {
      setPaymentSchedule([]);
    }
  }, [customerData, companyData, amountValue, termMonthsValue, errors.amount, errors.termMonths]);
  

  const onSubmit: SubmitHandler<LoanFormInputs> = async (data) => {
    if ((!customerData && !companyData) || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Datos del cliente/empresa o usuario no disponibles.' });
      return;
    }
    if (paymentSchedule.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el cronograma de pagos.' });
      return;
    }

    setIsSubmitting(true);
    
    const loanData: Omit<Loan, 'id' | 'createdAt'> = {
      userId: user.uid,
      customerDocument: data.document,
      customerType: customerData ? 'person' : 'company',
      customerDni: customerData?.dni,
      customerRuc: companyData?.ruc,
      customerName: customerData ? customerData.nombres : companyData!.razonSocial, 
      customerLastName: customerData ? `${customerData.apellidoPaterno} ${customerData.apellidoMaterno}`.trim() : undefined,
      amount: data.amount,
      termMonths: data.termMonths, // Changed from termYears
      interestRate: 0.10, // 10%
      startDate: format(new Date(), 'yyyy-MM-dd'),
      paymentSchedule: paymentSchedule,
    };

    try {
      const result = await createLoanAction(loanData);
      if (result.success && result.loanId) {
        toast({
          title: 'Préstamo Registrado',
          description: `El préstamo para ${customerData ? `${customerData.nombres} ${customerData.apellidoPaterno}` : companyData!.razonSocial} ha sido registrado exitosamente.`,
          className: "bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-200"
        });
        router.push(`/loans`); 
      } else {
        console.error("Error from createLoanAction:", result.error);
        let displayError = result.error || 'Error desconocido al guardar el préstamo.';
        if (displayError.includes('firestore/indexes?create_composite=')) {
             displayError = `Error de Firestore: La consulta requiere un índice. 
            Por favor, crea el índice usando el enlace proporcionado en los logs de tu servidor/consola. 
            Consulta README.md para más detalles. Error original: ${result.error}`;
        }
        toast({
          variant: 'destructive',
          title: 'Error al Registrar Préstamo',
          description: displayError,
          duration: 9000, 
        });
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        variant: 'destructive',
        title: 'Error al Registrar Préstamo',
        description: error.message || 'Ocurrió un error al guardar el préstamo.',
        duration: 9000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section>
        <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
          <UserCircle className="mr-2 h-6 w-6 text-primary" />
          Datos del Cliente/Empresa
        </h3>
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <Label htmlFor="document">
                {documentType === 'dni' ? 'DNI del Cliente' : 
                 documentType === 'ruc' ? 'RUC de la Empresa' : 
                 'DNI (8 dígitos) o RUC (11 dígitos)'}
              </Label>
              <Input
                id="document"
                placeholder="Ingrese DNI (8 dígitos) o RUC (11 dígitos)"
                {...register('document')}
                className={errors.document || documentError ? 'border-destructive' : ''}
                maxLength={11}
                aria-invalid={errors.document || documentError ? "true" : "false"}
              />
            </div>
            <Button 
              type="button" 
              onClick={handleFetchDocument} 
              disabled={
                isFetchingDocument || 
                !documentValue || 
                Boolean(documentError) || 
                (!!documentValue && documentValue.length !== 8 && documentValue.length !== 11) || 
                (!!documentValue && !/^\d+$/.test(documentValue))
              } 
              className="whitespace-nowrap"
            >
              {isFetchingDocument ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {documentType === 'dni' ? 'Buscar DNI' : 
               documentType === 'ruc' ? 'Buscar RUC' : 
               'Buscar'}
            </Button>
          </div>
          {(errors.document && <p className="text-sm text-destructive">{errors.document.message}</p>) || 
           (documentError && <p className="text-sm text-destructive">{documentError}</p>)}

          {customerData && (
            <Card className="bg-secondary/50">
              <CardContent className="p-4 space-y-1 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Persona Natural</span>
                </div>
                <p><strong>Nombres:</strong> {customerData.nombres}</p>
                <p><strong>Apellido Paterno:</strong> {customerData.apellidoPaterno}</p>
                <p><strong>Apellido Materno:</strong> {customerData.apellidoMaterno}</p>
                {customerData.genero && <p><strong>Género:</strong> {customerData.genero}</p>}
                {customerData.fecha_nacimiento && <p><strong>Fecha de Nacimiento:</strong> {customerData.fecha_nacimiento}</p>}
                {customerData.codigo_verificacion && <p><strong>Código de Verificación:</strong> {customerData.codigo_verificacion}</p>}
              </CardContent>
            </Card>
          )}

          {companyData && (
            <Card className="bg-secondary/50">
              <CardContent className="p-4 space-y-1 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Empresa</span>
                </div>
                <p><strong>Razón Social:</strong> {companyData.razonSocial}</p>
                <p><strong>Nombre Comercial:</strong> {companyData.nombreComercial}</p>
                <p><strong>Tipo:</strong> {companyData.tipo}</p>
                <p><strong>Estado:</strong> {companyData.estado}</p>
                <p><strong>Condición:</strong> {companyData.condicion}</p>
                <p><strong>Dirección:</strong> {companyData.direccion}</p>
                {(companyData.departamento || companyData.provincia || companyData.distrito) && (
                  <p><strong>Ubicación:</strong> {[companyData.distrito, companyData.provincia, companyData.departamento].filter(Boolean).join(', ')}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
          <Coins className="mr-2 h-6 w-6 text-primary" />
          Detalles del Préstamo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto a Prestar (S/)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="Ej: 1000.00"
              {...register('amount')}
              className={errors.amount ? 'border-destructive' : ''}
              disabled={!customerData}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="termMonths">Plazo (Meses)</Label> 
            <Input
              id="termMonths"
              type="number"
              step="1"
              placeholder="Ej: 12" 
              {...register('termMonths')} 
              className={errors.termMonths ? 'border-destructive' : ''} 
              disabled={!customerData}
              aria-invalid={!!errors.termMonths} 
            />
            {errors.termMonths && <p className="text-sm text-destructive">{errors.termMonths.message}</p>}
          </div>
        </div>
        <Alert className="mt-4 border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
          <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          <AlertTitle className="font-semibold text-blue-600 dark:text-blue-300">Información Importante</AlertTitle>
          <AlertDescription className="text-sm">
            La tasa de interés es fija del 10% anual.
            El monto máximo diario por cliente es {formatCurrency(MAX_DAILY_LOAN_AMOUNT)} y mensual es {formatCurrency(MAX_MONTHLY_LOAN_AMOUNT)}.
            El plazo máximo es de {MAX_LOAN_TERM_MONTHS} meses.
          </AlertDescription>
        </Alert>
      </section>

      {paymentSchedule.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
            <CalendarDays className="mr-2 h-6 w-6 text-primary" />
            Cronograma de Pagos (Primera cuota el próximo mes)
          </h3>
          <PaymentScheduleDisplay schedule={paymentSchedule} customerEmail={customerData?.nombres ? `${customerData.nombres.split(' ')[0].toLowerCase()}.${customerData.apellidoPaterno.toLowerCase()}@example.com` : ''} />
        </section>
      )}

      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting || !customerData || paymentSchedule.length === 0 || Object.keys(errors).length > 0}
          className="min-w-[150px] bg-green-600 hover:bg-green-700 text-white dark:bg-positive dark:hover:bg-positive/90"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? 'Registrando...' : 'Registrar Préstamo'}
        </Button>
      </div>
    </form>
  );
}

