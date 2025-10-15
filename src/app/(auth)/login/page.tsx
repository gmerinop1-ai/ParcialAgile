import { LoginForm } from '@/components/auth/LoginForm';
import { siteConfig } from '@/config/site';
import { Building2, Shield, TrendingUp } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-center px-12 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Building2 className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">
              {siteConfig.name}
            </h1>
          </div>
          
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Gestión financiera profesional
          </h2>
          
          <p className="text-xl text-blue-100 mb-12 leading-relaxed">
            Sistema integral para la administración de préstamos, clientes y cronogramas de pago.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Seguridad garantizada</h3>
                <p className="text-blue-100 text-sm">
                  Protección avanzada de datos financieros y personales
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Análisis inteligente</h3>
                <p className="text-blue-100 text-sm">
                  Reportes detallados y métricas de rendimiento
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-16 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {siteConfig.name}
            </h1>
            <p className="mt-2 text-gray-600">
              Sistema de gestión financiera
            </p>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Bienvenido de nuevo
            </h2>
            <p className="text-gray-600">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>
          
          <LoginForm />
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              ¿Problemas para ingresar?{' '}
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Contacta soporte
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
