import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, PlusCircle, List } from "lucide-react";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Bienvenido a Prestamos Castillo</CardTitle>
          <CardDescription className="text-lg">
            Aquí puedes gestionar los préstamos de tus clientes de manera eficiente.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-4 text-muted-foreground">
              Utiliza las herramientas disponibles para registrar nuevos préstamos,
              visualizar el historial y generar cronogramas de pago.
            </p>
            <div className="space-y-3">
              <Button asChild size="lg" className="w-full justify-start md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/loans/new">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Registrar Nuevo Préstamo
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full justify-start md:w-auto">
                <Link href="/loans">
                  <List className="mr-2 h-5 w-5" />
                  Ver Préstamos Existentes
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
             <Image
              src="https://picsum.photos/400/300"
              alt="Financial planning"
              width={400}
              height={300}
              className="rounded-lg object-cover shadow-md"
              data-ai-hint="financial planning"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Préstamos Recientes</CardTitle>
            <CardDescription>Un resumen de los últimos préstamos registrados.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for recent loans summary */}
            <p className="text-muted-foreground">Aún no hay préstamos recientes.</p>
            <Button variant="link" asChild className="px-0">
              <Link href="/loans">
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Límites de Préstamo</CardTitle>
            <CardDescription>Monitoreo de límites diarios y mensuales.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for loan limits */}
            <div className="space-y-2">
              <p>Límite Diario: $5,000.00</p>
              <p>Límite Mensual: $20,000.00</p>
            </div>
             <p className="mt-2 text-sm text-muted-foreground">Estos límites se aplican por cliente.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Acceso Rápido</CardTitle>
            <CardDescription>Funciones importantes a un clic.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">Generar Reporte (Próximamente)</Button>
            <Button variant="outline" className="w-full justify-start">Configuración (Próximamente)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
