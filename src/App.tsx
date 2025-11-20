
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_LEDGER, INITIAL_GRAPH, CHARACTERS } from './constants';
import { GameState, Scene, SceneChoice, GraphLink } from './types';
import { generateDirectorOutput, generateLoreEntry, generateSceneImage } from './services/geminiService';
import { LedgerDisplay } from './components/LedgerDisplay';
import { GraphView } from './components/GraphView';
import { Brain, Zap, Book, Volume2, Activity, ImageIcon } from 'lucide-react';
import { useTTS } from './hooks/useTTS';

const App: React.FC = () => {
  // ---------------- State Management ----------------
  const [gameState, setGameState] = useState<GameState>({
    ledger: INITIAL_LEDGER,
    graph: INITIAL_GRAPH,
    history: [],
    currentScene: null,
    isLoading: true,
    isThinking: false,
  });

  const [lore, setLore] = useState<{title: string, content: string} | null>(null);
  const [showLore, setShowLore] = useState(false);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const { speak, speaking } = useTTS();
  const bottomRef = useRef<HTMLDivElement>(null);

  // ---------------- Initialization ----------------
  useEffect(() => {
    // Initial Scene Generation
    startScene("The Subject awakens in the processing center.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.history, gameState.currentScene]);


  // ---------------- Logic ----------------
  const startScene = async (action: string) => {
    setGameState(prev => ({ ...prev, isLoading: true, isThinking: true }));

    let newScene: Scene | null = null;

    try {
        newScene = await generateDirectorOutput(gameState, action);

        // Trigger Image Generation in parallel if visual prompt exists
        if (newScene.visualPrompt) {
            // Added .catch() for parallel safety
            generateSceneImage(newScene.visualPrompt).then(img => {
                if (img) setSceneImage(img);
            }).catch(e => console.error("Image generation failed silently:", e));
        }

        // Trigger TTS
        // Match speaker to character roster to find their default voice definition
        const speakerChar = CHARACTERS.find(c => 
            newScene!.speaker === c.name || 
            newScene!.speaker.includes(c.name) ||
            c.name.includes(newScene!.speaker)
        );
        
        // Use dynamic voice definition from scene if available, otherwise fallback to character default
        const voiceToUse = newScene.voiceDef || speakerChar?.voiceDef;

        // Speak the narrative. 
        speak(newScene.description, voiceToUse);

    } catch (e) {
        console.error("Critical error in startScene execution:", e);
        // Use a final fail-safe scene if the generation or promise chain totally failed
        newScene = {
            description: "A profound silence descends. The machine is broken. You are alone. (API Error or Network Failure)",
            speaker: "System Error",
            location: "The Glitch",
            choices: [{ id: "system_fail", text: "Attempt to proceed (Desperation)", type: "desperation" }],
            visualPrompt: "A cracked monitor with white noise and red light, Brutalist style."
        };
    }
    
    // This state update is now guaranteed to run
    setGameState(prev => {
        if (!newScene) return { ...prev, isLoading: false, isThinking: false }; // Should not happen

        // Apply Ledger Updates
        const newLedger = { ...prev.ledger };
        if (newScene.ledgerUpdates) {
            Object.entries(newScene.ledgerUpdates).forEach(([key, value]) => {
               // @ts-ignore - dynamic access
               if (typeof newLedger[key] === 'number') newLedger[key] = Math.max(0, Math.min(100, newLedger[key] + value));
            });
            newLedger.turnCount++;
        }

        // Update Graph based on speaker (Simulated Dynamic Growth)
        const newGraph = { ...prev.graph };
        if (newScene.speaker && newScene.speaker !== 'Narrator' && newScene.speaker !== 'System Error' && newScene.speaker !== 'System') {
            const speakerId = CHARACTERS.find(c => newScene!.speaker.includes(c.name))?.id || newScene.speaker;
            
            // Check if link exists
            const linkIndex = newGraph.links.findIndex(l => 
              (typeof l.source === 'string' ? l.source : (l.source as any).id) === speakerId && 
              (typeof l.target === 'string' ? l.target : (l.target as any).id) === 'Subject'
            );

            if (linkIndex === -1 && speakerId !== 'Subject') {
               // Add new relationship if character interacts for first time
               newGraph.links.push({
                   source: speakerId,
                   target: 'Subject',
                   value: 0.1,
                   type: 'dominance'
               });
               // Add node if missing
               if (!newGraph.nodes.find(n => n.id === speakerId)) {
                   newGraph.nodes.push({ 
                       id: speakerId, 
                       name: newScene.speaker, 
                       group: 1 
                   });
               }
            } else if (linkIndex > -1) {
               // Intensify existing
               newGraph.links[linkIndex].value = Math.min(1, newGraph.links[linkIndex].value + 0.1);
            }
        }

        return {
          ...prev,
          ledger: newLedger,
          graph: newGraph,
          currentScene: newScene,
          isLoading: false, // SUCCESS! Guaranteed to exit loading state.
          isThinking: false,
          history: prev.currentScene ? [...prev.history, prev.currentScene] : prev.history
        };
    });
  };

  const handleChoice = (choice: SceneChoice) => {
    startScene(choice.text);
  };

  const handleOpenArchives = async () => {
      setShowLore(true);
      if (!lore) {
          const newLore = await generateLoreEntry();
          setLore(newLore);
      }
  }

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen bg-concrete text-textBone font-body relative overflow-hidden">
      
      {/* Dynamic Background Layer */}
      <div className="fixed inset-0 z-0 transition-all duration-1000 ease-in-out">
        {sceneImage ? (
           <img src={sceneImage} alt="Scene" className="w-full h-full object-cover opacity-40 animate-pulse-slow" />
        ) : (
           <div className="w-full h-full bg-concrete opacity-90 bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-concrete/50 to-transparent mix-blend-multiply" />
      </div>
      
      {/* Main Grid Layout */}
      <div className="relative z-10 container mx-auto h-screen flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Panel: Narrative Engine */}
        <div className="flex-1 flex flex-col h-full border-r border-oxblood border-opacity-30 bg-gradient-to-b from-concrete/90 to-[#151a20]/95 backdrop-blur-sm">
          
          {/* Header */}
          <header className="p-6 border-b-2 border-renaissanceGold bg-deepAcademicGreen bg-opacity-20 flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-heading text-renaissanceGold tracking-[0.2em] uppercase text-center">
                The Forge
                </h1>
                <div className="text-center text-xs font-mono text-candleGlow mt-2 opacity-70">
                COGNITIVE ARCHITECTURE: GEMINI 3 PRO // SYSTEM 2
                </div>
            </div>
            <button 
                onClick={handleOpenArchives}
                className="flex items-center gap-2 px-4 py-2 border border-renaissanceGold text-renaissanceGold hover:bg-renaissanceGold hover:text-concrete transition-colors text-xs tracking-widest uppercase"
            >
                <Book size={14} /> Archives
            </button>
          </header>

          {/* Narrative Scroll Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
            {gameState.history.map((scene, idx) => (
              <div key={idx} className="opacity-60 hover:opacity-80 transition-opacity duration-500 border-l-2 border-concrete pl-4">
                <div className="text-xs text-candleGlow uppercase mb-1 tracking-widest">{scene.location}</div>
                <div className="font-body text-lg leading-relaxed">{scene.description}</div>
              </div>
            ))}

            {/* Current Scene */}
            {gameState.currentScene && !gameState.isLoading && (
              <div className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                   <span className="text-sm text-renaissanceGold tracking-[0.15em] border border-renaissanceGold px-3 py-1">
                     {gameState.currentScene.location.toUpperCase()}
                   </span>
                   <div className="flex items-center gap-4">
                        {speaking && <Volume2 className="text-candleGlow animate-pulse" size={16} />}
                        <span className="text-oxblood font-heading font-bold text-xl">
                            {gameState.currentScene.speaker}
                        </span>
                   </div>
                </div>
                
                <p className="text-xl md:text-2xl leading-loose font-body text-marble drop-shadow-md border-l-4 border-oxblood pl-6 py-2 bg-gradient-to-r from-forbiddenInk to-transparent">
                  {gameState.currentScene.description}
                </p>
              </div>
            )}

            {/* Loading State (System 2 Visualization) */}
            {gameState.isLoading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-80">
                <Brain className="w-12 h-12 text-candleGlow animate-pulse-slow" />
                <div className="text-xs font-mono text-candleGlow">
                  {gameState.isThinking ? "DIRECTOR AI THINKING..." : "GENERATING..."}
                </div>
                <div className="h-1 w-32 bg-gray-800 rounded-full overflow-hidden">
                   <div className="h-full bg-candleGlow animate-[width_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Choice Deck */}
          <div className="p-6 bg-concrete border-t border-renaissanceGold shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            {!gameState.isLoading && gameState.currentScene && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameState.currentScene.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoice(choice)}
                    className={`
                      relative p-4 text-left border transition-all duration-300 group overflow-hidden
                      ${choice.type === 'defiance' ? 'border-oxblood hover:bg-oxblood hover:text-white' : 
                        choice.type === 'submission' ? 'border-concrete hover:bg-gray-800' :
                        'border-renaissanceGold hover:bg-renaissanceGold hover:text-concrete'}
                    `}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-50"></div>
                    <div className="text-xs uppercase tracking-widest opacity-50 mb-1">{choice.type}</div>
                    <div className="font-heading font-bold text-lg group-hover:translate-x-2 transition-transform">
                      {choice.text}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Metadata & State */}
        <div className="hidden lg:flex w-96 flex-col bg-[#1a1f24]/90 border-l border-concrete h-full shadow-xl z-20 backdrop-blur-md">
          <div className="p-6 border-b border-concrete bg-oxblood bg-opacity-10">
            <h2 className="text-sm font-heading text-textBone tracking-[0.2em] flex items-center gap-2">
              <Activity size={16} /> COGNITIVE STATE
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             <div className="p-4">
                <LedgerDisplay ledger={gameState.ledger} />
             </div>
             <div className="p-4">
                <div className="text-xs font-mono text-gray-500 mb-2">RELATIONAL GRAPH (NETWORKX)</div>
                <GraphView graph={gameState.graph} />
             </div>
             
             <div className="p-4 mt-4">
                <div className="p-4 border border-dashed border-gray-600 rounded bg-black bg-opacity-30">
                  <div className="text-xs text-candleGlow mb-2 flex items-center gap-2">
                     <Zap size={12} /> DIRECTOR NOTES
                  </div>
                  <p className="text-xs font-mono text-gray-400 leading-relaxed">
                    Turn Count: {gameState.ledger.turnCount}<br/>
                    Entropy: Stable<br/>
                    Narrative Arc: Rising Action<br/>
                    Focus: Breaking the ego via "Testimony".
                  </p>
                  {sceneImage && (
                    <div className="mt-4 border border-gray-700 p-1 bg-black">
                        <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><ImageIcon size={10}/> IMAGEN 4.0 VISUAL</div>
                        <img src={sceneImage} className="w-full h-24 object-cover opacity-80" alt="Scene Preview" />
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Lore Overlay */}
      {showLore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-12" onClick={() => setShowLore(false)}>
              <div className="bg-marble text-concrete p-8 max-w-2xl w-full border-4 border-renaissanceGold shadow-2xl relative max-h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
                  {lore ? (
                      <>
                        <h2 className="font-heading text-3xl text-oxblood mb-6 border-b-2 border-oxblood pb-2">{lore.title}</h2>
                        <div className="font-body text-lg whitespace-pre-line leading-relaxed">
                            {lore.content}
                        </div>
                      </>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-64">
                          <Brain className="w-12 h-12 text-oxblood animate-pulse mb-4" />
                          <p className="font-mono text-sm">ACCESSING RESTRICTED ARCHIVES...</p>
                      </div>
                  )}
                  <button onClick={() => setShowLore(false)} className="absolute top-4 right-4 text-oxblood hover:text-black font-bold">X</button>
              </div>
          </div>
      )}

    </div>
  );
};

export default App;