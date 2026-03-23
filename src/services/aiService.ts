import { GoogleGenAI, Type, Modality, ThinkingLevel } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSpeech(text: string): Promise<string | null> {
  const model = "gemini-2.5-flash-preview-tts";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Speech generation failed:", error);
    throw error; // Throwing error to handle it in the UI (e.g., quota exceeded)
  }
}

export async function analyzeLeafImage(base64Image: string, language: string = "English"): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Act as an expert Plant Pathologist. Analyze this leaf image and provide a detailed diagnosis.
    1. Identify the crop type (e.g., Tomato, Potato, Grape).
    2. If the plant is healthy, indicate so.
    3. If diseased, identify the specific disease.
    4. Estimate severity as a percentage (0-100%) representing the total leaf area covered by symptoms.
    5. Determine risk level (Low, Medium, High, Critical) based on disease spread potential.
    6. Identify likely environmental factors contributing to this condition (e.g., high humidity, poor soil drainage).
    7. Provide tailored treatment and prevention steps specific to this crop and disease.
    8. Specify action urgency (e.g., "Immediate", "Within 24 hours").
    9. Identify the specific areas on the leaf that show symptoms. Provide their bounding boxes in [ymin, xmin, ymax, xmax] format (0-1000 normalized).
    
    IMPORTANT: Provide all text content in ${language}.
    
    Return the result in strict JSON format.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diseaseName: { type: Type.STRING },
          cropType: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          severity: { type: Type.NUMBER },
          riskLevel: { 
            type: Type.STRING,
            enum: ["Low", "Medium", "High", "Critical"]
          },
          description: { type: Type.STRING },
          treatment: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          prevention: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          visualMarkers: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          environmentalFactors: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          affectedRegions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                box_2d: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER }
                },
                label: { type: Type.STRING }
              },
              required: ["box_2d", "label"]
            }
          },
          actionUrgency: { type: Type.STRING },
          isHealthy: { type: Type.BOOLEAN }
        },
        required: [
          "diseaseName", "cropType", "confidence", "severity", "riskLevel", 
          "description", "treatment", "prevention", "visualMarkers", 
          "environmentalFactors", "affectedRegions", "actionUrgency", "isHealthy"
        ]
      }
    },
  });

  try {
    const result = JSON.parse(response.text);
    return result as AnalysisResult;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("Failed to analyze the image. Please try again with a clearer photo.");
  }
}

export async function translateResult(result: AnalysisResult, targetLanguage: string): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [{ 
      parts: [{ 
        text: `Translate this JSON object into ${targetLanguage}. 
               Only translate the text values. 
               Maintain the exact same JSON structure and keys.
               
               JSON: ${JSON.stringify({
                 diseaseName: result.diseaseName,
                 cropType: result.cropType,
                 description: result.description,
                 treatment: result.treatment,
                 prevention: result.prevention,
                 visualMarkers: result.visualMarkers,
                 environmentalFactors: result.environmentalFactors,
                 actionUrgency: result.actionUrgency,
                 isHealthy: result.isHealthy
               })}` 
      }] 
    }],
    config: {
      systemInstruction: "You are a professional translator specializing in agricultural science. Translate the provided JSON values accurately while preserving the structure and keys.",
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  });

  try {
    return JSON.parse(response.text) as AnalysisResult;
  } catch (error) {
    console.error("Failed to parse translation response:", error);
    return result; // Fallback to original if translation fails
  }
}
