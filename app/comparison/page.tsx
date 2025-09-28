"use client";
import Link from "next/link";

export default function ComparisonPage() {
  const rows: [string, string, string, string][] = [
    ["Core mechanism", "Deterministic cycle engine; Q1→Q2→Q3 coverage, K=4 floor", "Fixed dichotomies", "Likert trait scales"],
    ["Output shape", "Main + Secondary → 144 combos", "Single 4-letter type (16)", "Five continuous scores"],
    ["Scoring", "+1 per pick, first-to-3 locks", "Opaque tallies per axis", "Summed/weighted items"],
    ["Determinism", "Same taps = same result; ledger replay", "Deterministic; hidden tie rules", "Deterministic"],
    ["Coverage policy", "Q1: 5; Q2: seed + 4 unseen; Q3: remainder", "Not applicable", "Broad item pools"],
    ["Tie handling", "Interactive duel/tri-duel at cap", "Hidden defaults", "Not needed (continuous)"],
    ["Verification step", "Axis Probe → PURE/WOBBLE/OFF", "None", "None (standard forms)"],
    ["Audit trail", "Full taps + exposures (export)", "Rarely exposed", "Scores/facets only"],
    ["Reliability stance", "Runtime determinism; user retest + micro-alignment", "Mixed test–retest", "Strong psychometrics"],
    ["Adaptivity", "Seeded progression; convergence after Q6", "Static", "Static; some CAT variants"],
    ["Item burden", "≤ 21 Q (+3 probe)", "~93 items (Form M)", "50–240 items"],
    ["Bias controls", "Coverage + K floor; transparent ties", "Self-report bias", "Self-report bias; sometimes desirability scales"],
    ["Use cases", "Team ops, decision patterns, rapid profiling with receipts", "Coaching, teams", "Research, selection"],
  ];

  return (
    <div className="min-h-screen">
      <div className="wrap">
        <section className="hero center">
          <div className="glow" />
          <h1>Our Test vs The Rest</h1>
          <p className="lead">How Ground Zero compares to other personality assessments</p>
          
          <div className="mt-8">
            <Link href="/" className="btn-secondary">
              ← Back to Quiz
            </Link>
          </div>
        </section>

        <div className="comparison-container">
          <section className="rounded-2xl bg-slate-900 text-slate-100 p-6 ring-1 ring-slate-700/60 shadow-xl">
            <h2 className="text-lg font-semibold tracking-tight mb-3">Ground Zero vs MBTI vs Big Five</h2>
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-700/60">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="sticky top-0 bg-slate-900/80 backdrop-blur">
                  <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-3 border-b border-slate-700/60">
                    <th className="w-56 text-slate-300">Feature</th>
                    <th className="font-semibold text-amber-300">Ground Zero</th>
                    <th className="font-semibold">MBTI</th>
                    <th className="font-semibold">Big Five (OCEAN)</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(odd)]:bg-slate-800/40">
                  {rows.map(([k, gz, mbti, big], i) => (
                    <tr key={i} className="align-top hover:bg-slate-800/70">
                      <th scope="row" className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">{k}</th>
                      <td className="px-4 py-3">{highlight(gz)}</td>
                      <td className="px-4 py-3 text-slate-200/90">{mbti}</td>
                      <td className="px-4 py-3 text-slate-200/90">{big}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-slate-400">Engine-level differences: determinism, coverage, verification, receipts.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function highlight(text: string) {
  return (
    <span dangerouslySetInnerHTML={{
      __html: text
        .replace("Deterministic cycle engine", `<strong>Deterministic cycle engine</strong>`)
        .replace("Main + Secondary → 144 combos", `<strong>Main + Secondary</strong> → <span class='inline-flex items-center rounded-full border border-amber-400/50 px-2 py-0.5 text-xs'>144 combos</span>`)
        .replace("+1 per pick, first-to-3 locks", `<strong>+1 per pick</strong>, <strong>first-to-3</strong> locks`)
        .replace("Same taps = same result; ledger replay", `<span class='inline-flex items-center rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 text-xs'>Same taps = same result</span>; ledger replay`)
    }} />
  );
}
