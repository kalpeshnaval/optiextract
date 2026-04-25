"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileImage, FileText, X, File } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface FileUploaderProps {
  onFileSelected: (file: File | null) => void;
  isLoading?: boolean;
}

export function FileUploader({ onFileSelected, isLoading }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // Increased to 20MB for documents
        toast.error('File size must be less than 20MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Only create object URL for images to show preview
      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
      } else {
        setPreview(null);
      }
      
      onFileSelected(file);
    }
  }, [onFileSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
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
    setSelectedFile(null);
    onFileSelected(null);
  };

  const isImage = selectedFile?.type.startsWith('image/');
  const isPdf = selectedFile?.type === 'application/pdf';
  const isDocx = selectedFile?.type.includes('wordprocessingml.document') || selectedFile?.name.endsWith('.docx');

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
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
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-white/10 group-hover:ring-white/30 transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)]"
              >
                <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
              </motion.div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                  {isDragActive ? "Drop file here" : "Upload your file"}
                </h3>
                <p className="text-sm sm:text-base text-white/60 max-w-sm mx-auto px-2">
                  Drag and drop a file, or click to browse. Supported formats: Images, PDF, DOCX.
                </p>
              </div>
              
              <div className="flex space-x-2 items-center justify-center pt-2">
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center space-x-1.5 text-xs text-white/70">
                  <FileImage className="w-3.5 h-3.5 text-pink-400" /> <span>Image</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center space-x-1.5 text-xs text-white/70">
                  <FileText className="w-3.5 h-3.5 text-red-400" /> <span>PDF</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center space-x-1.5 text-xs text-white/70">
                  <File className="w-3.5 h-3.5 text-blue-400" /> <span>DOCX</span>
                </div>
              </div>
            </div>
            
            {/* Ambient hover effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </motion.div>
          </div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "relative rounded-3xl overflow-hidden glass-card group flex items-center justify-center p-8",
              !isImage && "min-h-[250px]"
            )}
          >
            {isImage && preview ? (
              <img 
                src={preview} 
                alt="Preview" 
                className={cn(
                  "w-full h-auto max-h-[400px] object-contain transition-all duration-500 rounded-lg",
                  isLoading && "opacity-50 blur-sm scale-105"
                )}
              />
            ) : (
              <div className={cn(
                "flex flex-col items-center justify-center space-y-4",
                isLoading && "opacity-50 blur-sm scale-105 transition-all duration-500"
              )}>
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-white/10">
                  {isPdf ? (
                    <FileText className="w-12 h-12 text-red-400" />
                  ) : isDocx ? (
                    <File className="w-12 h-12 text-blue-400" />
                  ) : (
                    <File className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-medium text-white truncate max-w-[200px] sm:max-w-[300px]">
                    {selectedFile?.name}
                  </h4>
                  <p className="text-sm text-white/50 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
            
            {/* Top Bar for File Info / Clear */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                {isImage ? <FileImage className="w-4 h-4 text-pink-400" /> : isPdf ? <FileText className="w-4 h-4 text-red-400" /> : <File className="w-4 h-4 text-blue-400" />}
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
