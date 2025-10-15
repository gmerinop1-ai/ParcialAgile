import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Company, SunatRucResponse, SunatRucResult } from '@/types';

// Ensure SUNAT_API_TOKEN is set in your .env.local file
const apiKey = process.env.SUNAT_API_TOKEN || process.env.RENIEC_API_TOKEN; 
// RUC API endpoint from PeruDevs
const apiUrl = process.env.SUNAT_API_URL || 'https://api.perudevs.com/api/v1/ruc';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ruc = searchParams.get('ruc');

  if (!apiKey) {
    console.error('SUNAT API Key (SUNAT_API_TOKEN or RENIEC_API_TOKEN) is not configured.');
    return NextResponse.json({ message: 'Error de configuración del servidor: Clave API no encontrada.' }, { status: 500 });
  }

  if (!ruc) {
    return NextResponse.json({ message: 'RUC es requerido.' }, { status: 400 });
  }

  if (ruc.length !== 11 || !/^\d+$/.test(ruc)) {
    return NextResponse.json({ message: 'RUC inválido. Debe tener 11 dígitos numéricos.' }, { status: 400 });
  }

  try {
    const fullApiUrl = `${apiUrl}?document=${ruc}&key=${apiKey}`;
    // Diagnostic log - this will appear in your Next.js server console
    console.log('Attempting to fetch SUNAT data from URL:', fullApiUrl); 
    
    const response = await fetch(fullApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage;
      const errorBodyText = await response.text(); 
      console.error('PeruDevs SUNAT API Raw Error Response Text:', errorBodyText);
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
              errorMessage = `Error ${responseStatus} al consultar RUC. Respuesta: ${errorBodyText.substring(0, 150)}`;
          }
      } catch (jsonError) {
          errorMessage = `Error ${responseStatus} al consultar RUC. Respuesta no JSON: ${errorBodyText.substring(0, 200)}`;
      }
      
      if (typeof errorMessage !== 'string') {
          errorMessage = JSON.stringify(errorMessage);
      }
      if (errorMessage.length > 300) { 
          errorMessage = errorMessage.substring(0, 297) + "...";
      }

      console.error('PeruDevs SUNAT API Error (Processed):', errorMessage);
      return NextResponse.json({ message: errorMessage }, { status: responseStatus });
    }

    const data: SunatRucResponse = await response.json();

    if (!data.estado || !data.resultado) {
      const errorMessage = data.mensaje || 'No se pudo obtener la información del RUC desde el API de SUNAT.';
      console.error('PeruDevs SUNAT API Logical Error (estado:false or no resultado):', errorMessage, data);
      
      let status = 400; 
      if (errorMessage.toLowerCase().includes("token") || errorMessage.toLowerCase().includes("key")) {
        status = 401; 
      } else if (errorMessage.toLowerCase().includes("encontrado") || errorMessage.toLowerCase().includes("existe") || errorMessage.toLowerCase().includes("requerido")) {
        status = 404; 
        if(errorMessage.toLowerCase().includes("requerido")) status = 400;
      }
      return NextResponse.json({ message: errorMessage }, { status });
    }
    
    const companyData: Company = {
      ruc: data.resultado.id,
      razonSocial: data.resultado.razon_social,
      nombreComercial: data.resultado.nombre_comercial || '-',
      condicion: data.resultado.condicion,
      estado: data.resultado.estado,
      tipo: data.resultado.tipo,
      fechaInscripcion: data.resultado.fecha_inscripcion,
      direccion: data.resultado.direccion,
      departamento: data.resultado.departamento,
      provincia: data.resultado.provincia,
      distrito: data.resultado.distrito,
      actividadesEconomicas: data.resultado.actividades_economicas || [],
      sistemaEmision: data.resultado.sistema_emision,
      actividadExterior: data.resultado.actividad_exterior,
      sistemaContabilidad: data.resultado.sistema_contabilidad,
    };

    return NextResponse.json(companyData, { status: 200 });

  } catch (error) {
    console.error('Error fetching from PeruDevs SUNAT API (catch block):', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor al procesar la solicitud a SUNAT.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}