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
      let cleaned = line.replace(/[©®€|<>+=\[\]{}_\\~`^]/g, ' ');
      cleaned = cleaned.replace(/\s[.,;:'"-]\s/g, ' ');
      return cleaned.replace(/\s{2,}/g, ' ').trim();
    }).filter(line => {
      if (line.length < 2) return false;
      const alphaNumCount = (line.match(/[a-zA-Z0-9]/g) || []).length;
      return (alphaNumCount / line.length) > 0.4;
    }).join('\n');
  }

  // 2. Smart Formatting (For All Documents)
  let lines = processedText.split('\n');
  let formattedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Skip excessive empty lines
    if (!line) {
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
      continue;
    }
    
    // Standardize bullet points
    if (/^[•*○▪]\s/.test(line)) {
      line = '- ' + line.substring(2).trim();
    }
    
    // Rejoin broken sentences (if previous line didn't end with punctuation and wasn't a bullet)
    if (
      formattedLines.length > 0 && 
      formattedLines[formattedLines.length - 1] !== ''
    ) {
      const prevLine = formattedLines[formattedLines.length - 1];
      const endsWithPunct = /[.!?:]$/.test(prevLine);
      const isPrevList = /^[\-]\s/.test(prevLine) || /^\d+\.\s/.test(prevLine);
      const isCurrentList = /^[\-]\s/.test(line) || /^\d+\.\s/.test(line);
      
      // If it looks like a wrapped paragraph, merge it
      if (!endsWithPunct && !isPrevList && !isCurrentList && prevLine.length > 40) {
        formattedLines[formattedLines.length - 1] = prevLine + ' ' + line;
        continue;
      }
    }
    
    formattedLines.push(line);
  }
  
  // 3. Final Polish
  let finalResult = formattedLines.join('\n');
  
  // Fix punctuation spacing (e.g. "word , word" -> "word, word")
  finalResult = finalResult.replace(/\s+([.,;:!?])/g, '$1');
  // Ensure space after punctuation (e.g. "word.Word" -> "word. Word")
  finalResult = finalResult.replace(/([a-zA-Z][.,;:!?])([a-zA-Z])/g, '$1 $2');
  
  return finalResult.trim();
}
