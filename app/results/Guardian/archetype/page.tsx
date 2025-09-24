"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FAMILIES, RESULTS_LIB,
    ARCHETYPES,
    TIE_ORDER,
    familyPair,
    resolveAllFamilies,
    familyScoresPure,
    Tap,
    Seed,
    MatchLog
} from '../../../quiz-data';


const CURRENT_ARCHETYPE = "Guardian";

export default function GuardianArchetypePage() {
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
        const winnerArchetype = archetypeFamily.L.name === winnerName ? archetypeFamily.L : archetypeFamily.R;
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
            {/* Final Archetype Face Only */}
            {computeFinal && (computeFinal as any).winnerArchetype && (
                <div className='card fade-in pulse'>
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
                        <div style={{ marginTop: 8 }}>
                            <strong>Top Tells:</strong>
                            <div className="flex flex-wrap gap-2 mt-2">
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
                                            onClick={() => family && router.push(`/results/${family}`)}
                                            className="text-xs bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-2 py-1 rounded transition-colors cursor-pointer"
                                        >
                                            {descriptiveName}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        { (computeFinal as any).runnerUp ? <div className='muted' style={{ marginTop: 12 }}><strong>Near Flavor:</strong> {(computeFinal as any).runnerUp}</div> : null }
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className='card fade-in' style={{ animationDelay: '0.5s' }}>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        className='btn' 
                        onClick={() => router.push('/results/Guardian')}
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
