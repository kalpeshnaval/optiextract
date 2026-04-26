"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Lock, ScanLine } from 'lucide-react';
import { ImageUploader } from '../components/ImageUploader';
import { TextExtractor } from '../components/TextExtractor';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass border-b border-white/5 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-linear-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <ScanLine className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-tight">optiExtractt</span>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm font-medium z-50 relative">
          <span className="flex items-center text-green-400 bg-green-400/10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-green-400/20">
            <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" /> <span className="hidden sm:inline">100% Private</span><span className="sm:hidden">Private</span>
          </span>
          <a href="https://github.com/kalpeshnaval" target="_blank" rel="noopener noreferrer" className="hidden sm:block text-white/70 hover:text-white transition-colors">GitHub</a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 w-full max-w-5xl mx-auto flex flex-col items-center">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-4 sm:space-y-6 mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-2 sm:mb-4 backdrop-blur-md">
            <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-500"></span>
            <span className="text-[10px] sm:text-xs font-medium text-white/80 uppercase tracking-wider">Fast & Secure</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight px-2 text-white">
            Simple Text <br className="hidden sm:block"/>
            <span className="text-blue-400">Extraction.</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto px-2">
            Upload any image to instantly extract the text. Your files are processed securely and never stored.
          </p>
        </motion.div>

        {/* Features Grid */}
        {!selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-16"
          >
            {[
              { icon: Zap, title: "Instant", desc: "Get your text in seconds." },
              { icon: Shield, title: "Secure", desc: "Files are never saved to our servers." },
              { icon: ScanLine, title: "Accurate", desc: "Powered by advanced vision models." }
            ].map((feature, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all flex flex-col items-center text-center">
                <feature.icon className="w-8 h-8 text-white/80 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Application Core */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-full relative z-20"
        >
          <ImageUploader 
            onImageSelected={setSelectedImage} 
            isLoading={isProcessing} 
          />
          <TextExtractor 
            key={selectedImage ? selectedImage.name + selectedImage.size : 'empty'}
            imageFile={selectedImage} 
            onProcessingChange={setIsProcessing} 
          />
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-white/40 text-sm glass mt-auto relative z-20">
        <p>OptiExtractt &copy; {new Date().getFullYear()}. Fast, secure image-to-text.</p>
      </footer>
    </div>
  );
}
