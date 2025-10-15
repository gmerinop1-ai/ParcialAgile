
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOutUser } from '@/lib/firebase/auth';
import { siteConfig, mainNavItems } from '@/config/site';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut, Building2, ChevronDown } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast({ 
        title: 'Sesión cerrada', 
        description: 'Has cerrado sesión exitosamente.',
        duration: 3000,
      });
      router.push('/login');
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudo cerrar la sesión.' 
      });
    }
  };

  const getInitials = (email?: string | null) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200 bg-white">
      <SidebarHeader className="p-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg text-gray-900">{siteConfig.name}</span>
            <p className="text-xs text-gray-500 mt-1">Sistema de Gestión</p>
          </div>
        </Link>
        <SidebarTrigger className="md:hidden absolute top-4 right-4" />
      </SidebarHeader>

      <SidebarContent className="flex-1 p-4">
        <div className="space-y-2">
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
              Navegación Principal
            </p>
          </div>
          <SidebarMenu>
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    tooltip={item.title}
                    className="h-12 justify-start rounded-lg transition-all duration-200 hover:bg-blue-50 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:border-blue-200"
                  >
                    <a className="flex items-center gap-3 px-3">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarSeparator className="bg-gray-100" />

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-auto w-full justify-start gap-3 p-3 hover:bg-gray-50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-3"
            >
              <Avatar className="h-9 w-9 border-2 border-gray-200">
                <AvatarImage 
                  src={user?.photoURL || undefined} 
                  alt={user?.displayName || user?.email || 'Usuario'} 
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                  {getInitials(user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold text-gray-900">
                  {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}
                </span>
                <span className="text-xs text-gray-500">
                  Administrador
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 ml-auto group-data-[collapsible=icon]:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-64 p-2 shadow-lg border border-gray-200"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-3 bg-gray-50 rounded-lg mb-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={user?.photoURL || undefined} 
                    alt={user?.displayName || user?.email || 'Usuario'} 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">
                    {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut} 
              className="p-3 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer rounded-lg"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span className="font-medium">Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
