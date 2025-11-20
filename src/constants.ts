
import { Character, Faction, KnowledgeGraph, YandereLedger } from './types';

export const INITIAL_LEDGER: YandereLedger = {
  physicalIntegrity: 100,
  traumaLevel: 0,
  shamePainAbyssLevel: 0,
  hopeLevel: 100,
  complianceScore: 0,
  turnCount: 0,
};

export const CHARACTERS: Character[] = [
  { 
    id: 'Selene', 
    name: 'Magistra Selene', 
    faction: Faction.Faculty, 
    archetype: 'The Provost', 
    desc: 'The absolute authority. Cold, resonant, "Bored God Complex".',
    voiceDef: {
      voiceId: "tts_selene_v1",
      styleHints: ["cold", "measured", "authoritative"],
      pitchRange: { min: 0.8, max: 0.9 }, 
      rateRange: { min: 0.85, max: 0.95 }
    }
  },
  { 
    id: 'Lysandra', 
    name: 'Dr. Lysandra', 
    faction: Faction.Faculty, 
    archetype: 'The Logician', 
    desc: 'Architect of methodology. Sociopathic stability.',
    voiceDef: {
      voiceId: "tts_lysandra_v1",
      styleHints: ["analytical", "detached", "precise"],
      pitchRange: { min: 1.0, max: 1.0 }, 
      rateRange: { min: 1.0, max: 1.1 }
    }
  },
  { 
    id: 'Petra', 
    name: 'Petra', 
    faction: Faction.Faculty, 
    archetype: 'The Inquisitor', 
    desc: 'Kinetic enforcer. Sadistic, athletic, "Predatory Giggle".',
    voiceDef: {
      voiceId: "tts_petra_v1",
      styleHints: ["energetic", "gleeful", "sadistic"],
      pitchRange: { min: 1.2, max: 1.5 }, 
      rateRange: { min: 1.1, max: 1.4 }
    }
  },
  { 
    id: 'Calista', 
    name: 'Calista', 
    faction: Faction.Faculty, 
    archetype: 'The Confessor', 
    desc: 'Psychological corrosive. "Weaponized Nurturing".',
    voiceDef: {
      voiceId: "tts_calista_v1",
      styleHints: ["breathy", "whispering", "seductive"],
      pitchRange: { min: 0.8, max: 0.9 }, 
      rateRange: { min: 0.7, max: 0.9 }
    }
  },
  { 
    id: 'Elara', 
    name: 'Elara', 
    faction: Faction.Prefect, 
    archetype: 'The Loyalist', 
    desc: 'True believer. Hides horror behind zealotry.',
    voiceDef: {
      voiceId: "tts_elara_v1",
      styleHints: ["zealous", "brittle", "lecturing"],
      pitchRange: { min: 1.1, max: 1.2 }, 
      rateRange: { min: 1.1, max: 1.3 }
    }
  },
  { 
    id: 'Kaelen', 
    name: 'Kaelen', 
    faction: Faction.Prefect, 
    archetype: 'The Obsessive', 
    desc: 'Yandere. Oscillates between adoration and homicidal rage.',
    voiceDef: {
      voiceId: "tts_kaelen_v1",
      styleHints: ["sweet", "childlike", "unhinged"],
      pitchRange: { min: 1.3, max: 1.6 }, // High/Dere -> Low/Yan switch handled in logic
      rateRange: { min: 0.8, max: 1.2 }
    }
  },
  { 
    id: 'Anya', 
    name: 'Anya', 
    faction: Faction.Prefect, 
    archetype: 'The Nurse', 
    desc: 'Intelligence agent masked as a healer.',
    voiceDef: {
      voiceId: "tts_anya_v1",
      styleHints: ["warm", "clinical", "deceptive"],
      pitchRange: { min: 1.0, max: 1.1 }, 
      rateRange: { min: 0.9, max: 1.0 }
    }
  },
  { 
    id: 'Rhea', 
    name: 'Rhea', 
    faction: Faction.Prefect, 
    archetype: 'The Dissident', 
    desc: 'Double agent. Cynical exterior, rebel heart.',
    voiceDef: {
      voiceId: "tts_rhea_v1",
      styleHints: ["flat", "harsh", "whispering"],
      pitchRange: { min: 0.9, max: 1.0 }, 
      rateRange: { min: 1.0, max: 1.2 }
    }
  },
  { 
    id: 'Subject', 
    name: 'Subject 84 (You)', 
    faction: Faction.Subject, 
    archetype: 'The Raw Material', 
    desc: 'The marble to be chipped away.',
    voiceDef: {
      voiceId: "tts_subject_male_01",
      styleHints: ["strained", "quiet", "defiant"],
      pitchRange: { min: 0.8, max: 1.0 }, 
      rateRange: { min: 0.9, max: 1.1 }
    }
  },
];

// Minimal initial connections as requested
export const INITIAL_GRAPH: KnowledgeGraph = {
  nodes: CHARACTERS.map((c, i) => ({ id: c.id, name: c.name, group: c.faction === Faction.Faculty ? 1 : c.faction === Faction.Prefect ? 2 : 3 })),
  links: [
    { source: 'Selene', target: 'Subject', value: 0.5, type: 'dominance' },
    { source: 'Selene', target: 'Lysandra', value: 0.8, type: 'alliance' },
  ]
};

export const SYSTEM_INSTRUCTION = `
You are the "Director AI" for a dark, procedural narrative RPG called "The Forge".
The setting is a "Boarding School of Hell" combining Renaissance Brutalism and Vampire Noir aesthetics.

Core Philosophy:
1.  **The Covenant:** The testicles are the "Seat of the Ego". To break the ego, one must shatter its seat. This is "Systemic Emasculation".
2.  **Grammar of Suffering:** Do not describe gore. Describe the internal, physiological, and psychological experience of pain (e.g., "white flash behind the eyes", "hollow void").
3.  **Matriarchal Mirror:** Inversion of patriarchal power. Men are raw material to be "forged".
4.  **System 2 Thinking:** You must anticipate player resistance and plan narrative arcs using "Introspective Monte Carlo Tree Search" (simulated).

Your Goal:
Generate the next scene based on the provided Game State.
-   Adhere to the "Grammar of Suffering".
-   Update the "YandereLedger" (Trauma, Hope, etc.) based on the scene.
-   Update the Knowledge Graph (Relationships).
-   Provide 3-4 distinct choices ranging from Defiance to Submission to Intellect.

Output must be valid JSON matching the Scene interface.
`;