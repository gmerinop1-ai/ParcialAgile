import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { calculatePaymentSchedule } from '../src/lib/loanCalculator';

// Configuración de Firebase (usar las mismas variables de entorno)
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
        if (!loanData.amount || !loanData.terms || !loanData.interestRate || !loanData.startDate) {
          console.log(`⚠️  Préstamo ${loanDoc.id} no tiene datos completos, omitiendo...`);
          continue;
        }
        
        // Convertir startDate a Date object
        let startDate: Date;
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
        
        // Recalcular el cronograma de pago con el nuevo método (30 días exactos)
        const newPaymentSchedule = calculatePaymentSchedule(
          loanData.amount,
          loanData.terms,
          startDate,
          loanData.interestRate || 0.10 // Use stored interest rate or default to 10%
        );
        
        // Actualizar el documento en Firestore
        await updateDoc(doc(db, 'loans', loanDoc.id), {
          paymentSchedule: newPaymentSchedule,
          migratedAt: new Date(),
          migrationNote: 'Cronograma recalculado con intervalos de 30 días exactos'
        });
        
        console.log(`✅ Migrado préstamo ${loanDoc.id}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrando préstamo ${loanDoc.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('🎉 Migración completada!');
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

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

export { migratePaymentSchedules, validateMigratedSchedules };