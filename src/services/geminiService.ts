
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { GameState, Scene } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      description: "Optional override for voice parameters to match the emotion of the dialogue.",
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

export const generateDirectorOutput = async (state: GameState, playerAction: string): Promise<Scene> => {
  // Gemini 3 Pro is the "Director" capable of complex reasoning (System 2)
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
    5. IMPORTANT: You can implicitly update the Knowledge Graph by describing relationship shifts in the narrative, but focusing on the ledger updates for state.
    6. Optional: If the speaker's emotion deviates significantly from their neutral state, provide a 'voiceDef' to modulate pitch/rate (e.g. higher pitch for excitement/fear, lower for anger).
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: sceneSchema,
        thinkingConfig: { thinkingBudget: 2048 } // Enforce "System 2" reasoning
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
    const prompt = `
        Generate a detailed lore entry for the 'Institute for the Study of Masculinity' (The Forge).
        
        Requirements:
        1. Explain its founding principles based on the "Yalan Hypothesis" (Male aggression as a resource).
        2. Explain the methodology: "Grammar of Suffering", control via the "Covenant of Vulnerability" (testicular trauma).
        3. Explain the "Marble and Concrete" aesthetic (Renaissance Brutalism).
        4. Tone: Dark, academic, sinister, clinical yet poetic.
        5. Key terms to include: 'discipulus', 'perfect testimony', 'The Smelting'.
    `;

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