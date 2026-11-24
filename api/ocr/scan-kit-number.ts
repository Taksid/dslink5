import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Image data required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ success: false, error: 'Gemini not configured' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64
          }
        },
        {
          text: "Extract the Starlink Kit number or serial number from this box or barcode label. It usually starts with KIT or similar alphanumerics. Return ONLY a JSON object with key 'kitNumber' containing the string without hyphens or spaces, e.g. {\"kitNumber\": \"KIT0012345\"}."
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);

    return res.status(200).json({
      success: !!data.kitNumber,
      kitNumber: data.kitNumber || null
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'OCR failed' });
  }
}
