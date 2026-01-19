import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getFileUrl = (url: string | undefined | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`;
};
