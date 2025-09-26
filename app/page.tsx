// DETERMINISTIC EDIT — keeps tournament, removes outcome randomness, seeds demos predictably.
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  PHASE1,
  PHASE2,
  ARCHETYPES,
  LEAN,
  FaceArt,
  FaceCopy,
  familyPair,
  // PROB_WINDOW,
  // MIN_FINALISTS,
  // PROB_BACKOFF,
  resolveAllFamilies,
  Tap,
  FamilyResult,
  Seed,
  MatchLog
} from './quiz-data';

// #region Determinism helpers
// FNV-1a (uint32) for lightweight hashing of canonical strings (used for tie-breaks)
const fhash = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// Stable comparator utilities that never return 0 for distinct items
const cmpNum = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0);
const cmpStr = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Final tie-break compare for seeds. We avoid modulo jitter and ensure a strict order:
 * 1) full 32-bit hash asc, 2) face name asc, 3) family asc
 */
const cmpSeedTB = (a: Seed | Omit<Seed, 'seed'>, b: Seed | Omit<Seed, 'seed'>) => {
  const byHash = cmpNum((a as any)._tb, (b as any)._tb);
  if (byHash) return byHash;
  const byFace = cmpStr((a as any).face, (b as any).face);
  if (byFace) return byFace;
  return cmpStr((a as any).family, (b as any).family);
};
// #endregion

// #region Helper Types
type BracketMode = 'top8' | 'top4' | 'top2';
type Stage =
  | { mode: 'qf'; index: number }           // quarterfinals (top8 or top4)
  | { mode: 'sf'; index: number }           // semifinals (top8 only)
  | { mode: 'final' }                       // tournament final
  | { mode: 'grand'; match: [Seed, Seed] }; // reserved (not used here)

type TourneyState =
  | { finalWinner: Seed | null; duels?: MatchLog[]; secondaryFace?: Seed; pureOneFace?: boolean }
  | {
      familyResults: FamilyResult[];
      ranked: Seed[];
      bracketMode: BracketMode;
      stage: Stage;
      qfWinners: Seed[];
      sfWinners: Seed[];
      secondary: Seed | null;
      log: MatchLog[];
    };
// #endregion

// Build a seed object for a specific face in a given family result
const seedFromFace = (fr: FamilyResult, face: string, taps: Tap[]): Omit<Seed, 'seed'> => {
  const pair = familyPair(fr.family);
  const p = (fr.probs as any)[face] ?? 0.5;
  let votes = 1 + (p >= 0.6 ? 1 : 0) + ((fr.confidence === 'High' || fr.confidence === 'User') ? 1 : 0);
  if (votes > 3) votes = 3;
  const margin = Math.abs(((fr.probs as any)[pair.left] ?? 0) - ((fr.probs as any)[pair.right] ?? 0));

  // Deterministic tie-breaker derived ONLY from ordered taps + face label
  const tb = fhash(taps.map(t => `${t.family[0]}:${t.mv}:${t.detail}`).join('|') + '|' + face);
  return { face, family: fr.family, votes, p, margin, _tb: tb };
};

// Internal pool used to compute a "bye champion" if you ever re-enable grand finals later.
// const makeSeedsHybridPool = (familyResults: FamilyResult[], taps: Tap[]): Seed[] => {
//   const seeded = familyResults
//     .map(fr => seedFromFace(fr, fr.winner, taps))
//     .sort(
//       (a, b) =>
//         // Higher is better for votes/p/margin; on full tie, use strict deterministic TB
//         (b.votes - a.votes) ||
//         (b.p - a.p) ||
//         (b.margin - a.margin) ||
//         cmpSeedTB(a, b)
//     );

//   if (seeded.length === 0) return [];

//   const topVotes = seeded[0].votes;
//   const byVotes = seeded.filter(s => s.votes === topVotes);
//   const refProb = Math.max(...byVotes.map(s => s.p));
//   let pool = byVotes.filter(s => (refProb - s.p) <= PROB_WINDOW);
//   if (pool.length < MIN_FINALISTS) {
//     pool = byVotes.filter(s => (refProb - s.p) <= PROB_BACKOFF);
//   }
//   if (pool.length < MIN_FINALISTS) {
//     const extras = seeded.filter(s => !pool.includes(s)).slice(0, MIN_FINALISTS - pool.length);
//     pool = pool.concat(extras);
//   }
//   return pool.map((f, i) => ({ ...f, seed: i + 1 }));
// };

// Ranked list for the actual tournament: 7 winners + 1 wildcard (best runner-up) = Top-8.
// Falls back to Top-4 or Top-2 when necessary. Fully deterministic ordering.
const makeSeedsRanked = (familyResults: FamilyResult[], taps: Tap[]): Seed[] => {
  if (!familyResults || familyResults.length === 0) return [];

  // Primary seeds: winners of each family
  const winners = familyResults.map(fr => seedFromFace(fr, fr.winner, taps));

  // Wildcard: best runner-up across families (the non-winner face with the highest p)
  const runnerUps = familyResults.map(fr => {
    const pair = familyPair(fr.family);
    const runner = fr.winner === pair.left ? pair.right : pair.left;
    return seedFromFace(fr, runner, taps);
  });

  // Pick the strongest runner-up deterministically
  const bestRunner = runnerUps.sort(
    (a, b) =>
      (b.votes - a.votes) ||
      (b.p - a.p) ||
      (b.margin - a.margin) ||
      cmpSeedTB(a, b)
  )[0];

  // Combine and rank
  const combined = bestRunner ? [...winners, bestRunner] : [...winners];

  const ranked = combined
    .sort(
      (a, b) =>
        (b.votes - a.votes) ||
        (b.p - a.p) ||
        (b.margin - a.margin) ||
        cmpSeedTB(a, b)
    )
    .map((s, i) => ({ ...s, seed: i + 1 }));

  return ranked;
};

// Face light color mapping
type FaceLightMap = { [key: string]: string };
const FACE_LIGHT: FaceLightMap = {
  Guardian: '#14b8a6',        // Teal
  Spotlight: '#a3e635',       // Yellow-green
  Partner: '#ec4899',         // Pink
  Catalyst: '#f4a300',        // Golden-orange
  Provider: '#22d3ee',        // Aqua-teal
  Diplomat: '#5eead4',        // Soft teal
  Axiarch: '#ffbf00',         // Amber (special/out-of-scope but supported)
  Architect: '#8b5cf6',       // Violet
  Seeker: '#67e8f9',          // Light cyan
  Visionary: '#3b82f6',       // Blue
  Navigator: '#a855f7',       // Purple
  Sovereign: '#f59e0b',       // Orange-gold
  Rebel: '#f97316',           // Red-orange
  Equalizer: '#22c55e'        // Green
};
export const getFaceLight = (face: string): string => FACE_LIGHT[face] || '#94a3b8'; // slate-400 fallback

// Machine-selected secondary face: best runner-up across families (same deterministic sort as ranking)
const computeSecondary = (familyResults: FamilyResult[], taps: Tap[], ranked: Seed[]): Seed | null => {
  if (!familyResults || familyResults.length === 0) return null;
  const runnerUps = familyResults.map(fr => {
    const pair = familyPair(fr.family);
    const runner = fr.winner === pair.left ? pair.right : pair.left;
    return seedFromFace(fr, runner, taps);
  });
  runnerUps.sort(
    (a, b) =>
      (b.votes - a.votes) ||
      (b.p - a.p) ||
      (b.margin - a.margin) ||
      cmpSeedTB(a, b)
  );
  const best = runnerUps[0];
  if (!best) return null;
  const match = ranked.find(s => s.face === best.face);
  return match || ({ ...best, seed: 0 } as Seed);
};

// Pairing helpers (fixed; no shuffle = reproducible bracket)
const pairIndicesTop8: [number, number][] = [
  [0, 7], // 1 vs 8
  [3, 4], // 4 vs 5
  [1, 6], // 2 vs 7
  [2, 5], // 3 vs 6
];
const pairIndicesTop4: [number, number][] = [
  [0, 3], // 1 vs 4
  [1, 2], // 2 vs 3
];
const pairIndicesTop2: [number, number][] = [
  [0, 1], // 1 vs 2
];

export default function Home() {
  const router = useRouter();
  const [gameState, setGameState] = useState({
    phase: 'intro',
    p1Index: 0,
    p2Index: 0,
    taps: [] as Tap[],
  });
  const lockRef = useRef(false);
  const [isFading, setIsFading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showSamples, setShowSamples] = useState(false);
  const [activeTab, setActiveTab] = useState<'quiz' | 'theory'>('quiz');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar when quiz starts
  useEffect(() => {
    if (gameState.phase === 'p1' || gameState.phase === 'p2' || gameState.phase === 'end') {
      setSidebarOpen(false);
    }
  }, [gameState.phase]);

  // Keyboard flow (P1/P2 only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || lockRef.current || gameState.phase === 'intro' || gameState.phase === 'end') return;

      const { phase, p1Index, p2Index } = gameState;
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
          const opts: any[] = [];
          if (currentQuestion?.A) opts.push({ mv: 'A', ...currentQuestion.A });
          if (currentQuestion?.S) opts.push({ mv: 'S', ...currentQuestion.S });
          if (currentQuestion?.R) opts.push({ mv: 'R', ...currentQuestion.R });
          options = opts.length === 3 ? [opts[0], opts[(p2Index % 2) + 1]] : opts;
        }
      }

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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, selectedOption]);

  const handleOptionClick = (tapData: Omit<Tap, 'ts'>) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setSelectedOption(tapData.detail);

    // debounce
    setTimeout(() => {
      lockRef.current = false;
      setSelectedOption(null);
    }, 250);

    // Note: we still store ts for UX, but hashes & scoring ignore it.
    const newTaps = [...gameState.taps, { ...tapData, ts: Date.now() }];
    let { phase, p1Index, p2Index } = gameState;

    if (phase === 'p1') {
      if (p1Index < PHASE1.length - 1) p1Index++;
      else phase = 'p2';
    } else if (phase === 'p2') {
      if (p2Index < PHASE2.length - 1) p2Index++;
      else phase = 'end'; // straight to tournament
    }

    setIsFading(true);
    setTimeout(() => {
      setGameState({ taps: newTaps, phase, p1Index, p2Index });
      setIsFading(false);
    }, 90);
  };

  const restart = () => setGameState({ phase: 'intro', p1Index: 0, p2Index: 0, taps: [] });

  const renderContent = () => {
    const { phase, p1Index, p2Index, taps } = gameState;
    if (phase === 'intro')
      return (
        <IntroScreen
          onStart={() => {
            if (lockRef.current) return;
            lockRef.current = true;
            setTimeout(() => {
              lockRef.current = false;
            }, 260);
            setIsFading(true);
            setTimeout(() => {
              setGameState(prev => ({ ...prev, phase: 'p1' }));
              setIsFading(false);
            }, 240);
          }}
        />
      );

    if (phase === 'p1')
      return (
        <Phase1Screen
          question={PHASE1[p1Index]}
          onSelect={handleOptionClick}
          qNum={p1Index + 1}
          total={PHASE1.length}
          selectedOption={selectedOption}
        />
      );

    if (phase === 'p2')
      return (
        <Phase2Screen
          index={p2Index}
          question={PHASE2[p2Index]}
          onSelect={handleOptionClick}
          qNum={p2Index + 1}
          total={PHASE2.length}
        />
      );

    if (phase === 'end') return <EndScreen taps={taps} onRestart={restart} router={router} />;

    return null;
  };

  const progress = useMemo(() => {
    const total = PHASE1.length + PHASE2.length;
    const answered = Math.min(gameState.p1Index, PHASE1.length) + Math.min(gameState.p2Index, PHASE2.length);
    if (gameState.phase === 'end') return 100;
    if (gameState.phase === 'intro') return 0;
    return Math.round(100 * answered / total);
  }, [gameState]);

  const isTournamentPhase = gameState.phase === 'end';
  const inIntro = gameState.phase === 'intro';

  return (
    <div className="min-h-screen flex">
      {/* Toggle Button - Only show during intro phase */}
      {gameState.phase === 'intro' && (
        <div className="fixed top-4 left-4 z-50">
          {!sidebarOpen ? (
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-white/70 text-sm font-medium bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-200"
              aria-label="Open sidebar for more info"
            >
              Open for more info
            </button>
          ) : (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <svg
                className="w-5 h-5 transition-transform duration-200 rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Left Sidebar Navigation */}
      {sidebarOpen && (
        <div className="fixed left-0 top-0 h-full w-64 bg-black/90 backdrop-blur-sm border-r border-white/10 z-40 flex flex-col transition-transform duration-300">
          <div className="p-4 border-b border-white/10">
            <Image
              src="/THE-Axiarch.png"
              alt="Ground Zero"
              width={48}
              height={48}
              className="h-12 w-12 mx-auto [filter:drop-shadow(0_0_10px_rgba(212,175,55,.35))]"
            />
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'quiz'
                  ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="font-semibold">Take Quiz</div>
              <div className="text-xs text-white/50">Start the Ground Zero quiz</div>
            </button>
            <button
              onClick={() => setActiveTab('theory')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'theory'
                  ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="font-semibold">How Ground Zero Works</div>
              <div className="text-xs text-white/50">Theory, Sources & Quiz Engine</div>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {activeTab === 'quiz' ? (
          <div className={inIntro ? 'min-h-screen overflow-x-hidden' : 'max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-2 md:py-4 space-y-6 sm:space-y-8 -mt-6 sm:-mt-10'}>
            {inIntro && (
              <button
                className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur-sm"
                onClick={() => setShowSamples(true)}
              >
                Sample Results
              </button>
            )}

            {inIntro && showSamples && (
              <SampleResultsModal
                onClose={() => setShowSamples(false)}
                onPick={(face) => {
                  setShowSamples(false);
                  try {
                    generateSampleAndGoto(face);
                  } catch (e) {
                    console.error(e);
                  }
                }}
              />
            )}
            <div role="status" aria-live="polite" className="sr-only">
              {gameState.phase !== 'intro' &&
                gameState.phase !== 'end' &&
                `Question ${gameState.p1Index + gameState.p2Index + 1}/${PHASE1.length + PHASE2.length}`}
            </div>

            {!inIntro && !isTournamentPhase && (
              <header className="flex items-center justify-center py-2 sm:py-3">
                <Image
                  src="/THE-Axiarch.png"
                  alt="Ground Zero"
                  width={192}
                  height={192}
                  className="h-32 sm:h-40 md:h-48 [filter:drop-shadow(0_0_10px_rgba(212,175,55,.35))]"
                />
              </header>
            )}

            {!inIntro && !isTournamentPhase && (
              <div className="fixed bottom-2 sm:bottom-4 left-0 right-0 px-3 sm:px-4 md:px-6 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div aria-label="Progress" className="relative h-1 sm:h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 transition-[width] duration-200 rounded-full"
                      style={{ width: `${progress}%` }}
                    >
                      <span
                        aria-live="polite"
                        className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] text-black/80 font-medium tabular-nums"
                      >
                        {progress}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div id="stage" className={inIntro ? 'min-h-screen pb-16 sm:pb-8' : 'min-h-[400px] sm:min-h-[500px]'}>
              <div style={isFading ? { opacity: 0, transition: 'opacity 90ms ease-out' } : { opacity: 1, transition: 'opacity 120ms ease-out' }}>
                {renderContent()}
              </div>
            </div>
          </div>
        ) : (
          <TheoryPage />
        )}
      </div>
    </div>
  );
}

// #region Components
const IntroScreen = ({ onStart }: { onStart: () => void }) => (
  <div className="wrap">
    <section className="hero center">
      <div className="glow" />
      <div className="logo" aria-hidden="true">
        <Image src="/THE-Axiarch.png" alt="Ground Zero Emblem" width={200} height={200} />
      </div>
      <h1>Ground Zero</h1>
      <p className="lead">
        The diagnostic quiz that shows how you move through reality.
      </p>
      <p className="sub">
        Not ONLY who you are, but ALSO how you decide, adapt, and reset.
      </p>
      <div className="mt-4">
        <button className="btn" onClick={onStart}>
          Start Quiz
        </button>
        <div className="note" style={{marginTop: '12px', fontSize: '13px', color: 'var(--muted)'}}>
          TOTALLY FREE • RESULTS NOW • NO SIGN UP REQUIRED
        </div>
      </div>
    </section>

    <section className="section">
      <div className="cols">
        <div>
          <div className="kicker">About</div>
          <h2>Not Another Personality Test</h2>
          <div className="divider" />
          <p className="p"><b>Most quizzes hand you a label. Ground Zero gives you a movement.</b></p>
          <p className="p">
            Same choices = same results. No randomness in outcomes. Just a replayable map of how you carry calls, set pace, draw lines, and reset.
          </p>

          <div className="diagram mt-3" aria-hidden="true">
            <div className="step">
              <b>Question</b>
              <div className="muted">Situational choices</div>
            </div>
            <div className="arrow" />
            <div className="step">
              <b>Engine</b>
              <div className="muted">Deterministic ledger</div>
            </div>
            <div className="arrow" />
            <div className="step">
              <b>Your Archetype</b>
              <div className="muted">Plus a machine-picked secondary</div>
            </div>
          </div>
        </div>

        <div>
          <div className="kicker">Why it&apos;s different</div>
          <h2>What powers the insight</h2>
          <div className="divider" />
          <div className="mini">
            <div className="card">
              <h3>Families</h3>
              <div className="muted">Seven decision jobs tested.</div>
            </div>
            <div className="card">
              <h3>Styles</h3>
              <div className="muted">Action, Weighing, Reset.</div>
            </div>
            <div className="card">
              <h3>Prize Pattern</h3>
              <div className="muted">Activates only with your exact partner face.</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div className="separator" role="presentation" />

    <section className="cta">
      <button className="btn" onClick={onStart}>
        Take the Quiz (5 min)
      </button>
      <div className="note" style={{marginTop: '12px', fontSize: '13px', color: 'var(--muted)'}}>
        TOTALLY FREE • RESULTS NOW • NO SIGN UP REQUIRED
      </div>
    </section>
  </div>
);

const Phase1Screen = ({
  question,
  onSelect,
  qNum,
  total
}: {
  question: any;
  onSelect: (tap: Omit<Tap, 'ts'>) => void;
  qNum: number;
  total: number;
  selectedOption: string | null;
}) => {
  const onKey = (e: React.KeyboardEvent, mv: string, detail: string, family: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect({ phase: 'P1', family, mv, detail });
    }
  };

  if (!question || !question.choices || !Array.isArray(question.choices)) {
    return (
      <div className="text-center py-8">
        <p className="text-white/70">Loading question...</p>
      </div>
    );
  }

  return (
    <div>
      <fieldset className="space-y-4 sm:space-y-6">
        <legend className="text-xl sm:text-2xl md:text-[28px] font-semibold tracking-tight text-balance px-1">{question.stem}</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch">
          {question.choices.map((ch: any, index: number) => (
            <div key={index} className="h-full">
              <label
                className="group relative cursor-pointer rounded-xl gold-card-premium p-3 sm:p-4
                                               transition-all duration-150 will-change-transform h-full flex flex-col"
              >
                <input
                  type="radio"
                  name={`q${qNum}`}
                  value={ch.detail}
                  className="sr-only"
                  onKeyDown={e => onKey(e, ch.mv, ch.detail, question.family)}
                  onClick={() => onSelect({ phase: 'P1', family: question.family, mv: ch.mv, detail: ch.detail })}
                />
                <div className="min-h-[50px] sm:min-h-[60px] md:min-h-[70px] text-sm sm:text-[15px] leading-relaxed text-[#E8E8E8] flex-1 relative z-10">{ch.text}</div>
                <div className="absolute inset-0"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <span className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1 rounded-full bg-white/5 text-white/70 border border-white/10">
            Question {qNum}/{total}
          </span>
        </div>
      </fieldset>
    </div>
  );
};

const Phase2Screen = ({
  index,
  question,
  onSelect,
  qNum,
  total
}: {
  index: number;
  question: any;
  onSelect: (tap: Omit<Tap, 'ts'>) => void;
  qNum: number;
  total: number;
}) => {
  if (!question || !question.family) {
    return (
      <div className="text-center py-8">
        <p className="text-white/70">Loading question...</p>
      </div>
    );
  }

  const opts: any[] = [];
  if (question.A) opts.push({ mv: 'A', ...question.A });
  if (question.S) opts.push({ mv: 'S', ...question.S });
  if (question.R) opts.push({ mv: 'R', ...question.R });
  const shown = opts.length === 3 ? [opts[0], opts[(index % 2) + 1]] : opts;

  const onKey = (e: React.KeyboardEvent, mv: string, detail: string, family: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect({ phase: 'P2', family, mv, detail });
    }
  };

  return (
    <div>
      <fieldset className="space-y-4 sm:space-y-6">
        <legend className="text-xl sm:text-2xl md:text-[28px] font-semibold tracking-tight text-balance px-1">{question.stem}</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch">
          {shown.map((o: any, idx: number) => (
            <div key={idx} className="h-full">
              <label
                className="group relative cursor-pointer rounded-xl gold-card-premium p-3 sm:p-4
                                               transition-all duration-150 will-change-transform h-full flex flex-col"
              >
                <input
                  type="radio"
                  name={`q${qNum}`}
                  value={o.detail}
                  className="sr-only"
                  onKeyDown={e => onKey(e, o.mv, o.detail, question.family)}
                  onClick={() => onSelect({ phase: 'P2', family: question.family, mv: o.mv, detail: o.detail })}
                />
                <div className="min-h-[50px] sm:min-h-[60px] md:min-h-[70px] text-sm sm:text-[15px] leading-relaxed text-[#E8E8E8] flex-1 relative z-10">{o.text}</div>
                <div className="absolute inset-0"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <span className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1 rounded-full bg-white/5 text-white/70 border border-white/10">
            Item {qNum}/{total}
          </span>
        </div>
      </fieldset>
    </div>
  );
};

const EndScreen = ({ taps, router }: { taps: Tap[]; onRestart: () => void; router: any }) => {
  const [state, setState] = useState<TourneyState>({ finalWinner: null });

  // Build bracket + secondary on mount — all deterministic given taps
  useEffect(() => {
    const familyResults = resolveAllFamilies(taps);

    // Ranked tournament seeds: 7 winners + 1 wildcard
    const ranked = makeSeedsRanked(familyResults, taps);

    // Decide bracket size: prefer 8, else 4, else 2
    let bracketMode: BracketMode = 'top2';
    if (ranked.length >= 8) bracketMode = 'top8';
    else if (ranked.length >= 4) bracketMode = 'top4';

    const stage: Stage =
      bracketMode === 'top8' ? { mode: 'qf', index: 0 } :
      bracketMode === 'top4' ? { mode: 'qf', index: 0 } :
      { mode: 'final' };

    const sizedRanked = bracketMode === 'top8' ? ranked.slice(0, 8) :
                        bracketMode === 'top4' ? ranked.slice(0, 4) :
                        ranked.slice(0, 2);
    const secondary = computeSecondary(familyResults, taps, sizedRanked);
    
    setState({
      familyResults,
      ranked: sizedRanked,
      secondary,
      bracketMode,
      stage,
      qfWinners: [],
      sfWinners: [],
      log: []
    });
  }, [taps]);

  // Redirect when final winner chosen
  useEffect(() => {
    if ('finalWinner' in state && state.finalWinner) {
      const resultsData = {
        taps,
        finalWinner: state.finalWinner,
        duels: (state as any).duels || (state as any).log || [],
        secondaryFace: (state as any).secondaryFace || (state as any).secondary || null,
        pureOneFace: !!(((state as any).secondaryFace || (state as any).secondary) && state.finalWinner && ((state as any).secondaryFace || (state as any).secondary).face === state.finalWinner.face)
      };
      try {
        sessionStorage.setItem('quizResult', JSON.stringify(resultsData));
      } catch {}
      const winnerFace = state.finalWinner.face;
      if (winnerFace) {
        window.location.href = `/results/${winnerFace}`;
      } else {
        router.replace('/');
      }
    }
  }, [state, taps, router]);

  // Utility to get current pair based on stage
  const currentPair = () => {
    if (!('stage' in state)) return null;
    const ranked = (state as any).ranked as Seed[];
    const mode = (state as any).bracketMode as BracketMode;

    if ((state as any).stage.mode === 'qf') {
      const idx = (state as any).stage.index as number;
      const pairs =
        mode === 'top8'
          ? pairIndicesTop8
          : mode === 'top4'
          ? pairIndicesTop4
          : pairIndicesTop2;
      const [i, j] = pairs[idx];
      return [ranked[i], ranked[j]] as [Seed, Seed];
    }

    if ((state as any).stage.mode === 'sf') {
      const idx = (state as any).stage.index as number;
      const w = (state as any).qfWinners as Seed[];
      const pairs: [Seed, Seed][] = [
        [w[0], w[1]],
        [w[2], w[3]],
      ];
      return pairs[idx];
    }

    if ((state as any).stage.mode === 'final') {
      const mode = (state as any).bracketMode as BracketMode;
      if (mode === 'top8') {
        const w = (state as any).sfWinners as Seed[];
        return [w[0], w[1]] as [Seed, Seed];
      }
      if (mode === 'top4') {
        const w = (state as any).qfWinners as Seed[];
        return [w[0], w[1]] as [Seed, Seed];
      }
      // top2
      return [(state as any).ranked[0], (state as any).ranked[1]] as [Seed, Seed];
    }
    return null;
  };

  const advanceLog = (winner: Seed, other: Seed, label: string) => {
    setState(prev => {
      if ('finalWinner' in prev) return prev;
      const base = prev as Exclude<TourneyState, { finalWinner: Seed | null }>;
      const newLog = [
        ...base.log,
        { round: label, left: { face: winner.face, seed: winner.seed }, right: { face: other.face, seed: other.seed }, chosen: winner.face }
      ];
      return { ...base, log: newLog };
    });
  };

  const pick = (winner: Seed, other: Seed, roundLabel: string) => {
    advanceLog(winner, other, roundLabel);

    setState(prev => {
      if ('finalWinner' in prev) return prev;
      const base = prev as Exclude<TourneyState, { finalWinner: Seed | null }>;
      const mode = base.bracketMode;

      // Quarterfinals
      if (base.stage.mode === 'qf') {
        const pairs = mode === 'top8' ? pairIndicesTop8 : mode === 'top4' ? pairIndicesTop4 : pairIndicesTop2;
        const idx = base.stage.index;
        const qfWinners = [...base.qfWinners, winner];

        // move to next QF or transition to SF/Final
        if (idx + 1 < pairs.length) {
          return { ...base, qfWinners, stage: { mode: 'qf', index: idx + 1 } };
        }
        // top8 -> SF
        if (mode === 'top8') {
          return { ...base, qfWinners, stage: { mode: 'sf', index: 0 } };
        }
        // top4 -> Final
        if (mode === 'top4') {
          return { ...base, qfWinners, stage: { mode: 'final' } };
        }
        // top2 -> Final already handled elsewhere, but for safety:
        return { ...base, qfWinners, stage: { mode: 'final' } };
      }

      // Semifinals (top8 only)
      if (base.stage.mode === 'sf') {
        const idx = base.stage.index;
        const sfWinners = [...base.sfWinners, winner];
        if (idx === 0) {
          return { ...base, sfWinners, stage: { mode: 'sf', index: 1 } };
        }
        // both SF done -> Final
        return { ...base, sfWinners, stage: { mode: 'final' } };
      }

      // Tournament Final -> crown overall champion, compute pureOneFace flag
      if (base.stage.mode === 'final') {
        const pureOneFace = !!(base.secondary && base.secondary.face === winner.face);
        return { finalWinner: winner, duels: base.log, secondaryFace: base.secondary || undefined, pureOneFace } as any;
      }

      return base;
    });
  };

  if ('finalWinner' in state) {
    return null; // redirecting
  }

  if (!(state as any).stage) {
    return (
      <div className="text-center py-8">
        <p className="text-white/70">Building bracket...</p>
      </div>
    );
  }

  const pair = currentPair();
  if (!pair) {
    return (
      <div className="text-center py-8">
        <p className="text-white/70">Preparing match...</p>
      </div>
    );
  }

  const [a, b] = pair;
  const stageLabel =
    (state as any).stage.mode === 'qf'
      ? ((state as any).bracketMode === 'top8' ? `Quarterfinal ${((state as any).stage.index + 1)}/4` : ((state as any).bracketMode === 'top4' ? `Semifinal ${((state as any).stage.index + 1)}/2` : 'Final'))
      : (state as any).stage.mode === 'sf'
      ? `Semifinal ${((state as any).stage.index + 1)}/2`
      : (state as any).stage.mode === 'final'
      ? 'Final — Tournament Crown'
      : 'Final — Champion vs Bye Champion';

  const roundLogLabel =
    (state as any).stage.mode === 'qf'
      ? ((state as any).bracketMode === 'top8' ? `QF-${(state as any).stage.index + 1}` : ((state as any).bracketMode === 'top4' ? `SF-${(state as any).stage.index + 1}` : 'Final'))
      : (state as any).stage.mode === 'sf'
      ? `SF-${(state as any).stage.index + 1}`
      : (state as any).stage.mode === 'final'
      ? 'Final'
      : 'Final';

  return (
    <DuelScreen
      title={stageLabel}
      a={a}
      b={b}
      onPick={(w) => pick(w, w.face === a.face ? b : a, roundLogLabel)}
    />
  );
};

const DuelScreen = ({ title, a, b, onPick }: { title: string; a: Seed; b: Seed; onPick: (winner: Seed) => void }) => {
  const [selectedWinner, setSelectedWinner] = useState<Seed | null>(null);

  // Reset selection when duel participants change
  useEffect(() => {
    setSelectedWinner(null);
  }, [a.face, b.face, a.seed, b.seed]);

  const handlePick = (winner: Seed) => setSelectedWinner(winner);
  const handleNext = () => {
    if (selectedWinner) onPick(selectedWinner);
  };

  return (
    <div className="fade-in">
      <h2 className="text-xl sm:text-2xl md:text-[28px] font-semibold tracking-tight text-balance text-center mb-4 sm:mb-6 px-2">{title}</h2>
      <div className="flex flex-row items-center justify-center gap-2 md:gap-4 min-h-[50vh]">
        <div className="flex-1 max-w-[400px]">
          <DuelCard key={`left-${a.face}-${a.seed}`} seed={a} onPick={() => handlePick(a)} isSelected={selectedWinner?.face === a.face} />
        </div>
        <div className="flex-shrink-0 relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-800/20 via-red-700/30 to-red-800/20 animate-pulse blur-sm scale-110" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-800/10 via-red-700/20 to-red-800/10 animate-ping blur-md scale-125" />
          <div className="relative w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-red-800 via-red-700 to-red-900 flex items-center justify-center shadow-[0_0_20px_rgba(127,29,29,0.5)] border-2 border-red-700/50">
            <span className="text-xs sm:text-base md:text-xl font-bold text-white tracking-wider">VS</span>
          </div>
        </div>
        <div className="flex-1 max-w-[400px]">
          <DuelCard key={`right-${b.face}-${b.seed}`} seed={b} onPick={() => handlePick(b)} isSelected={selectedWinner?.face === b.face} />
        </div>
      </div>
      <div className="fixed left-0 right-0 bottom-8 sm:bottom-12 z-30">
        <div className="flex justify-center px-4">
          <button
            className={`px-6 sm:px-8 py-3 sm:py-4 text-black font-semibold rounded-2xl relative overflow-hidden w-full sm:w-auto
                                 hover:scale-105 active:scale-[.98] transition-all duration-300 group
                                 focus:ring-2 focus:ring-yellow-400/60 focus:outline-none
                                 ${!selectedWinner ? 'opacity-60 pointer-events-none' : ''}`}
            style={{
              background: selectedWinner
                ? 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #7F1D1D 100%)'
                : 'linear-gradient(135deg, #F4D03F 0%, #F7DC6F 50%, #F4D03F 100%)',
              boxShadow: selectedWinner ? '0 0 20px rgba(127, 29, 29, 0.4)' : '0 0 20px rgba(244, 208, 63, 0.4)'
            }}
            onClick={handleNext}
            disabled={!selectedWinner}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative z-10">Next</span>
          </button>
        </div>
        <div className="flex justify-center mt-2">
          <p className="text-xs sm:text-sm text-center text-white/60 px-2">Choose who advances.</p>
        </div>
      </div>
    </div>
  );
};

const DuelCard = ({ seed, onPick, isSelected }: { seed: Seed; onPick: () => void; isSelected?: boolean }) => {
  const getSpotlightColor = (face: string) => {
    const RGB: Record<string, [number, number, number]> = {
      'Guardian': [13, 148, 136],
      'Spotlight': [163, 230, 53],
      'Partner': [236, 72, 153],
      'Catalyst': [245, 158, 11],
      'Provider': [45, 212, 191],
      'Diplomat': [94, 234, 212],
      'The Axiarch': [251, 191, 36],
      'Architect': [139, 92, 246],
      'Seeker': [103, 232, 249],
      'Visionary': [59, 130, 246],
      'Navigator': [168, 85, 247],
      'Sovereign': [245, 158, 11],
      'Rebel': [249, 115, 22],
      'Equalizer': [34, 197, 94],
      'Artisan': [125, 211, 252]
    };
    const [r, g, b] = RGB[face] ?? [125, 211, 252];
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
  };

  return (
    <button
      onClick={onPick}
      className={`group relative w-full text-left rounded-[20px] sm:rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-6 md:p-8
                       hover:bg-white/[0.05] transition will-change-transform
                       ${isSelected ? 'shadow-[0_12px_40px_rgba(0,0,0,.45)]' : ''}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPick();
        }
      }}
    >
      <div
        className="absolute inset-0 rounded-[16px] sm:rounded-[22px] opacity-100"
        style={{
          background: `radial-gradient(circle at center, ${getSpotlightColor(seed.face)} 0%, transparent 70%)`
        }}
      />

      <div
        className="relative rounded-[16px] sm:rounded-[22px] bg-black/15 p-4 sm:p-6 md:p-8 aspect-[3/4] flex items-center justify-center"
        style={{
          border: `1px solid ${isSelected ? 'rgba(127, 29, 29, 0.6)' : getSpotlightColor(seed.face).replace('0.15','0.30')}`
        }}
      >
        <Image
          src={FaceArt[seed.face]}
          alt={`${seed.face} emblem`}
          width={420}
          height={560}
          className="max-h-[320px] sm:max-h-[380px] md:max-h-[420px] object-contain mx-auto relative z-10"
          unoptimized
        />
      </div>
      <div className="mt-4 sm:mt-6">
        <div className="text-[10px] sm:text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
          {seed.face === 'Sovereign'
            ? 'Authority'
            : seed.face === 'Spotlight'
            ? 'Recognition'
            : seed.face === 'Rebel'
            ? 'Defiance'
            : seed.face === 'Artisan'
            ? 'Craft'
            : seed.face === 'Guardian'
            ? 'Protection'
            : seed.face === 'Navigator'
            ? 'Guidance'
            : seed.face === 'Visionary'
            ? 'Insight'
            : seed.face === 'Equalizer'
            ? 'Balance'
            : seed.face === 'Seeker'
            ? 'Discovery'
            : seed.face === 'Architect'
            ? 'Structure'
            : seed.face === 'Diplomat'
            ? 'Harmony'
            : seed.face === 'Partner'
            ? 'Loyalty'
            : seed.face === 'Provider'
            ? 'Support'
            : seed.face === 'Catalyst'
            ? 'Transformation'
            : 'Essence'}
        </div>

        <h3 className="font-bold text-white text-lg sm:text-xl md:text-2xl mb-2 sm:mb-3 relative">
          #{seed.seed} {seed.face}
          <div
            className="absolute -bottom-1 left-0 h-0.5 w-full"
            style={{
              background: `linear-gradient(90deg, ${isSelected ? 'rgba(127, 29, 29, 0.8)' : getSpotlightColor(seed.face).replace('0.15', '0.8')} 0%, transparent 100%)`
            }}
          />
        </h3>

        <p className="text-white/70 leading-relaxed italic text-xs sm:text-sm md:text-base">{FaceCopy[seed.face]}</p>
      </div>
      {isSelected && <div className="after:absolute after:inset-0 after:rounded-[20px] sm:after:rounded-[28px] after:border after:border-yellow-300/15" />}
    </button>
  );
};

// #endregion

// #region Sample Results Modal + Deterministic Generator (demo-only, seeded by face)
const ALL_FACES: string[] = [
  'Sovereign','Rebel','Visionary','Navigator','Equalizer','Guardian','Seeker','Architect','Diplomat','Spotlight','Partner','Provider','Artisan','Catalyst'
];
const FACE_EMOJI: Record<string, string> = {
  Sovereign: '👑', Rebel: '🦂', Visionary: '🔭', Navigator: '🧭', Equalizer: '⚖️', Guardian: '🛡️',
  Seeker: '🕵️', Architect: '📐', Diplomat: '🕊️', Spotlight: '🎯', Partner: '🤝', Provider: '🛠️',
  Artisan: '🧵', Catalyst: '⚡'
};

// Simple seeded RNG (xmur3 + mulberry32) for deterministic demos
function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}
function mulberry32(a: number) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
function seededRandom(seedStr: string) {
  const seed32 = xmur3(seedStr)();
  return mulberry32(seed32);
}

const SampleResultsModal = ({ onClose, onPick }: { onClose: () => void; onPick: (face: string) => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-w-4xl w-full bg-[#0b0b0b] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold">Sample Results</h3>
          <button className="text-white/60 hover:text-white text-sm" onClick={onClose}>Close</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {ALL_FACES.map(face => (
            <button
              key={face}
              className="group rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-2 sm:p-3 text-left flex items-center gap-1 sm:gap-2"
              onClick={() => onPick(face)}
            >
              <span className="text-lg sm:text-xl" aria-hidden>{FACE_EMOJI[face] || '🧩'}</span>
              <span className="underline decoration-dotted underline-offset-4 group-hover:text-white text-sm sm:text-base">
                {face}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/60">Deterministic demo: same face → same sample path every time.</p>
      </div>
    </div>
  );
};

// Infer which family an archetype belongs to
// const findFamilyForFace = (face: string): string => {
//   for (const fam of Object.keys(ARCHETYPES as any)) {
//     const def = (ARCHETYPES as any)[fam];
//     if (def?.L?.name === face || def?.R?.name === face) return fam;
//   }
//   // Fallbacks based on known pairs
//   const pairs: Record<string, string> = {
//     Sovereign: 'Control', Rebel: 'Control', Visionary: 'Pace', Navigator: 'Pace',
//     Equalizer: 'Boundary', Guardian: 'Boundary', Seeker: 'Truth', Architect: 'Truth',
//     Diplomat: 'Recognition', Spotlight: 'Recognition', Partner: 'Bonding', Provider: 'Bonding',
//     Artisan: 'Stress', Catalyst: 'Stress'
//   };
//   return pairs[face] || 'Control';
// };

// Weighted pick helper using seeded RNG (demo-only)
const pickWeightedSeeded = <T,>(items: T[], weights: number[], rnd: () => number): T => {
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let r = rnd() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
};

// Build a deterministic taps array by sampling PHASE1 and PHASE2 with bias toward the target face
const buildSampleTaps = (targetFace: string, rnd: () => number): Tap[] => {
  const taps: Tap[] = [] as any;
  let t = 0; // deterministic tick counter

  // const targetFamily = findFamilyForFace(targetFace);

  // PHASE 1: pick one option each deterministically with bias
  PHASE1.forEach((q) => {
    const choices = q.choices || [];
    const fam = q.family;
    const weights = choices.map((ch: any) => {
      const leanFace = (LEAN as any)[fam]?.[ch.detail];
      const bias = (leanFace === targetFace) ? 4 : 1;
      return bias;
    });
    const pick = pickWeightedSeeded(choices, weights, rnd);
    taps.push({ phase: 'P1', family: fam, mv: pick.mv, detail: pick.detail, ts: (t += 100) });
  });

  // PHASE 2: 14 binaries — two shown in app; replicate with deterministic selection (index-based)
  PHASE2.forEach((q, idx) => {
    const fam = q.family;
    const opts: any[] = [];
    if ((q as any).A) opts.push({ mv: 'A', ...(q as any).A });
    if ((q as any).S) opts.push({ mv: 'S', ...(q as any).S });
    if ((q as any).R) opts.push({ mv: 'R', ...(q as any).R });
    const shown = opts.length === 3 ? [opts[0], opts[(idx % 2) + 1]] : opts;
    const weights = shown.map((o: any) => {
      const leanFace = (LEAN as any)[fam]?.[o.detail];
      const bias = (leanFace === targetFace) ? 4 : 1;
      return bias;
    });
    const pick = pickWeightedSeeded(shown, weights, rnd);
    taps.push({ phase: 'P2', family: fam, mv: pick.mv, detail: pick.detail, ts: (t += 110) });
  });

  // Optional extra: add 3 tie-breaker taps in fixed family order with seeded pick for detail
  const extraFamilies = ['Control','Pace','Boundary','Truth','Recognition','Bonding','Stress'];
  for (let i = 0; i < 3; i++) {
    const fam = extraFamilies[i];
    const leanMap = (LEAN as any)[fam] || {};
    const entries = Object.keys(leanMap) as string[];
    const toward = entries.filter(d => leanMap[d] === targetFace);
    const idx = entries.length ? Math.floor(rnd() * (toward.length || entries.length)) : 0;
    const chosenDetail = (toward.length ? toward[idx] : entries[idx]) || 'A1a';
    const mv: 'A'|'S'|'R' = (chosenDetail.startsWith('A') ? 'A' : chosenDetail.startsWith('S') ? 'S' : 'R') as any;
    taps.push({ phase: 'P2', family: fam, mv, detail: chosenDetail, ts: (t += 120) });
  }

  return taps;
};

// Navigate with a deterministic sample stored in session
function generateSampleAndGoto(face: string) {
  const rnd = seededRandom('GZ-DEMO|' + face);
  const taps = buildSampleTaps(face, rnd);
  // Compute winner via full flow by letting results page do its normal logic;
  // we still store a minimal compatible shape.
  const finalWinner = { face, seed: 1 } as any;

  // Choose deterministic secondary partner using a fixed mapping, else first non-face alphabetically
  const PRIZE_LOCKS: Record<string, string> = {
    Sovereign: 'Diplomat', Rebel: 'Spotlight', Spotlight: 'Seeker', Diplomat: 'Architect',
    Seeker: 'Sovereign', Architect: 'Rebel', Visionary: 'Catalyst', Navigator: 'Artisan',
    Catalyst: 'Navigator', Artisan: 'Visionary', Equalizer: 'Provider', Guardian: 'Partner',
    Partner: 'Guardian', Provider: 'Equalizer'
  };
  const wanted = PRIZE_LOCKS[face];
  const pool = ALL_FACES.filter(f => f !== face).sort();
  const fallback = pool[0];
  const secondaryName = wanted || fallback;
  const secondaryFace = { face: secondaryName, seed: 2 } as any;

  const resultsData = {
    taps,
    finalWinner,
    duels: [],
    secondaryFace,
    pureOneFace: secondaryName === face
  };

  try {
    sessionStorage.setItem('quizResult', JSON.stringify(resultsData));
  } catch {}

  window.location.href = `/results/${face}`;
}

// #region Theory Page Component
const TheoryPage = () => (
  <div className="min-h-screen bg-black text-white p-8">
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">How Ground Zero Works</h1>
        <p className="text-xl text-white/70">Theory, Sources & Quiz Engine</p>
      </div>
      
      <div className="space-y-8">
        <div className="bg-white/5 rounded-lg p-8 border border-white/10">
          <h2 className="text-3xl font-bold mb-6">Theory, Sources & Methodology — Ground Zero Archetypes</h2>
          
          <div className="mb-6 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
            <p className="text-yellow-200 font-medium">
              <strong>What this page is:</strong> the concise, source-backed explainer of where Ground Zero archetypes come from, 
              how the quiz detects decision style (Act / Scan / Reset), and exactly how the engine turns taps into a 
              deterministic archetype result. No fluff, no mystical chest-beating — just the facts and the code behavior.
            </p>
          </div>

          <div className="space-y-8">
             <section>
               <h3 className="text-2xl font-semibold mb-4">Quick summary</h3>
               <p className="text-white/80 leading-relaxed">
                 Ground Zero maps Jung-inspired archetypal imagery onto observable and readable behavior 
                 through a deterministic quiz engine. The output is a primary archetype and a machine-picked secondary, 
                 seeded and ranked by evidence strength, not by random chance.
               </p>
             </section>

             <section>
               <h3 className="text-2xl font-semibold mb-4">How detection maps to meaning</h3>
               <ul className="space-y-2 text-white/80">
                 <li><strong>Frequency</strong> — more taps for a style → that style leads the family.</li>
                 <li><strong>Consistency</strong> — repeated taps across items increase confidence.</li>
                 <li><strong>Margin</strong> — the gap between top and second candidate matters (7 vs 6 is weaker than 7 vs 2).</li>
                 <li><strong>Cross-family echo</strong> — the same style dominating multiple families implies a global bias.</li>
                 <li><strong>Phase 2 locks</strong> — Phase 2 answers are explicit; they strengthen confidence and influence votes/probabilities used when seeding.</li>
               </ul>
               
               <div className="mt-4 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                 <p className="text-yellow-200 font-medium">
                   <strong>TL;DR</strong><br/>
                   • Act = you pick commit-and-move-now choices.<br/>
                   • Scan = you pick evaluate/verify/measure choices.<br/>
                   • Reset = you pick pivot/stop/switch choices.<br/>
                   <strong>Engine:</strong> count, compare, and seed the strongest styles; Phase 2 is the spotlight.
                 </p>
               </div>
             </section>

             <section>
               <h3 className="text-2xl font-semibold mb-4">Intellectual lineage (very short)</h3>
              <ul className="space-y-2 text-white/80">
                <li><strong>C.G. Jung — Archetypal theory</strong> (archetypes as recurring psychic patterns)</li>
                <li><strong>James Hillman — Archetypal psychology</strong> (imaginal & cultural framing)</li>
                <li><strong>Mark & Pearson — Brand archetypes</strong> (practical translation to roles/voice)</li>
                <li><strong>Big Five / NEO</strong> (empirical anchors for behavioral traits)</li>
                <li><strong>Org & behavioral research</strong> (applied validation for team dynamics)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold mb-4">The engine, in plain terms (what it actually reads)</h3>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">1. Every quiz item is tagged.</h4>
                  <p className="text-white/80">
                    Each question belongs to a <em>family</em> (domain) and every answer choice maps to one of Act / Scan / Reset. 
                    A user click becomes a <strong>tap</strong> recorded as <code className="bg-black/30 px-2 py-1 rounded">{`{ phase, family, mv, detail, ts }`}</code>.
                  </p>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">2. Per-family ledger.</h4>
                  <p className="text-white/80">
                    The engine tallies A/S/R taps per family. Those tallies form the family&apos;s raw evidence.
                  </p>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">3. Two-phase flow.</h4>
                  <ul className="text-white/80 space-y-1 ml-4">
                    <li><strong>Phase 1</strong> provides &quot;lean&quot; hints (broader, softer signal).</li>
                    <li><strong>Phase 2</strong> is the explicit A/S/R read. Phase 2 is treated as more deliberate and drives confidence in the family result.</li>
                  </ul>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">4. Family resolution.</h4>
                  <p className="text-white/80">
                    The resolver computes, per family: probabilities (<code className="bg-black/30 px-1 py-0.5 rounded">p</code> for each face), 
                    a winner face, and a confidence rating (User/High/Medium/Low). That becomes the <code className="bg-black/30 px-1 py-0.5 rounded">FamilyResult</code> used downstream.
                  </p>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">5. Seeds and deterministic tie-breaks.</h4>
                  <p className="text-white/80 mb-2">For each family winner the engine builds a seed object that includes:</p>
                  <ul className="text-white/80 space-y-1 ml-4">
                    <li><code className="bg-black/30 px-1 py-0.5 rounded">votes</code> (a small integer summarizing strength; derived from probability thresholds and confidence),</li>
                    <li><code className="bg-black/30 px-1 py-0.5 rounded">p</code> (face probability),</li>
                    <li><code className="bg-black/30 px-1 py-0.5 rounded">margin</code> (gap between the two faces in that family),</li>
                    <li><code className="bg-black/30 px-1 py-0.5 rounded">_tb</code> (a deterministic tie-breaker hash derived from the ordered taps and the face label).</li>
                  </ul>
                  <p className="text-white/80 mt-2">
                    The hash function is FNV-1a applied to the tap string; it guarantees a strict, stable order for ties.
                  </p>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">6. Ranking & wildcard.</h4>
                  <ul className="text-white/80 space-y-1 ml-4">
                    <li>Primary seeds = one winner per family.</li>
                    <li>Wildcard = the strongest runner-up across families (deterministically selected the same way).</li>
                    <li>Seeds are ranked by <code className="bg-black/30 px-1 py-0.5 rounded">(votes, p, margin, tie-breaker)</code>. This ordered list becomes the tournament bracket (Top-8 / Top-4 / Top-2 depending on how many strong seeds you have).</li>
                  </ul>
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">7. Tournament (duels).</h4>
                  <p className="text-white/80">
                    The bracket is fixed (no random shuffle). Users choose duel winners, but the initial seeding — which faces are on stage — 
                    is driven by the A/S/R ledger and the family resolution. The final champion is recorded and used as the quiz result; 
                    the system also records the machine-selected secondary (best runner-up).
                  </p>
                </div>
              </div>
            </section>


            <section>
              <h3 className="text-2xl font-semibold mb-4">Implementation details (what the code does — exact, for the curious)</h3>
              <ul className="space-y-2 text-white/80">
                <li><strong>Deterministic hashing:</strong> FNV-1a over a canonical tap string is used to produce <code className="bg-black/30 px-1 py-0.5 rounded">_tb</code>, a 32-bit tie-breaker hash. That prevents non-determinism when votes/p/probabilities/margins tie.</li>
                <li><strong>Seed ordering:</strong> seeds are compared by <code className="bg-black/30 px-1 py-0.5 rounded">(votes desc, p desc, margin desc, cmpSeedTB)</code>. Votes are <code className="bg-black/30 px-1 py-0.5 rounded">1 + (p &gt;= 0.6 ? 1 : 0) + (confidence in {'{'}High,User{'}'} ? 1 : 0)</code> capped at 3.</li>
                <li><strong>Wildcard selection:</strong> picks the strongest runner-up across families using the same deterministic comparator.</li>
                <li><strong>Bracket rules:</strong> prefer Top-8, else Top-4, else Top-2. Pairing is fixed via index table (no shuffles).</li>
                <li><strong>Phase flow:</strong> PHASE1 builds soft &quot;leans&quot;; PHASE2 supplies the direct A/S/R taps (two options shown per item in the UI so not all three are visible each time).</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold mb-4">What this means for product & diagnostics</h3>
              <ul className="space-y-2 text-white/80">
                <li><strong>Repeatability:</strong> same answers ⇒ same result every time. Determinism is baked in. No surprise winners.</li>
                <li><strong>Explainability:</strong> you can show the per-family ledger, seed scores, margins, and tie-break hashes to demonstrate <em>why</em> a face won.</li>
                <li><strong>Robustness:</strong> tie-breaker hashing + margin-aware ranking avoids flukes when evidence is thin.</li>
                <li><strong>Actionable output:</strong> the card and the one-line Signal are tuned to the winning face; the machine-picked secondary gives context and a potential partner/contrast archetype.</li>
              </ul>
            </section>

          </div>
        </div>
      </div>
    </div>
  </div>
);
// #endregion
