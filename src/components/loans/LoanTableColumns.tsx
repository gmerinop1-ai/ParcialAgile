
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/loanCalculator';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// import Link from 'next/link'; // Not currently used
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PaymentScheduleDisplay } from './PaymentScheduleDisplay';


export const columns: ColumnDef<Loan>[] = [
  {
    accessorKey: 'customerName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Cliente
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => `${row.original.customerName} ${row.original.customerLastName}`,
  },
  {
    accessorKey: 'customerDni',
    header: 'DNI Cliente',
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
       return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-right w-full justify-end"
        >
          Monto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="text-right">{formatCurrency(row.original.amount)}</div>,
  },
  {
    accessorKey: 'termMonths', // Changed from termYears
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-center w-full justify-center"
        >
          Plazo (Meses) 
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="text-center">{row.original.termMonths}</div>, // Display termMonths
  },
  {
    accessorKey: 'startDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Fecha Inicio
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => formatDate(row.original.startDate),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const loan = row.original;

      return (
        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(loan.id || '')}>
                Copiar ID Préstamo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
               <DialogTrigger asChild>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Cronograma
                </DropdownMenuItem>
              </DialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Cronograma de Pagos</DialogTitle>
              <DialogDescription>
                Cliente: {loan.customerName} {loan.customerLastName} (DNI: {loan.customerDni})
                <br />
                Monto: {formatCurrency(loan.amount)} | Plazo: {loan.termMonths} meses | Tasa: {(loan.interestRate * 100).toFixed(0)}% anual
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto py-4">
              <PaymentScheduleDisplay schedule={loan.paymentSchedule} customerEmail={""} />
            </div>
          </DialogContent>
        </Dialog>
      );
    },
  },
];
