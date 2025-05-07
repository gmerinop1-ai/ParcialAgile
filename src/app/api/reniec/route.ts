import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Customer, ReniecPeruDevsResponse, ReniecErrorResponse } from '@/types';

// Ensure RENIEC_API_TOKEN is set in your .env.local file
const apiKey = process.env.RENIEC_API_TOKEN; 
const apiUrl = 'https://api.perudevs.com/api/v1/dni/simple';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dni = searchParams.get('dni');

  if (!apiKey) {
    console.error('RENIEC API Key (RENIEC_API_TOKEN) is not configured.');
    return NextResponse.json({ message: 'Error de configuración del servidor.' }, { status: 500 });
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
      mode: 'cors', // Keep cors mode if the API requires it
      headers: {
        'Accept': 'application/json',
        // 'Origin' header might not be needed or could cause issues with some APIs if not specifically required.
        // If the API works without it, it's safer to remove.
        // 'Origin': request.headers.get('origin') || '', 
      },
    });

    if (!response.ok) {
      // Attempt to parse error response from the new API
      let errorData: { message?: string, error?: string } = { message: `Error ${response.status}: ${response.statusText}` };
      try {
        const parsedError = await response.json();
        // Assuming the new API might return an error message in a 'message' or 'error' field
        errorData.message = parsedError.message || parsedError.error || `Error al consultar DNI: ${response.statusText}`;
      } catch (e) {
        // Failed to parse JSON, use default error message
      }
      console.error('PeruDevs RENIEC API Error:', errorData.message);
      return NextResponse.json({ message: errorData.message }, { status: response.status });
    }

    const data: ReniecPeruDevsResponse = await response.json();

    if (!data.estado || !data.resultado) {
      // Handle cases where API call was "ok" (2xx) but data indicates an issue
      const errorMessage = data.mensaje || 'No se pudo obtener la información del DNI.';
      console.error('PeruDevs RENIEC API Logical Error:', errorMessage, data);
      return NextResponse.json({ message: errorMessage }, { status: 404 }); // Or appropriate status
    }
    
    const customerData: Customer = {
      dni: data.resultado.id, // Assuming 'id' field in 'resultado' is the DNI
      name: data.resultado.nombres,
      lastName: `${data.resultado.apellido_paterno} ${data.resultado.apellido_materno}`.trim(),
      address: 'No disponible', // New API does not provide address
    };

    return NextResponse.json(customerData, { status: 200 });

  } catch (error) {
    console.error('Error fetching from PeruDevs RENIEC API:', error);
    // Check if error is an instance of Error to safely access message property
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor al contactar RENIEC.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
