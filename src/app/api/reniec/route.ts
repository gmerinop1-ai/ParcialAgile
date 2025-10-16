import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Customer, ReniecPeruDevsResponse, ReniecPeruDevsResult } from '@/types';

// Ensure RENIEC_API_TOKEN is set in your .env.local file
const apiKey = process.env.RENIEC_API_TOKEN; 
// Updated to use the /complete endpoint by default if RENIEC_API_URL is not set
const apiUrl = process.env.RENIEC_API_URL || 'https://api.perudevs.com/api/v1/dni/complete';

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Check if person is of legal age (18 or older)
 */
function isOfLegalAge(birthDate: string): boolean {
  return calculateAge(birthDate) >= 18;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dni = searchParams.get('dni');

  if (!apiKey) {
    console.error('RENIEC API Key (RENIEC_API_TOKEN) is not configured.');
    return NextResponse.json({ message: 'Error de configuración del servidor: Clave API no encontrada.' }, { status: 500 });
  }

  if (!dni) {
    return NextResponse.json({ message: 'DNI es requerido.' }, { status: 400 });
  }

  if (dni.length !== 8 || !/^\d+$/.test(dni)) {
    return NextResponse.json({ message: 'DNI inválido. Debe tener 8 dígitos numéricos.' }, { status: 400 });
  }

  try {
    const fullApiUrl = `${apiUrl}?document=${dni}&key=${apiKey}`;
    // Diagnostic log - this will appear in your Next.js server console
    console.log('Attempting to fetch RENIEC data from URL:', fullApiUrl); 
    
    const response = await fetch(fullApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage;
      const errorBodyText = await response.text(); 
      console.error('PeruDevs RENIEC API Raw Error Response Text:', errorBodyText);
      const responseStatus = response.status;

      try {
          const parsedError = JSON.parse(errorBodyText) as any;
          
          if (parsedError.details && Array.isArray(parsedError.details) && parsedError.details.length > 0) {
              const firstDetail = parsedError.details[0];
              // Check for 'descripti' (API typo) or 'description' or 'message'
              const detailMsg = firstDetail.descripti || firstDetail.description || firstDetail.message;
              
              if (detailMsg) {
                  errorMessage = detailMsg; // Prioritize detail message
                  if (parsedError.code) {
                      errorMessage = `Error ${parsedError.code}: ${errorMessage}`;
                  }
              } else {
                  // Fallback if detail exists but has no clear message string
                  errorMessage = parsedError.description || parsedError.mensaje || parsedError.message || JSON.stringify(firstDetail);
                  if (parsedError.code && (parsedError.description || parsedError.mensaje || parsedError.message)) {
                       errorMessage = `Error ${parsedError.code}: ${errorMessage}`;
                  } else if (parsedError.code) {
                      errorMessage = `Error ${parsedError.code}: ${JSON.stringify(firstDetail)}`;
                  } else if (!errorMessage) { // if detailMsg was empty and others also empty
                      errorMessage = `Error ${responseStatus} con detalles: ${JSON.stringify(firstDetail)}`;
                  }
              }
          } else if (parsedError.description) { // 'description' key directly in the root
              errorMessage = parsedError.description;
              if (parsedError.code) {
                  errorMessage = `Error ${parsedError.code}: ${errorMessage}`;
              }
          } else if (parsedError.mensaje) {
              errorMessage = parsedError.mensaje;
          } else if (parsedError.message) {
              errorMessage = parsedError.message;
          } else if (parsedError.error) {
              errorMessage = parsedError.error;
          } else {
              errorMessage = `Error ${responseStatus} al consultar DNI. Respuesta: ${errorBodyText.substring(0, 150)}`;
          }
      } catch (jsonError) {
          errorMessage = `Error ${responseStatus} al consultar DNI. Respuesta no JSON: ${errorBodyText.substring(0, 200)}`;
      }
      
      if (typeof errorMessage !== 'string') {
          errorMessage = JSON.stringify(errorMessage);
      }
      if (errorMessage.length > 300) { 
          errorMessage = errorMessage.substring(0, 297) + "...";
      }

      // Check if this might be a minor age case based on error message and DNI pattern
      if ((errorMessage.toLowerCase().includes('encontrado') || 
           errorMessage.toLowerCase().includes('existe') ||
           errorMessage.toLowerCase().includes('base de datos')) && responseStatus === 404) {
        
        const currentYear = new Date().getFullYear();
        const dniFirstTwoDigits = parseInt(dni.substring(0, 2));
        
        // Heuristic: DNI starting with 06-25 could indicate birth years 2006-2025 (minors in 2025)
        if (dniFirstTwoDigits >= 6 && dniFirstTwoDigits <= 25) {
          errorMessage = 'La persona podría ser menor de edad. Solo se pueden registrar préstamos para mayores de 18 años. Si considera que esto es un error, verifique que el DNI esté correcto.';
        } else {
          errorMessage = 'No se ha encontrado a la persona en la base de datos pública de RENIEC.';
        }
      }

      console.error('PeruDevs RENIEC API Error (Processed):', errorMessage);
      return NextResponse.json({ message: errorMessage }, { status: responseStatus });
    }

    const data: ReniecPeruDevsResponse = await response.json();

    if (!data.estado || !data.resultado) {
      let errorMessage = data.mensaje || 'No se pudo obtener la información del DNI desde el API de RENIEC.';
      
      // Check if this is likely a minor age case based on the error message
      if (errorMessage.toLowerCase().includes('encontrado') || 
          errorMessage.toLowerCase().includes('existe') ||
          errorMessage.toLowerCase().includes('base de datos')) {
        // This could be a minor - let's check if the DNI format suggests it could be a recent birth year
        const currentYear = new Date().getFullYear();
        const dniFirstTwoDigits = parseInt(dni.substring(0, 2));
        
        // If DNI starts with digits suggesting birth year 2006 or later (making them 18 or younger in 2025)
        // This is a heuristic approach since we can't get the actual birth date
        if (dniFirstTwoDigits >= 6 && dniFirstTwoDigits <= 25) {
          errorMessage = 'La persona podría ser menor de edad. Solo se pueden registrar préstamos para mayores de 18 años. Si considera que esto es un error, verifique que el DNI esté correcto.';
        } else {
          // Keep the original message for truly not found cases
          errorMessage = 'No se ha encontrado a la persona en la base de datos pública de RENIEC.';
        }
      }
      
      console.error('PeruDevs RENIEC API Logical Error (estado:false or no resultado):', errorMessage, data);
      
      let status = 400; 
      if (errorMessage.toLowerCase().includes("token") || errorMessage.toLowerCase().includes("key")) {
        status = 401; 
      } else if (errorMessage.toLowerCase().includes("encontrado") || errorMessage.toLowerCase().includes("existe") || errorMessage.toLowerCase().includes("requerido")) {
        status = 404; 
        if(errorMessage.toLowerCase().includes("requerido")) status = 400;
      }
      return NextResponse.json({ message: errorMessage }, { status });
    }
    
    const customerData: Customer = {
      dni: data.resultado.id,
      nombres: data.resultado.nombres,
      apellidoPaterno: data.resultado.apellido_paterno,
      apellidoMaterno: data.resultado.apellido_materno,
      nombreCompleto: data.resultado.nombre_completo,
      genero: data.resultado.genero,
      fecha_nacimiento: data.resultado.fecha_nacimiento,
      codigo_verificacion: data.resultado.codigo_verificacion,
    };

    // Check if the person is of legal age
    if (data.resultado.fecha_nacimiento && !isOfLegalAge(data.resultado.fecha_nacimiento)) {
      const age = calculateAge(data.resultado.fecha_nacimiento);
      const errorMessage = `La persona es menor de edad (${age} años). Solo se pueden registrar préstamos para mayores de 18 años.`;
      console.log(`DNI ${dni} rejected: Minor age (${age} years old)`);
      return NextResponse.json({ message: errorMessage }, { status: 400 });
    }

    return NextResponse.json(customerData, { status: 200 });

  } catch (error) {
    console.error('Error fetching from PeruDevs RENIEC API (catch block):', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor al procesar la solicitud a RENIEC.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
