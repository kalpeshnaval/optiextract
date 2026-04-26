/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileImage, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface ImageUploaderProps {
  onImageSelected: (file: File | null) => void;
  isLoading?: boolean;
}

export function ImageUploader({ onImageSelected, isLoading }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onImageSelected(file);
    }
  }, [onImageSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp']
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onImageSelected(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!preview ? (
          <div {...getRootProps()} className="focus:outline-none w-full">
            <input {...getInputProps()} />
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "relative group cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-10 transition-all duration-300",
                "glass-card border-2 border-dashed",
                isDragActive ? "border-blue-500 bg-blue-500/10 scale-[1.02]" : "border-white/20 hover:border-white/40 hover:bg-white/5",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              
              <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 text-center">
              <motion.div
                animate={{ 
                  y: isDragActive ? -10 : 0,
                  scale: isDragActive ? 1.1 : 1
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-linear-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-white/10 group-hover:ring-white/30 transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)]"
              >
                <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
              </motion.div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                  {isDragActive ? "Drop image here" : "Upload your image"}
                </h3>
                <p className="text-sm sm:text-base text-white/60 max-w-sm mx-auto px-2">
                  Drag and drop an image, or click to browse. Supported formats: JPEG, PNG, WEBP.
                </p>
              </div>
              
              <div className="px-6 py-2 rounded-full glass border border-white/10 text-sm font-medium text-white/80 group-hover:text-white group-hover:bg-white/10 transition-colors">
                Select File
              </div>
            </div>
            
            {/* Ambient hover effect */}
            <div className="absolute inset-0 bg-linear-to-tr from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </motion.div>
          </div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-3xl overflow-hidden glass-card group"
          >
            <img 
              src={preview} 
              alt="Preview" 
              className={cn(
                "w-full h-auto max-h-[500px] object-contain transition-all duration-500",
                isLoading && "opacity-50 blur-sm scale-105"
              )}
            />
            
            {/* Top Bar for File Info / Clear */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-linear-to-b from-black/80 to-transparent flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                <FileImage className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-white/90">Ready for extraction</span>
              </div>
              
              {!isLoading && (
                <button
                  onClick={handleClear}
                  className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all hover:scale-105"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
