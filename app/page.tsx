"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PHASE1, PHASE2, PHASE3, FaceArt, FaceCopy, familyPair, PROB_WINDOW, MIN_FINALISTS, PROB_BACKOFF, resolveAllFamilies, Tap, FamilyResult, Seed, MatchLog } from './quiz-data';
import Image from 'next/image';

// #region Helper Types and Functions
type Bracket = { mode: "solo" | "final" | "three" | "full"; solo?: Seed; final?: [Seed, Seed]; byeFinal?: Seed; semi?: [Seed, Seed]; seed1Final?: Seed; r1?: [Seed, Seed][]; };

const fhash = (s: string) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
};


const seedFromFamily = (fr: FamilyResult, taps: Tap[]): Omit<Seed, 'seed'> => {
    const pair = familyPair(fr.family);
    const pW = fr.probs[fr.winner] ?? 0.5;
    let votes = 1 + (pW >= 0.60 ? 1 : 0) + ((fr.confidence === "High" || fr.confidence === "User") ? 1 : 0);
    if (votes > 3) votes = 3;
    const margin = Math.abs((fr.probs as any)[pair.left] - (fr.probs as any)[pair.right]);
    const tb = fhash(taps.map(t => `${t.family[0]}:${t.mv}:${t.detail}`).join('|') + '|' + fr.winner);
    return { face: fr.winner, family: fr.family, votes, p: pW, margin, _tb: tb };
};

const makeSeedsHybrid = (familyResults: FamilyResult[], taps: Tap[]): Seed[] => {
    const seeded = familyResults.map(fr => seedFromFamily(fr, taps)).sort((a, b) =>
        (b.votes - a.votes) || (b.p - a.p) || (b.margin - a.margin) || ((a._tb % 997) - (b._tb % 997))
    );
    if (seeded.length === 0) return [];
    const topVotes = seeded[0].votes;
    const byVotes = seeded.filter(s => s.votes === topVotes);
    const refProb = Math.max(...byVotes.map(s => s.p));
    let pool = byVotes.filter(s => (refProb - s.p) <= PROB_WINDOW);
    if (pool.length < MIN_FINALISTS) {
        pool = byVotes.filter(s => (refProb - s.p) <= PROB_BACKOFF);
    }
    if (pool.length < MIN_FINALISTS) {
        const extras = seeded.filter(s => !pool.includes(s)).slice(0, MIN_FINALISTS - pool.length);
        pool = pool.concat(extras);
    }
    return pool.map((f, i) => ({ ...f, seed: i + 1 }));
};

const buildAdaptiveBracket = (seeds: Seed[]): Bracket => {
    const n = seeds.length;
    if (n === 0) return { mode: "solo", solo: undefined };
    if (n === 1) return { mode: "solo", solo: seeds[0] };
    if (n === 2) return { mode: "final", final: [seeds[0], seeds[1]] };
    if (n === 3) return { mode: "three", byeFinal: seeds[0], semi: [seeds[1], seeds[2]] };
    
    const pairs: [Seed, Seed][] = [];
    if (n >= 4) {
        const r1Seeds = seeds.slice(1); // Seed 1 gets a bye to the final
        const numPairs = Math.floor(r1Seeds.length / 2);
        for (let i = 0; i < numPairs; i++) {
            pairs.push([r1Seeds[i], r1Seeds[r1Seeds.length - 1 - i]]);
        }
        // If there's an odd number of players in R1, the middle one gets a bye to R2
        // This is handled in the tournament flow logic
    }
    return { mode: "full", seed1Final: seeds[0], r1: pairs };
};
// #endregion

export default function Home() {
    const router = useRouter();
    const [gameState, setGameState] = useState({
        phase: 'intro',
        p1Index: 0, p2Index: 0, p3Index: 0,
        taps: [] as Tap[],
    });
    const lockRef = useRef(false);
    const [isFading, setIsFading] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    // Enhanced keyboard flow
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat || lockRef.current || gameState.phase === 'intro' || gameState.phase === 'end') return;
            
            const { phase, p1Index, p2Index, p3Index } = gameState;
            let currentQuestion: any = null;
            let options: any[] = [];
            
            if (phase === 'p1') {
                currentQuestion = PHASE1[p1Index];
                options = currentQuestion?.choices || [];
            } else if (phase === 'p2') {
                currentQuestion = PHASE2[p2Index];
                if (!currentQuestion) {
                    options = [];
                } else {
                    const opts = [] as any[];
                    if (currentQuestion?.A) opts.push({ mv: 'A', ...currentQuestion.A });
                    if (currentQuestion?.S) opts.push({ mv: 'S', ...currentQuestion.S });
                    if (currentQuestion?.R) opts.push({ mv: 'R', ...currentQuestion.R });
                    options = opts.length === 3 ? [opts[0], opts[(p2Index % 2) + 1]] : opts;
                }
            } else if (phase === 'p3') {
                currentQuestion = PHASE3[p3Index];
                
                // Add safety check for currentQuestion
                if (!currentQuestion || !currentQuestion.family) {
                    options = [];
                } else {
                    // Compute the two options for P3
                    const counts = gameState.taps.reduce((acc, t) => {
                        if (t.family === currentQuestion.family && (t.phase === 'P1' || t.phase === 'P2')) { 
                            (acc as any)[t.mv] = ((acc as any)[t.mv]||0)+1; 
                        }
                        return acc;
                    }, { A:0, S:0, R:0 } as {A:number;S:number;R:number});
                const arr = ([{k:'A',v:counts.A},{k:'S',v:counts.S},{k:'R',v:counts.R}] as Array<{k:'A'|'S'|'R';v:number}>).sort((x,y)=>y.v-x.v);
                const top = arr[0].k, second = arr[1].k;
                
                // If only one movement type was chosen, no keyboard options
                if (second === undefined || arr[1].v === 0) {
                    options = [];
                } else {
                    const leftKey: 'A'|'S'|'R' = top;
                    const rightKey: 'A'|'S'|'R' = second;
                    const left = leftKey === 'A' ? currentQuestion.A : (currentQuestion as any)[leftKey];
                    const right = (currentQuestion as any)[rightKey];
                    
                    // Add safety checks to prevent undefined errors
                    if (left && right && left.detail && right.detail) {
                        options = [
                            { mv: leftKey, detail: left.detail, text: left.text },
                            { mv: rightKey, detail: right.detail, text: right.text }
                        ];
                    } else {
                        options = [];
                    }
                }
                }
            }
            
            // Handle digit keys 1-6
            const digit = parseInt(e.key);
            if (digit >= 1 && digit <= 6 && digit <= options.length) {
                e.preventDefault();
                const option = options[digit - 1];
                if (option && currentQuestion) {
                    setSelectedOption(option.detail);
                    handleOptionClick({ 
                        phase: phase.toUpperCase() as any, 
                        family: currentQuestion.family, 
                        mv: option.mv, 
                        detail: option.detail 
                    });
                }
            }
            
            // Handle Enter to confirm/advance
            if (e.key === 'Enter' && selectedOption) {
                e.preventDefault();
                // Auto-advance is already handled in handleOptionClick
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, selectedOption]);

    const handleOptionClick = (tapData: Omit<Tap, 'ts'>) => {
        if (lockRef.current) return;
        lockRef.current = true;
        setSelectedOption(tapData.detail);
        
        // Debounce for 250ms to prevent double taps
        setTimeout(() => { 
            lockRef.current = false; 
            setSelectedOption(null);
        }, 250);
        
        const newTaps = [...gameState.taps, { ...tapData, ts: Date.now() }];
        let { phase, p1Index, p2Index, p3Index } = gameState;

        // Optimistic advance
        if (phase === 'p1') { if (p1Index < PHASE1.length - 1) p1Index++; else phase = 'p2'; } 
        else if (phase === 'p2') { if (p2Index < PHASE2.length - 1) p2Index++; else phase = 'p3'; } 
        else if (phase === 'p3') { if (p3Index < PHASE3.length - 1) p3Index++; else phase = 'end'; }
        
        setIsFading(true);
        setTimeout(() => {
        setGameState({ taps: newTaps, phase, p1Index, p2Index, p3Index });
            setIsFading(false);
        }, 90);
    };
    
    const restart = () => setGameState({ phase: 'intro', p1Index: 0, p2Index: 0, p3Index: 0, taps: [] });

    const renderContent = () => {
        const { phase, p1Index, p2Index, p3Index, taps } = gameState;
        if (phase === 'intro') return <IntroScreen onStart={() => { if (lockRef.current) return; lockRef.current = true; setTimeout(()=>{ lockRef.current = false; }, 260); setIsFading(true); setTimeout(()=>{ setGameState(prev => ({...prev, phase: 'p1'})); setIsFading(false); }, 240); }} />;
        if (phase === 'p1') return <Phase1Screen question={PHASE1[p1Index]} onSelect={handleOptionClick} qNum={p1Index + 1} total={PHASE1.length} selectedOption={selectedOption} />;
        if (phase === 'p2') return <Phase2Screen index={p2Index} question={PHASE2[p2Index]} onSelect={handleOptionClick} qNum={p2Index + 1} total={PHASE2.length} />;
        if (phase === 'p3') return <Phase3Screen question={PHASE3[p3Index]} taps={taps} onSelect={handleOptionClick} qNum={p3Index + 1} total={PHASE3.length} />;
        if (phase === 'end') return <EndScreen taps={taps} onRestart={restart} router={router} />;
        return null;
    };
    
    const progress = useMemo(() => {
        const total = PHASE1.length + PHASE2.length + PHASE3.length; // total questions
        const done = gameState.p1Index + gameState.p2Index + gameState.p3Index;
        if (gameState.phase === 'end') return 100;
        if (gameState.phase === 'intro') return 0;
        return Math.round(100 * done / total);
    }, [gameState]);

    const isTournamentPhase = gameState.phase === 'end';

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-2 md:py-4 space-y-8 -mt-10">
            <div role="status" aria-live="polite" className="sr-only">
                {gameState.phase !== 'intro' && gameState.phase !== 'end' && 
                    `Question ${gameState.p1Index + gameState.p2Index + gameState.p3Index + 1}/7`}
            </div>
            
            {!isTournamentPhase && (
                <header className="flex items-center justify-center py-3">
                        <Image 
                            src="/THE-Axiarch.png" 
                        alt="Ground Zero" 
                            width={192} 
                            height={192} 
                            className="h-48 [filter:drop-shadow(0_0_10px_rgba(212,175,55,.35))]"
                    />
                </header>
            )}
            
            {!isTournamentPhase && (
                <div className="absolute bottom-4 left-0 right-0 px-4 md:px-6 z-10">
                    <div className="flex items-center gap-3">
                        <div aria-label="Progress" className="relative h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 transition-[width] duration-200 rounded-full" 
                                style={{ width: `${progress}%` }}
                            >
                                <span 
                                    aria-live="polite" 
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-black/80 font-medium tabular-nums"
                                >
                                    {progress}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div id="stage" className="min-h-[500px]">
                <div style={isFading ? { opacity: 0, transition: 'opacity 90ms ease-out' } : { opacity: 1, transition: 'opacity 120ms ease-out' }}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

// #region Components
const IntroScreen = ({ onStart }: { onStart: () => void }) => (
    <div className="space-y-6">
        <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                Ground Zero
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
                7 six-choice scenarios, 14 binaries, 7 quick checks. Every tap = 1. Movement triads shown. Archetype per family resolved with priors + capped nudges.
            </p>
        </div>
        <div className="flex justify-center">
            <button 
                className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-300 text-black font-semibold rounded-2xl
                         hover:from-yellow-300 hover:to-yellow-200 active:scale-[.98] transition-all duration-120 ease-out
                         focus:ring-2 focus:ring-yellow-400/60 focus:outline-none"
                onClick={onStart}
            >
                Begin
            </button>
        </div>
    </div>
);

const Phase1Screen = ({ question, onSelect, qNum, total, selectedOption }: { question: any, onSelect: (tap: Omit<Tap, 'ts'>) => void, qNum: number, total: number, selectedOption: string | null }) => {
    const onKey = (e: React.KeyboardEvent, mv: string, detail: string, family: string) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect({ phase: 'P1', family, mv, detail }); }
    };
    
    // Add safety check for question object
    if (!question || !question.choices || !Array.isArray(question.choices)) {
        return (
            <div className="text-center py-8">
                <p className="text-white/70">Loading question...</p>
            </div>
        );
    }
    
    return (
        <div>
            <fieldset className="space-y-6">
                <legend className="text-2xl md:text-[28px] font-semibold tracking-tight text-balance">
                    {question.stem}
                </legend>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {question.choices.map((ch: any, index: number) => (
                        <div key={index} className="h-full">
                            <label className="group relative cursor-pointer rounded-xl border border-white/8 bg-white/[0.03] p-4 question-card-backlight
                                               hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:border-yellow-400/30 
                                               active:scale-[.99] active:border-0 transition-all duration-150 will-change-transform
                                               focus-visible:ring-2 focus-visible:ring-yellow-300/60 h-full flex flex-col
                                               data-[selected=true]:border-yellow-400/40 data-[selected=true]:bg-yellow-400/5">
                                <input 
                                    type="radio" 
                                    name={`q${qNum}`} 
                                    value={ch.detail} 
                                    className="sr-only" 
                                    onKeyDown={(e) => onKey(e, ch.mv, ch.detail, question.family)}
                                    onClick={() => onSelect({ phase: 'P1', family: question.family, mv: ch.mv, detail: ch.detail })}
                                />
                                <div className="min-h-[60px] md:min-h-[70px] text-[15px] leading-relaxed text-[#E8E8E8] flex-1 relative z-10">{ch.text}</div>
                                <div className="absolute inset-0"></div>
                            </label>
                    </div>
                ))}
            </div>
                
                <div className="flex justify-end">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 text-white/70 border border-white/10">
                        Question {qNum}/{total}
                    </span>
                </div>
            </fieldset>
        </div>
    );
};

const Phase2Screen = ({ index, question, onSelect, qNum, total }: { index: number, question: any, onSelect: (tap: Omit<Tap, 'ts'>) => void, qNum: number, total: number }) => {
    // Add safety check for question object
    if (!question || !question.family) {
        return (
            <div className="text-center py-8">
                <p className="text-white/70">Loading question...</p>
            </div>
        );
    }
    
    const opts = [] as any[]; if (question.A) opts.push({ mv: 'A', ...question.A }); if (question.S) opts.push({ mv: 'S', ...question.S }); if (question.R) opts.push({ mv: 'R', ...question.R });
    const shown = opts.length === 3 ? [opts[0], opts[(index % 2) + 1]] : opts;
    const onKey = (e: React.KeyboardEvent, mv: string, detail: string, family: string) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect({ phase: 'P2', family, mv, detail }); } };
    
    return (
        <div>
            <fieldset className="space-y-6">
                <legend className="text-2xl md:text-[28px] font-semibold tracking-tight text-balance">
                    {question.stem}
                </legend>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {shown.map((o: any, idx: number) => (
                        <div key={idx} className="h-full">
                            <label className="group relative cursor-pointer rounded-xl border border-white/8 bg-white/[0.03] p-4 question-card-backlight
                                               hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:border-yellow-400/30 
                                               active:scale-[.99] active:border-0 transition-all duration-150 will-change-transform
                                               focus-visible:ring-2 focus-visible:ring-yellow-300/60 h-full flex flex-col
                                               data-[selected=true]:border-yellow-400/40 data-[selected=true]:bg-yellow-400/5">
                                <input 
                                    type="radio" 
                                    name={`q${qNum}`} 
                                    value={o.detail} 
                                    className="sr-only" 
                                    onKeyDown={(e) => onKey(e, o.mv, o.detail, question.family)}
                                    onClick={() => onSelect({ phase: 'P2', family: question.family, mv: o.mv, detail: o.detail })}
                                />
                                <div className="min-h-[60px] md:min-h-[70px] text-[15px] leading-relaxed text-[#E8E8E8] flex-1 relative z-10">{o.text}</div>
                                <div className="absolute inset-0"></div>
                            </label>
                    </div>
                ))}
            </div>
                
                <div className="flex justify-end">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 text-white/70 border border-white/10">
                        Item {qNum}/{total}
                    </span>
                </div>
            </fieldset>
        </div>
    );
};

const Phase3Screen = ({ question, onSelect, qNum, total, taps }: { question: any, onSelect: (tap: Omit<Tap, 'ts'>) => void, qNum: number, total: number, taps: Tap[] }) => {
    console.log('🔍 Phase3Screen render - question:', question, 'qNum:', qNum, 'taps:', taps);
    const onKey = (e: React.KeyboardEvent, mv: string, detail: string, family: string) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect({ phase: 'P3', family, mv, detail }); } };
    
    // compute counts from P1/P2 for this family (only if question exists)
    const counts = question && question.family ? taps.reduce((acc, t) => {
        if (t.family === question.family && (t.phase === 'P1' || t.phase === 'P2')) { (acc as any)[t.mv] = ((acc as any)[t.mv]||0)+1; }
        return acc;
    }, { A:0, S:0, R:0 } as {A:number;S:number;R:number}) : { A:0, S:0, R:0 };
    
    console.log('📈 Phase3Screen counts for family', question?.family, ':', counts);
    
    const arr = ([{k:'A',v:counts.A},{k:'S',v:counts.S},{k:'R',v:counts.R}] as Array<{k:'A'|'S'|'R';v:number}>).sort((x,y)=>y.v-x.v);
    const top = arr[0].k, second = arr[1].k;
    
    console.log('🎯 Phase3Screen computed - top:', top, 'second:', second, 'arr:', arr);
    
    // If only one movement type was chosen, auto-advance using useEffect
    useEffect(() => {
        if (question && question.family && (second === undefined || (arr[1] && arr[1].v === 0))) {
            console.log('⚡ Phase3Screen - Auto-advancing, second:', second, 'arr[1]:', arr[1]);
            const onlyChoice = top;
            const onlyOption = onlyChoice === 'A' ? question.A : (question as any)[onlyChoice];
            if (onlyOption) {
                // Auto-advance after component mounts
                onSelect({ phase: 'P3', family: question.family, mv: onlyChoice, detail: onlyOption.detail });
            }
        }
    }, [question, top, second, arr, onSelect]);
    
    // Add safety check for question object
    if (!question || !question.family) {
        console.log('❌ Phase3Screen - No question or family:', question);
        return (
            <div className="text-center py-8">
                <p className="text-white/70">Loading question...</p>
            </div>
        );
    }
    
    // If only one movement type was chosen, show processing message
    if (second === undefined || (arr[1] && arr[1].v === 0)) {
        console.log('⚡ Phase3Screen - Auto-advancing, second:', second, 'arr[1]:', arr[1]);
        return (
            <div className="text-center py-8">
                <p className="text-white/70">Processing {question.family}...</p>
            </div>
        );
    }
    
    // Only use movement types that actually exist in the question
    const availableMovements = Object.keys(question).filter(key => key !== 'family' && key !== 'stem') as ('A'|'S'|'R')[];
    console.log('🎯 Available movements in question:', availableMovements);
    
    // Filter the sorted array to only include movements that exist in the question
    const availableArr = arr.filter(item => availableMovements.includes(item.k));
    const leftKey: 'A'|'S'|'R' = availableArr[0]?.k || availableMovements[0];
    const rightKey: 'A'|'S'|'R' = availableArr[1]?.k || availableMovements[1];
    
    const left = leftKey === 'A' ? question.A : (question as any)[leftKey];
    const right = (question as any)[rightKey];
    
    console.log('🔧 Phase3Screen - leftKey:', leftKey, 'rightKey:', rightKey, 'left:', left, 'right:', right);
    
    // Add safety checks to prevent undefined errors
    if (!left || !right) {
        console.log('❌ Phase3Screen - Missing left or right option:', { left, right, leftKey, rightKey, question });
        return (
            <div className="text-center py-8">
                <p className="text-white/70">Loading question...</p>
            </div>
        );
    }
    
    return (
        <div>
            <fieldset className="space-y-6">
                <legend className="text-2xl md:text-[28px] font-semibold tracking-tight text-balance">
                    {question.stem}
                </legend>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    <div className="h-full">
                        <label className="group relative cursor-pointer rounded-xl border border-white/8 bg-white/[0.03] p-4 question-card-backlight
                                           hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:border-yellow-400/30 
                                           active:scale-[.99] active:border-0 transition-all duration-150 will-change-transform
                                           focus-visible:ring-2 focus-visible:ring-yellow-300/60 h-full flex flex-col
                                           data-[selected=true]:border-yellow-400/40 data-[selected=true]:bg-yellow-400/5">
                            <input 
                                type="radio" 
                                name={`q${qNum}`} 
                                value={left.detail} 
                                className="sr-only" 
                                onKeyDown={(e) => onKey(e, leftKey, left.detail, question.family)}
                                onClick={() => onSelect({ phase: 'P3', family: question.family, mv: leftKey, detail: left.detail })}
                            />
                            <div className="min-h-[60px] md:min-h-[70px] text-[15px] leading-relaxed text-[#E8E8E8] flex-1 relative z-10">{left.text}</div>
                            <div className="absolute inset-0"></div>
                        </label>
                    </div>
                    
                    <div className="h-full">
                        <label className="group relative cursor-pointer rounded-xl border border-white/8 bg-white/[0.03] p-4 question-card-backlight
                                           hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:border-yellow-400/30 
                                           active:scale-[.99] active:border-0 transition-all duration-150 will-change-transform
                                           focus-visible:ring-2 focus-visible:ring-yellow-300/60 h-full flex flex-col
                                           data-[selected=true]:border-yellow-400/40 data-[selected=true]:bg-yellow-400/5">
                            <input 
                                type="radio" 
                                name={`q${qNum}`} 
                                value={right.detail} 
                                className="sr-only" 
                                onKeyDown={(e) => onKey(e, rightKey, right.detail, question.family)}
                                onClick={() => onSelect({ phase: 'P3', family: question.family, mv: rightKey, detail: right.detail })}
                            />
                            <div className="min-h-[60px] md:min-h-[70px] text-[15px] leading-relaxed text-[#E8E8E8] flex-1 relative z-10">{right.text}</div>
                            <div className="absolute inset-0"></div>
                        </label>
                    </div>
                </div>
                
                <div className="flex justify-end">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 text-white/70 border border-white/10">
                        Check {qNum}/{total}
                    </span>
                </div>
            </fieldset>
        </div>
    );
};

const EndScreen = ({ taps, onRestart, router }: { taps: Tap[], onRestart: () => void, router: any }) => {
    const [state, setState] = useState<
        | { finalWinner: Seed | null, duels?: MatchLog[] }
        | {
            familyResults: FamilyResult[];
        bracket: Bracket;
        log: MatchLog[];
            stage:
                | { mode: 'final', match: [Seed, Seed] }
                | { mode: 'three-semi', match: [Seed, Seed] }
                | { mode: 'three-final', match: [Seed, Seed] }
                | { mode: 'full-r1', index: number }
                | { mode: 'full-r2-elim', match: [Seed, Seed], seed1: Seed, bye: Seed }
                | { mode: 'full-r2-qual', match: [Seed, Seed], seed1: Seed }
                | { mode: 'full-final', match: [Seed, Seed] };
            r1Winners: Seed[];
            seed1?: Seed;
            bye?: Seed;
        }
    >({ finalWinner: null });

    useEffect(() => {
        const familyResults = resolveAllFamilies(taps);
        const seeds = makeSeedsHybrid(familyResults, taps);
        const bracket = buildAdaptiveBracket(seeds);
        if (bracket.mode === 'solo' || seeds.length <= 1) {
            setState({ finalWinner: bracket.solo || null, duels: [] });
            return;
        }
        if (bracket.mode === 'final') {
            setState({ familyResults, bracket, log: [], stage: { mode: 'final', match: bracket.final! }, r1Winners: [] });
            return;
        }
        if (bracket.mode === 'three') {
            setState({ familyResults, bracket, log: [], stage: { mode: 'three-semi', match: bracket.semi! }, r1Winners: [] });
            return;
        }
        // full
        setState({ familyResults, bracket, log: [], stage: { mode: 'full-r1', index: 0 }, r1Winners: [], seed1: bracket.seed1Final });
    }, [taps]);

    // Handle redirect when final winner is determined
    useEffect(() => {
        if ('finalWinner' in state && state.finalWinner) {
            // Store the results in session storage
            const resultsData = {
                taps,
                finalWinner: state.finalWinner,
                duels: (state as any).duels || []
            };
            sessionStorage.setItem('quizResult', JSON.stringify(resultsData));
            
            // Redirect to the appropriate results page
            const winnerFace = state.finalWinner.face;
            if (winnerFace) {
                window.location.href = `/results/${winnerFace}`;
            } else {
                // Fallback - redirect to home if no winner
                router.replace('/');
            }
        }
    }, [state, taps, router]);

    const pick = (winner: Seed, other: Seed, roundLabel: string) => {
        setState(prev => {
            if ('finalWinner' in prev) return prev;
            const base = prev as Exclude<typeof prev, { finalWinner: Seed | null }>;
            const newLog = [...base.log, { round: roundLabel, left: { face: winner.face, seed: winner.seed }, right: { face: other.face, seed: other.seed }, chosen: winner.face }];
            const b = base.bracket;
            // advance by mode
            if (base.stage.mode === 'final') {
                return { finalWinner: winner, duels: newLog };
            }
            if (base.stage.mode === 'three-semi') {
                const byeFinal = b.byeFinal!;
                return { ...base, log: newLog, stage: { mode: 'three-final', match: [byeFinal, winner] } };
            }
            if (base.stage.mode === 'three-final') {
                return { finalWinner: winner, duels: newLog };
            }
            if (base.stage.mode === 'full-r1') {
                const idx = base.stage.index;
                const pair = b.r1![idx];
                const winners = [...base.r1Winners, winner];
                if (idx + 1 < b.r1!.length) {
                    return { ...base, log: newLog, r1Winners: winners, stage: { mode: 'full-r1', index: idx + 1 } };
                }
                // R1 done → compute bye and rest
                const sorted = winners.slice().sort((a, c) => a.seed - c.seed);
                const bye = sorted[0];
                const rest = sorted.slice(1);
                if (rest.length === 0) {
                    return { ...base, log: newLog, r1Winners: winners, bye, stage: { mode: 'full-final', match: [base.seed1!, bye] } };
                }
                if (rest.length === 1) {
                    // Two winners total (bye + 1), so they play each other in R2
                    return { ...base, log: newLog, r1Winners: winners, bye, stage: { mode: 'full-r2-qual', match: [bye, rest[0]], seed1: base.seed1! } };
                }
                // Three or more winners, so we need R2 eliminator first
                return { ...base, log: newLog, r1Winners: winners, bye, stage: { mode: 'full-r2-elim', match: [rest[0], rest[1]], seed1: base.seed1!, bye } };
            }
            if (base.stage.mode === 'full-r2-elim') {
                return { ...base, log: newLog, stage: { mode: 'full-r2-qual', match: [base.bye!, winner], seed1: base.stage.seed1 } };
            }
            if (base.stage.mode === 'full-r2-qual') {
                return { ...base, log: newLog, stage: { mode: 'full-final', match: [base.stage.seed1, winner] } };
            }
            if (base.stage.mode === 'full-final') {
                return { finalWinner: winner, duels: newLog };
            }
            return prev;
        });
    };

    if ('finalWinner' in state) {
        return null; // Prevent rendering while redirecting
    }

    // render current match per mode
    if (!(state as any).stage) {
        return (
            <div className="text-center py-8">
                <p className="text-white/70">Building bracket...</p>
            </div>
        );
    }
    const mode = (state as any).stage.mode;
    if (mode === 'final') {
        const [a, b] = (state as any).stage.match;
        return <DuelScreen title={'Final — Close Candidates'} a={a} b={b} onPick={(w)=>pick(w, w.face===a.face?b:a, 'Final')} />;
    }
    if (mode === 'three-semi') {
        const [a, b] = (state as any).stage.match;
        return <DuelScreen title={'Semifinal'} a={a} b={b} onPick={(w)=>pick(w, w.face===a.face?b:a, 'Semifinal')} />;
    }
    if (mode === 'three-final') {
        const [a, b] = (state as any).stage.match;
        return <DuelScreen title={'Final — vs Top Seed'} a={a} b={b} onPick={(w)=>pick(w, w.face===a.face?b:a, 'Final')} />;
    }
    if (mode === 'full-r1') {
        const idx = ((state as any).stage as any).index as number;
        const pair = (state as any).bracket.r1![idx];
        return <DuelScreen title={`Round 1 — Match ${idx+1}`} a={pair[0]} b={pair[1]} onPick={(w)=>pick(w, w.face===pair[0].face?pair[1]:pair[0], `R1-M${idx+1}`)} />;
    }
    if (mode === 'full-r2-elim') {
        const [a,b] = (state as any).stage.match;
        return <DuelScreen title={'Round 2 — Eliminator'} a={a} b={b} onPick={(w)=>pick(w, w.face===a.face?b:a, 'R2-Eliminator')} />;
    }
    if (mode === 'full-r2-qual') {
        const [a,b] = (state as any).stage.match;
        return <DuelScreen title={'Round 2 — Qualifier'} a={a} b={b} onPick={(w)=>pick(w, w.face===a.face?b:a, 'R2-Qualifier')} />;
    }
    if (mode === 'full-final') {
        const [a,b] = (state as any).stage.match;
        return <DuelScreen title={'Final — Crown Match'} a={a} b={b} onPick={(w)=>pick(w, w.face===a.face?b:a, 'Final')} />;
    }
    return <div />;
};

const DuelScreen = ({ title, a, b, onPick }: { title: string, a: Seed, b: Seed, onPick: (winner: Seed) => void }) => {
    const [selectedWinner, setSelectedWinner] = useState<Seed | null>(null);
    
    const handlePick = (winner: Seed) => {
        setSelectedWinner(winner);
    };
    
    const handleNext = () => {
        if (selectedWinner) {
            onPick(selectedWinner);
        }
    };
    
    return (
        <div className="fade-in">
            <h2 className="text-2xl md:text-[28px] font-semibold tracking-tight text-balance text-center mb-6">{title}</h2>
            <div className="flex items-center justify-center gap-2 md:gap-4">
                <div className="flex-1 max-w-[400px]">
                    <DuelCard 
                        key={`left-${a.face}-${a.seed}`} 
                        seed={a} 
                        onPick={() => handlePick(a)}
                        isSelected={selectedWinner?.face === a.face}
                    />
                </div>
                <div className="flex-shrink-0 relative">
                    {/* Flare animation behind VS */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-800/20 via-red-700/30 to-red-800/20 animate-pulse blur-sm scale-110" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-800/10 via-red-700/20 to-red-800/10 animate-ping blur-md scale-125" />
                    
                    {/* Circular VS element */}
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-red-800 via-red-700 to-red-900 flex items-center justify-center shadow-[0_0_20px_rgba(127,29,29,0.5)] border-2 border-red-700/50">
                        <span className="text-lg md:text-xl font-bold text-white tracking-wider">VS</span>
                    </div>
                </div>
                <div className="flex-1 max-w-[400px]">
                    <DuelCard 
                        key={`right-${b.face}-${b.seed}`} 
                        seed={b} 
                        onPick={() => handlePick(b)}
                        isSelected={selectedWinner?.face === b.face}
                    />
                </div>
            </div>
            <p className="text-sm text-center text-white/60 mt-6">Choose who advances.</p>
            <div className="sticky bottom-0 pb-[env(safe-area-inset-bottom)] mt-6">
                <div className="flex justify-center">
                    <button 
                        className={`px-8 py-4 text-black font-semibold rounded-2xl relative overflow-hidden
                                 hover:scale-105 active:scale-[.98] transition-all duration-300 group
                                 focus:ring-2 focus:ring-yellow-400/60 focus:outline-none
                                 ${!selectedWinner ? 'opacity-60 pointer-events-none' : ''}`}
                        style={{
                            background: selectedWinner ? 
                                'linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #7F1D1D 100%)' :
                                'linear-gradient(135deg, #F4D03F 0%, #F7DC6F 50%, #F4D03F 100%)',
                            boxShadow: selectedWinner ? 
                                '0 0 20px rgba(127, 29, 29, 0.4)' :
                                '0 0 20px rgba(244, 208, 63, 0.4)'
                        }}
                        onClick={handleNext}
                        disabled={!selectedWinner}
                    >
                        {/* Gradient sweep animation on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <span className="relative z-10">Next</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const DuelCard = ({ seed, onPick, isSelected }: { seed: Seed, onPick: () => void, isSelected?: boolean }) => {
    // Define spotlight colors for each face type
    const getSpotlightColor = (face: string) => {
        switch (face) {
            case 'Sovereign': return 'rgba(250, 204, 21, 0.15)'; // Gold
            case 'Rebel': return 'rgba(239, 68, 68, 0.15)'; // Red
            case 'Artisan': return 'rgba(250, 204, 21, 0.15)'; // Gold
            case 'Spotlight': return 'rgba(250, 204, 21, 0.15)'; // Gold
            default: return 'rgba(6, 182, 212, 0.15)'; // Teal for others
        }
    };


    return (
        <button
            onClick={onPick}
            className={`group relative w-full text-left rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8
                       hover:bg-white/[0.05] transition will-change-transform
                       ${isSelected ? 'shadow-[0_12px_40px_rgba(0,0,0,.45)]' : ''}`}
            onKeyDown={(e)=>{ if (e.key==='Enter'||e.key===' ') { e.preventDefault(); onPick(); } }}
        >
            
            {/* Glow behind the image - always visible */}
            <div 
                className="absolute inset-0 rounded-[22px] opacity-100"
                style={{
                    background: `radial-gradient(circle at center, ${getSpotlightColor(seed.face)} 0%, transparent 70%)`
                }}
            />
            
            <div 
                className="relative rounded-[22px] bg-black/15 p-6 md:p-8 aspect-[3/4] flex items-center justify-center"
                style={{
                    border: `1px solid ${isSelected ? 
                        'rgba(127, 29, 29, 0.6)' : 
                        (seed.face === 'Sovereign' || seed.face === 'Artisan' || seed.face === 'Spotlight' ? 
                            'rgba(250, 204, 21, 0.3)' : 'rgba(6, 182, 212, 0.3)')}`
                }}
            >
                
                <Image 
                    src={FaceArt[seed.face]} 
                    alt={`${seed.face} emblem`} 
                    width={420} 
                    height={560} 
                    className="max-h-[420px] object-contain mx-auto relative z-10" 
                    unoptimized 
                />
            </div>
            <div className="mt-6">
                {/* Callout word above archetype name */}
                <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
                    {seed.face === 'Sovereign' ? 'Authority' : 
                     seed.face === 'Spotlight' ? 'Recognition' :
                     seed.face === 'Rebel' ? 'Defiance' :
                     seed.face === 'Artisan' ? 'Craft' :
                     seed.face === 'Guardian' ? 'Protection' :
                     seed.face === 'Navigator' ? 'Guidance' :
                     seed.face === 'Visionary' ? 'Insight' :
                     seed.face === 'Equalizer' ? 'Balance' :
                     seed.face === 'Seeker' ? 'Discovery' :
                     seed.face === 'Architect' ? 'Structure' :
                     seed.face === 'Diplomat' ? 'Harmony' :
                     seed.face === 'Partner' ? 'Loyalty' :
                     seed.face === 'Provider' ? 'Support' :
                     seed.face === 'Catalyst' ? 'Transformation' : 'Essence'}
                </div>
                
                {/* Archetype name with accent underline */}
                <h3 className="font-bold text-white text-xl md:text-2xl mb-3 relative">
                    #{seed.seed} {seed.face}
                    <div 
                        className="absolute -bottom-1 left-0 h-0.5 w-full"
                        style={{
                            background: `linear-gradient(90deg, ${isSelected ? 'rgba(127, 29, 29, 0.8)' : getSpotlightColor(seed.face).replace('0.15', '0.8')} 0%, transparent 100%)`
                        }}
                    />
                </h3>
                
                {/* Description with improved typography */}
                <p className="text-white/70 leading-relaxed line-clamp-3 italic text-sm md:text-base">
                    {FaceCopy[seed.face]}
                </p>
            </div>
            {isSelected && <div className="after:absolute after:inset-0 after:rounded-[28px] after:border after:border-yellow-300/15" />}
        </button>
    );
};


// #endregion