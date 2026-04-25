/**
 * Advanced image preprocessing for Tesseract.js OCR.
 * Converts images to high-contrast grayscale to eliminate backgrounds,
 * emojis, and logos, forcing Tesseract to focus only on text.
 */
export async function preprocessImageForOCR(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        // Fallback to original if canvas fails
        resolve(URL.createObjectURL(file));
        return;
      }
      
      // Upscale image if it's too small (helps Tesseract read small text)
      const scale = Math.max(1, 2000 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Preprocessing Algorithm: Grayscale + High Contrast Thresholding
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // 1. Convert to Grayscale using luminance formula
        const grayscale = r * 0.299 + g * 0.587 + b * 0.114;
        
        // 2. Thresholding / Binarization
        // Anything lighter than the threshold becomes pure white (background/emojis)
        // Anything darker becomes pure black (text)
        // Adjust threshold based on typical screenshot backgrounds (around 150-180 works well for standard text)
        const threshold = 160; 
        const color = grayscale > threshold ? 255 : 0;
        
        data[i] = color;     // red
        data[i + 1] = color; // green
        data[i + 2] = color; // blue
        // data[i + 3] remains alpha
      }
      
      // Put processed pixels back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert canvas to base64 blob URL
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      // Fallback on error
      resolve(URL.createObjectURL(file));
    };
    
    img.src = url;
  });
}
