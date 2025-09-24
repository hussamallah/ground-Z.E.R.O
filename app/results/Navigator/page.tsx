"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FAMILIES,
    ARCHETYPES,
    RESULTS_LIB,
    TIE_ORDER,
    familyPair,
    resolveAllFamilies,
    familyScoresPure,
    Tap,
    Seed,
    MatchLog,
    FamilyResult,
    FAMILY_INTROS,
    JOINERS,
    calculateJoiners,
    calculateHeadline,
    renderFamilyContent
} from '../../quiz-data';
import Image from 'next/image';

const CURRENT_ARCHETYPE = "Navigator";

export default function NavigatorResultsPage() {
    const router = useRouter();
    
    const [resultsData, setResultsData] = useState<{
        taps: Tap[];
        finalWinner: Seed | null;
        duels: MatchLog[];
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
                onRestart={handleRestart}
                router={router}
            />
        </div>
    );
}

const ResultsScreen = ({ taps, finalWinner, duels, onRestart, router }: { taps: Tap[], finalWinner: Seed | null, duels: MatchLog[], onRestart: () => void, router: any }) => {
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
        let winnerArchetype = archetypeFamily.L.name === winnerName ? archetypeFamily.L : archetypeFamily.R;
        return { winner: winnerName, winnerArchetype, isProvisional, runnerUp: runnerUpName, chosenFamily };
    }, [taps, finalWinner, familyResults]);

    const code = triad.map(f => (f.lines.find((l:any)=>l.primary)?.mv || f.lines[0]?.mv || '')).join(' ');

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
                taps: res.taps.map(t => ({ mv: t.mv, detail: t.detail }))
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
            {/* Header - Archetype */}
            {computeFinal && (computeFinal as any).winnerArchetype && (
                <div className='fade-in'>
                    {/* Navigator Header with Glow Effect */}
                    <div className="text-center relative mb-8">
                        <div className="relative inline-block mb-2">
                            <div 
                                className="absolute inset-0 rounded-full -z-10 blur-7"
                                style={{
                                    background: 'radial-gradient(circle at 50% 40%, rgba(43, 124, 255, 0.20) 0%, transparent 70%)',
                                    filter: 'blur(28px)'
                                }}
                            ></div>
                            <h1 
                                className="m-0 uppercase font-black tracking-wider"
                                style={{
                                    fontSize: 'clamp(36px, 6vw, 56px)',
                                    color: '#2b7cff',
                                    textShadow: '0 0 30px rgba(43, 124, 255, 0.6), 0 0 60px rgba(43, 124, 255, 0.33)',
                                    filter: 'drop-shadow(0 0 14px #2b7cff) drop-shadow(0 0 36px #2b7cff)'
                                }}
                            >
                                {computeFinal.winner}
                            </h1>
                        </div>
                        <div 
                            className="text-lg text-gold italic"
                            style={{ marginTop: '8px' }}
                        >
                            {(computeFinal as any).winnerArchetype.definition}
                        </div>
                        
                        {/* Top Tells under subheader */}
                        <div style={{ marginTop: '16px' }}>
                            <div className="guardian-section-label" style={{ marginBottom: '8px' }}>
                                Top Tells
                            </div>
                            <div className="flex flex-wrap justify-center" style={{ gap: '6px' }}>
                                {(computeFinal as any).winnerArchetype.tells.map((tell: string, index: number) => {
                                    // Extract family name from tell (e.g., "A1a (Command)" -> "Control")
                                    const tellCode = tell.split(' ')[0]; // Get the code part like "A1a"
                                    const family = FAMILIES.find(fam => {
                                        const familyTells = Object.keys((RESULTS_LIB as any)[fam] || {});
                                        return familyTells.includes(tellCode);
                                    });
                                    
                                    // Extract just the descriptive name (e.g., "A1a (Command)" -> "Command")
                                    const descriptiveName = tell.includes('(') ? tell.split('(')[1].replace(')', '') : tell;
                                    
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => family && handleFamilyClick(family)}
                                            className="guardian-chip"
                                        >
                                            {descriptiveName}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {(computeFinal as any).isProvisional && (
                            <div className="mt-2">
                                <span className='tag'>Provisional</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 7 Family Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {triad.map((item: any, index: number) => (
                    <div 
                        key={item.family} 
                        className='card fade-in cursor-pointer hover:bg-white/8 transition-all duration-300 hover:scale-105 hover:shadow-xl' 
                        style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                        onClick={() => handleFamilyClick(item.family)}
                    >
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-white mb-3">{item.family}</h3>
                            {item.intro && (
                                <p className="text-sm text-gold italic leading-relaxed">{item.intro}</p>
                            )}
                            <div className="mt-4 text-xs text-white/50">
                                Click to explore details →
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Details Card - Guardian Style */}
            {computeFinal && (computeFinal as any).winnerArchetype && (
                <div className="guardian-panel">
                    <div className='grid cols2 gap-6 relative'>
                        <div>
                            <div className="guardian-section-label">
                                Strengths
                            </div>
                            <div className="guardian-value-text">
                                {(computeFinal as any).winnerArchetype.strengths}
                            </div>
                        </div>
                        <div className="relative" style={{ paddingLeft: '28px' }}>
                            <div className="guardian-vertical-divider"></div>
                            <div className="guardian-section-label">
                                Blindspots
                            </div>
                            <div className="guardian-value-text">
                                {(computeFinal as any).winnerArchetype.blindspots}
                            </div>
                        </div>
                    </div>
                    
                    { (computeFinal as any).runnerUp && (
                        <div style={{ marginTop: '20px' }}>
                            <div className="guardian-section-label">
                                Near Flavor
                            </div>
                            <div className="guardian-value-text">
                                {(computeFinal as any).runnerUp}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className='card fade-in' style={{ animationDelay: '1s' }}>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        className='btn' 
                        onClick={() => router.push('/results/Navigator/archetype')}
                        style={{ 
                            backgroundColor: '#4169E1', 
                            borderColor: '#4169E1',
                            color: 'white'
                        }}
                    >
                        If you agree, enter
                    </button>
                    <button className='btn primary' onClick={download}>Download Session JSON</button>
                    <button className='btn' onClick={onRestart}>Restart</button>
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