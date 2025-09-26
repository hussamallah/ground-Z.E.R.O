"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FAMILIES, RESULTS_LIB,
    ARCHETYPES,
    TIE_ORDER,
    familyPair,
    resolveAllFamilies,
    familyScoresPure,
    renderFamilyContent,
    Tap,
    Seed,
    MatchLog
} from '../../quiz-data';
// Face light color mapping
const FACE_LIGHT: { [key: string]: string } = {
  Guardian: '#14b8a6',        // Teal
  Spotlight: '#a3e635',       // Yellow-green
  Partner: '#ec4899',         // Pink
  Catalyst: '#f4a300',        // Golden-orange
  Provider: '#22d3ee',        // Aqua-teal
  Diplomat: '#5eead4',        // Soft teal
  Axiarch: '#ffbf00',         // Amber
  Architect: '#8b5cf6',       // Violet
  Seeker: '#67e8f9',          // Light cyan
  Visionary: '#3b82f6',       // Blue
  Navigator: '#a855f7',       // Purple
  Sovereign: '#f59e0b',       // Orange-gold
  Rebel: '#f97316',           // Red-orange
  Equalizer: '#22c55e'        // Green
};

const getFaceLight = (face: string): string => FACE_LIGHT[face] || '#94a3b8';

const FAMILY_ICONS: { [key: string]: string } = {
    'Control': '⚡',
    'Pace': '🏃',
    'Boundary': '🛡️',
    'Truth': '🔍',
    'Recognition': '👁️',
    'Bonding': '🤝',
    'Stress': '⚡'
};


const CURRENT_ARCHETYPE = "Artisan";

// Prize pattern locks - "X needs Y" means X only clicks when Y is the Secondary
const PRIZE_LOCKS: { [key: string]: string } = {
    // Control → needs Recognition
    'Sovereign': 'Diplomat',
    'Rebel': 'Spotlight',
    
    // Recognition → needs Truth
    'Spotlight': 'Seeker',
    'Diplomat': 'Architect',
    
    // Truth → needs Control
    'Seeker': 'Sovereign',
    'Architect': 'Rebel',
    
    // Pace → needs Stress
    'Visionary': 'Catalyst',
    'Navigator': 'Artisan',
    
    // Stress → needs Pace
    'Catalyst': 'Navigator',
    'Artisan': 'Visionary',
    
    // Boundary → needs Bonding
    'Equalizer': 'Provider',
    'Guardian': 'Partner',
    
    // Bonding → needs Boundary
    'Partner': 'Guardian',
    'Provider': 'Equalizer'
};

type PrizeActivation =
    | { state: "ACTIVE"; main: string; secondary: string; required: string }
    | { state: "DARK"; main: string; secondary: string; required: string; reason: "missing_partner" | "low_evidence" | "wide_margin" };

// Prize activation logic
const evaluatePrizeActivation = (main: string, secondary: Seed | null, taps: Tap[]): PrizeActivation => {
    const required = PRIZE_LOCKS[main];
    if (!required) {
        return { state: "DARK", main, secondary: secondary?.face || "none", required: "none", reason: "missing_partner" };
    }
    
    if (!secondary) {
        return { state: "DARK", main, secondary: "none", required, reason: "missing_partner" };
    }
    
    // Check evidence threshold (taps >= 18)
    if (taps.length < 18) {
        return { state: "DARK", main, secondary: secondary.face, required, reason: "low_evidence" };
    }
    
    // Check if secondary matches required partner
    if (secondary.face === required) {
        return { state: "ACTIVE", main, secondary: secondary.face, required };
    }
    
    return { state: "DARK", main, secondary: secondary.face, required, reason: "missing_partner" };
};

export default function ArtisanResultsPage() {
    const router = useRouter();
    
    const [resultsData, setResultsData] = useState<{
        taps: Tap[];
        finalWinner: Seed | null;
        duels: MatchLog[];
        secondaryFace?: Seed | null;
        pureOneFace?: boolean;
    } | null>(null);

    useEffect(() => {
        try {
            const storedData = sessionStorage.getItem('quizResult');
            if (storedData) {
                const data = JSON.parse(storedData);
                if (data.finalWinner && data.finalWinner.face === CURRENT_ARCHETYPE) {
                    setResultsData(data);
                } else {
                    console.warn(`Mismatch: Stored winner is not ${CURRENT_ARCHETYPE}. Redirecting.`);
                    router.replace('/');
                }
            } else {
                router.replace('/');
            }
        } catch (error) {
            console.error("Failed to parse quiz results from session storage", error);
            router.replace('/');
        }
    }, [router]);

    const handleRestart = () => {
        sessionStorage.removeItem('quizResult');
        router.push('/');
    };

    if (!resultsData) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-white/70">Loading results...</div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-2 md:py-4 space-y-2">
           <ResultsScreen
                taps={resultsData.taps}
                finalWinner={resultsData.finalWinner}
                duels={resultsData.duels}
                secondaryFace={resultsData.secondaryFace}
                pureOneFace={resultsData.pureOneFace}
                onRestart={handleRestart}
                router={router}
            />
        </div>
    );
}

// #13) Component contract
const HeroBand = ({ finalWinner, secondaryFace, pureOneFace, taps }: { finalWinner: Seed | null, secondaryFace?: Seed | null, pureOneFace?: boolean, taps: Tap[] }) => {
    return (
    <div className="mb-6 pt-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-y-4">
            {/* Face name and sticker on one line */}
            <div className="flex items-center gap-x-3">
                <h1
                    className="m-0 font-bold tracking-tight relative"
                    style={{
                        fontSize: '48px',
                        lineHeight: 1.1,
                        color: getFaceLight(finalWinner?.face || ''),
                        background: `linear-gradient(135deg, ${getFaceLight(finalWinner?.face || '')}, ${getFaceLight(finalWinner?.face || '')}cc)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}
                >
                    {finalWinner?.face}
                </h1>
                <img
                    src={`/${(finalWinner?.face || 'Artisan').toLowerCase()}.png`}
                    alt={`${finalWinner?.face || 'Artisan'} emblem.`}
                    width={72}
                    height={72}
                    className="rounded"
                    style={{
                        objectFit: 'contain',
                        transform: 'translateY(5px)'
                    }}
                />
            </div>
            
            {/* Compact chips row */}
            <div className="flex items-center gap-x-3 flex-wrap">
                {pureOneFace && (
                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 border border-solid border-white/20 text-white/80">
                        Pure Match
                    </div>
                )}
                {secondaryFace && secondaryFace.face !== finalWinner?.face && (
                    <div
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                            background: `rgba(${getFaceLight(secondaryFace.face).replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '148, 163, 184'}, 0.1)`,
                            color: getFaceLight(secondaryFace.face),
                            border: `1px solid rgba(${getFaceLight(secondaryFace.face).replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '148, 163, 184'}, 0.2)`
                        }}
                    >
                        Secondary: {secondaryFace.face}
                    </div>
                )}
            </div>
            
            <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
                Your movement pattern and decision-making style across all seven families.
            </p>
        </div>
    </div>
    );
};

const LegendSection = () => (
    <div className="mb-6 max-w-6xl mx-auto">
        <div className="bg-black/40 rounded-lg p-4 border border-white/10">
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white">
                <div className="flex items-center gap-2">
                    <span className="text-white/60">⚡</span>
                    <strong>Main Archetype (Driver):</strong> your baseline way of moving through the world.
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-white/60">🎭</span>
                    <strong>Secondary Archetype (Presenter):</strong> the parallel pattern that shapes how the main shows up.
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-white/60">🔑</span>
                    <strong>Prize:</strong> the required pattern — the one you chase in yourself and look for in others, the lock that makes your movement click.
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-white/60">🏛️</span>
                    <strong>Families:</strong> seven decision jobs where your patterns show up.
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-white/60">🎯</span>
                    <strong>Styles:</strong> Action (push forward), Weighing (hold and compare), Reset (stop and restart).
                </div>
            </div>
        </div>
    </div>
);

const PrizeSection = ({ finalWinner, secondaryFace, taps }: { finalWinner: Seed | null, secondaryFace?: Seed | null, taps: Tap[] }) => {
    const prizeActivation = finalWinner ? evaluatePrizeActivation(finalWinner.face, secondaryFace || null, taps) : null;
    
    if (!prizeActivation) return null;
    
    return (
        <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ 
                backgroundColor: prizeActivation.state === "ACTIVE" ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                border: `1px solid ${prizeActivation.state === "ACTIVE" ? 'rgba(34, 197, 94, 0.3)' : 'rgba(156, 163, 175, 0.3)'}`
            }}>
                <span style={{ color: prizeActivation.state === "ACTIVE" ? '#22c55e' : '#9ca3af' }}>
                    {prizeActivation.state === "ACTIVE" ? '✓' : '○'}
                </span>
                <span style={{ color: prizeActivation.state === "ACTIVE" ? '#22c55e' : '#9ca3af' }}>
                    {prizeActivation.state === "ACTIVE" ? "Prize active" : "Prize dark"}
                </span>
                <span className="text-white/80">
                    {prizeActivation.state === "ACTIVE" 
                        ? `${prizeActivation.main} clicks when paired with ${prizeActivation.secondary}.`
                        : (
                            <>
                                you need <span style={{ color: getFaceLight(prizeActivation.required) }}><strong>{prizeActivation.required.toUpperCase()}</strong></span> as Secondary for full alignment.
                            </>
                        )
                    }
                </span>
            </div>
        </div>
    );
};

const FamilyGrid = ({ triad, finalWinner, secondaryFace, taps }: { triad: any[], finalWinner: Seed | null, secondaryFace?: Seed | null, taps: Tap[] }) => {
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    
    const toggleCard = (familyName: string) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(familyName)) {
                newSet.delete(familyName);
            } else {
                newSet.add(familyName);
            }
            return newSet;
        });
    };
    
    const prizeActivation = finalWinner ? evaluatePrizeActivation(finalWinner.face, secondaryFace || null, taps) : null;
    
    return (
    <div className="mb-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {triad.map((item: any) => {
                // Get the top movement for each type from the actual results
                const actionLine = item.lines.find((l: any) => l.mv === 'A' && !l.undetected);
                const scanLine = item.lines.find((l: any) => l.mv === 'S' && !l.undetected);
                const resetLine = item.lines.find((l: any) => l.mv === 'R' && !l.undetected);
                
                const isExpanded = expandedCards.has(item.family);
                const isPrizeActive = prizeActivation?.state === "ACTIVE" && item.family === "Stress";
                
                return (
                    <div
                        key={item.family}
                        className={`bg-white/5 rounded-lg p-4 flex flex-col cursor-pointer transition-all duration-200 hover:bg-white/10 ${
                            isPrizeActive ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20' : ''
                        }`}
                        style={{ minHeight: '200px' }}
                        onClick={() => toggleCard(item.family)}
                    >
                        <div className="flex items-start mb-2">
                            <h3 className="text-md font-semibold flex items-center gap-x-2">
                                <span>{FAMILY_ICONS[item.family]}</span>
                                <span>{item.family}</span>
                            </h3>
                        </div>
                        <div className="space-y-2 text-sm text-white/90 flex-grow" style={{ lineHeight: 1.4 }}>
                            <p style={{ color: getFaceLight(finalWinner?.face || '') }}>
                                {item.headline.substring(0, 90)}{item.headline.length > 90 && '...'}
                            </p>
                            
                            {!isExpanded ? (
                                <div className="text-sm text-white/60">
                                    Click to reveal your decision styles
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {actionLine && <div><span className="font-medium" title="This describes how you push forward and commit to decisions" style={{ color: getFaceLight(finalWinner?.face || '') }}>Action style:</span> {actionLine.sentence}</div>}
                                    {scanLine && <div><span className="font-medium" title="This describes your thought process when evaluating options" style={{ color: getFaceLight(finalWinner?.face || '') }}>Weighing style:</span> {scanLine.sentence}</div>}
                                    {resetLine && <div><span className="font-medium" title="This describes how you stop, reframe, and restart when needed" style={{ color: getFaceLight(finalWinner?.face || '') }}>Reset style:</span> {resetLine.sentence}</div>}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            <div className="bg-white/5 rounded-lg p-4 flex flex-col justify-between opacity-60 border-2 border-dashed border-white/20" style={{ minHeight: '180px' }}>
                <div>
                    <h3 className="text-md font-semibold text-white/80">Compatibility</h3>
                    <p className="text-sm text-white/60 mt-2">Coming Soon</p>
                </div>
                <div className="w-full h-12 bg-white/10 rounded animate-pulse" />
            </div>
        </div>
    </div>
    );
};

const ResultsScreen = ({ taps, finalWinner, duels, secondaryFace, pureOneFace, onRestart, router }: { taps: Tap[], finalWinner: Seed | null, duels: MatchLog[], secondaryFace?: Seed | null, pureOneFace?: boolean, onRestart: () => void, router: any }) => {
    const familyResults = useMemo(() => resolveAllFamilies(taps), [taps]);
    const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
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
            const earnedLines = ordered.filter((x:any) => !x.undetected).map(makeLine);
            
            // Use new atomic + joiner system for all families
            const familyContent = renderFamilyContent(fam, earnedLines);
            return { 
                family: fam, 
                lines: earnedLines, 
                totals: {A:scores.A,S:scores.S,R:scores.R},
                intro: familyContent.intro,
                headline: familyContent.headline,
                joiners: familyContent.joiners
            };
        });
    }, [taps]);

    const computeFinal = useMemo(() => {
        if (finalWinner) {
            const familyName = Object.keys(ARCHETYPES).find(f => (ARCHETYPES as any)[f].L.name === finalWinner.face || (ARCHETYPES as any)[f].R.name === finalWinner.face) || 'Control';
            const archetypeFamily = (ARCHETYPES as any)[familyName];
            const winnerArchetype = archetypeFamily.L.name === finalWinner.face ? archetypeFamily.L : archetypeFamily.R;
            return { winner: finalWinner.face, winnerArchetype, isProvisional: false, runnerUp: null, chosenFamily: "Tournament" };
        }
        // This part might not be needed if we are sure finalWinner will always exist on this page.
        // For now, keeping it as a fallback.
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
        const winnerArchetype = archetypeFamily.L.name === winnerName ? archetypeFamily.L : archetypeFamily.R;
        return { winner: winnerName, winnerArchetype, isProvisional, runnerUp: runnerUpName, chosenFamily };
    }, [taps, finalWinner, familyResults]);

    

    const handleFamilyClick = (family: string) => {
        setSelectedFamily(family);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedFamily(null);
    };

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
                taps: res.taps.map((t: any) => ({ mv: t.mv, detail: t.detail }))
            };
        });
        const manifest = {
            schema: 'asr.session.v7.triad+archetype',
            version: '1.0.0',
            tieBreakOrder: ['A','S','R'],
            priorLR: {},
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
            <HeroBand finalWinner={finalWinner} secondaryFace={secondaryFace} pureOneFace={pureOneFace} taps={taps} />
            <LegendSection />
            <PrizeSection finalWinner={finalWinner} secondaryFace={secondaryFace} taps={taps} />
            
            {/* Winner Slice - Name First, Essence Second */}
            <div className="fade-in mb-12" style={{ paddingTop: '20px' }}>
                <div className="text-center">
                    {/* Winner Name with Emoji */}
                    <div className="flex justify-center items-center gap-3 mb-2">
                        <span 
                            className="text-5xl"
                            style={{ 
                                color: getFaceLight(finalWinner?.face || '')
                            }}
                        >
                            🎨
                        </span>
                        <h1 
                            className="m-0 font-bold tracking-wide"
                            style={{
                                fontSize: '48px',
                                color: getFaceLight(finalWinner?.face || ''),
                                textShadow: `0 0 20px ${getFaceLight(finalWinner?.face || '')}40, 0 0 40px ${getFaceLight(finalWinner?.face || '')}20`,
                                filter: `drop-shadow(0 0 8px ${getFaceLight(finalWinner?.face || '')}60)`
                            }}
                        >
                            {finalWinner?.face}
                        </h1>
                    </div>
                    
                    {/* Secondary with Tug Meter */}
                    {secondaryFace && secondaryFace.face !== finalWinner?.face && (
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div 
                                className="px-3 py-1 rounded-full text-sm font-medium"
                                style={{
                                    background: `rgba(${getFaceLight(secondaryFace.face).replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '148, 163, 184'}, 0.08)`,
                                    color: getFaceLight(secondaryFace.face),
                                    border: `1px solid rgba(${getFaceLight(secondaryFace.face).replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '148, 163, 184'}, 0.18)`
                                }}
                            >
                                secondary: {secondaryFace.face}
                            </div>
                            {/* Tug Meter: dot on bar */}
                            <div className="relative" style={{ width: '72px', height: '6px' }}>
                                <div className="absolute inset-0 bg-white/20 rounded-full"></div>
                                <div 
                                    className="absolute -top-[3px] w-2 h-2 rounded-full"
                                    style={{
                                        left: '30%',
                                        background: getFaceLight(secondaryFace.face)
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}
                    
                    {/* Pure Match Badge */}
                    {pureOneFace && (
                        <div className="flex items-center justify-center mb-6">
                            <div 
                                className="px-3 py-1 rounded-full text-sm font-medium text-white/80"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                Pure Match
                            </div>
                        </div>
                    )}
                    
                    {/* Essence Line */}
                    <div 
                        className="text-lg text-white/90"
                        style={{ fontSize: '18px' }}
                    >
                        Methodical under pressure; isolates the critical cue and fixes it.
                    </div>
                </div>
            </div>

            {/* Proof Row - Two Column with Shared Baseline */}
            <div className="fade-in mb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Three Bars */}
                    <div className="proof-card">
                        <div className="space-y-4">
                            {familyResults && familyResults.length > 0 && (() => {
                                const totalShare = familyResults.reduce((acc, fr) => ({
                                    A: acc.A + fr.share.A,
                                    S: acc.S + fr.share.S,
                                    R: acc.R + fr.share.R
                                }), { A: 0, S: 0, R: 0 });
                                const total = totalShare.A + totalShare.S + totalShare.R;
                                const normalized = {
                                    A: total > 0 ? (totalShare.A / total) * 100 : 0,
                                    S: total > 0 ? (totalShare.S / total) * 100 : 0,
                                    R: total > 0 ? (totalShare.R / total) * 100 : 0
                                };
                                
                                return (
                                    <>
                                        {/* Three Horizontal Bars */}
                                        <div className="space-y-3">
                                            {['A', 'S', 'R'].map(phase => {
                                                const value = normalized[phase as keyof typeof normalized];
                                                const phaseLabel = phase === 'A' ? 'Act' : phase === 'S' ? 'Scan' : 'Reset';
                                                
                                                return (
                                                    <div key={phase} className="space-y-1">
                                                        <div className="text-xs text-white/70">
                                                            <span>{phaseLabel}</span>
                                                        </div>
                                                        <div className="w-full bg-white/10 rounded-full h-1">
                                                            <div 
                                                                className="h-1 rounded-full"
                                                                style={{ 
                                                                    width: `${value}%`,
                                                                    background: getFaceLight(finalWinner?.face || '')
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Evidence Stats Block */}
                    <div className="proof-card">
                        <div className="text-center space-y-4">
                            <div>
                                <div className="text-4xl font-bold text-white">{taps.length}</div>
                                <div className="text-sm text-white/70">Taps analyzed</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white">{familyResults ? familyResults.length : 0}</div>
                                <div className="text-sm text-white/70">Families resolved</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strengths/Blindspots Section */}
            {computeFinal && (computeFinal as any).winnerArchetype && (
                <div className="mb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Strengths */}
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 rounded-2xl p-6 border border-green-500/20">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                <h3 className="text-lg font-semibold text-white">Strengths</h3>
                            </div>
                            <div className="space-y-3">
                                {(() => {
                                    const txt = (computeFinal as any).winnerArchetype.strengths as any;
                                    const str = Array.isArray(txt) ? txt.join('; ') : String(txt || '');
                                    return str.split(/\u2022|•|;|\.|\n|-,/).map(s => s.trim()).filter(Boolean).slice(0,6);
                                })().map((b: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                                        <p className="text-sm text-white/80 leading-relaxed">{b}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Blindspots */}
                        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 rounded-2xl p-6 border border-amber-500/20">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                <h3 className="text-lg font-semibold text-white">Blindspots</h3>
                            </div>
                            <div className="space-y-3">
                                {(() => {
                                    const txt = (computeFinal as any).winnerArchetype.blindspots as any;
                                    const str = Array.isArray(txt) ? txt.join('; ') : String(txt || '');
                                    return str.split(/\u2022|•|;|\.|\n|-,/).map(s => s.trim()).filter(Boolean).slice(0,6);
                                })().map((b: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0"></div>
                                        <p className="text-sm text-white/80 leading-relaxed">{b}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {(computeFinal as any).runnerUp && (
                        <div className="mt-8 bg-gradient-to-r from-blue-500/10 to-purple-600/5 rounded-2xl p-6 border border-blue-500/20">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                <h3 className="text-lg font-semibold text-white">Near Flavor</h3>
                            </div>
                            <p className="text-white/80">{(computeFinal as any).runnerUp}</p>
                        </div>
                    )}
                </div>
            )}

            <FamilyGrid triad={triad} finalWinner={finalWinner} secondaryFace={secondaryFace} taps={taps} />

            {/* Action Buttons */}
            <div className='card fade-in' style={{ animationDelay: '1s' }}>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button 
                        className='btn primary' 
                        onClick={() => router.push('/results/Artisan/archetype')}
                        style={{ 
                            backgroundColor: getFaceLight(finalWinner?.face || ''), 
                            borderColor: getFaceLight(finalWinner?.face || ''),
                            color: 'white',
                            fontSize: '16px',
                            padding: '12px 24px'
                        }}
                    >
                        Enter Chamber
                    </button>
                    <button 
                        className='btn' 
                        onClick={download}
                        style={{ fontSize: '14px', padding: '10px 20px' }}
                    >
                        Download
                    </button>
                    <button 
                        className='btn' 
                        onClick={onRestart}
                        style={{ fontSize: '14px', padding: '10px 20px' }}
                    >
                        Restart
                    </button>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && selectedFamily && (
                <FamilyModal 
                    family={selectedFamily}
                    familyData={triad.find((item: any) => item.family === selectedFamily)}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

// Family Modal Component
const FamilyModal = ({ family, familyData, onClose }: { 
    family: string; 
    familyData: any; 
    onClose: () => void; 
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!familyData) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div 
                className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl"
                style={{
                    background: 'rgba(11, 15, 22, 0.8)',
                    border: '1px solid rgba(255, 201, 77, 0.2)',
                    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(12px)'
                }}
            >
                <div className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-3">{family}</h2>
                            {familyData.headline && (
                                <p className="text-xl font-medium" style={{ color: '#FFC94D' }}>{familyData.headline}</p>
                            )}
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-white/50 hover:text-white transition-colors text-3xl font-bold"
                        >
                            ×
                        </button>
                    </div>

                    {/* Movement Patterns */}
                    <div className="space-y-8">
                        {/* Act Section */}
                        {familyData.lines.filter((l: any) => l.mv === 'A' && !l.undetected).length > 0 && (
                            <div>
                                <h3 
                                    className="text-sm font-medium uppercase tracking-wider mb-4 pb-2"
                                    style={{ 
                                        color: '#FFC94D',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}
                                >
                                    Your action style
                                </h3>
                                <div className="space-y-4">
                                    {familyData.lines.filter((l: any) => l.mv === 'A' && !l.undetected).map((l: any) => (
                                        <div 
                                            key={l.detail} 
                                            className="rounded-xl p-4"
                                            style={{ background: 'rgba(20, 25, 34, 0.7)' }}
                                        >
                                            <div className="flex items-center mb-3">
                                                <div 
                                                    className="w-2 h-2 rounded-full mr-3"
                                                    style={{ 
                                                        background: '#FFC94D',
                                                        boxShadow: '0 0 8px rgba(255, 201, 77, 0.6)'
                                                    }}
                                                ></div>
                                                <span 
                                                    className="text-sm font-medium px-3 py-1 rounded-full"
                                                    style={{ 
                                                        background: 'rgba(255, 201, 77, 0.15)',
                                                        color: '#FFC94D'
                                                    }}
                                                >
                                                    {l.label.split(' • ')[1]}
                                                </span>
                                            </div>
                                            <p 
                                                className="text-sm leading-relaxed"
                                                style={{ color: '#A5B2C7' }}
                                            >
                                                {l.sentence}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Scan Section */}
                        {familyData.lines.filter((l: any) => l.mv === 'S' && !l.undetected).length > 0 && (
                            <div>
                                <h3 
                                    className="text-sm font-medium uppercase tracking-wider mb-4 pb-2"
                                    style={{ 
                                        color: '#FFC94D',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}
                                >
                                    Your weighing style
                                </h3>
                                <div className="space-y-4">
                                    {familyData.lines.filter((l: any) => l.mv === 'S' && !l.undetected).map((l: any) => (
                                        <div 
                                            key={l.detail} 
                                            className="rounded-xl p-4"
                                            style={{ background: 'rgba(20, 25, 34, 0.7)' }}
                                        >
                                            <div className="flex items-center mb-3">
                                                <div 
                                                    className="w-2 h-2 rounded-full mr-3"
                                                    style={{ 
                                                        background: '#2B7CFF',
                                                        boxShadow: '0 0 8px rgba(43, 124, 255, 0.6)'
                                                    }}
                                                ></div>
                                                <span 
                                                    className="text-sm font-medium px-3 py-1 rounded-full"
                                                    style={{ 
                                                        background: 'rgba(43, 124, 255, 0.15)',
                                                        color: '#2B7CFF'
                                                    }}
                                                >
                                                    {l.label.split(' • ')[1]}
                                                </span>
                                            </div>
                                            <p 
                                                className="text-sm leading-relaxed"
                                                style={{ color: '#A5B2C7' }}
                                            >
                                                {l.sentence}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Reset Section */}
                        {familyData.lines.filter((l: any) => l.mv === 'R' && !l.undetected).length > 0 && (
                            <div>
                                <h3 
                                    className="text-sm font-medium uppercase tracking-wider mb-4 pb-2"
                                    style={{ 
                                        color: '#FFC94D',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}
                                >
                                    Your reset style
                                </h3>
                                <div className="space-y-4">
                                    {familyData.lines.filter((l: any) => l.mv === 'R' && !l.undetected).map((l: any) => (
                                        <div 
                                            key={l.detail} 
                                            className="rounded-xl p-4"
                                            style={{ background: 'rgba(20, 25, 34, 0.7)' }}
                                        >
                                            <div className="flex items-center mb-3">
                                                <div 
                                                    className="w-2 h-2 rounded-full mr-3"
                                                    style={{ 
                                                        background: '#7C3AED',
                                                        boxShadow: '0 0 8px rgba(124, 58, 237, 0.6)'
                                                    }}
                                                ></div>
                                                <span 
                                                    className="text-sm font-medium px-3 py-1 rounded-full"
                                                    style={{ 
                                                        background: 'rgba(124, 58, 237, 0.15)',
                                                        color: '#7C3AED'
                                                    }}
                                                >
                                                    {l.label.split(' • ')[1]}
                                                </span>
                                            </div>
                                            <p 
                                                className="text-sm leading-relaxed"
                                                style={{ color: '#A5B2C7' }}
                                            >
                                                {l.sentence}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Pattern Insights */}
                        {familyData.joiners && familyData.joiners.length > 0 && (
                            <div>
                                <h3 
                                    className="text-sm font-medium uppercase tracking-wider mb-4 pb-2"
                                    style={{ 
                                        color: '#FFC94D',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}
                                >
                                    Pattern Insights
                                </h3>
                                <div className="space-y-4">
                                    {familyData.joiners.map((joiner: string, joinerIndex: number) => (
                                        <div 
                                            key={joinerIndex} 
                                            className="rounded-xl p-4 border-l-2"
                                            style={{ 
                                                background: 'rgba(26, 32, 44, 0.6)',
                                                borderLeftColor: '#FFC94D'
                                            }}
                                        >
                                            <p 
                                                className="text-base italic leading-relaxed"
                                                style={{ color: '#E6ECF2' }}
                                            >
                                                {joiner}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Close Button */}
                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2 rounded-full font-bold text-sm transition-all duration-200 hover:brightness-110"
                            style={{
                                background: 'linear-gradient(135deg, #FFD95D 0%, #FFB733 100%)',
                                color: '#000',
                                height: '40px',
                                boxShadow: '0 0 12px rgba(255, 201, 77, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 201, 77, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 201, 77, 0.3)';
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
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