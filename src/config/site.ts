import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, PlusCircle, List, UserCircle, LogOut } from 'lucide-react';

export const siteConfig = {
  name: "Financiera Robles",
  description: "Sistema integral de gestión de préstamos.",
};

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Registrar Préstamo",
    href: "/loans/new",
    icon: PlusCircle,
  },
  {
    title: "Ver Préstamos",
    href: "/loans",
    icon: List,
  },
];

export const userNavItems: NavItem[] = [
  {
    title: "Perfil",
    href: "/profile",
    icon: UserCircle,
  },
  {
    title: "Cerrar Sesión",
    href: "/logout", // This will be handled by a function, not a direct link
    icon: LogOut,
  },
];
