import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "optiExtractt | Private Client-Side OCR",
  description: "Free, unlimited, and 100% private text extraction from images using client-side AI. Your data never leaves your device.",
  keywords: ["OCR", "Text Extraction", "Private AI", "Client-Side", "Image to Text", "Free OCR"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-black text-white relative overflow-x-hidden">
        {/* Animated background blobs for premium feel */}
        <div className="bg-blob bg-blue-600 w-96 h-96 top-0 left-[-10%] opacity-20"></div>
        <div className="bg-blob bg-purple-600 w-96 h-96 bottom-0 right-[-10%] opacity-20" style={{ animationDelay: '2s' }}></div>
        <div className="bg-blob bg-pink-600 w-80 h-80 top-[40%] left-[60%] opacity-10" style={{ animationDelay: '4s' }}></div>
        
        <main className="flex-1 flex flex-col relative z-10">
          {children}
        </main>
        
        <Toaster theme="dark" position="bottom-center" toastOptions={{
          className: 'glass border-white/10 text-white',
        }} />
      </body>
    </html>
  );
}
