import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  let geminiErrorMsg = '';
  let groqErrorMsg = '';
  let openaiErrorMsg = '';

  try {
    const { base64Image, mimeType } = await req.json();

    if (!base64Image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!geminiKey && !groqKey) {
      return NextResponse.json({ error: 'Extraction service not properly configured with API keys in .env' }, { status: 500 });
    }

    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    // Attempt 1: Gemini (Best OCR)
    if (geminiKey) {
      const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      for (const model of geminiModels) {
        try {
          const response = await ai.models.generateContent({
            model,
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
          if (text) {
            return NextResponse.json({ text });
          }
          geminiErrorMsg += `[${model}: empty response] `;
        } catch (geminiError: any) {
          console.error(`Gemini ${model} failed:`, geminiError);
          geminiErrorMsg += `[${model}: ${geminiError.message || 'failed'}] `;
        }
      }
      console.log('Falling back to Groq...');
    }

    // Attempt 2: Groq Llama Vision (Fallback)
    if (groqKey) {
      const groqModels = [
        'llama-3.2-11b-vision-preview',
        'llama-3.2-90b-vision-preview',
        'llama-3.2-11b-vision-instruct',
        'llama-3.2-90b-vision-instruct',
        'llama-3.2-11b-vision',
        'llama-3.2-90b-vision'
      ];

      const groq = new Groq({ apiKey: groqKey });
      
      for (const model of groqModels) {
        try {
          const response = await groq.chat.completions.create({
            model,
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
          if (text) {
            return NextResponse.json({ text });
          }
          groqErrorMsg += `[${model}: empty response] `;
        } catch (groqError: any) {
          console.error(`Groq ${model} failed:`, groqError);
          groqErrorMsg += `[${model}: ${groqError.message || 'failed'}] `;
        }
      }
    }

    // Attempt 3: OpenAI GPT-4o Mini (Ultimate Fallback)
    const openAIKey = process.env.OPENAI_API_KEY;
    if (openAIKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAIKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Extract all text from this image exactly as written. Do not describe the image. Just return the text.' },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${mimeType || 'image/jpeg'};base64,${cleanBase64}`,
                    },
                  },
                ],
              },
            ],
          }),
        });

        const data = await response.json();
        if (data.error) {
          openaiErrorMsg = data.error.message || 'OpenAI API returned error';
        } else {
          const text = data.choices?.[0]?.message?.content || '';
          if (text) {
            return NextResponse.json({ text });
          }
          openaiErrorMsg = 'OpenAI returned empty text';
        }
      } catch (openaiError: any) {
        console.error('OpenAI failed:', openaiError);
        openaiErrorMsg = openaiError.message || 'OpenAI network error';
      }
    }

    const combinedError = `Gemini: ${geminiErrorMsg || 'Skipped'}. Groq: ${groqErrorMsg || 'Skipped'}. OpenAI: ${openaiErrorMsg || 'Skipped'}`;
    return NextResponse.json({ error: combinedError }, { status: 500 });

  } catch (error: any) {
    console.error('Extraction API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}
