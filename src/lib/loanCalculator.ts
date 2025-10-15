import type { Loan, PaymentScheduleEntry } from '@/types';
import { format, addDays, parseISO } from 'date-fns';

const LOAN_INTEREST_RATE = 0.10; // 10% annual interest rate
export const MAX_LOAN_TERM_MONTHS = 60; // Maximum loan term in months (e.g., 5 years)

/**
 * Calculates payment schedule with payments exactly every 30 days.
 * IMPORTANT: Each payment is scheduled exactly 30 calendar days from the previous payment.
 * This means NO days are gifted - payment intervals are strictly 30 days apart.
 * Example: If loan starts Jan 15, payments are Feb 14, Mar 16, Apr 15, etc.
 */
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
      // STRICT 30-day intervals: Payment i is exactly 30*i days from start date
      paymentDate: format(addDays(parsedStartDate, 30 * i), 'yyyy-MM-dd'), 
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

/**
 * Validates that payment dates are exactly 30 days apart.
 * Used for testing and verification purposes.
 */
export function validatePaymentDates(schedule: PaymentScheduleEntry[], startDate: Date | string): boolean {
  if (schedule.length === 0) return true;
  
  const parsedStartDate = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  
  for (let i = 0; i < schedule.length; i++) {
    const expectedDate = addDays(parsedStartDate, 30 * (i + 1));
    const actualDate = parseISO(schedule[i].paymentDate);
    
    // Check if dates match (same day)
    if (expectedDate.getTime() !== actualDate.getTime()) {
      console.error(`Payment ${i + 1} date mismatch:`, {
        expected: format(expectedDate, 'yyyy-MM-dd'),
        actual: schedule[i].paymentDate,
        daysDifference: Math.abs(expectedDate.getTime() - actualDate.getTime()) / (1000 * 60 * 60 * 24)
      });
      return false;
    }
  }
  
  return true;
}

/**
 * Example function to test the 30-day payment schedule
 * This can be called from the browser console for testing
 */
export function testPaymentSchedule(): void {
  console.log('=== Testing 30-Day Payment Schedule ===');
  
  // Test with a loan starting January 15, 2024
  const startDate = new Date('2024-01-15');
  const schedule = calculatePaymentSchedule(10000, 3, startDate);
  
  console.log('Start Date:', format(startDate, 'yyyy-MM-dd (EEEE)'));
  console.log('Schedule:');
  
  schedule.forEach((payment, index) => {
    const paymentDate = parseISO(payment.paymentDate);
    const daysDiff = index === 0 
      ? Math.round((paymentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : Math.round((paymentDate.getTime() - parseISO(schedule[index - 1].paymentDate).getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(
      `Payment ${payment.month}: ${payment.paymentDate} (${format(paymentDate, 'EEEE')}) - ` +
      `${index === 0 ? daysDiff + ' days from start' : daysDiff + ' days from previous'}`
    );
  });
  
  const isValid = validatePaymentDates(schedule, startDate);
  console.log('Validation Result:', isValid ? '✅ PASSED' : '❌ FAILED');
}
