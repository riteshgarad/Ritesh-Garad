/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getWhatsAppLink(phone: string | undefined) {
  if (!phone) return '#';
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it's a 10-digit number (common in India), prepend 91
  if (cleaned.length === 10 && (cleaned.startsWith('7') || cleaned.startsWith('8') || cleaned.startsWith('9'))) {
    cleaned = '91' + cleaned;
  }
  
  return `https://wa.me/${cleaned}`;
}
