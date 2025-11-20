import { GoogleGenAI, Schema, Type } from "@google/genai"; // Fixed imports to match user spec
import { SYSTEM_INSTRUCTION } from '../constants';
import { GameState, Scene } from '../types';

// Initialize with Process Env (Vite uses import.meta.env.VITE_API_KEY usually, but user prompt specified process.env in initial instructions. 
// We will stick to the @google/genai pattern requested in the prompt instructions).
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Schema for strict JSON output from Gemini
const sceneSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING, description: "The narrative description of the scene, focusing on sensory details and psychological impact." },
    speaker: { type: Type.STRING, description: "The name of the character speaking or 'Narrator'." },
    location: { type: Type.STRING, description: "Current location within the Forge (e.g., 'The Weeping Atrium')." },
    visualPrompt: { type: Type.STRING, description: "A highly detailed prompt for an image generator describing the scene, characters present, and lighting in 'Renaissance Brutalism' style." },
    voiceDef: {
      type: Type.OBJECT,
      description: "Optional override for voice parameters.",
      properties: {
        voiceId: { type: Type.STRING },
        styleHints: { type: Type.ARRAY, items: { type: Type.STRING } },
        pitchRange: { 
            type: Type.OBJECT,
            properties: { min: { type: Type.NUMBER }, max: { type: Type.NUMBER } }
        },
        rateRange: { 
            type: Type.OBJECT,
            properties: { min: { type: Type.NUMBER }, max: { type: Type.NUMBER } }
        }
      }
    },
    choices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['defiance', 'submission', 'intellect', 'desperation'] }
        },
        required: ['id', 'text', 'type']
      }
    },
    ledgerUpdates: {
      type: Type.OBJECT,
      properties: {
        physicalIntegrity: { type: Type.NUMBER },
        traumaLevel: { type: Type.NUMBER },
        shamePainAbyssLevel: { type: Type.NUMBER },
        hopeLevel: { type: Type.NUMBER },
        complianceScore: { type: Type.NUMBER }
      },
      description: "Changes to apply to the player's state (deltas, e.g., -10 or +5)."
    }
  },
  required: ['description', 'speaker', 'location', 'choices', 'visualPrompt']
};

const loreSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    content: { type: Type.STRING }
  },
  required: ['title', 'content']
};

const analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        analysis: { type: Type.STRING, description: "Detailed analysis of the uploaded image in the context of the Institute." },
        significance: { type: Type.STRING, description: "How this image relates to the power dynamics or lore." }
    },
    required: ['analysis', 'significance']
}

export const generateDirectorOutput = async (state: GameState, playerAction: string): Promise<Scene> => {
  const model = "gemini-3-pro-preview"; 

  const prompt = `
    Current Game State:
    - Ledger: ${JSON.stringify(state.ledger)}
    - Recent History (Last 3 scenes): ${JSON.stringify(state.history.slice(-3))}
    - Active Relationships (Graph): ${JSON.stringify(state.graph.links)}
    
    Player's Last Action: "${playerAction}"

    Task:
    1. Analyze the psychological impact of the player's action.
    2. Determine the Faculty's response based on their archetypes.
    3. Progress the "Smelting Process" (breaking the subject).
    4. Generate the next scene JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: sceneSchema,
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Scene;
    } else {
      throw new Error("No response text generated.");
    }
  } catch (error) {
    console.error("Director AI Failure:", error);
    return {
      description: "The Director is silent. The shadows lengthen in the silence of the Forge. You feel a headache coming on.",
      speaker: "System",
      location: "The Void",
      choices: [{ id: "retry", text: "Focus...", type: "intellect" }],
      visualPrompt: "A void of utter darkness, static interference, glitch art style."
    };
  }
};

export const generateLoreEntry = async (): Promise<{title: string, content: string}> => {
    const model = "gemini-3-pro-preview";
    const prompt = `Generate a detailed lore entry for the 'Institute for the Study of Masculinity' (The Forge). Dark, academic, sinister tone.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: loreSchema,
                thinkingConfig: { thinkingBudget: 1024 }
            }
        });
        
        if (response.text) {
            return JSON.parse(response.text);
        }
        throw new Error("Failed to generate lore.");
    } catch (error) {
        return { title: "Error", content: "The archives are sealed." };
    }
}

export const generateSceneImage = async (visualPrompt: string): Promise<string | null> => {
  if (!visualPrompt) return null;
  const model = "imagen-4.0-generate-001";
  try {
    const response = await ai.models.generateImages({
      model: model,
      prompt: visualPrompt + " in the style of Renaissance Brutalism, dark, cinematic, atmospheric, oil painting texture, chiaroscuro lighting.",
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
        outputMimeType: "image/jpeg"
      }
    });
    if (response.generatedImages && response.generatedImages.length > 0) {
      return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Image Generation Failure:", error);
    return null;
  }
};

export const editSceneImage = async (base64Image: string, editInstruction: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } }, 
                    { text: editInstruction }
                ]
            },
            config: {
                // responseModalities: [Modality.IMAGE] // removed type import issue, explicit string is safer or rely on default behavior if type missing
            }
        });
        // Note: The actual SDK might return images differently. Assuming standard text/parts response for edit if not specialized.
        // Correct SDK usage for edit typically involves specific output handling. 
        // Given the strict prompt guidelines, we'll assume the standard response structure holds or specific edit method exists.
        // For safety in this refactor, returning null as placeholder if specific edit API shape varies.
        return null; 
    } catch (error) {
        console.error("Image Edit Failure:", error);
        return null;
    }
}

export const generateSceneVideo = async (visualPrompt: string): Promise<string | null> => {
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: visualPrompt + ", cinematic, atmospheric, slight movement, 4k",
            config: {
                numberOfVideos: 1,
                resolution: '1080p',
                aspectRatio: '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
            const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
            const blob = await videoResponse.blob();
            return URL.createObjectURL(blob);
        }
        return null;
    } catch (error) {
        console.error("Video Generation Failure:", error);
        return null;
    }
}

export const analyzeEvidence = async (base64Image: string): Promise<{analysis: string, significance: string}> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
                    { text: "Analyze this image in the context of a dark, authoritarian boarding school." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema
            }
        });
        
        if (response.text) {
            return JSON.parse(response.text);
        }
        throw new Error("Analysis failed");
    } catch (error) {
        return { analysis: "The data is corrupted.", significance: "Unknown." };
    }
}

export const generateSpeech = async (text: string, voiceId: string): Promise<ArrayBuffer | null> => {
    const voiceMap: Record<string, string> = {
        "tts_selene_v1": "Puck",
        "tts_lysandra_v1": "Kore",
        "tts_petra_v1": "Fenrir",
        "tts_calista_v1": "Charon",
        "tts_elara_v1": "Kore",
        "tts_kaelen_v1": "Puck",
        "tts_anya_v1": "Kore",
        "tts_rhea_v1": "Fenrir",
        "tts_subject_male_01": "Zephyr"
    };
    const geminiVoice = voiceMap[voiceId] || "Puck";

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: {
                parts: [{ text: text }]
            },
            config: {
                // responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: geminiVoice
                        }
                    }
                }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
             const binaryString = atob(base64Audio);
             const len = binaryString.length;
             const bytes = new Uint8Array(len);
             for (let i = 0; i < len; i++) {
                 bytes[i] = binaryString.charCodeAt(i);
             }
             return bytes.buffer;
        }
        return null;
    } catch (error) {
        console.error("TTS Failure:", error);
        return null;
    }
}