import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(amount: number | string | null | undefined): string {
  if (amount == null) return '0.00';
  return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy');
}

export function fmtDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
}
