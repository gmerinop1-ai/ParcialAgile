export interface Customer {
  dni: string;
  name: string;
  lastName: string;
  address: string;
}

export interface Loan {
  id?: string; // Firestore document ID
  userId: string; // Firebase Auth User ID of the professor who registered the loan
  customerDni: string;
  customerName: string; // Denormalized for easier display
  customerLastName: string; // Denormalized for easier display
  amount: number; // Loan amount in dollars
  termYears: number; // Loan term in years
  interestRate: number; // Annual interest rate (e.g., 0.10 for 10%)
  startDate: string; // ISO date string (YYYY-MM-DD)
  paymentSchedule: PaymentScheduleEntry[];
  createdAt: Date;
  // Optional fields for tracking limits
  dailyTotalForCustomer?: number;
  monthlyTotalForCustomer?: number;
}

export interface PaymentScheduleEntry {
  month: number;
  paymentDate: string; // ISO date string (YYYY-MM-DD)
  paymentAmount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface ReniecResponse {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  // Add other fields as provided by the RENIEC API. This example uses common ones.
  // For address, the API might provide multiple fields or a combined one.
  // Adjust based on actual API response.
  direccion?: string; // This is a guess, check actual API response
  ubigeo?: string; // Might contain address parts
}

export interface ReniecErrorResponse {
  message: string;
  // Add other error fields if the API provides them
}
