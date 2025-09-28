export type Archetype = string;

export interface EngineConfig {
  faces: Archetype[];
  K: number;
  totalQuestions: number;
}

export interface EngineState {
  qIndex: number;
  picks: Archetype[];
  shown: Map<Archetype, number>;
  lastSeenAt: Map<Archetype, number>;
  hitCount: Map<Archetype, number>;
  banned: Set<Archetype>;
  mainFace?: Archetype;
  secondaryFace?: Archetype;
}

export interface BuildContext extends EngineConfig, EngineState {}

export type AnchorPlan = (qIndex: number, picks: Archetype[]) => {
  mustInclude: Archetype[];
  mustAvoidTogether: [Archetype, Archetype][];
};

export function defaultAnchors(K: number): AnchorPlan {
  return (qIndex, picks) => {
    const inBlock = qIndex % 3; // 0,1,2
    const prevBlockStart = Math.floor((qIndex - 1) / 3) * 3;
    const blockHasHistory = prevBlockStart >= 0 && picks.length >= prevBlockStart + 3;

    const mustInclude: Archetype[] = [];
    if (blockHasHistory) {
      const trio = picks.slice(prevBlockStart, prevBlockStart + 3);
      const pick = trio[inBlock] ?? trio[0];
      if (pick) mustInclude.push(pick);
    }
    return { mustInclude, mustAvoidTogether: [] };
  };
}

export function initState(): EngineState {
  return {
    qIndex: 0,
    picks: [],
    shown: new Map(),
    lastSeenAt: new Map(),
    hitCount: new Map(),
    banned: new Set(),
  };
}

function violatesPairs(current: Archetype[], next: Archetype, rules: [Archetype, Archetype][]) {
  return rules.some(([x, y]) => (next === x && current.includes(y)) || (next === y && current.includes(x)));
}

export function buildOptions(
  ctx: BuildContext,
  anchorsByBlock: AnchorPlan
): Archetype[] {
  const { faces, K, qIndex, shown, lastSeenAt, banned, picks } = ctx;

  const { mustInclude, mustAvoidTogether } = anchorsByBlock(qIndex, picks);
  const candidatePool = faces.filter(f => !banned.has(f));

  candidatePool.sort((a, b) => {
    const sa = shown.get(a) ?? 0;
    const sb = shown.get(b) ?? 0;
    if (sa !== sb) return sa - sb;
    const la = lastSeenAt.get(a) ?? -1;
    const lb = lastSeenAt.get(b) ?? -1;
    return la - lb;
  });

  const lineup: Archetype[] = [];

  for (const a of mustInclude) {
    if (!lineup.includes(a) && !banned.has(a)) lineup.push(a);
  }

  for (const c of candidatePool) {
    if (lineup.length >= K) break;
    if (lineup.includes(c)) continue;
    if (violatesPairs(lineup, c, mustAvoidTogether)) continue;
    lineup.push(c);
  }

  while (lineup.length < K && candidatePool.length) {
    const c = candidatePool.find(x => !lineup.includes(x));
    if (!c) break;
    lineup.push(c);
  }

  return lineup.slice(0, K);
}

export function answerPick(state: EngineState, pick: Archetype): EngineState {
  const s: EngineState = {
    ...state,
    picks: state.picks.concat(pick),
    hitCount: new Map(state.hitCount),
    banned: new Set(state.banned),
    shown: new Map(state.shown),
    lastSeenAt: new Map(state.lastSeenAt),
  };

  const n = (s.hitCount.get(pick) ?? 0) + 1;
  s.hitCount.set(pick, n);

  if (n === 3) {
    s.banned.add(pick);
    if (!s.mainFace) s.mainFace = pick;
    else if (!s.secondaryFace && pick !== s.mainFace) s.secondaryFace = pick;
  }

  s.qIndex += 1;
  return s;
}

export function recordShown(state: EngineState, options: Archetype[]): EngineState {
  const s: EngineState = {
    ...state,
    shown: new Map(state.shown),
    lastSeenAt: new Map(state.lastSeenAt),
  };
  options.forEach(o => {
    s.shown.set(o, (s.shown.get(o) ?? 0) + 1);
    s.lastSeenAt.set(o, state.qIndex);
  });
  return s;
}


