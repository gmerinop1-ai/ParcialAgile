export interface Customer {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  genero?: string; 
  fecha_nacimiento?: string; 
  codigo_verificacion?: string; 
}

export interface Loan {
  id?: string; // Firestore document ID
  userId: string; // Firebase Auth User ID of the professor who registered the loan
  customerDni?: string; // Optional for backward compatibility
  customerRuc?: string; // New field for companies
  customerDocument: string; // Either DNI or RUC
  customerName: string; // Denormalized for easier display (usually 'nombres' or 'razonSocial')
  customerLastName?: string; // Denormalized for easier display (usually 'apellidoPaterno apellidoMaterno') - optional for companies
  customerType: 'person' | 'company'; // New field to distinguish between person and company
  amount: number; // Loan amount in soles (PEN)
  termMonths: number; // Loan term in months
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

// Updated ReniecPeruDevsResult for api.perudevs.com /complete endpoint
export interface ReniecPeruDevsResult {
  id: string; // DNI
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre_completo: string;
  codigo_verificacion: string;
  genero: string; 
  fecha_nacimiento: string; 
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

// Types for SUNAT RUC API
export interface SunatRucResult {
  razon_social: string;
  condicion: string;
  nombre_comercial: string;
  tipo: string;
  fecha_inscripcion: string;
  estado: string;
  direccion: string;
  sistema_emision: string;
  actividad_exterior: string;
  sistema_contabilidad: string;
  fecha_emision_electronica: string;
  fecha_ple: string;
  oficio: string | null;
  actividades_economicas: string[];
  comprobante_pago: string[];
  sistema_emision_electronica: string[];
  padrones: string[];
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  representantes_legales: any | null;
  id: string; // RUC number
}

export interface SunatRucResponse {
  estado: boolean;
  mensaje: string;
  resultado?: SunatRucResult; // Optional because it might not be present on error
}

export interface Company {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  condicion: string;
  estado: string;
  tipo: string;
  fechaInscripcion: string;
  direccion: string;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  actividadesEconomicas: string[];
  sistemaEmision: string;
  actividadExterior: string;
  sistemaContabilidad: string;
}

