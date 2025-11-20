
import { useState, useCallback } from 'react';
import { TtsVoiceDef } from '../types';

export const useTTS = () => {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text: string, voiceDef?: TtsVoiceDef) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel(); // Stop previous

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    let selectedVoice = voices[0];

    if (voiceDef) {
        // Attempt to gender-match based on ID hints
        if (voiceDef.voiceId.includes('male') || voiceDef.voiceId.includes('subject')) {
             selectedVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Male")) || voices[0];
        } else {
             // Default to female for Faculty/Prefects (Matriarchy theme)
             selectedVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha") || v.name.includes("Female")) || voices[0];
        }

        const styles = voiceDef.styleHints;
        
        // Base Pitch/Rate from definition
        let pitch = (voiceDef.pitchRange.min + voiceDef.pitchRange.max) / 2;
        let rate = (voiceDef.rateRange.min + voiceDef.rateRange.max) / 2;

        // Dynamic adjustments based on style keywords found in text or definition
        if (styles.includes("cold") || styles.includes("authoritative")) {
            pitch -= 0.1;
            rate -= 0.1;
        }
        if (styles.includes("gleeful") || styles.includes("sadistic")) {
            pitch += 0.3;
            rate += 0.1;
        }
        if (styles.includes("breathy") || styles.includes("seductive")) {
            pitch -= 0.1;
            rate -= 0.1;
        }
        
        // Strained / Subject voice tweaks
        if (styles.includes("strained")) {
            pitch += 0.1;
            rate += 0.1;
        }

        utterance.pitch = Math.max(0.1, Math.min(2, pitch));
        utterance.rate = Math.max(0.1, Math.min(10, rate));
    } else {
        // Narrator voice - Neutral / Standard
        selectedVoice = voices.find(v => v.name.includes("Google US English")) || voices[0];
        utterance.pitch = 0.95;
        utterance.rate = 1.0;
    }

    utterance.voice = selectedVoice;
    
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak, speaking };
};
