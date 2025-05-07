
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
import { Loader2, Search, UserCircle, CalendarDays, DollarSign, Info } from 'lucide-react';
import type { Customer, Loan, PaymentScheduleEntry } from '@/types'; 
import { calculatePaymentSchedule, MAX_DAILY_LOAN_AMOUNT, MAX_MONTHLY_LOAN_AMOUNT, MAX_LOAN_TERM_YEARS, formatCurrency } from '@/lib/loanCalculator';
import { PaymentScheduleDisplay } from './PaymentScheduleDisplay';
import { createLoanAction } from '@/app/actions/loanActions';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';

const loanFormSchema = z.object({
  dni: z.string().length(8, { message: 'El DNI debe tener 8 dígitos.' }).regex(/^\d+$/, { message: 'El DNI solo debe contener números.' }),
  amount: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().positive({ message: 'El monto debe ser positivo.' })
      .max(MAX_DAILY_LOAN_AMOUNT, { message: `El monto máximo diario es ${formatCurrency(MAX_DAILY_LOAN_AMOUNT)}.` })
  ),
  termYears: z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number().int().min(1, { message: 'El plazo mínimo es 1 año.' })
      .max(MAX_LOAN_TERM_YEARS, { message: `El plazo máximo es ${MAX_LOAN_TERM_YEARS} años.` })
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
  const [dniError, setDniError] = useState<string | null>(null); // For custom DNI error messages (live feedback or API errors)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger, 
  } = useForm<LoanFormInputs>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      termYears: 1, 
    }
  });

  const dniValue = watch('dni');
  const amountValue = watch('amount');
  const termYearsValue = watch('termYears');

  // Effect for live DNI input feedback (format, length) and clearing data if DNI becomes invalid
  useEffect(() => {
    const debouncedUpdate = setTimeout(() => {
      if (dniValue) { // if there's any input
        let currentError: string | null = null;
        if (dniValue.length !== 8) {
          currentError = 'El DNI debe tener 8 dígitos.';
        } else if (!/^\d+$/.test(dniValue)) {
          currentError = 'El DNI solo debe contener números.';
        }

        setDniError(currentError); // Set or clear the custom error message for live feedback

        if (currentError) { // If there's a format/length error based on current input
          if (customerData) setCustomerData(null); // Clear existing customer data
          if (paymentSchedule.length > 0) setPaymentSchedule([]); // Clear existing payment schedule
        }
        // If !currentError (DNI is 8 digits and numeric), dniError is set to null.
        // Fetching is handled by button click.
      } else { // DNI is empty
        setDniError(null);
        if (customerData) setCustomerData(null);
        if (paymentSchedule.length > 0) setPaymentSchedule([]);
      }
    }, 300); // Debounce slightly

    return () => clearTimeout(debouncedUpdate);
  }, [dniValue]); // Removed customerData and paymentSchedule.length from deps, setters are sufficient

  const handleFetchDni = useCallback(async () => {
    // Trigger react-hook-form validation for the DNI field.
    // This will populate errors.dni if invalid according to the Zod schema.
    const isValidDniField = await trigger('dni');

    if (!isValidDniField) {
      // errors.dni from react-hook-form will be set and displayed by FormMessage.
      // Ensure customer data is cleared if DNI is invalid.
      setCustomerData(null);
      setPaymentSchedule([]);
      // No need to setDniError here as RHF errors.dni.message will be shown.
      // Optionally, a toast could be shown, but usually RHF error display is enough.
      // toast({ variant: 'destructive', title: 'DNI Inválido', description: errors.dni?.message || 'Por favor, ingrese un DNI válido.' });
      return;
    }
    
    // If RHF validation passes, DNI is 8 digits & numeric. Clear any custom dniError.
    setDniError(null); 
    setIsFetchingDni(true);
    setCustomerData(null); // Clear previous data before new fetch
    setPaymentSchedule([]);  // Clear schedule too

    try {
      const response = await fetch(`/api/reniec?dni=${dniValue}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al buscar DNI.');
      }
      const data: Customer = await response.json();
      setCustomerData(data);
      toast({ title: 'Datos del cliente encontrados', description: `${data.nombres} ${data.apellidoPaterno}` });
    } catch (error: any) {
      setCustomerData(null);
      // Display API error or generic error message near DNI field using dniError state
      setDniError(error.message || 'No se pudo obtener los datos del DNI.'); 
      toast({ variant: 'destructive', title: 'Error de DNI', description: error.message || 'No se pudo obtener los datos del DNI.' });
    } finally {
      setIsFetchingDni(false);
    }
  }, [dniValue, toast, trigger]);


  useEffect(() => {
    if (customerData && amountValue > 0 && termYearsValue > 0 && !errors.amount && !errors.termYears) {
      const schedule = calculatePaymentSchedule(amountValue, termYearsValue, new Date());
      setPaymentSchedule(schedule);
    } else {
      setPaymentSchedule([]);
    }
  }, [customerData, amountValue, termYearsValue, errors.amount, errors.termYears]);
  

  const onSubmit: SubmitHandler<LoanFormInputs> = async (data) => {
    if (!customerData || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Datos del cliente o usuario no disponibles.' });
      return;
    }
    if (paymentSchedule.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el cronograma de pagos.' });
      return;
    }

    setIsSubmitting(true);
    
    const loanData: Omit<Loan, 'id' | 'createdAt'> = {
      userId: user.uid,
      customerDni: customerData.dni,
      customerName: customerData.nombres, 
      customerLastName: `${customerData.apellidoPaterno} ${customerData.apellidoMaterno}`.trim(),
      amount: data.amount,
      termYears: data.termYears,
      interestRate: 0.10, // 10%
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
        throw new Error(result.error || 'Error desconocido al guardar el préstamo.');
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        variant: 'destructive',
        title: 'Error al Registrar Préstamo',
        description: error.message || 'Ocurrió un error al guardar el préstamo.',
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
            <Button type="button" onClick={handleFetchDni} disabled={isFetchingDni || !dniValue || dniValue.length !== 8 || !/^\d+$/.test(dniValue)} className="whitespace-nowrap">
              {isFetchingDni ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Buscar DNI
            </Button>
          </div>
          {/* Display RHF validation error for DNI or custom DNI error */}
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

      <section>
        <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
          <DollarSign className="mr-2 h-6 w-6 text-primary" />
          Detalles del Préstamo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto a Prestar (USD)</Label>
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
            <Label htmlFor="termYears">Plazo (Años)</Label>
            <Input
              id="termYears"
              type="number"
              step="1"
              placeholder="Ej: 2"
              {...register('termYears')}
              className={errors.termYears ? 'border-destructive' : ''}
              disabled={!customerData}
              aria-invalid={!!errors.termYears}
            />
            {errors.termYears && <p className="text-sm text-destructive">{errors.termYears.message}</p>}
          </div>
        </div>
        <Alert className="mt-4 border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
          <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          <AlertTitle className="font-semibold text-blue-600 dark:text-blue-300">Información Importante</AlertTitle>
          <AlertDescription className="text-sm">
            La tasa de interés es fija del 10% anual.
            El monto máximo diario por cliente es {formatCurrency(MAX_DAILY_LOAN_AMOUNT)} y mensual es {formatCurrency(MAX_MONTHLY_LOAN_AMOUNT)}.
            El plazo máximo es de {MAX_LOAN_TERM_YEARS} años.
          </AlertDescription>
        </Alert>
      </section>

      {paymentSchedule.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center">
            <CalendarDays className="mr-2 h-6 w-6 text-primary" />
            Cronograma de Pagos
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

