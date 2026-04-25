"use client";

import React, { useEffect, useState, useRef } from 'react';
import { createWorker, type Worker } from 'tesseract.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, FileText, Loader2, ShieldCheck, Wand2, FileImage, File } from 'lucide-react';
import { cn, formatExtractedText } from '../lib/utils';
import { preprocessImageForOCR } from '../lib/imageUtils';
import { toast } from 'sonner';

interface TextExtractorProps {
  imageFile: File | null;
  onProcessingChange: (isProcessing: boolean) => void;
}

export function TextExtractor({ imageFile: file, onProcessingChange }: TextExtractorProps) {
  const [extractedText, setExtractedText] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isCleaned, setIsCleaned] = useState<boolean>(true);
  
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!file) {
      return;
    }

    let isMounted = true;

    const extractFromImage = async () => {
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
        
        // Enhance the image before sending to Tesseract to drastically reduce hallucinations
        setStatus('Enhancing image for AI...');
        const processedImageUrl = await preprocessImageForOCR(file);
        
        if (!isMounted) {
          await worker.terminate();
          return;
        }

        setStatus('Extracting text...');
        const { data: { text } } = await worker.recognize(processedImageUrl);
        
        if (isMounted) {
          setExtractedText(text);
          setStatus('Extraction Complete');
          toast.success('Text extracted successfully!');
        }
        
        await worker.terminate();
        workerRef.current = null;
        // Clean up the generated data URL (base64 or object URL) if it's an object URL
        if (processedImageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(processedImageUrl);
        }

      } catch (error) {
        console.error('OCR Error:', error);
        if (isMounted) {
          setStatus('Error extracting text');
          toast.error('Failed to extract text from image.');
        }
      }
    };

    const extractFromDocx = async () => {
      setStatus('Parsing Document...');
      setProgress(0.5); // Fast process, just show half
      try {
        const arrayBuffer = await file.arrayBuffer();
        if (!isMounted) return;

        const mammothModule = await import('mammoth');
        const mammoth = mammothModule.default || mammothModule;
        const result = await mammoth.extractRawText({ arrayBuffer });
        setProgress(1);

        if (isMounted) {
          setExtractedText(result.value);
          setStatus('Extraction Complete');
          toast.success('Text extracted successfully!');
        }
      } catch (error) {
        console.error('Docx Error:', error);
        if (isMounted) {
          setStatus('Error parsing DOCX');
          toast.error('Failed to read DOCX file.');
        }
      }
    };

    const extractFromPdf = async () => {
      setStatus('Parsing PDF Structure...');
      setProgress(0.1);
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        if (!isMounted) return;

        const pdfjsLib = await import('pdfjs-dist');
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const maxPages = pdf.numPages;
        let fullText = '';

        for (let i = 1; i <= maxPages; i++) {
          if (!isMounted) return;
          setStatus(`Extracting Page ${i} of ${maxPages}...`);
          setProgress(i / maxPages);
          
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // PDF.js returns TextItems which have a 'str' property
          const pageText = textContent.items
            .map((item: unknown) => (item as { str?: string })?.str || '')
            .join(' ');
            
          fullText += pageText + '\n\n';
        }

        if (isMounted) {
          // If no text was found, it might be a scanned PDF
          if (fullText.trim().length === 0) {
            setExtractedText("No embedded text found in this PDF. It appears to be a scanned document. To extract text from a scanned PDF, please convert the pages to images first and upload them.");
            setStatus('Scanned PDF Detected');
            toast.warning('No text found. Document might be scanned.');
          } else {
            setExtractedText(fullText);
            setStatus('Extraction Complete');
            toast.success('Text extracted successfully!');
          }
        }
      } catch (error) {
        console.error('PDF Error:', error);
        if (isMounted) {
          setStatus('Error parsing PDF');
          toast.error('Failed to read PDF file.');
        }
      }
    };

    const processFile = async () => {
      setIsProcessing(true);
      onProcessingChange(true);
      setExtractedText('');
      setProgress(0);

      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      if (fileType.startsWith('image/')) {
        await extractFromImage();
      } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        await extractFromPdf();
      } else if (fileType.includes('wordprocessingml.document') || fileName.endsWith('.docx')) {
        await extractFromDocx();
      } else {
        setStatus('Unsupported File Type');
        toast.error('Please upload an image, PDF, or DOCX file.');
      }

      if (isMounted) {
        setIsProcessing(false);
        onProcessingChange(false);
      }
    };

    processFile();

    return () => {
      isMounted = false;
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [file, onProcessingChange]);

  const handleCopy = async () => {
    const textToCopy = isCleaned ? formatExtractedText(extractedText, isImage) : extractedText;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy text');
    }
  };

  if (!file && !isProcessing && !extractedText) return null;

  const isImage = file?.type.startsWith('image/');
  const isPdf = file?.type === 'application/pdf';

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
                {isImage ? <FileImage className="w-5 h-5 text-pink-400" /> : isPdf ? <FileText className="w-5 h-5 text-red-400" /> : <File className="w-5 h-5 text-blue-400" />}
                <h3 className="font-semibold text-white">Extracted Text</h3>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Clean Toggle (Available for all formats now) */}
                <button
                  onClick={() => setIsCleaned(!isCleaned)}
                  className={cn(
                    "flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    isCleaned 
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30" 
                      : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                  )}
                  title={isImage ? "Toggle anti-noise filter & formatting" : "Toggle formatting"}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isCleaned ? 'Formatted' : 'Raw'}</span>
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
                <pre className="whitespace-pre-wrap font-sans text-sm sm:text-base text-white/90 bg-black/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/5 max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar leading-relaxed">
                  {(isCleaned ? formatExtractedText(extractedText, isImage) : extractedText) || "No text could be extracted from this document."}
                </pre>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
