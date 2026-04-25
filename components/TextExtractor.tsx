"use client";

import React, { useEffect, useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, FileText, Loader2, ShieldCheck, Wand2 } from 'lucide-react';
import { cn, cleanOCRText } from '../lib/utils';
import { toast } from 'sonner';

interface TextExtractorProps {
  imageFile: File | null;
  onProcessingChange: (isProcessing: boolean) => void;
}

export function TextExtractor({ imageFile, onProcessingChange }: TextExtractorProps) {
  const [extractedText, setExtractedText] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isCleaned, setIsCleaned] = useState<boolean>(true);
  
  // Use a ref to track the current worker so we can terminate it if the component unmounts or image changes
  const workerRef = useRef<Tesseract.Worker | null>(null);

  useEffect(() => {
    // If no image, we do nothing. The component remounts or returns null.
    if (!imageFile) {
      return;
    }

    let isMounted = true;

    const extractText = async () => {
      setIsProcessing(true);
      onProcessingChange(true);
      setExtractedText('');
      setProgress(0);
      setStatus('Initializing AI Engine (100% Local)...');

      try {
        const worker = await createWorker('eng', 1, {
          logger: (m) => {
            if (!isMounted) return;
            if (m.status === 'recognizing text') {
              setProgress(m.progress);
              setStatus(`Extracting text... ${Math.round(m.progress * 100)}%`);
            } else {
              setStatus(m.status);
            }
          }
        });
        
        workerRef.current = worker;

        const imageUrl = URL.createObjectURL(imageFile);
        
        if (!isMounted) {
          await worker.terminate();
          return;
        }

        const { data: { text } } = await worker.recognize(imageUrl);
        
        if (isMounted) {
          setExtractedText(text);
          setStatus('Extraction Complete');
          toast.success('Text extracted successfully!');
        }
        
        await worker.terminate();
        workerRef.current = null;
        URL.revokeObjectURL(imageUrl);

      } catch (error) {
        console.error('OCR Error:', error);
        if (isMounted) {
          setStatus('Error extracting text');
          toast.error('Failed to extract text. Please try another image.');
        }
      } finally {
        if (isMounted) {
          setIsProcessing(false);
          onProcessingChange(false);
        }
      }
    };

    extractText();

    return () => {
      isMounted = false;
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [imageFile, onProcessingChange]);

  const handleCopy = async () => {
    const textToCopy = isCleaned ? cleanOCRText(extractedText) : extractedText;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy text');
    }
  };

  if (!imageFile && !isProcessing && !extractedText) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <AnimatePresence mode="wait">
        {isProcessing ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden"
          >
            {/* Animated background pulse */}
            <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
            
            <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                <div className="absolute inset-0 bg-blue-400 blur-xl opacity-30 animate-pulse rounded-full" />
              </div>
              
              <div className="text-center space-y-2 w-full max-w-xs">
                <p className="text-white font-medium text-lg capitalize">{status}</p>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ ease: "linear", duration: 0.2 }}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-white/50 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span>Processing locally. Your data is private.</span>
              </div>
            </div>
          </motion.div>
        ) : extractedText ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Extracted Text</h3>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Clean Toggle */}
                <button
                  onClick={() => setIsCleaned(!isCleaned)}
                  className={cn(
                    "flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    isCleaned 
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30" 
                      : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                  )}
                  title="Toggle clean mode to remove OCR noise"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isCleaned ? 'Cleaned' : 'Raw'}</span>
                </button>

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
            
            <div className="p-4 sm:p-6 relative group">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-xs text-white/50">
                  Select to copy
                </div>
              </div>
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm sm:text-base text-white/90 bg-black/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/5 max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
                  {(isCleaned ? cleanOCRText(extractedText) : extractedText) || "No text could be extracted from this image."}
                </pre>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
