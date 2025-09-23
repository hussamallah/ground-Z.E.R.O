"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { PHASE1, PHASE2, PHASE3, FAMILIES, ARCHETYPES, FaceArt, FaceCopy, RESULTS_LIB, TIE_ORDER, priorLR, LEAN, familyPair, PROB_WINDOW, MIN_FINALISTS, PROB_BACKOFF } from './quiz-data';
import Image from 'next/image';

// #region Helper Types and Functions
type Tap = { phase: string; family: string; mv: string; detail: string; ts: number; };
type FamilyResult = { family: string; winner: string; probs: { [key: string]: number; }; share: { A: number; S: number; R: number; }; lrScore: number; avgDetailNudge: number; confidence: string; taps: Tap[]; };
type Seed = { face: string; family: string; votes: number; p: number; margin: number; _tb: number; seed: number; };
type Bracket = { mode: "solo" | "final" | "three" | "full"; solo?: Seed; final?: [Seed, Seed]; byeFinal?: Seed; semi?: [Seed, Seed]; seed1Final?: Seed; r1?: [Seed, Seed][]; };
type MatchLog = { round: string; left: { face: string; seed: number; }; right: { face: string; seed: number; }; chosen: string; };

const fhash = (s: string) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
};

const familyScoresPure = (fam: string, allTaps: Tap[]) => {
    const A = allTaps.reduce((n, t) => n + (t.family === fam && t.mv === 'A' ? 1 : 0), 0);
    const S = allTaps.reduce((n, t) => n + (t.family === fam && t.mv === 'S' ? 1 : 0), 0);
    const R = allTaps.reduce((n, t) => n + (t.family === fam && t.mv === 'R' ? 1 : 0), 0);
    return { A, S, R, T: A + S + R || 1 };
};

const detailNudge = (family: string, detail: string) => {
    const lean = (LEAN as any)[family]?.[detail];
    if (!lean) return 0;
    const pair = familyPair(family);
    return lean === pair.left ? +0.05 : -0.05;
};

const band = (prob: number, margin: number, tapCount: number) => {
    if (prob >= 0.64 && margin >= 0.20 && tapCount >= 4) return "High";
    if (prob >= 0.55 && margin >= 0.12 && tapCount >= 3) return "Medium";
    return "Low";
};

const resolveFamilyArchetype = (family: string, allTaps: Tap[]): FamilyResult => {
    const familyTaps = allTaps.filter(t => t.family === family);
    const counts = familyScoresPure(family, allTaps);
    const total = counts.T;
    const share = { A: counts.A / total, S: counts.S / total, R: counts.R / total };
    let raw = 0;
    for (const mv of ["A", "S", "R"]) {
        raw += share[mv as keyof typeof share] * ((priorLR as any)[family]?.[mv] || 0);
    }
    const nudgeSum = familyTaps.reduce((sum, t) => sum + detailNudge(family, t.detail), 0);
    const avgDetailNudge = familyTaps.length ? (nudgeSum / familyTaps.length) : 0;
    let lrScore = Math.max(-0.24, Math.min(+0.24, raw + avgDetailNudge));
    const left = Math.exp(+lrScore);
    const right = Math.exp(-lrScore);
    const pL = left / (left + right);
    const pR = right / (left + right);
    const pair = familyPair(family);
    const winner = pL >= pR ? pair.left : pair.right;
    const confidence = band(Math.max(pL, pR), Math.abs(pL - pR), familyTaps.length);
    return { family, winner, probs: { [pair.left]: pL, [pair.right]: pR }, share, lrScore, avgDetailNudge, confidence, taps: familyTaps };
};

const resolveAllFamilies = (allTaps: Tap[]): FamilyResult[] => FAMILIES.map(fam => resolveFamilyArchetype(fam, allTaps));

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
        for (let i = 0; i < Math.floor(r1Seeds.length / 2); i++) {
            pairs.push([r1Seeds[i], r1Seeds[r1Seeds.length - 1 - i]]);
        }
        // If there's an odd number of players in R1, the middle one gets a bye to R2
    }
    return { mode: "full", seed1Final: seeds[0], r1: pairs };
};
// #endregion

export default function Home() {
    const [gameState, setGameState] = useState({
        phase: 'intro',
        p1Index: 0, p2Index: 0, p3Index: 0,
        taps: [] as Tap[],
    });
    const lockRef = useRef(false);
    const [isFading, setIsFading] = useState(false);

    const handleOptionClick = (tapData: Omit<Tap, 'ts'>) => {
        if (lockRef.current) return;
        lockRef.current = true;
        setTimeout(()=>{ lockRef.current = false; }, 260);
        const newTaps = [...gameState.taps, { ...tapData, ts: Date.now() }];
        let { phase, p1Index, p2Index, p3Index } = gameState;

        if (phase === 'p1') { if (p1Index < PHASE1.length - 1) p1Index++; else phase = 'p2'; } 
        else if (phase === 'p2') { if (p2Index < PHASE2.length - 1) p2Index++; else phase = 'p3'; } 
        else if (phase === 'p3') { if (p3Index < PHASE3.length - 1) p3Index++; else phase = 'end'; }
        
        setIsFading(true);
        setTimeout(() => {
        setGameState({ taps: newTaps, phase, p1Index, p2Index, p3Index });
            setIsFading(false);
        }, 240);
    };
    
    const restart = () => setGameState({ phase: 'intro', p1Index: 0, p2Index: 0, p3Index: 0, taps: [] });

    const renderContent = () => {
        const { phase, p1Index, p2Index, p3Index, taps } = gameState;
        if (phase === 'intro') return <IntroScreen onStart={() => { if (lockRef.current) return; lockRef.current = true; setTimeout(()=>{ lockRef.current = false; }, 260); setIsFading(true); setTimeout(()=>{ setGameState(prev => ({...prev, phase: 'p1'})); setIsFading(false); }, 240); }} />;
        if (phase === 'p1') return <Phase1Screen question={PHASE1[p1Index]} onSelect={handleOptionClick} qNum={p1Index + 1} total={PHASE1.length} />;
        if (phase === 'p2') return <Phase2Screen index={p2Index} question={PHASE2[p2Index]} onSelect={handleOptionClick} qNum={p2Index + 1} total={PHASE2.length} />;
        if (phase === 'p3') return <Phase3Screen question={PHASE3[p3Index]} taps={taps} onSelect={handleOptionClick} qNum={p3Index + 1} total={PHASE3.length} />;
        if (phase === 'end') return <EndScreen taps={taps} onRestart={restart} />;
        return null;
    };
    
    const progress = useMemo(() => {
        const total = PHASE1.length + PHASE2.length + PHASE3.length; // total questions
        const done = gameState.p1Index + gameState.p2Index + gameState.p3Index;
        if (gameState.phase === 'end') return 100;
        if (gameState.phase === 'intro') return 0;
        return Math.round(100 * done / total);
    }, [gameState]);

    return (
        <div className="wrap">
            <div className="card">
                <div style={{ position: 'relative', marginBottom: '20px', marginTop: '-20px' }}>
                    <div style={{
                        position: 'absolute',
                        left: '100px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '4rem',
                        fontWeight: 'bold',
                        color: '#d4af37',
                        textShadow: '0 0 30px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.3)',
                        letterSpacing: '0.1em',
                        filter: 'drop-shadow(0 4px 8px rgba(212, 175, 55, 0.3))'
                    }}>GROUND</div>
                    <div style={{
                        position: 'absolute',
                        right: '150px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '4rem',
                        fontWeight: 'bold',
                        color: '#d4af37',
                        textShadow: '0 0 30px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.3)',
                        letterSpacing: '0.1em',
                        filter: 'drop-shadow(0 4px 8px rgba(212, 175, 55, 0.3))'
                    }}>Z.E.R.O</div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Image 
                            src="/THE-Axiarch.png" 
                            alt="Axiarch" 
                            width={180} 
                            height={180} 
                            style={{ 
                                maxWidth: '180px', 
                                height: 'auto',
                                filter: 'drop-shadow(0 8px 16px rgba(212, 175, 55, 0.4))'
                            }}
                        />
                    </div>
                </div>
                <div className="hr"></div>
                <div className="progress"><div className="bar" style={{ width: `${progress}%` }}></div></div>
                <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#aeb7c7' }}>{progress}%</div>
                <div id="stage"><div style={isFading ? { opacity: 0, transform: 'translateY(-10px)', transition: 'all 0.24s ease-out' } : undefined}>{renderContent()}</div></div>
            </div>
        </div>
    );
}

// #region Components
const IntroScreen = ({ onStart }: { onStart: () => void }) => ( <div className='fade-in'> <div className="section-title">Start</div> <div className="stack"> <div className="muted">7 six-choice scenarios, 14 binaries, 7 quick checks. Every tap = 1. Movement triads shown. Archetype per family resolved with priors + capped nudges.</div> <div><button className="btn primary pulse" onClick={onStart}>Begin</button></div> </div> </div> );

const Phase1Screen = ({ question, onSelect, qNum, total }: { question: any, onSelect: (tap: Omit<Tap, 'ts'>) => void, qNum: number, total: number }) => {
    const onKey = (e: React.KeyboardEvent, mv: string, detail: string, family: string) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect({ phase: 'P1', family, mv, detail }); }
    };
    return (
        <div className='fade-in' style={{ marginTop: '-10px' }}>
            <div className="section-title" style={{ marginBottom: '8px', fontSize: '18px' }}>Phase 1 • {question.family}</div>
            <h2 className="title" style={{ fontSize: '20px', textAlign: 'center', marginBottom: '20px', color: '#e6f3ff' }}>{question.stem}</h2>
            <div className={`grid cols2`} style={{ gap: '10px' }}>
                {question.choices.map((ch: any, index: number) => (
                    <div key={index} className='option slide-in-left' style={{ animationDelay: `${index * 0.08}s`, minHeight: '70px', padding: '12px 16px' }} tabIndex={0} onKeyDown={(e)=>onKey(e, ch.mv, ch.detail, question.family)} onClick={()=> onSelect({ phase: 'P1', family: question.family, mv: ch.mv, detail: ch.detail })}>
                        <div style={{ fontSize: '18px', lineHeight: '1.4' }}>{ch.text}</div>
                    </div>
                ))}
            </div>
            <div className="footer" style={{ marginTop: '8px' }}><span className="kbd">Question {qNum}/7</span></div>
        </div>
    );
};

const Phase2Screen = ({ index, question, onSelect, qNum, total }: { index: number, question: any, onSelect: (tap: Omit<Tap, 'ts'>) => void, qNum: number, total: number }) => {
    const opts = [] as any[]; if (question.A) opts.push({ mv: 'A', ...question.A }); if (question.S) opts.push({ mv: 'S', ...question.S }); if (question.R) opts.push({ mv: 'R', ...question.R });
    const shown = opts.length === 3 ? [opts[0], opts[(index % 2) + 1]] : opts;
    const onKey = (e: React.KeyboardEvent, mv: string, detail: string, family: string) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect({ phase: 'P2', family, mv, detail }); } };
    return (
        <div className='fade-in'>
            <div className="section-title">Phase 2 • Options</div>
            <h2 className="title" style={{ fontSize: '22px', textAlign: 'center', marginBottom: '20px', color: '#e6f3ff' }}>{question.stem}</h2>
            <div className={`grid cols2`}>
                {shown.map((o: any, idx: number) => (
                    <div key={idx} className='option slide-in-right' style={{ animationDelay: `${idx * 0.08}s` }} tabIndex={0} onKeyDown={(e)=>onKey(e, o.mv, o.detail, question.family)} onClick={()=> onSelect({ phase: 'P2', family: question.family, mv: o.mv, detail: o.detail })}>
                        <div style={{ fontSize: '18px', lineHeight: '1.4' }}>{o.text}</div>
                    </div>
                ))}
            </div>
            <div className="footer"><span className="kbd">Item {qNum}/14</span></div>
        </div>
    );
};

const Phase3Screen = ({ question, onSelect, qNum, total, taps }: { question: any, onSelect: (tap: Omit<Tap, 'ts'>) => void, qNum: number, total: number, taps: Tap[] }) => {
    const onKey = (e: React.KeyboardEvent, mv: string, detail: string, family: string) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect({ phase: 'P3', family, mv, detail }); } };
    // compute counts from P1/P2 for this family
    const counts = taps.reduce((acc, t) => {
        if (t.family === question.family && (t.phase === 'P1' || t.phase === 'P2')) { (acc as any)[t.mv] = ((acc as any)[t.mv]||0)+1; }
        return acc;
    }, { A:0, S:0, R:0 } as {A:number;S:number;R:number});
    const arr = ([{k:'A',v:counts.A},{k:'S',v:counts.S},{k:'R',v:counts.R}] as Array<{k:'A'|'S'|'R';v:number}>).sort((x,y)=>y.v-x.v);
    const top = arr[0].k, second = arr[1].k;
    let leftKey: 'A'|'S'|'R' = 'A';
    let rightKey: 'A'|'S'|'R' = (question.S ? 'S' : 'R');
    if (top === 'A' || second === 'A') {
        leftKey = 'A';
        rightKey = (top === 'A' ? second : top);
        if (!question[rightKey]) rightKey = (question.S ? 'S' : 'R');
    } else {
        // Prefer S vs R if we have both; else fall back to A vs available
        if (question.S && question.R) {
            leftKey = 'S'; rightKey = 'R';
        } else {
            leftKey = 'A'; rightKey = (question.S ? 'S' : 'R');
        }
    }
    const left = leftKey === 'A' ? question.A : (question as any)[leftKey];
    const right = (question as any)[rightKey];
    return (
        <div className='fade-in'>
            <div className="section-title">Phase 3 • Pattern</div>
            <h2 className="title" style={{ fontSize: '22px', textAlign: 'center', marginBottom: '20px', color: '#e6f3ff' }}>{question.stem}</h2>
            <div className={`grid cols2`}>
                <div className='option slide-in-left' style={{ animationDelay: `0s` }} tabIndex={0} onKeyDown={(e)=>onKey(e, leftKey, left.detail, question.family)} onClick={()=> onSelect({ phase: 'P3', family: question.family, mv: leftKey, detail: left.detail })}>
                    <div style={{ fontSize: '18px', lineHeight: '1.4' }}>{left.text}</div>
                </div>
                <div className='option slide-in-right' style={{ animationDelay: `0.16s` }} tabIndex={0} onKeyDown={(e)=>onKey(e, rightKey, right.detail, question.family)} onClick={()=> onSelect({ phase: 'P3', family: question.family, mv: rightKey, detail: right.detail })}>
                    <div style={{ fontSize: '18px', lineHeight: '1.4' }}>{right.text}</div>
                </div>
            </div>
            <div className="footer"><span className="kbd">Check {qNum}/7</span></div>
        </div>
    );
};

const EndScreen = ({ taps, onRestart }: { taps: Tap[], onRestart: () => void }) => {
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
                    return { ...base, log: newLog, r1Winners: winners, bye, stage: { mode: 'full-final', match: [base.seed1!, rest[0]] } };
                }
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
        return <ResultsScreen taps={taps} finalWinner={state.finalWinner} duels={(state as any).duels || []} onRestart={onRestart} />;
    }

    // render current match per mode
    const mode = state.stage.mode;
    if (mode === 'final') {
        const [a, b] = state.stage.match;
        return <DuelScreen title={'Final — Close Candidates'} a={a} b={b} onPick={(w)=>pick(w, w.face===a.face?b:a, 'Final')} />;
    }
    if (mode === 'three-semi') {
        const [a, b] = state.stage.match;
        return <DuelScreen title={'Semifinal'} a={a} b={b} onPick={(w)=>pick(w, w.face===a.face?b:a, 'Semifinal')} />;
    }
    if (mode === 'three-final') {
        const [a, b] = state.stage.match;
        return <DuelScreen title={'Final — vs Top Seed'} a={a} b={b} onPick={(w)=>pick(w, w.face===a.face?b:a, 'Final')} />;
    }
    if (mode === 'full-r1') {
        const idx = (state.stage as any).index as number;
        const pair = state.bracket.r1![idx];
        return <DuelScreen title={`Round 1 — Match ${idx+1}`} a={pair[0]} b={pair[1]} onPick={(w)=>pick(w, w.face===pair[0].face?pair[1]:pair[0], `R1-M${idx+1}`)} />;
    }
    if (mode === 'full-r2-elim') {
        const [a,b] = state.stage.match;
        return <DuelScreen title={'Round 2 — Eliminator'} a={a} b={b} onPick={(w)=>pick(w, w.face===a.face?b:a, 'R2-Eliminator')} />;
    }
    if (mode === 'full-r2-qual') {
        const [a,b] = state.stage.match;
        return <DuelScreen title={'Round 2 — Qualifier'} a={a} b={b} onPick={(w)=>pick(w, w.face===a.face?b:a, 'R2-Qualifier')} />;
    }
    if (mode === 'full-final') {
        const [a,b] = state.stage.match;
        return <DuelScreen title={'Final — Crown Match'} a={a} b={b} onPick={(w)=>pick(w, w.face===a.face?b:a, 'Final')} />;
    }
    return <div />;
};

const DuelScreen = ({ title, a, b, onPick }: { title: string, a: Seed, b: Seed, onPick: (winner: Seed) => void }) => (
    <div className="fade-in">
        <h2 className="title">{title}</h2>
        <div className="duel-grid">
            <div className="slide-in-left"><DuelCard key={`left-${a.face}-${a.seed}`} seed={a} onPick={() => onPick(a)} /></div>
            <div className="slide-in-right"><DuelCard key={`right-${b.face}-${b.seed}`} seed={b} onPick={() => onPick(b)} /></div>
        </div>
        <div className="kbd" style={{ marginTop: '12px' }}>Tournament: pick who advances.</div>
    </div>
);

const DuelCard = ({ seed, onPick }: { seed: Seed, onPick: () => void }) => {
    const [picked, setPicked] = useState(false);
    useEffect(() => { setPicked(false); }, [seed.face, seed.seed]);
    const click = () => { if (picked) return; setPicked(true); onPick(); };
    const cls = `duel-card${picked ? ' picked' : ''}`;
    return (
        <div className={cls} role="button" tabIndex={0} onClick={click} onKeyDown={(e)=>{ if (e.key==='Enter'||e.key===' ') { e.preventDefault(); click(); } }}>
            <figure className="duel-figure">
                <Image src={FaceArt[seed.face]} alt={`${seed.face} emblem`} width={800} height={1000} unoptimized />
            </figure>
            <div className="duel-name">#{seed.seed} {seed.face}</div>
            <div className="duel-desc">{FaceCopy[seed.face]}</div>
        </div>
    );
};

// helpers for results rendering
const pickWinnerMovement = (counts: {A:number;S:number;R:number}, fam: string) => {
    const max = Math.max(counts.A, counts.S, counts.R);
    const order = (TIE_ORDER as any)[fam] || ["A","S","R"];
    return order.find((k: string) => (counts as any)[k] === max);
};
const topDetailForMovement = (fam: string, mv: string, taps: Tap[]) => {
    const counts: {[k:string]: number} = {};
    taps.forEach(t => { if (t.family===fam && t.mv===mv && t.detail) counts[t.detail] = (counts[t.detail]||0)+1; });
    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const fallback = mv==='A'?'A1a': mv==='S'?'S1a':'R1a';
    return { detail: (sorted[0]?.[0] || fallback), n: (sorted[0]?.[1] || 0) };
};

const ResultsScreen = ({ taps, finalWinner, duels, onRestart }: { taps: Tap[], finalWinner: Seed | null, duels: MatchLog[], onRestart: () => void }) => {
    const familyResults = useMemo(() => resolveAllFamilies(taps), [taps]);
    useEffect(() => { try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {} }, []);
    const triad = useMemo(() => {
        return FAMILIES.map(fam => {
            const scores = familyScoresPure(fam, taps);
            const winner = pickWinnerMovement(scores, fam);
            const total = scores.T || 1;
            const A = { mv:'A', count:scores.A, share:+(scores.A/total).toFixed(2), ...topDetailForMovement(fam,'A',taps) };
            const S = { mv:'S', count:scores.S, share:+(scores.S/total).toFixed(2), ...topDetailForMovement(fam,'S',taps) };
            const R = { mv:'R', count:scores.R, share:+(scores.R/total).toFixed(2), ...topDetailForMovement(fam,'R',taps) };
            const ordered = [A,S,R].sort((x:any,y:any)=>y.share - x.share);
            const makeLine = (x:any)=> ({
                mv: x.mv,
                label: (RESULTS_LIB as any)[fam][x.detail].label,
                sentence: (RESULTS_LIB as any)[fam][x.detail].sentence,
                detail: x.detail,
                count: x.count,
                share: x.share,
                primary: x.mv===winner,
                undetected: x.count===0
            });
            return { family: fam, lines: ordered.map(makeLine), totals: {A:scores.A,S:scores.S,R:scores.R} };
        });
    }, [taps]);

    const computeFinal = useMemo(() => {
        if (finalWinner) {
            const familyName = Object.keys(ARCHETYPES).find(f => (ARCHETYPES as any)[f].L.name === finalWinner.face || (ARCHETYPES as any)[f].R.name === finalWinner.face) || 'Control';
            const archetypeFamily = (ARCHETYPES as any)[familyName];
            const winnerArchetype = archetypeFamily.L.name === finalWinner.face ? archetypeFamily.L : archetypeFamily.R;
            return { winner: finalWinner.face, winnerArchetype, isProvisional: false, runnerUp: null, chosenFamily: "Tournament" };
        }
        const djb2 = (str: string) => { let h = 5381; for (let i = 0; i < str.length; i++) { h = ((h << 5) + h) + str.charCodeAt(i); } return h >>> 0; };
        const seed = taps.map(t => `${t.family[0]}:${t.mv}:${t.detail}`).join('|');
        const idx = djb2(seed) % FAMILIES.length;
        const chosenFamily = FAMILIES[idx];
        const chosen = familyResults.find(r => r.family === chosenFamily) || familyResults[0];
        const pair = familyPair(chosen.family);
        const winnerName = chosen.winner;
        const runnerUpName = (winnerName === pair.left) ? pair.right : pair.left;
        const lowConfidenceCount = familyResults.filter(r => r.confidence === 'Low').length;
        const isProvisional = lowConfidenceCount > 3;
        const archetypeFamily = (ARCHETYPES as any)[chosen.family];
        let winnerArchetype = archetypeFamily.L.name === winnerName ? archetypeFamily.L : archetypeFamily.R;
        return { winner: winnerName, winnerArchetype, isProvisional, runnerUp: runnerUpName, chosenFamily };
    }, [taps, finalWinner, familyResults]);

    const code = triad.map(f => (f.lines.find((l:any)=>l.primary)?.mv || f.lines[0]?.mv || '')).join(' ');

    const download = () => {
        const familiesManifest = familyResults.map((res, i) => {
            const fam = FAMILIES[i];
            const scores = familyScoresPure(fam, taps);
            return {
                name: fam,
                counts: {A: scores.A, S: scores.S, R: scores.R},
                share: res.share,
                winnerMovement: pickWinnerMovement(scores, fam),
                archetype: { winner: res.winner, probs: res.probs, band: res.confidence },
                avgDetailNudge: res.avgDetailNudge,
                lrScore: res.lrScore,
                taps: res.taps.map(t => ({ mv: t.mv, detail: t.detail }))
            };
        });
        const manifest = {
            schema: 'asr.session.v7.triad+archetype',
            version: '1.0.0',
            tieBreakOrder: ['A','S','R'],
            priorLR,
            nudgeMap: 'see detailNudge function',
            duels,
            families: familiesManifest,
            finalFace: {
                name: computeFinal.winner,
                provisional: computeFinal.isProvisional,
                chosenFamily: (computeFinal as any).chosenFamily,
                runnerUp: (computeFinal as any).runnerUp,
                archetype: computeFinal.winnerArchetype
            }
        };
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(manifest,null,2)], { type: 'application/json' }));
        a.download = 'ground_zero_session_triad_archetype.json';
        a.click();
    };

    return (
        <div className='fade-in'>
            <div className='card fade-in'>
                <div className='section-title'>Results</div>
                <h2 className='title'>Movement Ledger</h2>
                <div className='stack'>
                    <div><span className='code'>{code}</span></div>
                    <div className='muted'>Three lines per family. Zero-share lines are dimmed and marked undetected.</div>
                    <div className='hr'></div>
                    <div id='triadList'>
                        {triad.map((item:any, index:number)=> (
                            <div key={item.family} className='result-family fade-in' style={{ animationDelay: `${index * 0.1}s` }}>
                                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',gap:'10px',flexWrap:'wrap' }}>
                                    <div><strong>{item.family}</strong></div>
                                </div>
                                {item.lines.map((l:any)=> (
                                    <div key={l.detail} className={`line ${l.primary?'primary':''} ${l.undetected?'undetected':''}`}>
                                        <div><span className='badge'>{l.label}</span> <span className='kbd'>(share {l.share}{l.undetected?' • undetected':''})</span></div>
                                        <div style={{ marginTop: 6 }}>{l.undetected ? <span className='muted'>(undetected)</span> : l.sentence}</div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className='card fade-in' style={{ animationDelay: '0.5s' }}>
                <h2 className='title'>Archetypes per Family</h2>
                <div className='muted'>Resolved with priors + capped nudges. Both sides shown; winner highlighted.</div>
                <div className='hr'></div>
                <div id='archList'>
                    {familyResults.map((res, index)=>{
                        const fam = FAMILIES[index];
                        const scores = familyScoresPure(fam, taps);
                        const pair = familyPair(fam);
                        const Lname = pair.left, Rname = pair.right;
                        const Lsent = (ARCHETYPES as any)[fam].sentences.L, Rsent = (ARCHETYPES as any)[fam].sentences.R;
                        const Lp = +(res.probs[Lname]||0).toFixed(2), Rp = +(res.probs[Rname]||0).toFixed(2);
                        return (
                            <div key={fam} className='result-family fade-in' style={{ animationDelay: `${(index + 1) * 0.1}s` }}>
                                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',gap:'10px',flexWrap:'wrap' }}>
                                    <div><strong>{fam}</strong> <span className='tag'>{res.confidence} confidence</span></div>
                                </div>
                                <div className='arch-row'>
                                    <div className={`arch ${res.winner===Lname?'win':'lose'} slide-in-left`} style={{ animationDelay: `${(index + 1) * 0.1 + 0.1}s` }}>
                                        <div className='name'>{Lname} <span className='tag'>p={Lp}</span></div>
                                        <div style={{ marginTop: 6 }}>{Lsent}</div>
                                    </div>
                                    <div className={`arch ${res.winner===Rname?'win':'lose'} slide-in-right`} style={{ animationDelay: `${(index + 1) * 0.1 + 0.2}s` }}>
                                        <div className='name'>{Rname} <span className='tag'>p={Rp}</span></div>
                                        <div style={{ marginTop: 6 }}>{Rsent}</div>
                                    </div>
                                </div>
                                <div className='kbd' style={{ marginTop: 8, opacity: .85 }}>
                                    Nudge: {res.avgDetailNudge.toFixed(2)} |
                                    Score: {res.lrScore.toFixed(2)}
                                </div>
                                <div className='kbd' style={{ marginTop: 4, opacity: .75 }}>{res.taps.map(t=>`${t.phase}:${t.detail||t.mv}`).join(' • ')}</div>
                            </div>
                        );
                    })}
                </div>
                <div className='hr'></div>
                <div>
                    <button className='btn primary' onClick={download}>Download Session JSON</button>
                    <button className='btn' onClick={onRestart} style={{ marginLeft: 12 }}>Restart</button>
                </div>
            </div>

            {computeFinal && (computeFinal as any).winnerArchetype && (
                <div className='card fade-in pulse' style={{ animationDelay: '1s' }}>
                    <h2 className='title'>Final Archetype Face</h2>
                    <div className='result-family'>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <h3 style={{ margin: 0, fontSize: '24px' }}>{computeFinal.winner}</h3>
                            {(computeFinal as any).isProvisional ? <span className='tag'>Provisional</span> : null}
                        </div>
                        <div className='sub'>{(computeFinal as any).winnerArchetype.definition}</div>
                        <div className='hr'></div>
                        <div className='grid cols2'>
                            <div><strong>Strengths:</strong><div className='muted'>{(computeFinal as any).winnerArchetype.strengths}</div></div>
                            <div><strong>Blindspots:</strong><div className='muted'>{(computeFinal as any).winnerArchetype.blindspots}</div></div>
                        </div>
                        <div className='hr'></div>
                        <div><strong>Movement Signature:</strong> <span className='code'>{(computeFinal as any).winnerArchetype.signature}</span></div>
                        <div style={{ marginTop: 8 }}><strong>Top Tells:</strong> <span className='muted'>{(computeFinal as any).winnerArchetype.tells.join(', ')}</span></div>
                        { (computeFinal as any).runnerUp ? <div className='muted' style={{ marginTop: 12 }}><strong>Near Flavor:</strong> {(computeFinal as any).runnerUp}</div> : null }
                        <div className='kbd' style={{ marginTop: 8 }}>
                            Fairness: harmonized priors ±0.10, nudges ±0.05, rotated A/S/R tie-order, deterministic family picker, face duels on ties.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
// #endregion
