'use server';

import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit, getDoc, doc, runTransaction } from 'firebase/firestore';
import type { Loan } from '@/types';
import { MAX_DAILY_LOAN_AMOUNT, MAX_MONTHLY_LOAN_AMOUNT } from '@/lib/loanCalculator';

// Firestore collection reference
const loansCollection = collection(db, 'loans');

/**
 * Creates a new loan document in Firestore.
 * Validates daily and monthly loan limits for the customer.
 */
export async function createLoanAction(loanData: Omit<Loan, 'id' | 'createdAt'>): Promise<{ success: boolean; loanId?: string; error?: string }> {
  try {
    // First, check if the customer already has existing loans
    const existingLoansCheck = await checkExistingLoansByDniAction(loanData.customerDni);
    if (!existingLoansCheck.success) {
      return { success: false, error: existingLoansCheck.error };
    }
    
    if (existingLoansCheck.hasExistingLoans && existingLoansCheck.existingLoans && existingLoansCheck.existingLoans.length > 0) {
      const latestLoan = existingLoansCheck.existingLoans[0]; // Already sorted by createdAt desc
      return { 
        success: false, 
        error: `El cliente con DNI ${loanData.customerDni} ya tiene un préstamo pendiente registrado el ${new Date(latestLoan.createdAt).toLocaleDateString('es-PE')} por ${new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(latestLoan.amount)}. No se puede otorgar un nuevo préstamo hasta que se complete el anterior.` 
      };
    }

    // Validate limits
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));
    
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);


    // Query for daily loans for this customer
    const dailyQuery = query(
      loansCollection,
      where('userId', '==', loanData.userId),
      where('customerDni', '==', loanData.customerDni),
      where('createdAt', '>=', Timestamp.fromDate(startOfToday)),
      where('createdAt', '<=', Timestamp.fromDate(endOfToday))
    );
    const dailySnapshot = await getDocs(dailyQuery);
    const dailyTotal = dailySnapshot.docs.reduce((sum, doc) => sum + (doc.data() as Loan).amount, 0);

    if (dailyTotal + loanData.amount > MAX_DAILY_LOAN_AMOUNT) {
      return { success: false, error: `El cliente ha superado el límite diario de S/ ${MAX_DAILY_LOAN_AMOUNT}. Total hoy: S/ ${dailyTotal.toFixed(2)}.` };
    }

    // Query for monthly loans for this customer
    const monthlyQuery = query(
      loansCollection,
      where('userId', '==', loanData.userId),
      where('customerDni', '==', loanData.customerDni),
      where('createdAt', '>=', Timestamp.fromDate(currentMonth)),
      where('createdAt', '<=', Timestamp.fromDate(endOfCurrentMonth))
    );
    const monthlySnapshot = await getDocs(monthlyQuery);
    const monthlyTotal = monthlySnapshot.docs.reduce((sum, doc) => sum + (doc.data() as Loan).amount, 0);
    
    if (monthlyTotal + loanData.amount > MAX_MONTHLY_LOAN_AMOUNT) {
      return { success: false, error: `El cliente ha superado el límite mensual de S/ ${MAX_MONTHLY_LOAN_AMOUNT}. Total este mes: S/ ${monthlyTotal.toFixed(2)}.` };
    }

    const newLoan: Loan = {
      ...loanData,
      createdAt: new Date(), // Server-side timestamp
    };
    
    const docRef = await addDoc(loansCollection, {
      ...newLoan,
      createdAt: Timestamp.fromDate(newLoan.createdAt) // Convert Date to Firestore Timestamp
    });

    return { success: true, loanId: docRef.id };
  } catch (error: any) {
    console.error("Error creating loan:", error);
    let errorMessage = error.message || 'No se pudo crear el préstamo.';
    
    // Check if it's a Firestore missing index error
    if (error.code === 'failed-precondition' && error.message && error.message.includes('index')) {
      errorMessage = `Error de Firestore: La consulta requiere un índice que no existe o no está activo. 
      Por favor, revisa los logs de tu servidor (terminal donde ejecutas 'npm run dev') para encontrar un enlace directo de Firebase para crear el índice. 
      Consulta la sección 'Set up Firestore Indexes' en el archivo README.md para más detalles sobre los índices requeridos. 
      El error original fue: "${error.message}"`;
    }
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Checks if a customer with the given DNI already has existing loans.
 * Returns the existing loans for validation purposes.
 */
export async function checkExistingLoansByDniAction(dni: string): Promise<{ success: boolean; hasExistingLoans: boolean; existingLoans?: Loan[]; error?: string }> {
  if (!dni) {
    return { success: false, hasExistingLoans: false, error: "DNI no proporcionado." };
  }
  
  try {
    const q = query(
      loansCollection,
      where('customerDni', '==', dni),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const loans = querySnapshot.docs.map(doc => {
      const data = doc.data() as Omit<Loan, 'createdAt'> & { createdAt: Timestamp };
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate()
      } as Loan;
    });
    
    const hasExistingLoans = loans.length > 0;
    return { success: true, hasExistingLoans, existingLoans: loans };
  } catch (error: any) {
    console.error("Error checking existing loans by DNI:", error);
    let errorMessage = error.message || 'No se pudieron verificar los préstamos existentes.';
    if (error.code === 'failed-precondition' && error.message && error.message.includes('index')) {
      errorMessage = `Error de Firestore: La consulta requiere un índice. 
      Por favor, revisa los logs del servidor para el enlace de creación o consulta README.md. 
      Error original: "${error.message}"`;
    }
    return { success: false, hasExistingLoans: false, error: errorMessage };
  }
}

/**
 * Fetches all loans for a specific user (professor).
 */
export async function getLoansByUserIdAction(userId: string): Promise<{ success: boolean; loans?: Loan[]; error?: string }> {
  if (!userId) {
    return { success: false, error: "ID de usuario no proporcionado." };
  }
  try {
    const q = query(
      loansCollection, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc') // Order by most recent
    );
    const querySnapshot = await getDocs(q);
    const loans = querySnapshot.docs.map(doc => {
      const data = doc.data() as Omit<Loan, 'createdAt'> & { createdAt: Timestamp };
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate() // Convert Firestore Timestamp to JS Date
      } as Loan;
    });
    return { success: true, loans };
  } catch (error: any) {
    console.error("Error fetching loans by user ID:", error);
     let errorMessage = error.message || 'No se pudieron cargar los préstamos.';
    if (error.code === 'failed-precondition' && error.message && error.message.includes('index')) {
      errorMessage = `Error de Firestore: La consulta para listar préstamos requiere un índice. 
      Por favor, revisa los logs de tu servidor para el enlace de creación o consulta README.md. 
      Error original: "${error.message}"`;
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Fetches a single loan by its ID.
 */
export async function getLoanByIdAction(loanId: string): Promise<{ success: boolean; loan?: Loan; error?: string }> {
  if (!loanId) {
    return { success: false, error: "ID de préstamo no proporcionado." };
  }
  try {
    const docRef = doc(db, 'loans', loanId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as Omit<Loan, 'createdAt'> & { createdAt: Timestamp };
      const loan = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate()
      } as Loan;
      return { success: true, loan };
    } else {
      return { success: false, error: "Préstamo no encontrado." };
    }
  } catch (error: any) {
    console.error("Error fetching loan by ID:", error);
    return { success: false, error: error.message || 'No se pudo cargar el préstamo.' };
  }
}