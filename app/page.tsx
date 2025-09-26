"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  PHASE1,
  PHASE2,
  FaceArt,
  FaceCopy,
  familyPair,
  PROB_WINDOW,
  MIN_FINALISTS,
  PROB_BACKOFF,
  resolveAllFamilies,
  Tap,
  FamilyResult,
  Seed,
  MatchLog
} from './quiz-data';
import Image from 'next/image';

// #region Helper Types and Functions
type BracketMode = 'top8' | 'top4' | 'top2';
type Stage =
  | { mode: 'qf'; index: number }           // quarterfinals (top8 or top4)
  | { mode: 'sf'; index: number }           // semifinals (top8 only)
  | { mode: 'final' }                       // tournament final
  | { mode: 'grand'; match: [Seed, Seed] }; // tournament winner vs bye champion

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

const fhash = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// Build a seed object for a specific face in a given family result
const seedFromFace = (fr: FamilyResult, face: string, taps: Tap[]): Omit<Seed, 'seed'> => {
  const pair = familyPair(fr.family);
  const p = (fr.probs as any)[face] ?? 0.5;
  let votes = 1 + (p >= 0.6 ? 1 : 0) + ((fr.confidence === 'High' || fr.confidence === 'User') ? 1 : 0);
  if (votes > 3) votes = 3;
  const margin = Math.abs(((fr.probs as any)[pair.left] ?? 0) - ((fr.probs as any)[pair.right] ?? 0));
  const tb = fhash(taps.map(t => `${t.family[0]}:${t.mv}:${t.detail}`).join('|') + '|' + face);
  return { face, family: fr.family, votes, p, margin, _tb: tb };
};

// Old hybrid pool used to compute the â€œbye championâ€ (internal systemâ€™s top pick)
const makeSeedsHybridPool = (familyResults: FamilyResult[], taps: Tap[]): Seed[] => {
  const seeded = familyResults
    .map(fr => seedFromFace(fr, fr.winner, taps))
    .sort(
      (a, b) =>
        (b.votes - a.votes) ||
        (b.p - a.p) ||
        (b.margin - a.margin) ||
        ((a._tb % 997) - (b._tb % 997))
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

// Ranked list for the actual tournament: 7 winners + 1 wildcard (best runner-up) = Top-8.
// Falls back to Top-4 or Top-2 automatically when you donâ€™t have enough.
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

  // Pick the strongest runner-up
  const bestRunner = runnerUps.sort(
    (a, b) =>
      (b.votes - a.votes) ||
      (b.p - a.p) ||
      (b.margin - a.margin) ||
      ((a._tb % 997) - (b._tb % 997))
  )[0];

  // Combine and rank
  const combined = bestRunner ? [...winners, bestRunner] : [...winners];

  const ranked = combined
    .sort(
      (a, b) =>
        (b.votes - a.votes) ||
        (b.p - a.p) ||
        (b.margin - a.margin) ||
        ((a._tb % 997) - (b._tb % 997))
    )
    .map((s, i) => ({ ...s, seed: i + 1 })); // faces detected + 1, and seeds start at 1

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

// Machine-selected secondary face: best runner-up across families (same sort as ranking)
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
      ((a._tb % 997) - (b._tb % 997))
  );
  const best = runnerUps[0];
  if (!best) return null;
  const match = ranked.find(s => s.face === best.face);
  return match || ({ ...best, seed: 0 } as Seed);
};
// Pairing helpers
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

// #endregion

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

  // Keyboard flow (P1/P2 only; Phase 3 removed)
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

      if (e.key === 'Enter' && selectedOption) {
        e.preventDefault();
        // no-op: advance handled in handleOptionClick
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
    const done = gameState.p1Index + gameState.p2Index;
    if (gameState.phase === 'end') return 100;
    if (gameState.phase === 'intro') return 0;
    return Math.round(100 * done / total);
  }, [gameState]);

  const isTournamentPhase = gameState.phase === 'end';
  const inIntro = gameState.phase === 'intro';

  return (
    <div className={inIntro ? '' : 'max-w-3xl mx-auto px-4 md:px-6 py-2 md:py-4 space-y-8 -mt-10'}>
      <div role="status" aria-live="polite" className="sr-only">
        {gameState.phase !== 'intro' &&
          gameState.phase !== 'end' &&
          `Question ${gameState.p1Index + gameState.p2Index + 1}/${PHASE1.length + PHASE2.length}`}
      </div>

      {!inIntro && !isTournamentPhase && (
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

      {!inIntro && !isTournamentPhase && (
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

      <div id="stage" className={inIntro ? '' : 'min-h-[500px]'}>
        <div style={isFading ? { opacity: 0, transition: 'opacity 90ms ease-out' } : { opacity: 1, transition: 'opacity 120ms ease-out' }}>
          {renderContent()}
        </div>
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
        <img src="/THE-Axiarch.png" alt="Ground Zero Emblem" />
      </div>
      <h1>Ground Zero</h1>
      <p className="lead">
        The only diagnostic quiz that reveals <em>how you think</em>, not just what you are.
      </p>
      <div className="mt-4">
        <button className="btn" onClick={onStart}>
          Begin
        </button>
      </div>
    </section>

    <section className="section">
      <div className="cols">
        <div>
          <div className="kicker">About</div>
          <h2>Not Another Personality Test</h2>
          <div className="divider" />
          <p className="p">Most quizzes hand you a random label. Theyâ€™re built on shallow point systems that shift with every attempt.</p>
          <p className="p">
            Ground Zero is <b>deterministic</b>. Same choices, same results â€” always. It captures the logic of how you decide: the patterns,
            pauses, and resets that shape your moves in the real world.
          </p>
          <p className="p">Transparent. Fair. Un-gameable.</p>

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
              <div className="muted">With proof</div>
            </div>
          </div>
        </div>

        <div>
          <div className="kicker">Why itâ€™s different</div>
          <h2>What powers the insight</h2>
          <div className="divider" />
          <div className="mini">
            <div className="card">
              <h3>Evidence, not vibes</h3>
              <div className="muted">Multi-phase questions build a replayable record of your logic.</div>
            </div>
            <div className="card">
              <h3>Deterministic</h3>
              <div className="muted">Same inputs, same outputs. No randomness, no mood swings.</div>
            </div>
            <div className="card">
              <h3>Fair by design</h3>
              <div className="muted">Clear rules, rotated tie breaks, and transparent weights.</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div className="separator" role="presentation" />

    <section className="cta">
      <button className="btn" onClick={onStart}>
        Start the 5-minute assessment
      </button>
      <div className="note">No sign-up required. Youâ€™ll see your decision-making fingerprint at the end.</div>
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
      <fieldset className="space-y-6">
        <legend className="text-2xl md:text-[28px] font-semibold tracking-tight text-balance">{question.stem}</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {question.choices.map((ch: any, index: number) => (
            <div key={index} className="h-full">
              <label
                className="group relative cursor-pointer rounded-xl border border-white/8 bg-white/[0.03] p-4 question-card-backlight
                                               hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:border-yellow-400/30 
                                               active:scale-[.99] active:border-0 transition-all duration-150 will-change-transform
                                               focus-visible:ring-2 focus-visible:ring-yellow-300/60 h-full flex flex-col
                                               data-[selected=true]:border-yellow-400/40 data-[selected=true]:bg-yellow-400/5"
              >
                <input
                  type="radio"
                  name={`q${qNum}`}
                  value={ch.detail}
                  className="sr-only"
                  onKeyDown={e => onKey(e, ch.mv, ch.detail, question.family)}
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
      <fieldset className="space-y-6">
        <legend className="text-2xl md:text-[28px] font-semibold tracking-tight text-balance">{question.stem}</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {shown.map((o: any, idx: number) => (
            <div key={idx} className="h-full">
              <label
                className="group relative cursor-pointer rounded-xl border border-white/8 bg-white/[0.03] p-4 question-card-backlight
                                               hover:translate-y-[-2px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:border-yellow-400/30 
                                               active:scale-[.99] active:border-0 transition-all duration-150 will-change-transform
                                               focus-visible:ring-2 focus-visible:ring-yellow-300/60 h-full flex flex-col
                                               data-[selected=true]:border-yellow-400/40 data-[selected=true]:bg-yellow-400/5"
              >
                <input
                  type="radio"
                  name={`q${qNum}`}
                  value={o.detail}
                  className="sr-only"
                  onKeyDown={e => onKey(e, o.mv, o.detail, question.family)}
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

const EndScreen = ({ taps, router }: { taps: Tap[]; onRestart: () => void; router: any }) => {
  const [state, setState] = useState<TourneyState>({ finalWinner: null });

  // Build bracket + bye champion on mount
  useEffect(() => {
    const familyResults = resolveAllFamilies(taps);

    // Ranked tournament seeds: 7 winners + 1 wildcard
    const ranked = makeSeedsRanked(familyResults, taps);

    // Internal system pool, take top as â€œbye championâ€

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
      sessionStorage.setItem('quizResult', JSON.stringify(resultsData));
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
      // semifinals only exist for top8
      // SF pairs: [w0 vs w1], [w2 vs w3]
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
      ? 'Final â€” Tournament Crown'
      : 'Final â€” Champion vs Bye Champion';

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

  const handlePick = (winner: Seed) => setSelectedWinner(winner);
  const handleNext = () => {
    if (selectedWinner) onPick(selectedWinner);
  };

  return (
    <div className="fade-in">
      <h2 className="text-2xl md:text-[28px] font-semibold tracking-tight text-balance text-center mb-6">{title}</h2>
      <div className="flex items-center justify-center gap-2 md:gap-4">
        <div className="flex-1 max-w-[400px]">
          <DuelCard key={`left-${a.face}-${a.seed}`} seed={a} onPick={() => handlePick(a)} isSelected={selectedWinner?.face === a.face} />
        </div>
        <div className="flex-shrink-0 relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-800/20 via-red-700/30 to-red-800/20 animate-pulse blur-sm scale-110" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-800/10 via-red-700/20 to-red-800/10 animate-ping blur-md scale-125" />
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-red-800 via-red-700 to-red-900 flex items-center justify-center shadow-[0_0_20px_rgba(127,29,29,0.5)] border-2 border-red-700/50">
            <span className="text-lg md:text-xl font-bold text-white tracking-wider">VS</span>
          </div>
        </div>
        <div className="flex-1 max-w-[400px]">
          <DuelCard key={`right-${b.face}-${b.seed}`} seed={b} onPick={() => handlePick(b)} isSelected={selectedWinner?.face === b.face} />
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
      className={`group relative w-full text-left rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8
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
        className="absolute inset-0 rounded-[22px] opacity-100"
        style={{
          background: `radial-gradient(circle at center, ${getSpotlightColor(seed.face)} 0%, transparent 70%)`
        }}
      />

      <div
        className="relative rounded-[22px] bg-black/15 p-6 md:p-8 aspect-[3/4] flex items-center justify-center"
        style={{
          border: `1px solid ${isSelected ? 'rgba(127, 29, 29, 0.6)' : getSpotlightColor(seed.face).replace('0.15','0.30')}`
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
        <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
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

        <h3 className="font-bold text-white text-xl md:text-2xl mb-3 relative">
          #{seed.seed} {seed.face}
          <div
            className="absolute -bottom-1 left-0 h-0.5 w-full"
            style={{
              background: `linear-gradient(90deg, ${isSelected ? 'rgba(127, 29, 29, 0.8)' : getSpotlightColor(seed.face).replace('0.15', '0.8')} 0%, transparent 100%)`
            }}
          />
        </h3>

        <p className="text-white/70 leading-relaxed italic text-sm md:text-base">{FaceCopy[seed.face]}</p>
      </div>
      {isSelected && <div className="after:absolute after:inset-0 after:rounded-[28px] after:border after:border-yellow-300/15" />}
    </button>
  );
};

// #endregion