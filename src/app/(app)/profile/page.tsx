'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { changeUserPassword } from '@/lib/firebase/auth';
import { 
  User, 
  Shield, 
  Key, 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validatePasswordForm = () => {
    const errors: typeof passwordErrors = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'La contraseña actual es requerida';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'La nueva contraseña es requerida';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres';
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Confirma la nueva contraseña';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      errors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) return;
    
    setLoading(true);
    try {
      await changeUserPassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente.",
        className: "bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-200"
      });
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cambiar contraseña",
        description: error.message || "No se pudo cambiar la contraseña."
      });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Muy débil', color: 'text-red-500' };
    if (password.length < 8) return { strength: 2, label: 'Débil', color: 'text-orange-500' };
    if (password.length < 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, label: 'Buena', color: 'text-yellow-500' };
    }
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      return { strength: 4, label: 'Muy fuerte', color: 'text-green-500' };
    }
    return { strength: 2, label: 'Regular', color: 'text-yellow-600' };
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Perfil de Usuario</h1>
        <p className="text-gray-600">
          Gestiona tu información personal y configuraciones de seguridad
        </p>
      </div>

      {/* User Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Información Personal
          </CardTitle>
          <CardDescription>
            Detalles de tu cuenta en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-500" />
            <div>
              <Label className="text-sm font-medium">Correo Electrónico</Label>
              <div className="text-sm text-gray-600">{user?.email}</div>
            </div>
            <Badge variant="secondary" className="ml-auto">
              Verificado
            </Badge>
          </div>
          
          <Separator />
          
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-green-500" />
            <div>
              <Label className="text-sm font-medium">Estado de la Cuenta</Label>
              <div className="text-sm text-green-600">Activa</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Recomendación de Seguridad:</strong> Te recomendamos cambiar tu contraseña regularmente 
          para mantener tu cuenta segura. Una contraseña fuerte debe tener al menos 8 caracteres e incluir 
          letras mayúsculas, minúsculas, números y símbolos.
        </AlertDescription>
      </Alert>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-red-600" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>
            Actualiza tu contraseña para mayor seguridad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña Actual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Ingresa tu contraseña actual"
                className={passwordErrors.currentPassword ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="text-sm text-red-500">{passwordErrors.currentPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Ingresa tu nueva contraseña"
                className={passwordErrors.newPassword ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {passwordForm.newPassword && (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.strength === 1 ? 'bg-red-500 w-1/4' :
                      passwordStrength.strength === 2 ? 'bg-orange-500 w-2/4' :
                      passwordStrength.strength === 3 ? 'bg-yellow-500 w-3/4' :
                      passwordStrength.strength === 4 ? 'bg-green-500 w-full' : ''
                    }`}
                  />
                </div>
                <span className={`text-sm font-medium ${passwordStrength.color}`}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
            {passwordErrors.newPassword && (
              <p className="text-sm text-red-500">{passwordErrors.newPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirma tu nueva contraseña"
                className={passwordErrors.confirmPassword ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {passwordErrors.confirmPassword && (
              <p className="text-sm text-red-500">{passwordErrors.confirmPassword}</p>
            )}
            {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Las contraseñas coinciden</span>
              </div>
            )}
          </div>

          <Button 
            onClick={handlePasswordChange}
            disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
          </Button>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Shield className="h-5 w-5" />
            Consejos de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Usa al menos 8 caracteres con combinación de letras, números y símbolos</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>No uses información personal como fechas de nacimiento o nombres</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Cambia tu contraseña cada 3-6 meses</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>No compartas tu contraseña con terceros</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}