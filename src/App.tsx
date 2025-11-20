import React, { useState, Suspense, useRef, useEffect } from 'react';
import { INITIAL_LEDGER, INITIAL_GRAPH, CHARACTERS } from './constants';
import { GameState, Scene, SceneChoice } from './types';
import { 
    generateDirectorOutput, 
    generateLoreEntry, 
    generateSceneImage, 
    generateSceneVideo, 
    analyzeEvidence
} from './services/geminiService';
import { LedgerDisplay } from './components/LedgerDisplay';
import { GraphView } from './components/GraphView';
import { Button, Card } from './components/ui-primitives';
import { Brain, Book, Volume2, Activity, Video, Edit2, Upload, Eye, Terminal } from 'lucide-react';
import { useTTS } from './hooks/useTTS';

// --- React 19 Resource Management ---

// Helper to create a suspended resource for a Promise
function createResource<T>(promise: Promise<T>) {
  let status = 'pending';
  let result: T;
  let suspender = promise.then(
    (r) => {
      status = 'success';
      result = r;
    },
    (e) => {
      status = 'error';
      result = e;
    }
  );
  return {
    read() {
      if (status === 'pending') {
        throw suspender;
      } else if (status === 'error') {
        throw result;
      } else if (status === 'success') {
        return result;
      }
      // Should not be reachable
      throw suspender; 
    },
  };
}

// --- Core Logic ---

const startScenePromise = (gameState: GameState, action: string) => {
  return generateDirectorOutput(gameState, action).then(async (scene) => {
      // Parallel fetch visual and audio (best effort)
      const visualPromise = scene.visualPrompt ? generateSceneImage(scene.visualPrompt) : Promise.resolve(null);
      // We don't block the scene render on TTS generation in the resource, 
      // but we could. For this app, we'll trigger TTS in the component side-effect 
      // to keep UI snappy, or we could return a promise for audio here.
      
      const [visual] = await Promise.all([visualPromise]);
      
      return {
        ...scene,
        generatedImage: visual
      };
  });
};

// --- Components ---

const SceneDisplay = ({ 
  sceneResource, 
  onChoice, 
  onEdit,
  onAnimate,
  speaking 
}: { 
  sceneResource: { read: () => Scene & { generatedImage?: string | null } }, 
  onChoice: (c: SceneChoice) => void,
  onEdit: () => void,
  onAnimate: () => void,
  speaking: boolean
}) => {
  const scene = sceneResource.read();
  const { speak } = useTTS();

  // Auto-speak when scene loads
  useEffect(() => {
    const speakerChar = CHARACTERS.find(c => 
        scene.speaker === c.name || 
        scene.speaker.includes(c.name) ||
        c.name.includes(scene.speaker)
    );
    const voiceToUse = scene.voiceDef || speakerChar?.voiceDef;
    speak(scene.description, voiceToUse);
  }, [scene, speak]);

  return (
    <div className="flex flex-col h-full">
      {/* Visual Context */}
      <div className="relative h-64 md:h-80 w-full bg-zinc-950 border-b border-zinc-800 overflow-hidden shrink-0 group">
        {scene.generatedImage ? (
           <img src={scene.generatedImage} alt="Scene" className="w-full h-full object-cover opacity-60" />
        ) : (
           <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        <div className="absolute bottom-4 left-6 z-10">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                <Terminal size={12} /> {scene.location}
            </div>
            <h2 className="text-2xl font-heading text-zinc-100 tracking-wide">
                {scene.speaker}
            </h2>
        </div>

        {/* Media Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
             {scene.generatedImage && (
                 <>
                    <Button size="icon" onClick={onEdit} className="h-8 w-8 p-0 bg-black/50 border-zinc-700">
                        <Edit2 size={14} />
                    </Button>
                    <Button size="icon" onClick={onAnimate} className="h-8 w-8 p-0 bg-black/50 border-zinc-700">
                        <Video size={14} />
                    </Button>
                 </>
             )}
        </div>
        
        {speaking && (
            <div className="absolute bottom-4 right-6 z-10 animate-pulse text-oxblood">
                <Volume2 size={20} />
            </div>
        )}
      </div>

      {/* Narrative Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
         <p className="text-lg md:text-xl font-body text-zinc-300 leading-loose border-l-2 border-oxblood pl-4 py-1">
             {scene.description}
         </p>
      </div>

      {/* Choices */}
      <div className="p-6 bg-zinc-900/30 border-t border-zinc-800 shrink-0">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {scene.choices.map(choice => (
                 <Button 
                    key={choice.id} 
                    onClick={() => onChoice(choice)}
                    className={`
                        h-auto py-4 text-left justify-start whitespace-normal border-zinc-700 hover:border-zinc-500
                        ${choice.type === 'defiance' ? 'hover:bg-red-950/30 hover:text-red-200 hover:border-red-900' : ''}
                        ${choice.type === 'submission' ? 'hover:bg-zinc-800' : ''}
                    `}
                 >
                     <span className="text-xs font-mono text-zinc-500 mr-3 uppercase tracking-wider min-w-[4rem]">
                         [{choice.type}]
                     </span>
                     <span className="font-heading text-lg tracking-wide">
                         {choice.text}
                     </span>
                 </Button>
             ))}
         </div>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-full p-12 space-y-6 animate-pulse">
    <Brain className="w-16 h-16 text-zinc-700" />
    <div className="font-mono text-xs text-zinc-500 tracking-[0.3em] uppercase">
      Cognitive Architecture Processing...
    </div>
    <div className="w-48 h-px bg-zinc-800 overflow-hidden">
        <div className="h-full bg-oxblood w-1/3 animate-[shimmer_2s_infinite_linear]" />
    </div>
  </div>
);

// --- Main App Container ---

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    ledger: INITIAL_LEDGER,
    graph: INITIAL_GRAPH,
    history: [],
    currentScene: null,
    isLoading: false,
    isThinking: false,
  });

  // React 19 Pattern: Resource is derived from state/action
  // Initialize with a "boot" promise
  const [sceneResource, setSceneResource] = useState(() => createResource(startScenePromise(gameState, "The Subject awakens.")));

  const [lore, setLore] = useState<{title: string, content: string} | null>(null);
  const [showLore, setShowLore] = useState(false);
  const [sceneVideo, setSceneVideo] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  // editPrompt removed as unused in this scope, can be added back if implementation expands
  const [analysisResult, setAnalysisResult] = useState<{analysis: string, significance: string} | null>(null);

  const { speaking } = useTTS();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleChoice = (choice: SceneChoice) => {
      // Optimistic Update
      const newHistory = gameState.currentScene ? [...gameState.history, gameState.currentScene] : gameState.history;
      
      // Prepare next state for the prompt
      const nextStateBase = {
          ...gameState,
          history: newHistory,
      };

      // Start Fetching - This creates the Suspense
      const scenePromise = startScenePromise(nextStateBase, choice.text);
      const nextResource = createResource(scenePromise);
      setSceneResource(nextResource);

      // We can update the GameState wrapper asynchronously once the resource resolves
      scenePromise.then((newScene) => {
          setGameState(prev => {
              // Logic to update Ledger/Graph (similar to original)
              const newLedger = { ...prev.ledger };
              if (newScene.ledgerUpdates) {
                  Object.entries(newScene.ledgerUpdates).forEach(([key, value]) => {
                     // @ts-ignore
                     if (typeof newLedger[key] === 'number') newLedger[key] = Math.max(0, Math.min(100, newLedger[key] + value));
                  });
                  newLedger.turnCount++;
              }
              // Graph update logic omitted for brevity but would go here
              return {
                  ...prev,
                  ledger: newLedger,
                  history: newHistory,
                  currentScene: newScene,
              };
          });
      });
  };

  const handleEditImage = async () => {
      // Implementation remains standard async as it's a side tool
      // Placeholder for future implementation
      setEditMode(false);
  };

  const handleAnimateScene = async () => {
     const currentVisual = gameState.currentScene?.visualPrompt;
     if(currentVisual) {
         const vid = await generateSceneVideo(currentVisual);
         if(vid) setSceneVideo(vid);
     }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            const analysis = await analyzeEvidence(base64String);
            setAnalysisResult(analysis);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleLore = async () => {
    setShowLore(true);
    if(!lore) {
        const l = await generateLoreEntry();
        setLore(l);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body flex relative overflow-hidden">
       <div className="absolute inset-0 scanline z-50 pointer-events-none opacity-10" />

       {/* Left: Narrative Engine */}
       <div className="flex-1 flex flex-col relative z-10">
          <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur">
              <div className="flex items-center gap-3">
                  <Activity className="text-oxblood" size={20} />
                  <h1 className="font-heading text-xl tracking-[0.2em] text-zinc-100">THE FORGE</h1>
              </div>
              <div className="flex gap-2">
                 <Button size="sm" onClick={() => fileInputRef.current?.click()} title="Analyze Evidence">
                    <Upload size={14} className="mr-2"/> Analyze
                 </Button>
                 <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
                 <Button size="sm" onClick={handleLore} title="Archives">
                    <Book size={14} className="mr-2"/> Archives
                 </Button>
              </div>
          </header>

          <main className="flex-1 overflow-hidden relative">
             <Suspense fallback={<LoadingState />}>
                <SceneDisplay 
                    sceneResource={sceneResource} 
                    onChoice={handleChoice}
                    onEdit={() => setEditMode(!editMode)}
                    onAnimate={handleAnimateScene}
                    speaking={speaking}
                />
             </Suspense>
          </main>
       </div>

       {/* Right: Cognition Engine (Sidebar) */}
       <div className="w-96 border-l border-zinc-800 bg-zinc-950/90 backdrop-blur flex flex-col z-20 hidden lg:flex">
           <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
               <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
                   System 2 // Monitoring
               </div>
               <div className="flex gap-2">
                   <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-oxblood w-[70%] animate-pulse" />
                   </div>
                   <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-gold w-[30%]" />
                   </div>
               </div>
           </div>

           <div className="flex-1 overflow-y-auto">
               <div className="p-6 space-y-8">
                   <LedgerDisplay ledger={gameState.ledger} />
                   
                   <div>
                       <div className="font-mono text-xs text-zinc-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                           <Activity size={12}/> Relationship Graph
                       </div>
                       <div className="border border-zinc-800 bg-black/50 p-2">
                            <GraphView graph={gameState.graph} />
                       </div>
                   </div>

                   {analysisResult && (
                       <Card className="p-4 border-oxblood/50">
                           <div className="text-xs text-oxblood font-mono mb-2 flex items-center gap-2">
                               <Eye size={12}/> EVIDENCE ANALYZED
                           </div>
                           <div className="text-sm text-zinc-400 mb-2">{analysisResult.analysis}</div>
                           <div className="text-xs font-bold text-zinc-200">{analysisResult.significance}</div>
                       </Card>
                   )}
               </div>
           </div>
       </div>

       {/* Lore Overlay */}
       {showLore && (
           <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-8" onClick={() => setShowLore(false)}>
               <Card className="max-w-2xl w-full max-h-full overflow-y-auto border-zinc-700 bg-zinc-950 p-8" onClick={e => e.stopPropagation()}>
                   {lore ? (
                       <>
                         <h2 className="font-heading text-3xl text-zinc-100 mb-6 border-b border-zinc-800 pb-4">{lore.title}</h2>
                         <div className="font-body text-lg text-zinc-300 leading-relaxed space-y-4 whitespace-pre-line">
                             {lore.content}
                         </div>
                       </>
                   ) : (
                       <div className="flex flex-col items-center justify-center py-12">
                           <Brain className="w-12 h-12 text-zinc-600 animate-pulse mb-4" />
                           <div className="font-mono text-xs text-zinc-500">DECRYPTING ARCHIVES...</div>
                       </div>
                   )}
               </Card>
           </div>
       )}
       
       {/* Video Overlay */}
       {sceneVideo && (
           <div className="absolute inset-0 z-40 bg-black flex items-center justify-center">
               <video src={sceneVideo} autoPlay loop controls className="max-w-full max-h-full" />
               <Button className="absolute top-4 right-4" onClick={() => setSceneVideo(null)}>Close Feed</Button>
           </div>
       )}

    </div>
  );
};

export default App;