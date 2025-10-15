const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
const { format, addDays, parseISO } = require('date-fns');
require('dotenv').config();

// Copiar la función calculatePaymentSchedule aquí
const LOAN_INTEREST_RATE = 0.10;

function calculatePaymentSchedule(amount, termMonths, startDate) {
  const principal = amount;
  const annualInterestRate = LOAN_INTEREST_RATE;
  const numberOfPayments = termMonths;

  if (principal <= 0 || numberOfPayments <= 0 || annualInterestRate < 0) {
    return [];
  }
  
  let monthlyPayment;
  const monthlyInterestRate = annualInterestRate / 12;

  if (monthlyInterestRate === 0) {
    monthlyPayment = principal / numberOfPayments;
  } else {
     monthlyPayment =
      (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  }

  const schedule = [];
  let remainingBalance = principal;
  const parsedStartDate = typeof startDate === 'string' ? parseISO(startDate) : startDate;

  for (let i = 1; i <= numberOfPayments; i++) {
    const interestPayment = remainingBalance * monthlyInterestRate;
    let principalPayment = monthlyPayment - interestPayment;
    
    let currentMonthPayment = monthlyPayment;

    if (i === numberOfPayments) {
      principalPayment = remainingBalance;
      currentMonthPayment = principalPayment + interestPayment;
      remainingBalance = 0;
    } else {
      remainingBalance -= principalPayment;
    }
    
    if (remainingBalance < 0 && Math.abs(remainingBalance) < 0.01) {
      remainingBalance = 0;
    }

    schedule.push({
      month: i,
      paymentDate: format(addDays(parsedStartDate, 30 * i), 'yyyy-MM-dd'), 
      paymentAmount: parseFloat(currentMonthPayment.toFixed(2)),
      principal: parseFloat(principalPayment.toFixed(2)),
      interest: parseFloat(interestPayment.toFixed(2)),
      remainingBalance: parseFloat(remainingBalance.toFixed(2)),
    });
  }

  return schedule;
}

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migratePaymentSchedules() {
  try {
    console.log('🔄 Iniciando migración de cronogramas de pago...');
    
    // Obtener todos los préstamos
    const loansSnapshot = await getDocs(collection(db, 'loans'));
    console.log(`📋 Encontrados ${loansSnapshot.size} préstamos para migrar`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const loanDoc of loansSnapshot.docs) {
      try {
        const loanData = loanDoc.data();
        
        // Verificar que tiene los datos necesarios
        if (!loanData.amount || !loanData.termMonths || !loanData.startDate) {
          console.log(`⚠️  Préstamo ${loanDoc.id} no tiene datos completos, omitiendo...`);
          console.log(`    Datos: amount=${loanData.amount}, termMonths=${loanData.termMonths}, startDate=${loanData.startDate}`);
          continue;
        }
        
        // Convertir startDate a Date object
        let startDate;
        if (loanData.startDate.toDate) {
          // Es un Timestamp de Firestore
          startDate = loanData.startDate.toDate();
        } else if (typeof loanData.startDate === 'string') {
          // Es un string
          startDate = new Date(loanData.startDate);
        } else {
          // Ya es un Date
          startDate = new Date(loanData.startDate);
        }
        
        console.log(`🔧 Migrando préstamo ${loanDoc.id}:`);
        console.log(`    Monto: S/ ${loanData.amount}`);
        console.log(`    Plazo: ${loanData.termMonths} meses`);
        console.log(`    Fecha inicio: ${startDate.toISOString().split('T')[0]}`);
        
        // Recalcular el cronograma de pago con el nuevo método (30 días exactos)
        const newPaymentSchedule = calculatePaymentSchedule(
          loanData.amount,
          loanData.termMonths,
          startDate
        );
        
        // Actualizar el documento en Firestore
        await updateDoc(doc(db, 'loans', loanDoc.id), {
          paymentSchedule: newPaymentSchedule,
          migratedAt: new Date(),
          migrationNote: 'Cronograma recalculado con intervalos de 30 días exactos'
        });
        
        console.log(`✅ Migrado préstamo ${loanDoc.id} con ${newPaymentSchedule.length} pagos`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrando préstamo ${loanDoc.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Migración completada!');
    console.log(`✅ Préstamos migrados: ${migratedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    
  } catch (error) {
    console.error('💥 Error en la migración:', error);
  }
}

// Función para validar los cronogramas migrados
async function validateMigratedSchedules() {
  try {
    console.log('\n🔍 Validando cronogramas migrados...');
    
    const loansSnapshot = await getDocs(collection(db, 'loans'));
    let validCount = 0;
    let invalidCount = 0;
    
    for (const loanDoc of loansSnapshot.docs) {
      const loanData = loanDoc.data();
      
      if (!loanData.paymentSchedule || loanData.paymentSchedule.length === 0) {
        console.log(`⚠️  Préstamo ${loanDoc.id} no tiene cronograma`);
        continue;
      }
      
      // Validar que los pagos son cada 30 días exactos
      let isValid = true;
      for (let i = 1; i < loanData.paymentSchedule.length; i++) {
        const prevDate = new Date(loanData.paymentSchedule[i - 1].paymentDate);
        const currentDate = new Date(loanData.paymentSchedule[i].paymentDate);
        const daysDiff = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff !== 30) {
          console.log(`❌ Préstamo ${loanDoc.id}: Intervalo incorrecto de ${daysDiff} días entre pagos ${i} y ${i + 1}`);
          isValid = false;
          break;
        }
      }
      
      if (isValid) {
        console.log(`✅ Préstamo ${loanDoc.id}: Cronograma válido`);
        validCount++;
      } else {
        invalidCount++;
      }
    }
    
    console.log('\n📊 Resultados de validación:');
    console.log(`✅ Cronogramas válidos: ${validCount}`);
    console.log(`❌ Cronogramas inválidos: ${invalidCount}`);
    
  } catch (error) {
    console.error('💥 Error en la validación:', error);
  }
}

// Ejecutar migración
async function main() {
  console.log('🚀 Iniciando proceso de migración de cronogramas de pago\n');
  
  await migratePaymentSchedules();
  await validateMigratedSchedules();
  
  console.log('\n🏁 Proceso completado');
  process.exit(0);
}

main().catch(console.error);