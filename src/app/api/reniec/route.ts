import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Customer, ReniecPeruDevsResponse } from '@/types';

// Ensure RENIEC_API_TOKEN is set in your .env.local file
const apiKey = process.env.RENIEC_API_TOKEN; 
const apiUrl = 'https://api.perudevs.com/api/v1/dni/simple';

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
      mode: 'cors', 
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText || 'Error desconocido al contactar API externa'}`;
      try {
        const errorBodyText = await response.text(); 
        console.error('PeruDevs RENIEC API Raw Error Response Text:', errorBodyText); 

        try {
          const parsedError = JSON.parse(errorBodyText); 
          errorMessage = parsedError.mensaje || parsedError.message || parsedError.error || `Error ${response.status} al consultar DNI: ${errorBodyText.substring(0, 100) || response.statusText || 'Respuesta no estructurada del API externa'}`;
        } catch (jsonError) {
          errorMessage = `Error ${response.status} al consultar DNI: ${errorBodyText.substring(0, 150) || response.statusText || 'Respuesta no JSON del API externa'}`;
        }
      } catch (textError) {
         errorMessage = `Error ${response.status} al consultar DNI: ${response.statusText || 'No se pudo leer la respuesta del API externa'}`;
      }
      
      console.error('PeruDevs RENIEC API Error (non-200 processed):', errorMessage);
      return NextResponse.json({ message: errorMessage }, { status: response.status }); 
    }

    const data: ReniecPeruDevsResponse = await response.json();

    if (!data.estado || !data.resultado) {
      const errorMessage = data.mensaje || 'No se pudo obtener la información del DNI desde el API de RENIEC.';
      console.error('PeruDevs RENIEC API Logical Error (estado:false or no resultado):', errorMessage, data);
      
      // Determine appropriate status code based on message
      let status = 400; // Default to Bad Request for logical errors
      if (errorMessage.toLowerCase().includes("token") || errorMessage.toLowerCase().includes("key")) {
        status = 401; // Unauthorized if it's a token/key issue
      } else if (errorMessage.toLowerCase().includes("encontrado") || errorMessage.toLowerCase().includes("existe")) {
        status = 404; // Not Found if DNI doesn't exist
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

