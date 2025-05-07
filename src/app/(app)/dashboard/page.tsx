import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, List } from "lucide-react";

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
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
