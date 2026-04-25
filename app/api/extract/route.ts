import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

// We do not save anything to the server.
export const runtime = 'edge'; // Edge runtime for ultra-fast serverless

export async function POST(req: Request) {
  try {
    const { base64Image, mimeType } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!geminiKey && !groqKey) {
      return NextResponse.json({ error: 'Extraction service not properly configured with API keys.' }, { status: 500 });
    }

    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    // Attempt 1: Gemini (Best OCR)
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [
            "Extract all text from this image exactly as written. Do not include markdown formatting like ```. Do not describe the image. Just return the text.",
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/jpeg',
              }
            }
          ]
        });

        const text = response.text || '';
        return NextResponse.json({ text });
      } catch (geminiError: any) {
        console.error('Gemini Error:', geminiError);
        // If Groq key is not available, throw the Gemini error
        if (!groqKey) {
          throw new Error(geminiError.message || 'Gemini API failed');
        }
        console.log('Falling back to Groq...');
      }
    }

    // Attempt 2: Groq Llama 3.2 Vision (Fallback or Primary if only Groq provided)
    if (groqKey) {
      const groq = new Groq({ apiKey: groqKey });
      
      const response = await groq.chat.completions.create({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all text from this image exactly as written. Do not describe the image. Just return the text." },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || 'image/jpeg'};base64,${cleanBase64}`,
                },
              },
            ],
          },
        ],
      });

      const text = response.choices[0]?.message?.content || '';
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: 'All API attempts failed.' }, { status: 500 });

  } catch (error: any) {
    console.error('Extraction API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}
