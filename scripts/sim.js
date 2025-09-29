// Zero-dependency headless simulator matching the UI rules

function defaultAnchors(K) {
  return (qIndex, picks) => {
    const inBlock = qIndex % 3; // 0,1,2
    const prevBlockStart = Math.floor((qIndex - 1) / 3) * 3;
    const blockHasHistory = prevBlockStart >= 0 && picks.length >= prevBlockStart + 3;

    const mustInclude = [];
    if (blockHasHistory) {
      const trio = picks.slice(prevBlockStart, prevBlockStart + 3);
      const pick = trio[inBlock] ?? trio[0];
      if (pick) mustInclude.push(pick);
    }
    return { mustInclude, mustAvoidTogether: [] };
  };
}

function initState() {
  return {
    qIndex: 0,
    picks: [],
    shown: new Map(),
    lastSeenAt: new Map(),
    hitCount: new Map(),
    banned: new Set(),
    mainFace: undefined,
    secondaryFace: undefined,
  };
}

function violatesPairs(current, next, rules) {
  return rules.some(([x, y]) => (next === x && current.includes(y)) || (next === y && current.includes(x)));
}

const MIN_GAP = 1;

// ring/seed helpers to mirror UI tiebreak
function rotate(arr, by) { const n = arr.length; if (!n) return arr; const k = ((by % n) + n) % n; return arr.slice(k).concat(arr.slice(0, k)); }
function fhash(s) { let h = 2166136261 >>> 0; for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h>>>0; }

function buildOptions(ctx, anchorsByBlock, forbiddenPairsSet, ring, seedEchoBudget, seedEchoExpireBlock, headWins, rng) {
  const { faces, K, qIndex, shown, lastSeenAt, banned, picks } = ctx;

  let { mustInclude, mustAvoidTogether } = anchorsByBlock(qIndex, picks);
  const pairSet = new Set(forbiddenPairsSet || []);
  // Block 1 exposure matches UI: fixed 4-face slices
  if (qIndex < 3) {
    const b1 = [
      faces.slice(0, 4),
      faces.slice(4, 8),
      faces.slice(8, 12)
    ];
    return b1[qIndex] ?? faces.slice(0, K);
  }

  // Diversify early blocks: in block 2 (Q4-6), swap the middle spotlight to a fresh low-shown face
  const blockIdx = Math.floor(qIndex / 3);
  const inBlock = qIndex % 3;
  if (blockIdx === 1 && inBlock === 1) {
    const prevTrio = picks.slice(0, 3);
    const fresh = faces
      .filter(f => !banned.has(f) && !prevTrio.includes(f))
      .sort((a, b) => {
        const d = (shown.get(a) ?? 0) - (shown.get(b) ?? 0);
        if (d) return d;
        const la = lastSeenAt.get(a) ?? -1;
        const lb = lastSeenAt.get(b) ?? -1;
        return la - lb;
      })[0];
    if (fresh) mustInclude = [fresh];
  }

  const candidatePool = faces.filter(f => !banned.has(f));

  // baseline fairness order: strict deficit-first (least shown), then oldest-seen
  const order = candidatePool.slice().sort((a, b) => {
    const sa = shown.get(a) ?? 0;
    const sb = shown.get(b) ?? 0;
    if (sa !== sb) return sa - sb;
    const la = lastSeenAt.get(a) ?? -1;
    const lb = lastSeenAt.get(b) ?? -1;
    return la - lb;
  });

  const lineup = [];

  for (const a of mustInclude) {
    if (!lineup.includes(a) && !banned.has(a)) lineup.push(a);
  }

  // Prefer seed echo faces first among equals
  const tryPlace = (preferSeed) => {
    const minShown = Math.min(...order.map(f => shown.get(f) ?? 0));
    for (const c of order) {
      if (lineup.length >= K) break;
      if (lineup.includes(c)) continue;
      // spacing rule (skip if seen too recently)
      const lastSeen = lastSeenAt.get(c) ?? -999;
      if (qIndex - lastSeen < MIN_GAP) continue;
      // forbidden pairs (global + anchor-local)
      const globalPairs = Array.from(pairSet).map(k => k.split('|'));
      if (violatesPairs(lineup, c, mustAvoidTogether)) continue;
      if (violatesPairs(lineup, c, globalPairs)) continue;
      if (preferSeed) {
        // Only apply seed echo to faces tied at the minimum shown to preserve fairness
        if ((shown.get(c) ?? 0) === minShown && (seedEchoBudget[c] ?? 0) > 0 && (seedEchoExpireBlock[c] ?? -1) >= Math.floor(qIndex / 3)) {
          lineup.push(c);
        }
      } else {
        lineup.push(c);
      }
    }
  };

  // seed-first pass
  tryPlace(true);
  // normal pass
  tryPlace(false);

  // gentle relax (ignoring spacing but still pair rules)
  for (const c of order) {
    if (lineup.length >= K) break;
    if (lineup.includes(c)) continue;
    const globalPairs = Array.from(pairSet).map(k => k.split('|'));
    if (violatesPairs(lineup, c, mustAvoidTogether)) continue;
    if (violatesPairs(lineup, c, globalPairs)) continue;
    lineup.push(c);
  }

  return lineup.slice(0, K);
}

function answerPick(state, pick, mainThreshold = 4, secondaryThreshold = 3) {
  const s = {
    ...state,
    picks: state.picks.concat(pick),
    hitCount: new Map(state.hitCount),
    banned: new Set(state.banned),
    shown: new Map(state.shown),
    lastSeenAt: new Map(state.lastSeenAt),
    mainFace: state.mainFace,
    secondaryFace: state.secondaryFace,
  };

  const n = (s.hitCount.get(pick) ?? 0) + 1;
  s.hitCount.set(pick, n);

  // lock main first-to-4
  if (!s.mainFace && n >= mainThreshold) {
    s.mainFace = pick;
    s.banned.add(pick);
  } else if (s.mainFace && !s.secondaryFace && pick !== s.mainFace && n >= secondaryThreshold) {
    // lock secondary at 3 (!= main)
    s.secondaryFace = pick;
    s.banned.add(pick);
  }

  s.qIndex += 1;
  return s;
}

function recordShown(state, options) {
  const s = {
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

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FACES = [
  "Sovereign","Rebel","Visionary","Navigator","Guardian","Seeker",
  "Architect","Spotlight","Diplomat","Partner","Provider","Vessel",
];

function runSim(cfg, seed = 42, jsonMode = false) {
  const rng = mulberry32(seed);
  let st = initState();
  const anchors = defaultAnchors(cfg.K);
  const forbiddenPairs = new Set(); // string keys sorted as a|b
  // seed echo state
  const seedEchoBudget = Object.fromEntries(cfg.faces.map(f => [f, 0]));
  const seedEchoExpireBlock = Object.fromEntries(cfg.faces.map(f => [f, -1]));
  // head-to-head memory: which face tended to win within a co-appearance
  const headWins = new Map(); // key a|b -> {winner}
  let suddenDeath = false;
  // cycle planning: cover all 12 faces exactly once per cycle (size = faces.length / K)
  const cycleLen = Math.ceil(cfg.faces.length / cfg.K);
  let cyclePlan = [];
  let usedThisCycle = new Set();

  const exposure = {};
  const picks = {};
  cfg.faces.forEach(f => { exposure[f] = 0; picks[f] = 0; });

  for (let q = 0; q < cfg.totalQuestions; q++) {
    // Start a new cycle every cycleLen questions
    if (st.qIndex % cycleLen === 0) {
      const ring = rotate(cfg.faces, fhash(JSON.stringify(st.picks)) % cfg.faces.length);
      cyclePlan = [];
      for (let i = 0; i < cycleLen; i++) {
        cyclePlan.push(ring.slice(i * cfg.K, (i + 1) * cfg.K));
      }
      usedThisCycle = new Set();
    }

    // Build options from cycle plan, substituting banned or used faces with deficit-first fillers
    const ring = rotate(cfg.faces, fhash(JSON.stringify(st.picks)) % cfg.faces.length);
    const base = (cyclePlan[st.qIndex % cycleLen] || []).slice();
    let options = base.filter(f => !st.banned.has(f) && !usedThisCycle.has(f));
    if (options.length < cfg.K) {
      // deficit-first fillers
      const order = cfg.faces
        .filter(f => !st.banned.has(f) && !usedThisCycle.has(f) && !options.includes(f))
        .sort((a, b) => {
          const sa = st.shown.get(a) ?? 0;
          const sb = st.shown.get(b) ?? 0;
          if (sa !== sb) return sa - sb;
          const la = st.lastSeenAt.get(a) ?? -1;
          const lb = st.lastSeenAt.get(b) ?? -1;
          return la - lb;
        });
      for (const f of order) {
        if (options.length >= cfg.K) break;
        const lastSeen = st.lastSeenAt.get(f) ?? -999;
        if (st.qIndex - lastSeen < MIN_GAP) continue;
        options.push(f);
      }
    }
    // record exposure
    st = recordShown(st, options);
    options.forEach(o => { exposure[o] = (exposure[o] ?? 0) + 1; usedThisCycle.add(o); });

    const familiar = options.find(o => st.picks.includes(o));
    let pick;
    if (familiar && rng() < 0.7) pick = familiar;
    else pick = options[Math.floor(rng() * options.length)];

    picks[pick]++;
    const beforeMain = st.mainFace;
    const beforeSecondary = st.secondaryFace;
    st = answerPick(st, pick, 4, 3);
    // If someone other than main exceeded 3 without locking (more than one at >=3 while secondary not chosen), flag sudden death
    const overThree = Array.from(st.hitCount.values()).filter(n => n >= 3).length;
    if (!beforeSecondary && !st.secondaryFace && overThree > 2) suddenDeath = true;
    // end-of-block: add co-picked pairs to forbidden set
    if (st.qIndex % 3 === 0 && st.picks.length >= 3) {
      const block = st.picks.slice(st.picks.length - 3);
      for (let i = 0; i < block.length; i++) {
        for (let j = i + 1; j < block.length; j++) {
          const [a, b] = [block[i], block[j]].sort();
          forbiddenPairs.add(`${a}|${b}`);
          // update head-to-head winner heuristic: last picked face in the block wins over earlier ones
          const winner = block[j];
          headWins.set(`${a}|${b}`, { winner });
        }
      }
      // seed echo: any face that had its solo this block gets an echo for next block
      const blockIdx = Math.floor((st.qIndex - 1) / 3);
      block.forEach(f => { seedEchoBudget[f] = 1; seedEchoExpireBlock[f] = blockIdx + 1; });
    }
    // stop only at cycle boundary when both locks obtained
    if (st.mainFace && st.secondaryFace && (st.qIndex % cycleLen === 0)) break;
    if (st.qIndex >= cfg.totalQuestions) break;
  }

  const sortedExposure = Object.entries(exposure).sort((a,b) => a[0].localeCompare(b[0]));
  const sortedPicks = Object.entries(picks).sort((a,b) => b[1]-a[1]);

  const maxExpo = Math.max(...Object.values(exposure));
  const minExpo = Math.min(...Object.values(exposure));
  const fairnessSpread = maxExpo - minExpo;

  const blocks = [];
  for (let i = 0; i < st.picks.length; i += 3) {
    const block = st.picks.slice(i, i + 3);
    blocks.push(block);
  }

  const result = {
    seed,
    K: cfg.K,
    totalQuestions: st.qIndex, // actual number of questions asked
    main: st.mainFace ?? null,
    secondary: st.secondaryFace ?? null,
    banned: Array.from(st.banned),
    exposure,
    picks,
    fairnessSpread,
    blocks,
    suddenDeath
  };

  if (jsonMode) {
    return result;
  }

  console.log("\n=== SIM RESULTS ===");
  console.log(`Questions: ${result.totalQuestions}, K=${cfg.K}`);
  console.log(`Main Face: ${result.main ?? "—"} | Secondary: ${result.secondary ?? "—"}`);
  console.log(`Banned: ${result.banned.join(", ") || "—"}`);
  console.log("\nExposure per face:");
  for (const [f, n] of sortedExposure) console.log(`${f.padEnd(12)} ${String(n).padStart(2)}`);
  console.log(`\nFairness spread (max-min exposure): ${fairnessSpread}`);
  console.log("\nPick counts:");
  for (const [f, n] of sortedPicks) if (n) console.log(`${f.padEnd(12)} ${n}`);
  console.log("\nBlock picks (triplets):");
  blocks.forEach((b, idx) => console.log(`B${idx+1}: ${b.join(", ")}`));
  return result;
}

const runs = Number(process.env.RUNS || 10);
const K = Number(process.env.K || 4);
const totalQuestions = Number(process.env.QS || 21);
const baseSeed = Number(process.env.SEED || 42);
const jsonFlag = String(process.env.JSON || "false").toLowerCase() === "true" || process.env.JSON === "1";
const jsonFormat = String(process.env.JSON_FORMAT || "summary"); // summary | ndjson | array

const outcomeCounts = new Map(); // key: main|secondary
const allResults = [];

for (let r = 0; r < runs; r++) {
  const cfg = { faces: [...FACES], K, totalQuestions };
  const res = runSim(cfg, baseSeed + r, jsonFlag);
  if (jsonFlag) {
    allResults.push(res);
    const key = `${res.main || "null"}|${res.secondary || "null"}`;
    outcomeCounts.set(key, (outcomeCounts.get(key) || 0) + 1);
  }
}

if (jsonFlag) {
  if (runs === 1) {
    console.log(JSON.stringify(allResults[0] || null));
  } else if (jsonFormat === "ndjson") {
    for (const r of allResults) console.log(JSON.stringify(r));
  } else if (jsonFormat === "array") {
    console.log(JSON.stringify(allResults));
  } else {
    const pairCounts = Array.from(outcomeCounts.entries()).map(([k, v]) => ({ pair: k, count: v }))
      .sort((a, b) => b.count - a.count);
    const summary = {
      runs,
      K,
      totalQuestions,
      uniquePairs: pairCounts.length,
      pairCounts,
    };
    console.log(JSON.stringify(summary));
  }
}



