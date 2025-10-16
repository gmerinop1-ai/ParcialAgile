
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, UserCircle, CalendarDays, Coins, Info, FileDown } from 'lucide-react';
import type { Customer, Loan, PaymentScheduleEntry } from '@/types'; 
import { calculatePaymentSchedule, MAX_DAILY_LOAN_AMOUNT, MIN_LOAN_AMOUNT, MAX_MONTHLY_LOAN_AMOUNT, MAX_LOAN_TERM_MONTHS, formatCurrency, testPaymentSchedule } from '@/lib/loanCalculator';
import { PaymentScheduleDisplay } from './PaymentScheduleDisplay';
import { createLoanAction, checkExistingLoansByDniAction } from '@/app/actions/loanActions';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';

// Constants
const UIT_AMOUNT = 5350; // 1 UIT en soles para 2025

// Validation functions for input restrictions
const validateAmountInput = (value: string): string => {
  // Remove any non-digit and non-decimal characters
  let cleaned = value.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit to 6 digits before decimal point
  if (parts[0] && parts[0].length > 6) {
    parts[0] = parts[0].slice(0, 6);
    cleaned = parts.join('.');
  }
  
  // Limit to 2 decimal places
  if (parts[1] && parts[1].length > 2) {
    parts[1] = parts[1].slice(0, 2);
    cleaned = parts.join('.');
  }
  
  return cleaned;
};

const validateTermInput = (value: string): string => {
  // Remove any non-digit characters and limit to 2 digits
  const cleaned = value.replace(/\D/g, '').slice(0, 2);
  return cleaned;
};

const validateInterestRateInput = (value: string): string => {
  // Remove any non-digit and non-decimal characters
  let cleaned = value.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit to 2 digits before decimal point (max 99)
  if (parts[0] && parts[0].length > 2) {
    parts[0] = parts[0].slice(0, 2);
    cleaned = parts.join('.');
  }
  
  // Limit to 2 decimal places
  if (parts[1] && parts[1].length > 2) {
    parts[1] = parts[1].slice(0, 2);
    cleaned = parts.join('.');
  }
  
  return cleaned;
};

// Function to check if loan amount requires ficha de conocimiento
const requiresFichaKnowledge = (amount: number): boolean => {
  return amount > UIT_AMOUNT;
};

const loanFormSchema = z.object({
  dni: z.string().length(8, { message: 'El DNI debe tener 8 dígitos.' }).regex(/^\d+$/, { message: 'El DNI solo debe contener números.' }),
  amount: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number()
      .min(200, { message: 'El monto mínimo es S/ 200.' })
      .max(100000, { message: 'El monto máximo es S/ 100,000.' })
      .positive({ message: 'El monto debe ser positivo.' })
  ),
  termMonths: z.preprocess( // Changed from termYears to termMonths
    (val) => parseInt(String(val), 10),
    z.number().int().min(1, { message: 'El plazo mínimo es 1 mes.' }) // Updated message
      .max(MAX_LOAN_TERM_MONTHS, { message: `El plazo máximo es ${MAX_LOAN_TERM_MONTHS} meses.` }) // Updated message
  ),
  interestRate: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number()
      .min(0.01, { message: 'La tasa de interés debe ser mayor a 0.01%.' })
      .max(99.99, { message: 'La tasa de interés no puede ser mayor a 99.99%.' })
  ),
});

type LoanFormInputs = z.infer<typeof loanFormSchema>;

export function NewLoanForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingDni, setIsFetchingDni] = useState(false);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleEntry[]>([]);
  const [dniError, setDniError] = useState<string | null>(null);
  const [declarationCompleted, setDeclarationCompleted] = useState(false);
  const [fichaKnowledgeCompleted, setFichaKnowledgeCompleted] = useState(false);
  
  // States for controlled inputs with validation
  const [amountInput, setAmountInput] = useState<string>('');
  const [termInput, setTermInput] = useState<string>('12');
  const [interestRateInput, setInterestRateInput] = useState<string>('10');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
    setValue,
  } = useForm<LoanFormInputs>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      termMonths: 12, // Default to 12 months (1 year)
      interestRate: 10, // Default to 10% annual interest rate (displayed as percentage)
    }
  });

  const dniValue = watch('dni');
  const amountValue = watch('amount');
  const termMonthsValue = watch('termMonths');

  useEffect(() => {
    const debouncedUpdate = setTimeout(() => {
      if (dniValue) { 
        let currentError: string | null = null;
        if (dniValue.length !== 8) {
          currentError = 'El DNI debe tener 8 dígitos.';
        } else if (!/^\d+$/.test(dniValue)) {
          currentError = 'El DNI solo debe contener números.';
        }

        setDniError(currentError); 

        if (currentError) { 
          if (customerData) setCustomerData(null); 
          if (paymentSchedule.length > 0) setPaymentSchedule([]); 
        }
      } else { 
        setDniError(null);
        if (customerData) setCustomerData(null);
        if (paymentSchedule.length > 0) setPaymentSchedule([]);
      }
    }, 300); 

    return () => clearTimeout(debouncedUpdate);
  }, [dniValue, customerData, paymentSchedule.length]); // customerData and paymentSchedule.length are needed here to reset if DNI changes to invalid

  const handleFetchDni = useCallback(async () => {
    const isValidDniField = await trigger('dni');

    if (!isValidDniField) {
      setCustomerData(null);
      setPaymentSchedule([]);
      setDniError(errors.dni?.message || 'Por favor, ingrese un DNI válido.');
      return;
    }
    
    setDniError(null); 
    setIsFetchingDni(true);
    setCustomerData(null); 
    setPaymentSchedule([]);  

    try {
      const response = await fetch(`/api/reniec?dni=${dniValue}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al buscar DNI.');
      }
      const data: Customer = await response.json();
      
      // Check for existing loans after successfully fetching customer data
      const existingLoansCheck = await checkExistingLoansByDniAction(dniValue);
      if (!existingLoansCheck.success) {
        throw new Error(existingLoansCheck.error || 'Error al verificar préstamos existentes.');
      }
      
      if (existingLoansCheck.hasExistingLoans && existingLoansCheck.existingLoans && existingLoansCheck.existingLoans.length > 0) {
        const latestLoan = existingLoansCheck.existingLoans[0];
        const errorMessage = `El cliente ${data.nombres} ${data.apellidoPaterno} ya tiene un préstamo pendiente registrado el ${new Date(latestLoan.createdAt).toLocaleDateString('es-PE')} por ${new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(latestLoan.amount)}. No se puede otorgar un nuevo préstamo hasta que se complete el anterior.`;
        setDniError(errorMessage);
        toast({ 
          variant: 'destructive', 
          title: 'Préstamo Existente', 
          description: errorMessage 
        });
        return;
      }
      
      setCustomerData(data);
      toast({ title: 'Datos del cliente encontrados', description: `${data.nombres} ${data.apellidoPaterno}` });
    } catch (error: any) {
      setCustomerData(null);
      setDniError(error.message || 'No se pudo obtener los datos del DNI.'); 
      toast({ variant: 'destructive', title: 'Error de DNI', description: error.message || 'No se pudo obtener los datos del DNI.' });
    } finally {
      setIsFetchingDni(false);
    }
  }, [dniValue, toast, trigger, errors.dni]);


  // Initialize controlled inputs with default values
  useEffect(() => {
    setValue('termMonths', 12);
    setValue('interestRate', 10);
  }, [setValue]);

  useEffect(() => {
    if (customerData && amountInput && termInput && interestRateInput && 
        !errors.amount && !errors.termMonths && !errors.interestRate) {
      const amount = parseFloat(amountInput);
      const termMonths = parseInt(termInput);
      const interestRate = parseFloat(interestRateInput);
      
      if (amount > 0 && termMonths > 0 && interestRate > 0) {
        // Convert percentage to decimal (e.g., 10% becomes 0.10)
        const annualInterestRate = interestRate / 100;
        const schedule = calculatePaymentSchedule(amount, termMonths, new Date(), annualInterestRate);
        setPaymentSchedule(schedule);
      } else {
        setPaymentSchedule([]);
      }
    } else {
      setPaymentSchedule([]);
    }
  }, [customerData, amountInput, termInput, interestRateInput, errors.amount, errors.termMonths, errors.interestRate]);
  
  // Reset ficha knowledge checkbox when amount changes and no longer requires it
  useEffect(() => {
    const amount = parseFloat(amountInput || '0');
    if (!requiresFichaKnowledge(amount) && fichaKnowledgeCompleted) {
      setFichaKnowledgeCompleted(false);
    }
  }, [amountInput, fichaKnowledgeCompleted]);

  const onSubmit: SubmitHandler<LoanFormInputs> = async (data) => {
    if (!customerData || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Datos del cliente o usuario no disponibles.' });
      return;
    }
    if (paymentSchedule.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el cronograma de pagos.' });
      return;
    }
    
    // Validate ficha de conocimiento for amounts > 1 UIT
    if (requiresFichaKnowledge(data.amount) && !fichaKnowledgeCompleted) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Para préstamos mayores a 1 UIT debe completar la Ficha de Conocimiento del Cliente.' 
      });
      return;
    }

    setIsSubmitting(true);
    
    const loanData: Omit<Loan, 'id' | 'createdAt'> = {
      userId: user.uid,
      customerDni: customerData.dni,
      customerName: customerData.nombres, 
      customerLastName: `${customerData.apellidoPaterno} ${customerData.apellidoMaterno}`.trim(),
      amount: data.amount,
      termMonths: data.termMonths, // Changed from termYears
      interestRate: data.interestRate / 100, // Convert percentage to decimal (e.g., 10% becomes 0.10)
      startDate: format(new Date(), 'yyyy-MM-dd'),
      paymentSchedule: paymentSchedule,
    };

    try {
      const result = await createLoanAction(loanData);
      if (result.success && result.loanId) {
        toast({
          title: 'Préstamo Registrado',
          description: `El préstamo para ${customerData.nombres} ${customerData.apellidoPaterno} ha sido registrado exitosamente.`,
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
          Datos del Cliente
        </h3>
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <Label htmlFor="dni">DNI del Cliente</Label>
              <Input
                id="dni"
                placeholder="Ingrese DNI (8 dígitos)"
                {...register('dni')}
                className={errors.dni || dniError ? 'border-destructive' : ''}
                maxLength={8}
                aria-invalid={errors.dni || dniError ? "true" : "false"}
              />
            </div>
            <Button 
              type="button" 
              onClick={handleFetchDni} 
              disabled={
                isFetchingDni || 
                !dniValue || 
                dniValue.length === 0 ||
                Boolean(dniError) || 
                dniValue.length !== 8 || 
                !/^\d+$/.test(dniValue)
              } 
              className="whitespace-nowrap"
            >
              {isFetchingDni ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Buscar DNI
            </Button>
          </div>
          {(errors.dni && <p className="text-sm text-destructive">{errors.dni.message}</p>) || 
           (dniError && <p className="text-sm text-destructive">{dniError}</p>)}

          {customerData && (
            <Card className="bg-secondary/50">
              <CardContent className="p-4 space-y-1 text-sm">
                <p><strong>Nombres:</strong> {customerData.nombres}</p>
                <p><strong>Apellido Paterno:</strong> {customerData.apellidoPaterno}</p>
                <p><strong>Apellido Materno:</strong> {customerData.apellidoMaterno}</p>
                {customerData.genero && <p><strong>Género:</strong> {customerData.genero}</p>}
                {customerData.fecha_nacimiento && <p><strong>Fecha de Nacimiento:</strong> {customerData.fecha_nacimiento}</p>}
                {customerData.codigo_verificacion && <p><strong>Código de Verificación:</strong> {customerData.codigo_verificacion}</p>}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Sección de descarga de declaración jurada */}
      {customerData && (
        <section className="text-center py-6">
          <div className="border rounded-lg p-6 bg-secondary/30">
            <h4 className="text-lg font-medium mb-3 text-foreground">
              Documentación Requerida
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Descargue y complete la declaración jurada para validacion de clientes PEP (Persona Expuesta Politicamente) antes de continuar con el préstamo
            </p>
            <Button 
              type="button"
              asChild
              variant="outline" 
              className="whitespace-nowrap"
            >
              <a 
                href="/documentos/declaracion-jurada-general-pep.pdf" 
                download="declaracion-jurada-general-pep.pdf"
                className="flex items-center"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Descargar Declaración Jurada
              </a>
            </Button>
            
            <div className="flex items-center space-x-2 mt-4 justify-center">
              <Checkbox 
                id="declaration-completed"
                checked={declarationCompleted}
                onCheckedChange={(checked) => setDeclarationCompleted(checked as boolean)}
              />
              <Label 
                htmlFor="declaration-completed" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Confirmo que la declaración jurada ha sido completada y firmada por el cliente
              </Label>
            </div>
          </div>
        </section>
      )}

      {/* Sección de Ficha de Conocimiento - Solo para préstamos > 1 UIT */}
      {customerData && declarationCompleted && amountInput && parseFloat(amountInput) > UIT_AMOUNT && (
        <section className="text-center py-6">
          <div className="border rounded-lg p-6 bg-orange-50 border-orange-200">
            <h4 className="text-lg font-medium mb-3 text-foreground">
              Documentación Adicional Requerida
            </h4>
            <div className="mb-4 p-3 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-800 font-medium">
                ⚠️ Préstamo Mayor a 1 UIT (S/ {UIT_AMOUNT.toLocaleString()})
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Monto solicitado: S/ {parseFloat(amountInput || '0').toLocaleString()}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Para préstamos superiores a 1 UIT, es obligatorio descargar y completar la Ficha de Conocimiento del Cliente
            </p>
            <Button 
              type="button"
              asChild
              variant="outline" 
              className="whitespace-nowrap mb-4"
            >
              <a 
                href="/documentos/ficha-conocimiento-cliente-regimen-general.pdf" 
                download="ficha-conocimiento-cliente-regimen-general.pdf"
                className="flex items-center"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Descargar Ficha de Conocimiento del Cliente
              </a>
            </Button>
            
            <div className="flex items-center space-x-2 mt-4 justify-center">
              <Checkbox 
                id="ficha-knowledge-completed"
                checked={fichaKnowledgeCompleted}
                onCheckedChange={(checked) => setFichaKnowledgeCompleted(checked as boolean)}
              />
              <Label 
                htmlFor="ficha-knowledge-completed" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Confirmo que la Ficha de Conocimiento del Cliente ha sido completada y firmada
              </Label>
            </div>
          </div>
        </section>
      )}

      {/* Sección de Detalles del Préstamo - Solo visible cuando se confirma la declaración jurada */}
      {customerData && declarationCompleted && (
        <section>
          <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
            <Coins className="mr-2 h-6 w-6 text-primary" />
            Detalles del Préstamo
          </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto a Prestar (S/)</Label>
            <Input
              id="amount"
              type="text"
              placeholder="Ej: 5000.00"
              value={amountInput}
              onChange={(e) => {
                const validatedValue = validateAmountInput(e.target.value);
                setAmountInput(validatedValue);
                // Update form value if valid number
                if (validatedValue && !isNaN(parseFloat(validatedValue))) {
                  setValue('amount', parseFloat(validatedValue));
                  trigger('amount');
                }
              }}
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
              type="text"
              placeholder="Ej: 12"
              value={termInput}
              onChange={(e) => {
                const validatedValue = validateTermInput(e.target.value);
                setTermInput(validatedValue);
                // Update form value if valid number
                if (validatedValue && !isNaN(parseInt(validatedValue))) {
                  setValue('termMonths', parseInt(validatedValue));
                  trigger('termMonths');
                }
              }}
              className={errors.termMonths ? 'border-destructive' : ''} 
              disabled={!customerData}
              aria-invalid={!!errors.termMonths} 
            />
            {errors.termMonths && <p className="text-sm text-destructive">{errors.termMonths.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="interestRate">Tasa de Interés Anual (%)</Label>
            <Input
              id="interestRate"
              type="text"
              placeholder="Ej: 15.50"
              value={interestRateInput}
              onChange={(e) => {
                const validatedValue = validateInterestRateInput(e.target.value);
                setInterestRateInput(validatedValue);
                // Update form value if valid number
                if (validatedValue && !isNaN(parseFloat(validatedValue))) {
                  setValue('interestRate', parseFloat(validatedValue));
                  trigger('interestRate');
                }
              }}
              className={errors.interestRate ? 'border-destructive' : ''}
              disabled={!customerData}
              aria-invalid={!!errors.interestRate}
            />
            {errors.interestRate && <p className="text-sm text-destructive">{errors.interestRate.message}</p>}
          </div>
        </div>
        <Alert className="mt-4 border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
          <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          <AlertTitle className="font-semibold text-blue-600 dark:text-blue-300">Información Importante</AlertTitle>
          <AlertDescription className="text-sm">
            Tasa de interés actual: {interestRateInput ? `${interestRateInput}%` : 'No definida'} anual (máximo 99.99%).
            Rango de monto: {formatCurrency(MIN_LOAN_AMOUNT)} - {formatCurrency(MAX_DAILY_LOAN_AMOUNT)}.
            El plazo máximo es de {MAX_LOAN_TERM_MONTHS} meses.
          </AlertDescription>
        </Alert>
      </section>
      )}

      {paymentSchedule.length > 0 && declarationCompleted && (
        <section>
          <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
            <CalendarDays className="mr-2 h-6 w-6 text-primary" />
            Cronograma de Pagos (Primera cuota el próximo mes)
          </h3>
          <PaymentScheduleDisplay 
            schedule={paymentSchedule} 
            customer={customerData}
            loan={{ amount: Number(amountValue || 0), termMonths: Number(termMonthsValue || 0), interestRate: 0.10, startDate: format(new Date(), 'yyyy-MM-dd') }}
          />
        </section>
      )}

      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={
            isSubmitting || 
            !customerData || 
            !declarationCompleted || 
            paymentSchedule.length === 0 || 
            Object.keys(errors).length > 0 || 
            Boolean(dniError) ||
            (requiresFichaKnowledge(parseFloat(amountInput || '0')) && !fichaKnowledgeCompleted)
          }
          className="min-w-[150px] bg-green-600 hover:bg-green-700 text-white dark:bg-positive dark:hover:bg-positive/90"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? 'Registrando...' : 'Registrar Préstamo'}
        </Button>
      </div>
    </form>
  );
}

