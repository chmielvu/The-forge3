
export enum Faction {
  Faculty = "Faculty",
  Prefect = "Prefect",
  Subject = "Subject"
}

export interface TtsVoiceDef {
  voiceId: string;
  styleHints: string[];
  pitchRange: { min: number, max: number };
  rateRange: { min: number, max: number };
}

export interface Character {
  id: string;
  name: string;
  faction: Faction;
  archetype: string;
  desc: string;
  voiceDef?: TtsVoiceDef;
}

export interface GraphNode {
  id: string;
  group: number;
  name: string;
  img?: string;
  // d3-force simulation properties
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number; // Weight of relationship (0-1)
  type: 'dominance' | 'grudge' | 'obsession' | 'alliance';
  // d3-force simulation properties
  index?: number;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface YandereLedger {
  physicalIntegrity: number; // 0-100
  traumaLevel: number; // 0-100
  shamePainAbyssLevel: number; // 0-100
  hopeLevel: number; // 0-100
  complianceScore: number; // 0-100
  turnCount: number;
}

export interface SceneChoice {
  id: string;
  text: string;
  type: 'defiance' | 'submission' | 'intellect' | 'desperation';
}

export interface Scene {
  description: string; // The main narrative text
  speaker: string;
  location: string;
  choices: SceneChoice[];
  visualPrompt?: string; // For image generation
  voiceDef?: TtsVoiceDef; // Optional override for voice parameters
  ledgerUpdates?: Partial<YandereLedger>; // Anticipated updates
  loreEntry?: { title: string; content: string }; // For generated lore
}

export interface GameState {
  ledger: YandereLedger;
  graph: KnowledgeGraph;
  history: Scene[]; // Log of past scenes
  currentScene: Scene | null;
  isLoading: boolean;
  isThinking: boolean; // For System 2 visualization
}
