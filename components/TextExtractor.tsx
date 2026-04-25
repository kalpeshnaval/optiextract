"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface TextExtractorProps {
  imageFile: File | null;
  onProcessingChange: (isProcessing: boolean) => void;
}

export function TextExtractor({ imageFile, onProcessingChange }: TextExtractorProps) {
  const [extractedText, setExtractedText] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      return;
    }

    let isMounted = true;

    const extractWithAI = async () => {
      onProcessingChange(true);
      setError(null);
      setExtractedText('');
      
      setStatus('AI is analyzing the image...');

      try {
        // Convert file and compress via canvas to prevent Payload Too Large (413) errors
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(imageFile);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 1600;
              const MAX_HEIGHT = 1600;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
              }

              ctx.drawImage(img, 0, 0, width, height);
              // Compress to 80% quality
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
              resolve(compressedBase64);
            };
            img.onerror = (err) => reject(err);
          };
          reader.onerror = (error) => reject(error);
        });

        const response = await fetch('/api/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base64Image: base64Data,
            mimeType: imageFile.type
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to extract text');
        }

        if (isMounted) {
          setExtractedText(data.text);
          setStatus('Extraction Complete');
          toast.success('Text extracted successfully!');
        }

      } catch (err) {
        console.error('AI Extraction Error:', err);
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'An error occurred during extraction.';
          setError(errorMessage);
          setStatus('');
          toast.error('Extraction failed.');
        }
      } finally {
        if (isMounted) {
          onProcessingChange(false);
        }
      }
    };

    extractWithAI();

    return () => {
      isMounted = false;
    };
  }, [imageFile, onProcessingChange]);

  const handleCopy = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy text');
    }
  };

  if (!imageFile) return null;

  const isProcessing = status.includes('analyzing');

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 sm:mt-8 relative z-20">
      <AnimatePresence mode="wait">
        {isProcessing && !extractedText ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.1)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 animate-shimmer" />
            <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 relative z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse" />
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400 animate-spin" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight">Processing Image</h3>
                <p className="text-sm text-blue-300/80 animate-pulse font-medium">{status}</p>
              </div>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)]"
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">Extraction Failed</h3>
                <p className="text-sm text-red-300/80 max-w-md mx-auto">{error}</p>
              </div>
            </div>
          </motion.div>
        ) : extractedText ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                      AI Extracted Text
                    </h3>
                    <p className="text-xs sm:text-sm text-white/50">
                      Perfectly formatted by Vision AI
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all",
                      copied 
                        ? "bg-green-500/20 text-green-400 border border-green-500/20" 
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:scale-105"
                    )}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm sm:text-base text-white/90 bg-black/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/5 max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar leading-relaxed">
                  {extractedText}
                </pre>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
