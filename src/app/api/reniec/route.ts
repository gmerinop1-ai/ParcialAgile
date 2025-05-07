import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Customer, ReniecPeruDevsResponse } from '@/types';

// Ensure RENIEC_API_TOKEN is set in your .env.local file
const apiKey = process.env.RENIEC_API_TOKEN; 
const apiUrl = process.env.RENIEC_API_URL || 'https://api.perudevs.com/api/v1/dni/simple';

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
    
    const response = await fetch(fullApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage;
      const errorBodyText = await response.text(); // Read text first for logging
      console.error('PeruDevs RENIEC API Raw Error Response Text:', errorBodyText);
      const responseStatus = response.status; // Capture status

      try {
          const parsedError = JSON.parse(errorBodyText) as any; // Use any for flexible parsing
          // Prioritize specific fields from the API's error structure
          if (parsedError.description) {
              errorMessage = parsedError.description;
              if (parsedError.code) {
                  errorMessage = `Error ${parsedError.code}: ${errorMessage}`;
              }
              // Attempt to get more info from details if available.
              if (parsedError.details && Array.isArray(parsedError.details) && parsedError.details.length > 0) {
                  const firstDetail = parsedError.details[0];
                  const detailMessage = firstDetail.description || firstDetail.message || firstDetail.descripti || JSON.stringify(firstDetail);
                  errorMessage += ` (Detalle: ${detailMessage})`;
              }
          } else if (parsedError.mensaje) { // For cases where API might use 'mensaje' even on HTTP errors
              errorMessage = parsedError.mensaje;
          } else if (parsedError.message) { // Generic 'message'
              errorMessage = parsedError.message;
          } else if (parsedError.error) { // Generic 'error' field
              errorMessage = parsedError.error;
          } else {
              // Fallback if no known fields are found in parsed JSON
              errorMessage = `Error ${responseStatus} al consultar DNI. Respuesta: ${errorBodyText.substring(0, 150)}`;
          }
      } catch (jsonError) {
          // If parsing JSON fails, use the raw text
          errorMessage = `Error ${responseStatus} al consultar DNI. Respuesta no JSON: ${errorBodyText.substring(0, 200)}`;
      }
      
      // Sanitize the final message
      if (typeof errorMessage !== 'string') {
          errorMessage = JSON.stringify(errorMessage);
      }
      if (errorMessage.length > 300) { // Cap length
          errorMessage = errorMessage.substring(0, 297) + "...";
      }

      console.error('PeruDevs RENIEC API Error (Processed):', errorMessage);
      return NextResponse.json({ message: errorMessage }, { status: responseStatus });
    }

    const data: ReniecPeruDevsResponse = await response.json();

    if (!data.estado || !data.resultado) {
      const errorMessage = data.mensaje || 'No se pudo obtener la información del DNI desde el API de RENIEC.';
      console.error('PeruDevs RENIEC API Logical Error (estado:false or no resultado):', errorMessage, data);
      
      let status = 400; 
      if (errorMessage.toLowerCase().includes("token") || errorMessage.toLowerCase().includes("key")) {
        status = 401; 
      } else if (errorMessage.toLowerCase().includes("encontrado") || errorMessage.toLowerCase().includes("existe")) {
        status = 404; 
      }
      return NextResponse.json({ message: errorMessage }, { status });
    }
    
    const customerData: Customer = {
      dni: data.resultado.id,
      name: data.resultado.nombres,
      lastName: `${data.resultado.apellido_paterno} ${data.resultado.apellido_materno}`.trim(),
      address: 'No disponible', // New API does not provide address
    };

    return NextResponse.json(customerData, { status: 200 });

  } catch (error) {
    console.error('Error fetching from PeruDevs RENIEC API (catch block):', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor al procesar la solicitud a RENIEC.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}