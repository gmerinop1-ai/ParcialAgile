import type { Loan, PaymentScheduleEntry } from '@/types';
import { format, addMonths, addYears, parseISO } from 'date-fns';

const LOAN_INTEREST_RATE = 0.10; // 10% annual interest rate
export const MAX_LOAN_TERM_MONTHS = 60; // Maximum loan term in months (e.g., 5 years)

export function calculatePaymentSchedule(
  amount: number,
  termMonths: number, // Changed from termYears
  startDate: Date | string // Can be Date object or ISO string
): PaymentScheduleEntry[] {
  const principal = amount;
  const annualInterestRate = LOAN_INTEREST_RATE;
  const numberOfPayments = termMonths; // Use termMonths directly

  if (principal <= 0 || numberOfPayments <= 0 || annualInterestRate < 0) {
    return [];
  }
  
  let monthlyPayment: number;
  const monthlyInterestRate = annualInterestRate / 12;

  if (monthlyInterestRate === 0) {
    monthlyPayment = principal / numberOfPayments;
  } else {
     monthlyPayment =
      (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  }

  const schedule: PaymentScheduleEntry[] = [];
  let remainingBalance = principal;
  const parsedStartDate = typeof startDate === 'string' ? parseISO(startDate) : startDate;

  for (let i = 1; i <= numberOfPayments; i++) {
    const interestPayment = remainingBalance * monthlyInterestRate;
    // For the last payment, principal payment might need adjustment
    let principalPayment = monthlyPayment - interestPayment;
    
    let currentMonthPayment = monthlyPayment;

    // Adjust last payment to clear balance exactly
    if (i === numberOfPayments) {
      principalPayment = remainingBalance; // Pay off the remaining balance
      currentMonthPayment = principalPayment + interestPayment;
      remainingBalance = 0;
    } else {
      remainingBalance -= principalPayment;
    }
    
    // Ensure remaining balance doesn't go significantly below zero due to floating point inaccuracies
    if (remainingBalance < 0 && Math.abs(remainingBalance) < 0.01) {
      remainingBalance = 0;
    }


    schedule.push({
      month: i,
      // First payment is one month after the loan start date
      paymentDate: format(addMonths(parsedStartDate, i), 'yyyy-MM-dd'), 
      paymentAmount: parseFloat(currentMonthPayment.toFixed(2)),
      principal: parseFloat(principalPayment.toFixed(2)),
      interest: parseFloat(interestPayment.toFixed(2)),
      remainingBalance: parseFloat(remainingBalance.toFixed(2)),
    });
  }

  return schedule;
}

export const MAX_DAILY_LOAN_AMOUNT = 5000;
export const MAX_MONTHLY_LOAN_AMOUNT = 20000;


export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy');
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Fecha inválida";
  }
}
