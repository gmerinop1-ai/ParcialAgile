export interface Customer {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
}

export interface Loan {
  id?: string; // Firestore document ID
  userId: string; // Firebase Auth User ID of the professor who registered the loan
  customerDni: string;
  customerName: string; // Denormalized for easier display (usually 'nombres')
  customerLastName: string; // Denormalized for easier display (usually 'apellidoPaterno apellidoMaterno')
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

// New ReniecPeruDevsResponse for api.perudevs.com
export interface ReniecPeruDevsResult {
  id: string; // DNI
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre_completo: string;
  codigo_verificacion: string;
  // The API does not provide genero or fecha_nacimiento with the /simple endpoint
}

export interface ReniecPeruDevsResponse {
  estado: boolean;
  mensaje: string;
  resultado?: ReniecPeruDevsResult; // Optional because it might not be present on error
}


export interface ReniecErrorResponse {
  message: string; // General message field for errors
  error?: string; // Alternative error message field
  // Add other error fields if the API provides them
}

