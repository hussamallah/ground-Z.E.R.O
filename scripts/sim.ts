import {
  EngineConfig, EngineState,
  initState, buildOptions, recordShown, answerPick,
  defaultAnchors
} from "../lib/engine";

function mulberry32(seed: number) {
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
] as const;

function runSim(cfg: EngineConfig, seed = 42) {
  const rng = mulberry32(seed);
  let st: EngineState = initState();
  const anchors = defaultAnchors(cfg.K);

  const exposure: Record<string, number> = {};
  const picks: Record<string, number> = {};
  cfg.faces.forEach(f => { exposure[f] = 0; picks[f] = 0; });

  for (let q = 0; q < cfg.totalQuestions; q++) {
    const options = buildOptions({ ...cfg, ...st }, anchors);

    st = recordShown(st, options);
    options.forEach(o => exposure[o]++);

    const familiar = options.find(o => st.picks.includes(o));
    let pick: string;
    if (familiar && rng() < 0.7) pick = familiar;
    else pick = options[Math.floor(rng() * options.length)];

    picks[pick]++;
    st = answerPick(st, pick);
    if (st.qIndex >= cfg.totalQuestions) break;
  }

  const sortedExposure = Object.entries(exposure).sort((a,b) => a[0].localeCompare(b[0]));
  const sortedPicks = Object.entries(picks).sort((a,b) => b[1]-a[1]);

  const maxExpo = Math.max(...Object.values(exposure));
  const minExpo = Math.min(...Object.values(exposure));
  const fairnessSpread = maxExpo - minExpo;

  console.log("\n=== SIM RESULTS ===");
  console.log(`Questions: ${cfg.totalQuestions}, K=${cfg.K}`);
  console.log(`Main Face: ${st.mainFace ?? "—"} | Secondary: ${st.secondaryFace ?? "—"}`);
  console.log(`Banned: ${Array.from(st.banned).join(", ") || "—"}`);
  console.log("\nExposure per face:");
  for (const [f, n] of sortedExposure) console.log(`${f.padEnd(12)} ${String(n).padStart(2)}`);
  console.log(`\nFairness spread (max-min exposure): ${fairnessSpread}`);
  console.log("\nPick counts:");
  for (const [f, n] of sortedPicks) if (n) console.log(`${f.padEnd(12)} ${n}`);

  console.log("\nBlock picks (triplets):");
  for (let i = 0; i < st.picks.length; i += 3) {
    const block = st.picks.slice(i, i + 3);
    console.log(`B${Math.floor(i/3)+1}: ${block.join(", ")}`);
  }
}

const cfg: EngineConfig = {
  faces: [...FACES],
  K: Number(process.env.K || 4),
  totalQuestions: Number(process.env.QS || 21),
};

runSim(cfg, Number(process.env.SEED || 42));


