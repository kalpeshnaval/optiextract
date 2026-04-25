import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatExtractedText(text: string, isOcr: boolean = false): string {
  if (!text) return text;
  
  let processedText = text;

  // 1. Aggressive Noise Reduction (Only for Image OCR)
  if (isOcr) {
    const lines = processedText.split('\n');
    processedText = lines.map(line => {
      // Keep only English letters (a-z, A-Z), numbers, whitespace, and basic punctuation.
      let cleaned = line.replace(/[^a-zA-Z0-9\s.,;:!?'"()\-&%$/]/g, ' ');
      cleaned = cleaned.replace(/\s[.,;:'"-]\s/g, ' ');
      return cleaned.replace(/\s{2,}/g, ' ').trim();
    }).filter(line => {
      if (line.length < 2) return false;
      const alphaNumCount = (line.match(/[a-zA-Z0-9]/g) || []).length;
      return (alphaNumCount / line.length) > 0.4;
    }).join('\n');
  }

  return processedText.trim();
}
