import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanOCRText(text: string): string {
  if (!text) return text;
  
  const lines = text.split('\n');
  
  const cleanedLines = lines.map(line => {
    // Replace common OCR noise characters with a space
    let cleaned = line.replace(/[©®€|<>+=\[\]{}_\\~`^]/g, ' ');
    // Remove isolated single punctuation marks
    cleaned = cleaned.replace(/\s[.,;:'"-]\s/g, ' ');
    // Collapse multiple spaces into one
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    return cleaned.trim();
  }).filter(line => {
    // Keep lines that have at least some content
    if (line.length < 2) return false;
    
    // Calculate ratio of alphanumeric chars to total length
    const alphaNumCount = (line.match(/[a-zA-Z0-9]/g) || []).length;
    const ratio = alphaNumCount / line.length;
    
    // If line is mostly garbage symbols, discard it
    return ratio > 0.4;
  });
  
  // Join the cleaned lines and remove excessive blank lines
  return cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n');
}
