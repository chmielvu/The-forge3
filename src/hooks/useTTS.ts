
import { useState, useCallback, useRef, useEffect } from 'react';
import { TtsVoiceDef } from '../types';
import { generateSpeech } from '../services/geminiService';

export const useTTS = () => {
  const [speaking, setSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize AudioContext
  useEffect(() => {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      return () => {
          audioContextRef.current?.close();
      };
  }, []);

  const speak = useCallback(async (text: string, voiceDef?: TtsVoiceDef) => {
    if (!text) return;

    // Stop previous audio
    if (sourceRef.current) {
        sourceRef.current.stop();
        setSpeaking(false);
    }

    try {
        setSpeaking(true);
        const voiceId = voiceDef?.voiceId || "tts_selene_v1";
        
        const audioData = await generateSpeech(text, voiceId);
        
        if (audioData && audioContextRef.current) {
            const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            
            source.onended = () => setSpeaking(false);
            source.start();
            sourceRef.current = source;
        } else {
            setSpeaking(false);
        }
    } catch (error) {
        console.error("Audio Playback Error", error);
        setSpeaking(false);
    }
  }, []);

  return { speak, speaking };
};
