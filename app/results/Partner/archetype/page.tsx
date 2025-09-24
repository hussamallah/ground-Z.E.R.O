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
} from '../../../quiz-data';
import Image from 'next/image';

const CURRENT_ARCHETYPE = "Partner";

export default function PartnerArchetypePage() {
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
           <ArchetypeScreen
                taps={resultsData.taps}
                finalWinner={resultsData.finalWinner}
                duels={resultsData.duels}
                onRestart={handleRestart}
                router={router}
            />
        </div>
    );
}

const ArchetypeScreen = ({ taps, finalWinner, duels, onRestart, router }: { taps: Tap[], finalWinner: Seed | null, duels: MatchLog[], onRestart: () => void, router: any }) => {
    const familyResults = useMemo(() => resolveAllFamilies(taps), [taps]);
    
    useEffect(() => { try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {} }, []);

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
            {/* Final Archetype Face */}
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
            <div className='card fade-in' style={{ animationDelay: '0.5s' }}>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        className='btn' 
                        onClick={() => router.push('/results/Partner')}
                        style={{ 
                            backgroundColor: '#6B7280', 
                            borderColor: '#6B7280',
                            color: 'white'
                        }}
                    >
                        ← Back to Details
                    </button>
                    <button className='btn primary' onClick={download}>Download Session JSON</button>
                    <button className='btn' onClick={onRestart}>Restart</button>
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