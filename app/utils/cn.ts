import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper for dynamic color classes
export function getColorClasses(color: string, type: 'bg' | 'text' | 'border' | 'hover', shade?: string) {
  const baseColor = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-500',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-50'
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-500',
      border: 'border-purple-200',
      hover: 'hover:bg-purple-50'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-500',
      border: 'border-green-200',
      hover: 'hover:bg-green-50'
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-500',
      border: 'border-gray-200',
      hover: 'hover:bg-gray-50'
    }
  };

  return baseColor[color as keyof typeof baseColor]?.[type] || baseColor.gray[type];
}