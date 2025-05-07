import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Customer, ReniecResponse, ReniecErrorResponse } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dni = searchParams.get('dni');

  if (!dni) {
    return NextResponse.json({ message: 'DNI es requerido.' }, { status: 400 });
  }

  if (dni.length !== 8 || !/^\d+$/.test(dni)) {
    return NextResponse.json({ message: 'DNI inválido. Debe tener 8 dígitos numéricos.' }, { status: 400 });
  }
  
  const apiUrl = process.env.RENIEC_API_URL;
  const apiToken = process.env.RENIEC_API_TOKEN;

  if (!apiUrl || !apiToken) {
    console.error("RENIEC API URL or Token not configured in environment variables.");
    return NextResponse.json({ message: 'Error de configuración del servidor.' }, { status: 500 });
  }

  try {
    const response = await fetch(`${apiUrl}?numero=${dni}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorData: ReniecErrorResponse | { message: string } = { message: `Error ${response.status}: ${response.statusText}` };
      try {
        errorData = await response.json();
      } catch (e) {
        // Failed to parse JSON, use default error message
      }
      console.error('RENIEC API Error:', errorData);
      const errorMessage = (errorData as ReniecErrorResponse).message || `Error al consultar RENIEC: ${response.statusText}`;
      return NextResponse.json({ message: errorMessage }, { status: response.status });
    }

    const data: ReniecResponse = await response.json();
    
    // Transform data to Customer format
    const customerData: Customer = {
      dni: data.dni,
      name: data.nombres,
      lastName: `${data.apellidoPaterno} ${data.apellidoMaterno}`.trim(),
      // The RENIEC API documentation implies address is not directly available.
      // It's often part of 'ubigeo' or might require a different endpoint or service.
      // For this example, we'll use a placeholder or rely on what's available.
      address: data.direccion || 'No disponible', 
    };

    return NextResponse.json(customerData, { status: 200 });

  } catch (error) {
    console.error('Error fetching from RENIEC API:', error);
    return NextResponse.json({ message: 'Error interno del servidor al contactar RENIEC.' }, { status: 500 });
  }
}
