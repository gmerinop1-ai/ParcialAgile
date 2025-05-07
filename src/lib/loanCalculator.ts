import type { Loan, PaymentScheduleEntry } from '@/types';
import { format, addMonths, addYears, parseISO } from 'date-fns';

const LOAN_INTEREST_RATE = 0.10; // 10% annual interest rate

export function calculatePaymentSchedule(
  amount: number,
  termYears: number,
  startDate: Date | string // Can be Date object or ISO string
): PaymentScheduleEntry[] {
  const principal = amount;
  const annualInterestRate = LOAN_INTEREST_RATE;
  const numberOfPayments = termYears * 12;

  if (principal <= 0 || numberOfPayments <= 0 || annualInterestRate < 0) {
    return [];
  }
  
  // If monthlyInterestRate is 0, formula for monthlyPayment would divide by zero.
  // In this case, monthly payment is just principal / numberOfPayments
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
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance -= principalPayment;

    // Ensure remaining balance doesn't go significantly below zero due to floating point inaccuracies
    if (remainingBalance < 0 && Math.abs(remainingBalance) < 0.01) {
      remainingBalance = 0;
    }
    // Adjust last payment to clear balance exactly
     let currentMonthPayment = monthlyPayment;
    if (i === numberOfPayments && remainingBalance !== 0) {
      currentMonthPayment += remainingBalance;
      remainingBalance = 0;
    }


    schedule.push({
      month: i,
      paymentDate: format(addMonths(parsedStartDate, i -1 ), 'yyyy-MM-dd'), // Payments usually start at the end of the first period/month
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
export const MAX_LOAN_TERM_YEARS = 5;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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
