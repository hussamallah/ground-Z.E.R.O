"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import EvidenceDrawer from '../EvidenceDrawer';
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
import SpotlightSecondaries from '../../components/GroundZero_Spotlight_13_Secondaries.json';
// Face light color mapping
const FACE_LIGHT: { [key: string]: string } = {
  Sovereign: '#6D28D9',       // Royal violet
  Rebel: '#111827',           // Ink black
  Visionary: '#4338CA',       // Indigo
  Guardian: '#DC2626',        // Signal red
  Navigator: '#166534',       // Forest green
  Seeker: '#2563EB',          // Deep blue
  Vessel: '#7DD3FC',          // Light sky
  Partner: '#64748B',         // Denim slate
  Diplomat: '#E11D48',        // Rose
  Spotlight: '#EAB308',       // Golden yellow
  Architect: '#F97316',       // Orange
  Provider: '#14B8A6'         // Teal
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
    'Navigator': 'Vessel',
    
    // Stress → needs Pace
    'Catalyst': 'Navigator',
    'Vessel': 'Visionary',
    
    // Boundary → needs Bonding

    'Guardian': 'Partner',
    
    // Bonding → needs Boundary
    'Partner': 'Guardian',
    'Provider': 'Navigator'
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
        <div className="min-h-screen w-full px-4 md:px-6 py-2 md:py-4 space-y-2 bg-[#0b0f14]">
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
                <Image
                    src={`/${(finalWinner?.face || 'Spotlight').toLowerCase()}.png`}
                    alt={`${finalWinner?.face || 'Spotlight'} emblem.`}
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
                        Pure Archetype No Secondary
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
            {(() => {
                const prizeActivation = finalWinner ? evaluatePrizeActivation(finalWinner.face, secondaryFace || null, taps) : null;
                if (!prizeActivation) return null;
                const isActive = prizeActivation.state === 'ACTIVE';
                return (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ 
                        backgroundColor: isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                        border: `1px solid ${isActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(156, 163, 175, 0.3)'}`
                    }}>
                        {isActive && <span style={{ color: '#22c55e' }}>✓</span>}
                        {isActive && <span style={{ color: '#22c55e' }}>Prize active</span>}
                        <span className="text-white/80">
                            {isActive
                                ? `${prizeActivation.main} clicks when paired with ${prizeActivation.secondary}.`
                                : (
                                    <>
                                        Prize - <span style={{ color: getFaceLight(prizeActivation.required) }}><strong>{prizeActivation.required}</strong></span> the secondary that complements you so movement clicks and reality aligns.
                                    </>
                                  )
                            }
                        </span>
                    </div>
                );
            })()}
        </div>
    </div>
    );
};

const CoreLegendSection = () => (
    <div className="mb-6 max-w-4xl mx-auto">
        <div className="bg-black/40 rounded-lg p-4 border border-white/10">
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white">
                <div className="flex items-center gap-2">
                    <span className="text-white/60">⚡</span>
                    <strong>Main:</strong> Who you are — your core archetype.
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-white/60">🎭</span>
                    <strong>Secondary (Shaper):</strong> What&apos;s shaping your core right now.
                </div>
                
            </div>
        </div>
    </div>
);


const SecondaryArchetypeSection = ({ finalWinner, secondaryFace, pureOneFace }: { finalWinner: Seed | null, secondaryFace?: Seed | null, pureOneFace?: boolean }) => {
    if (!finalWinner || finalWinner.face !== 'Spotlight') return null;
    const data: any = SpotlightSecondaries as any;

    let content: any = null;
    if (pureOneFace) {
        content = data.baseline;
    } else if (secondaryFace && secondaryFace.face) {
        const title = `Spotlight × ${secondaryFace.face}`;
        content = (data.variants || []).find((v: any) => v.title === title) || data.baseline;
    } else {
        content = data.baseline;
    }

    const color = getFaceLight(finalWinner.face);

    return (
        <div className="mb-6">
            <div className="max-w-4xl mx-auto bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="mb-2">
                    <h2 className="text-xl font-semibold" style={{ color }}>{content.title}</h2>
                </div>
                <div className="space-y-2 text-sm text-white/80" style={{ lineHeight: 1.5 }}>
                    {content['Psychological Profile'] && (
                        <div>
                            <div className="text-white/60 font-medium">Psychological Profile</div>
                            <p className="m-0">{content['Psychological Profile']}</p>
                        </div>
                    )}
                    {content['Origin'] && (
                        <div>
                            <div className="text-white/60 font-medium">Origin</div>
                            <p className="m-0">{content['Origin']}</p>
                        </div>
                    )}
                    {content['Inner Conflict'] && (
                        <div>
                            <div className="text-white/60 font-medium">Inner Conflict</div>
                            <p className="m-0">{content['Inner Conflict']}</p>
                        </div>
                    )}
                    {content['Field Presence'] && (
                        <div>
                            <div className="text-white/60 font-medium">Field Presence</div>
                            <p className="m-0">{content['Field Presence']}</p>
                        </div>
                    )}
                    {content['signal'] && (
                        <div>
                            <div className="text-white/60 font-medium">Signal</div>
                            <p className="m-0" style={{ color }}>{content['signal']}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PrizeSection = ({ finalWinner, secondaryFace, taps }: { finalWinner: Seed | null, secondaryFace?: Seed | null, taps: Tap[] }) => {
    const prizeActivation = finalWinner ? evaluatePrizeActivation(finalWinner.face, secondaryFace || null, taps) : null;
    
    if (!prizeActivation) return null;
    
    return (
        <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ 
                backgroundColor: prizeActivation.state === "ACTIVE" ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                border: `1px solid ${prizeActivation.state === "ACTIVE" ? 'rgba(34, 197, 94, 0.3)' : 'rgba(156, 163, 175, 0.3)'}`
            }}>
                {prizeActivation.state === "ACTIVE" && (
                    <span style={{ color: '#22c55e' }}>✓</span>
                )}
                {prizeActivation.state === "ACTIVE" && (
                    <span style={{ color: '#22c55e' }}>Prize active</span>
                )}
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
        <div className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm border-t border-white/10 z-50">
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



const ResultCTAs = ({ onDownload, onRestart, router, finalWinner }: { onDownload: () => void, onRestart: () => void, router: any, finalWinner: Seed | null }) => (
    <div className="md:static sticky bottom-0 z-10 py-4 bg-black/10 backdrop-blur-sm">
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
            <HeroBand finalWinner={finalWinner} secondaryFace={secondaryFace} pureOneFace={pureOneFace} taps={taps} />
            <CoreLegendSection />
            <SecondaryArchetypeSection finalWinner={finalWinner} secondaryFace={secondaryFace} pureOneFace={pureOneFace} />
            <div className="mb-10">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
                    <StrengthsCard archetype={winnerArchetype} color={winnerColor} />
                    <BlindspotsCard archetype={winnerArchetype} />
                </div>
            </div>

            {/* Inline prize now shown in HeroBand; removing separate section to avoid duplication */}


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
