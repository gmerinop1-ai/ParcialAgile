'use client';

import { useState } from 'react';
import { Company } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function RucSearchComponent() {
  const [ruc, setRuc] = useState('');
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!ruc || ruc.length !== 11) {
      setError('Por favor ingrese un RUC válido de 11 dígitos');
      return;
    }

    setLoading(true);
    setError(null);
    setCompany(null);

    try {
      const response = await fetch(`/api/sunat?ruc=${ruc}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al consultar RUC');
      }

      const companyData: Company = await response.json();
      setCompany(companyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo números
    if (value.length <= 11) {
      setRuc(value);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda por RUC</CardTitle>
          <CardDescription>
            Busque información de empresas registradas en SUNAT por su RUC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Ingrese RUC de 11 dígitos"
              value={ruc}
              onChange={handleInputChange}
              maxLength={11}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading || ruc.length !== 11}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {company && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {company.razonSocial}
                  <div className="flex gap-2">
                    <Badge variant={company.estado === 'ACTIVO' ? 'default' : 'secondary'}>
                      {company.estado}
                    </Badge>
                    <Badge variant={company.condicion === 'HABIDO' ? 'default' : 'secondary'}>
                      {company.condicion}
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription>RUC: {company.ruc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nombre Comercial</p>
                    <p className="text-sm">{company.nombreComercial}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tipo</p>
                    <p className="text-sm">{company.tipo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fecha de Inscripción</p>
                    <p className="text-sm">
                      {new Date(company.fechaInscripcion).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sistema de Emisión</p>
                    <p className="text-sm">{company.sistemaEmision}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Dirección</p>
                  <p className="text-sm">{company.direccion}</p>
                  {(company.departamento || company.provincia || company.distrito) && (
                    <p className="text-sm text-gray-500">
                      {[company.distrito, company.provincia, company.departamento]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>

                {company.actividadesEconomicas.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Actividades Económicas</p>
                    <div className="space-y-1">
                      {company.actividadesEconomicas.map((actividad, index) => (
                        <p key={index} className="text-sm bg-gray-50 p-2 rounded">
                          {actividad}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Actividad Exterior</p>
                    <p className="text-sm">{company.actividadExterior}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sistema de Contabilidad</p>
                    <p className="text-sm">{company.sistemaContabilidad}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}