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
    Control: '👑',
    Pace: '⏳',
    Boundary: '⚖️',
    Truth: '💎',
    Recognition: '🎭',
    Bonding: '🔗',
    Stress: '⚡️'
};

const CURRENT_ARCHETYPE = "Spotlight";

export default function SpotlightResultsPage() {
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
        <div className="w-full px-4 md:px-6 py-2 md:py-4 space-y-2">
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
const HeroBand = ({ finalWinner, secondaryFace, pureOneFace }: { finalWinner: Seed | null, secondaryFace?: Seed | null, pureOneFace?: boolean }) => (
    <div className="mb-10 pt-10">
        <div className="max-w-4xl mx-auto flex flex-col items-start text-left gap-y-3">
            <div className="flex items-baseline gap-x-4">
                <h1
                    className="m-0 font-bold tracking-tight"
                    style={{
                        fontSize: '56px',
                        lineHeight: 1.1,
                        color: getFaceLight(finalWinner?.face || ''),
                    }}
                >
                    {finalWinner?.face}
                </h1>
                <img
                    src={`/${(finalWinner?.face || 'Spotlight').toLowerCase()}.png`}
                    alt={`${finalWinner?.face || 'Spotlight'} emblem.`}
                    width={80}
                    height={80}
                    className="rounded-lg"
                    style={{
                        objectFit: 'contain',
                        transform: 'translateY(20px)'
                    }}
                />
            </div>
            <div className="flex items-center gap-x-6 mt-1">
                {pureOneFace && (
                    <div className="px-3 py-1 rounded-full text-sm font-medium bg-white/10 border border-solid border-white/20 text-white/80">
                        Pure Match
                    </div>
                )}
                {secondaryFace && secondaryFace.face !== finalWinner?.face && (
                    <div className="flex items-center gap-x-3">
                        <div
                            className="px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                                background: `rgba(${getFaceLight(secondaryFace.face).replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '148, 163, 184'}, 0.1)`,
                                color: getFaceLight(secondaryFace.face),
                                border: `1px solid rgba(${getFaceLight(secondaryFace.face).replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '148, 163, 184'}, 0.2)`
                            }}
                        >
                            Secondary: {secondaryFace.face}
                        </div>
                        <div className="relative w-[72px] h-[6px]">
                            <div className="absolute inset-0 bg-white/20 rounded-full"></div>
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                                style={{
                                    left: '36%', // This would be computed
                                    background: getFaceLight(secondaryFace.face)
                                }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>
            <p className="text-white/80 text-lg max-w-prose" style={{ lineHeight: 1.4 }}>
                {finalWinner?.face === 'Seeker' ? 'Runs alternatives and waits for decisive evidence.' : 
                 finalWinner?.face === 'Architect' ? 'Builds a proof path from sources and sequences to closure.' :
                 finalWinner?.face === 'Sovereign' ? 'Sets direction directly, enforces the move, expects alignment.' :
                 finalWinner?.face === 'Rebel' ? 'Disrupts imposed control or withdraws to reset the field.' :
                 finalWinner?.face === 'Visionary' ? 'Explores tempo and options, tests rhythms before locking one.' :
                 finalWinner?.face === 'Navigator' ? 'Plans tempo step by step and lands deadlines with clear markers.' :
                 finalWinner?.face === 'Equalizer' ? 'Balances claims and context to draw a fair line.' :
                 finalWinner?.face === 'Guardian' ? 'States non-negotiables and defends them without drift.' :
                 finalWinner?.face === 'Diplomat' ? 'Distributes credit proportionally and preserves cohesion.' :
                 finalWinner?.face === 'Spotlight' ? 'Makes contribution visible and specific, including self when needed.' :
                 finalWinner?.face === 'Partner' ? 'Co-regulates, offers choices, keeps space open.' :
                 finalWinner?.face === 'Provider' ? 'Delivers concrete support plans and visible care.' :
                 finalWinner?.face === 'Artisan' ? 'Works methodically under pressure, focusing on the critical cue.' :
                 finalWinner?.face === 'Catalyst' ? 'Initiates motion under pressure and drives recovery.' :
                 'Builds rules from repeated signals; commits once the pattern holds.'}
            </p>
        </div>
    </div>
);

const SummaryTab = ({ familyResults, taps, duels, finalWinner }: { familyResults: any[], taps: Tap[], duels: MatchLog[], finalWinner: Seed | null }) => {
    const { A, S, R } = useMemo(() => {
        const totalShare = familyResults.reduce((acc, fr) => ({
            A: acc.A + fr.share.A,
            S: acc.S + fr.share.S,
            R: acc.R + fr.share.R
        }), { A: 0, S: 0, R: 0 });
        const total = totalShare.A + totalShare.S + totalShare.R || 1;
        return {
            A: (totalShare.A / total) * 100,
            S: (totalShare.S / total) * 100,
            R: (totalShare.R / total) * 100,
        };
    }, [familyResults]);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-white/10 z-50">
            <div className="max-w-6xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-white/60">Act:</span>
                            <div className="w-16 h-1 bg-white/20 rounded-full">
                                <div 
                                    className="h-1 rounded-full transition-all duration-200"
                                    style={{
                                        width: `${A}%`,
                                        background: getFaceLight(finalWinner?.face || '')
                                    }}
                                />
                            </div>
                            <span className="text-white/80 text-xs">{Math.round(A)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white/60">Scan:</span>
                            <div className="w-16 h-1 bg-white/20 rounded-full">
                                <div 
                                    className="h-1 rounded-full transition-all duration-200"
                                    style={{
                                        width: `${S}%`,
                                        background: getFaceLight(finalWinner?.face || '')
                                    }}
                                />
                            </div>
                            <span className="text-white/80 text-xs">{Math.round(S)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white/60">Reset:</span>
                            <div className="w-16 h-1 bg-white/20 rounded-full">
                                <div 
                                    className="h-1 rounded-full transition-all duration-200"
                                    style={{
                                        width: `${R}%`,
                                        background: getFaceLight(finalWinner?.face || '')
                                    }}
                                />
                            </div>
                            <span className="text-white/80 text-xs">{Math.round(R)}%</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-white/80">
                        <span>{taps.length} taps</span>
                        <span>{familyResults.length} families</span>
                        <span>{duels.length} duels</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StrengthsCard = ({ archetype, color }: { archetype: any, color: string }) => (
    <div className="bg-white/5 rounded-lg p-4" style={{ borderLeft: `2px solid ${color}` }}>
        <h2 className="text-lg font-semibold mb-3">Strengths</h2>
        <ul className="space-y-2 list-disc list-inside text-white/80 text-sm" style={{ lineHeight: 1.4 }}>
            {((archetype?.strengths || '').split(';').map((s:string) => s.trim()).filter(Boolean).slice(0, 2) as string[]).map((item: string) => <li key={item}>{item}</li>)}
        </ul>
    </div>
);

const BlindspotsCard = ({ archetype }: { archetype: any }) => (
    <div className="bg-white/5 rounded-lg p-4" style={{ borderLeft: `2px solid #f59e0b` }}>
        <h2 className="text-lg font-semibold mb-3">Blindspots</h2>
        <ul className="space-y-2 list-disc list-inside text-white/80 text-sm" style={{ lineHeight: 1.4 }}>
            {((archetype?.blindspots || '').split(';').map((s:string) => s.trim()).filter(Boolean).slice(0, 2) as string[]).map((item: string) => <li key={item}>{item}</li>)}
        </ul>
    </div>
);

const FamilyGrid = ({ triad, finalWinner }: { triad: any[], finalWinner: Seed | null }) => (
    <div className="mb-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {triad.map((item: any) => {
                // Get the top movement for each type from the actual results
                const actionLine = item.lines.find((l: any) => l.mv === 'A' && !l.undetected);
                const scanLine = item.lines.find((l: any) => l.mv === 'S' && !l.undetected);
                const resetLine = item.lines.find((l: any) => l.mv === 'R' && !l.undetected);
                
                return (
                    <div
                        key={item.family}
                        className="bg-white/5 rounded-lg p-4 flex flex-col"
                        style={{ minHeight: '200px' }}
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
                            <div className="space-y-1.5">
                                {actionLine && <div><span className="font-medium" style={{ color: getFaceLight(finalWinner?.face || '') }}>Action style:</span> {actionLine.sentence}</div>}
                                {scanLine && <div><span className="font-medium" style={{ color: getFaceLight(finalWinner?.face || '') }}>Weighing style:</span> {scanLine.sentence}</div>}
                                {resetLine && <div><span className="font-medium" style={{ color: getFaceLight(finalWinner?.face || '') }}>Reset style:</span> {resetLine.sentence}</div>}
                            </div>
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

const EvidenceDrawer = ({ duels }: { duels: MatchLog[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="mb-10 max-w-4xl mx-auto">
            <button
                className="w-full text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls="evidence-timeline"
            >
                <span className="font-medium">Your duels path</span>
                <span className="text-sm text-white/60 ml-2">{isOpen ? 'Hide' : 'Show'}</span>
            </button>
            <div 
                id="evidence-timeline" 
                className={`transition-all duration-200 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 mt-4' : 'max-h-0'}`}
            >
                <div className="space-y-1 p-4 bg-white/5 rounded-lg">
                    {(duels || []).map((d, i) => (
                        <div key={i} className="text-sm text-white/80 font-mono flex justify-between">
                           <span>{d.round}: {d.left.face} vs {d.right.face}</span>
                           <span>→ {d.chosen}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ResultCTAs = ({ onDownload, onRestart, router, finalWinner }: { onDownload: () => void, onRestart: () => void, router: any, finalWinner: Seed | null }) => (
    <div className="md:static sticky bottom-0 z-10 py-4 bg-black/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 justify-center">
            <button
                className="px-6 py-3 text-base font-bold rounded-lg transition-colors"
                style={{
                    backgroundColor: getFaceLight(finalWinner?.face || ''),
                    color: 'black'
                }}
                onClick={() => router.push(`/results/${finalWinner?.face}/archetype`)}
            >
                Enter Chamber
            </button>
            <button className="px-5 py-3 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/20 transition-colors" onClick={onDownload}>Download JSON</button>
            <button className="px-5 py-3 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/20 transition-colors" onClick={onRestart}>Restart</button>
        </div>
    </div>
);

const ResultsScreen = ({ taps, finalWinner, duels, secondaryFace, pureOneFace, onRestart, router }: { taps: Tap[], finalWinner: Seed | null, duels: MatchLog[], secondaryFace?: Seed | null, pureOneFace?: boolean, onRestart: () => void, router: any }) => {
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
            const earnedLines = ordered.filter((x:any) => !x.undetected).map(makeLine);
            
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

    const winnerArchetype = (computeFinal as any).winnerArchetype;
    const winnerColor = getFaceLight(finalWinner?.face || '');

    return (
        <div className='fade-in pb-20'>
            <HeroBand finalWinner={finalWinner} secondaryFace={secondaryFace} pureOneFace={pureOneFace} />

            <FamilyGrid triad={triad} finalWinner={finalWinner} />

            <div className="mb-10">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
                    <StrengthsCard archetype={winnerArchetype} color={winnerColor} />
                    <BlindspotsCard archetype={winnerArchetype} />
                </div>
            </div>

            <EvidenceDrawer duels={duels} />

            <ResultCTAs onDownload={download} onRestart={onRestart} router={router} finalWinner={finalWinner} />
            
            <SummaryTab familyResults={familyResults} taps={taps} duels={duels} finalWinner={finalWinner} />
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