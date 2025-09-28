
"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Face =
  | "Sovereign" | "Rebel" | "Visionary" | "Equalizer" | "Guardian" | "Seeker"
  | "Architect" | "Spotlight" | "Diplomat" | "Partner" | "Provider" | "Artisan";

const FACES: Face[] = [
  "Sovereign","Rebel","Visionary","Equalizer","Guardian","Seeker",
  "Architect","Spotlight","Diplomat","Partner","Provider","Artisan"
];
const FACE_INDEX: Record<Face, number> = Object.fromEntries(FACES.map((f, i) => [f, i])) as any;

const fhash = (s: string) => { let h = 2166136261 >>> 0; for (let i=0;i<s.length;i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h>>>0; };

type Choice = { text: string; face: Face };
type Question = { stem: string; choices: Choice[] };

// 21-question bank (no repeats). Each has 12 face-mapped choices.
const Q: Question[] = [
  { stem: "When you walk into a room of strangers, you…", choices: [
    { text: "Scan who holds power and decide when to speak.", face: "Sovereign" },
    { text: "Say something sharp just to watch reactions.", face: "Rebel" },
    { text: "Note the possibilities and imagine new futures.", face: "Visionary" },
    { text: "Feel the emotional temperature, then bring balance.", face: "Equalizer" },
    { text: "Find the safest corner and observe everything first.", face: "Guardian" },
    { text: "Start tracing what’s really going on beneath the polite noise.", face: "Seeker" },
    { text: "Map the room’s structure: who plugs into what, what’s the system here.", face: "Architect" },
    { text: "Light up the space and claim a slice of stage.", face: "Spotlight" },
    { text: "Bridge cliques with small talk that lowers friction.", face: "Diplomat" },
    { text: "Find the person with a half-formed idea and make it usable.", face: "Partner" },
    { text: "Blend in and quietly support whomever needs it.", face: "Provider" },
    { text: "Inspect the craft around you; judge the build quality with your hands and eyes.", face: "Artisan" },
  ] },
  { stem: "Success feels most real when…", choices: [
    { text: "Your call stands and people align around it.", face: "Sovereign" },
    { text: "The crowd erupts and you OWN the moment.", face: "Rebel" },
    { text: "The future you sketched shows up in the real world.", face: "Visionary" },
    { text: "A pattern you proved holds under pressure.", face: "Equalizer" },
    { text: "Everyone feels protected and supplied because of you.", face: "Guardian" },
    { text: "You uncover a hidden truth no one else saw.", face: "Seeker" },
    { text: "A system you designed runs clean, stable, and elegant.", face: "Architect" },
    { text: "The room lights up because your presence lifted it.", face: "Spotlight" },
    { text: "Two rivals shake hands because you bridged them.", face: "Diplomat" },
    { text: "Your idea becomes tangible and useful to others.", face: "Partner" },
    { text: "Someone quietly says their day worked because you covered the gaps.", face: "Provider" },
    { text: "A thing you built works perfectly and feels right in the hand.", face: "Artisan" },
  ] },
  { stem: "Conflict shows up. Your first internal move is…", choices: [
    { text: "Command the space and set the terms.", face: "Sovereign" },
    { text: "Break the rules to see who notices.", face: "Rebel" },
    { text: "Paint a bigger future so everyone eases up.", face: "Visionary" },
    { text: "Weigh both sides, balance the charge, cool the room.", face: "Equalizer" },
    { text: "Shield the most vulnerable person in the room.", face: "Guardian" },
    { text: "Search for the underlying pattern you’re missing.", face: "Seeker" },
    { text: "Diagram the failure points and redesign the interface between them.", face: "Architect" },
    { text: "Draw the heat onto yourself and reset the mood.", face: "Spotlight" },
    { text: "Mediate the terms until a workable bridge appears.", face: "Diplomat" },
    { text: "Turn talk into a small actionable build everyone can move on.", face: "Partner" },
    { text: "Quietly absorb the loose tasks so pressure drops.", face: "Provider" },
    { text: "Put hands on the broken part and fix the tolerances.", face: "Artisan" },
  ] },
  { stem: "When someone praises you, you secretly…", choices: [
    { text: "Convert it into permission to set a bigger line.", face: "Sovereign" },
    { text: "Look for the edge you can push next.", face: "Rebel" },
    { text: "Turn it into fuel for your next big idea.", face: "Visionary" },
    { text: "Check whether the signal is clean or just noise.", face: "Equalizer" },
    { text: "Verify the base is safe before taking a bow.", face: "Guardian" },
    { text: "Dissect why they see you that way at all.", face: "Seeker" },
    { text: "Ask whether the system that produced it will scale.", face: "Architect" },
    { text: "Want a bigger stage and brighter lights.", face: "Spotlight" },
    { text: "Redirect the credit to keep the peace.", face: "Diplomat" },
    { text: "Spin it into a concrete next step.", face: "Partner" },
    { text: "Make sure people who helped are stocked and seen.", face: "Provider" },
    { text: "Go back to your bench and make the next version cleaner.", face: "Artisan" },
  ] },
  { stem: "If a friend calls at 2 AM, you…", choices: [
    { text: "Set the line: what we're doing, now.", face: "Sovereign" },
    { text: "Bring heat and courage to cut through the fog.", face: "Rebel" },
    { text: "Reframe their future so they can move.", face: "Visionary" },
    { text: "Trace the root cause and map next steps.", face: "Equalizer" },
    { text: "Stabilize the scene and keep them safe.", face: "Guardian" },
    { text: "Ask precise questions until the truth lands.", face: "Seeker" },
    { text: "Design a simple system they can follow half-asleep.", face: "Architect" },
    { text: "Rally them with presence so they don't quit.", face: "Spotlight" },
    { text: "Call the person who needs to hear them and broker peace.", face: "Diplomat" },
    { text: "Build a small, do-able plan together.", face: "Partner" },
    { text: "Bring what they need and stay until morning.", face: "Provider" },
    { text: "Fix the broken thing before dawn.", face: "Artisan" },
  ] },
  { stem: "Your energy spikes when…", choices: [
    { text: "You decree a bold new boundary and feel it hold.", face: "Sovereign" },
    { text: "You flip a stale situation upside-down.", face: "Rebel" },
    { text: "You glimpse a future no one else imagined.", face: "Visionary" },
    { text: "A hidden connection suddenly makes sense.", face: "Equalizer" },
    { text: "Protection and provision click into place perfectly.", face: "Guardian" },
    { text: "The riddle you’ve been tracking finally opens.", face: "Seeker" },
    { text: "You assemble a design that locks pieces into a coherent whole.", face: "Architect" },
    { text: "The room’s attention snaps to the moment you’re shaping.", face: "Spotlight" },
    { text: "A tense thread unwinds because you negotiated it right.", face: "Diplomat" },
    { text: "A concept becomes a working prototype.", face: "Partner" },
    { text: "Supplies arrive at the exact second they’re needed.", face: "Provider" },
    { text: "You tune a mechanism until it hums.", face: "Artisan" },
  ] },
  { stem: "Silence feels like…", choices: [
    { text: "A throne room before the decree.", face: "Sovereign" },
    { text: "A dare to make some noise.", face: "Rebel" },
    { text: "The blank canvas before the next vision lands.", face: "Visionary" },
    { text: "An invitation to analyze what isn’t said.", face: "Equalizer" },
    { text: "A moment to secure everyone’s safety.", face: "Guardian" },
    { text: "Space to track the unsolved thread.", face: "Seeker" },
    { text: "Room to draft the blueprint without interruption.", face: "Architect" },
    { text: "A stage with no lights — intolerable.", face: "Spotlight" },
    { text: "A chance to hear what would keep us whole.", face: "Diplomat" },
    { text: "Breathing room to refine the plan to action.", face: "Partner" },
    { text: "Time to quietly stock the shelves.", face: "Provider" },
    { text: "The workshop before first cut.", face: "Artisan" },
  ] },
  { stem: "Under extreme stress you usually…", choices: [
    { text: "Take total control and set the path.", face: "Sovereign" },
    { text: "Explode the rules so something new can emerge.", face: "Rebel" },
    { text: "Escape into imagination and future-build.", face: "Visionary" },
    { text: "Break the issue into patterns and fix the root.", face: "Equalizer" },
    { text: "Stand guard for everyone else’s safety.", face: "Guardian" },
    { text: "Hunt the missing variable until it confesses.", face: "Seeker" },
    { text: "Redesign the system so this failure can’t repeat.", face: "Architect" },
    { text: "Draw heat and attention to rally momentum.", face: "Spotlight" },
    { text: "Broker a ceasefire and buy time.", face: "Diplomat" },
    { text: "Build the small, sure fix that moves us one square.", face: "Partner" },
    { text: "Cover the unglamorous tasks so others can breathe.", face: "Provider" },
    { text: "Put tools on the table and start repairing.", face: "Artisan" },
  ] },
  { stem: "The compliment that hits deepest is…", choices: [
    { text: "\"You made the hard call and it was right.\"", face: "Sovereign" },
    { text: "\"You shook us awake.\"", face: "Rebel" },
    { text: "\"You pulled the future closer.\"", face: "Visionary" },
    { text: "\"You saw the real issue before anyone else.\"", face: "Equalizer" },
    { text: "\"I felt safe because you were there.\"", face: "Guardian" },
    { text: "\"You found the truth under the noise.\"", face: "Seeker" },
    { text: "\"Your design is clean and it scales.\"", face: "Architect" },
    { text: "\"You lit the room on fire.\"", face: "Spotlight" },
    { text: "\"You kept us together when it mattered.\"", face: "Diplomat" },
    { text: "\"You turned an idea into something we could use.\"", face: "Partner" },
    { text: "\"You had what we needed before we asked.\"", face: "Provider" },
    { text: "\"This feels crafted, not just made.\"", face: "Artisan" },
  ] },
  { stem: "When a plan stalls, you instinctively…", choices: [
    { text: "Reassert direction and cut the drift.", face: "Sovereign" },
    { text: "Kick the sacred cow blocking motion.", face: "Rebel" },
    { text: "Reframe with a bolder future so energy returns.", face: "Visionary" },
    { text: "Audit the logic chain and fix the weak link.", face: "Equalizer" },
    { text: "Rebuild the safety floor so people can move.", face: "Guardian" },
    { text: "Find the missing variable and slot it in.", face: "Seeker" },
    { text: "Redesign the workflow so friction drops.", face: "Architect" },
    { text: "Create a moment that pulls everyone back in.", face: "Spotlight" },
    { text: "Get the right people talking the right way.", face: "Diplomat" },
    { text: "Ship a tiny win to restart momentum.", face: "Partner" },
    { text: "Clear bottlenecks by covering the grunt work.", face: "Provider" },
    { text: "Tune the mechanism until it cycles clean.", face: "Artisan" },
  ] },
  { stem: "A perfect day ends with…", choices: [
    { text: "Standing somewhere no one can command me.", face: "Sovereign" },
    { text: "Knowing I disrupted what needed disrupting.", face: "Rebel" },
    { text: "Sketching the seed of the next impossible thing.", face: "Visionary" },
    { text: "Solving a puzzle that bothered me for weeks.", face: "Equalizer" },
    { text: "Seeing everyone supplied and settled.", face: "Guardian" },
    { text: "Cracking a mystery that finally yields.", face: "Seeker" },
    { text: "A framework drafted that clarifies the mess.", face: "Architect" },
    { text: "An audience leaving brighter than they arrived.", face: "Spotlight" },
    { text: "Two tense threads I tied into one rope.", face: "Diplomat" },
    { text: "Shipping a tidy prototype that works.", face: "Partner" },
    { text: "Knowing the fridges are stocked and the lists are done.", face: "Provider" },
    { text: "A piece finished so clean it makes me smile.", face: "Artisan" },
  ] },
  { stem: "Which loss would cut deepest?", choices: [
    { text: "My authority to draw the line.", face: "Sovereign" },
    { text: "My right to break the frame.", face: "Rebel" },
    { text: "My horizon of what could be.", face: "Visionary" },
    { text: "My ability to trust the pattern.", face: "Equalizer" },
    { text: "My duty to keep people safe.", face: "Guardian" },
    { text: "My capacity to find the hidden truth.", face: "Seeker" },
    { text: "My blueprint for how it all fits.", face: "Architect" },
    { text: "My platform to move a room.", face: "Spotlight" },
    { text: "My standing with both sides.", face: "Diplomat" },
    { text: "My knack for turning ideas real.", face: "Partner" },
    { text: "My role as the one who provides.", face: "Provider" },
    { text: "My hands’ memory for the craft.", face: "Artisan" },
  ] },
  { stem: "How do you rebuild after failure?", choices: [
    { text: "Redraw the power lines and claim them.", face: "Sovereign" },
    { text: "Burn the rubble and start louder.", face: "Rebel" },
    { text: "Turn failure into concept fuel.", face: "Visionary" },
    { text: "Analyze pattern errors until it clicks.", face: "Equalizer" },
    { text: "Fortify the foundation stronger than before.", face: "Guardian" },
    { text: "Track the missing fact and correct it.", face: "Seeker" },
    { text: "Re-architect the system so it can’t fail the same way.", face: "Architect" },
    { text: "Re-ignite the room so people believe again.", face: "Spotlight" },
    { text: "Broker agreements that unlock the jam.", face: "Diplomat" },
    { text: "Build the minimal working path forward.", face: "Partner" },
    { text: "Restore supply lines and remove friction.", face: "Provider" },
    { text: "Rework the piece until tolerances are true.", face: "Artisan" },
  ] },
  { stem: "What keeps you awake at night most often?", choices: [
    { text: "The cost of not choosing.", face: "Sovereign" },
    { text: "The silence after the applause ends.", face: "Spotlight" },
    { text: "Visions that refuse to sleep.", face: "Visionary" },
    { text: "An equation that still doesn’t balance.", face: "Equalizer" },
    { text: "Worry someone I love isn’t protected.", face: "Guardian" },
    { text: "A riddle I can’t yet decode.", face: "Seeker" },
    { text: "A design flaw I haven’t simplified yet.", face: "Architect" },
    { text: "A fight that didn’t need to be a fight.", face: "Diplomat" },
    { text: "A build I haven’t started but need to.", face: "Partner" },
    { text: "A gap in supply that could hurt someone tomorrow.", face: "Provider" },
    { text: "A piece that won’t sit flush.", face: "Artisan" },
    { text: "Rules that still deserve breaking.", face: "Rebel" },
  ] },
  { stem: "You learn best when…", choices: [
    { text: "Thrown into command with real consequences.", face: "Sovereign" },
    { text: "Facing resistance loud enough to push back.", face: "Rebel" },
    { text: "Prototyping wild ideas against the clock.", face: "Visionary" },
    { text: "Left to break apart the system myself.", face: "Equalizer" },
    { text: "Building safe frameworks from the ground up.", face: "Guardian" },
    { text: "Following the trail of unknowns until they’re known.", face: "Seeker" },
    { text: "Drafting schemas and testing interfaces.", face: "Architect" },
    { text: "Performing under bright feedback.", face: "Spotlight" },
    { text: "Negotiating with people who want different things.", face: "Diplomat" },
    { text: "Turning sketches into tools.", face: "Partner" },
    { text: "Carrying responsibility for real outcomes.", face: "Provider" },
    { text: "Working with materials until the feel is right.", face: "Artisan" },
  ] },
  { stem: "At the edge of everything, what remains?", choices: [
    { text: "A line only I can draw.", face: "Sovereign" },
    { text: "A spark of revolt waiting to ignite.", face: "Rebel" },
    { text: "An impossible vision calling me forward.", face: "Visionary" },
    { text: "A pattern that still holds true.", face: "Equalizer" },
    { text: "A wall strong enough for the next to rest on.", face: "Guardian" },
    { text: "A riddle still worth solving.", face: "Seeker" },
    { text: "A blueprint for a world that works.", face: "Architect" },
    { text: "A light that refuses to dim.", face: "Spotlight" },
    { text: "A bridge where there was none.", face: "Diplomat" },
    { text: "A tool that makes tomorrow easier.", face: "Partner" },
    { text: "A promise to provide what's needed.", face: "Provider" },
    { text: "A craft that outlasts its maker.", face: "Artisan" },
  ] },
  { stem: "On a brand-new team, you optimize first for…", choices: [
    { text: "Clear authority and crisp decision paths.", face: "Sovereign" },
    { text: "A culture that isn't afraid to break what's broken.", face: "Rebel" },
    { text: "A horizon worth chasing.", face: "Visionary" },
    { text: "Truth map: what's actually happening vs story.", face: "Equalizer" },
    { text: "Reliable safety nets and predictable cadence.", face: "Guardian" },
    { text: "Instrumentation to learn quickly from reality.", face: "Seeker" },
    { text: "Interfaces, standards, and clean contracts.", face: "Architect" },
    { text: "Signal, hype, and a strong launch moment.", face: "Spotlight" },
    { text: "Conflict protocols that keep us whole.", face: "Diplomat" },
    { text: "Fast prototypes that make decisions real.", face: "Partner" },
    { text: "Baselines: supply, tooling, checklists.", face: "Provider" },
    { text: "Craft discipline so output quality stays high.", face: "Artisan" },
  ] },
  { stem: "What is your deepest truth?", choices: [
    { text: "I am free to choose my own path.", face: "Sovereign" },
    { text: "I break what needs breaking.", face: "Rebel" },
    { text: "I imagine what could be.", face: "Visionary" },
    { text: "I see patterns others miss.", face: "Equalizer" },
    { text: "I protect what I love.", face: "Guardian" },
    { text: "I seek the truth beneath the story.", face: "Seeker" },
    { text: "I make order that lasts.", face: "Architect" },
    { text: "I turn moments into momentum.", face: "Spotlight" },
    { text: "I keep the peace without losing the edge.", face: "Diplomat" },
    { text: "I make ideas real.", face: "Partner" },
    { text: "I carry what needs carrying.", face: "Provider" },
    { text: "I shape with care until it’s right.", face: "Artisan" },
  ] },
  { stem: "People count on you most for…", choices: [
    { text: "Drawing direction when others hesitate.", face: "Sovereign" },
    { text: "Shaking the stuck thing loose.", face: "Rebel" },
    { text: "Naming a horizon that rallies people.", face: "Visionary" },
    { text: "Finding the signal inside the noise.", face: "Equalizer" },
    { text: "Keeping the base supplied and stable.", face: "Guardian" },
    { text: "Tracing root causes calmly.", face: "Seeker" },
    { text: "Turning chaos into working structure.", face: "Architect" },
    { text: "Turning moments into momentum.", face: "Spotlight" },
    { text: "Cooling tensions and aligning humans.", face: "Diplomat" },
    { text: "Turning a loose idea into something real.", face: "Partner" },
    { text: "Showing up beside them without being asked.", face: "Provider" },
    { text: "Delivering quality under pressure.", face: "Artisan" },
  ] },
  { stem: "When the stakes spike, your edge is…", choices: [
    { text: "Setting the terms so the game is clear.", face: "Sovereign" },
    { text: "Cracking stale frames so oxygen can enter.", face: "Rebel" },
    { text: "Seeing the future fast enough to steer now.", face: "Visionary" },
    { text: "Diagramming the pattern until it yields.", face: "Equalizer" },
    { text: "Locking the perimeter so nothing breaks through.", face: "Guardian" },
    { text: "Hunting the blind spot no one else sees.", face: "Seeker" },
    { text: "Re-architecting constraints into clarity.", face: "Architect" },
    { text: "Rallying energy in the room on command.", face: "Spotlight" },
    { text: "Translating competitors into collaborators.", face: "Diplomat" },
    { text: "Converting uncertainty into a concrete next step.", face: "Partner" },
    { text: "Bringing what’s missing exactly on time.", face: "Provider" },
    { text: "Tightening tolerances until failure disappears.", face: "Artisan" },
  ] },
  { stem: "If a friend calls at 2 AM, you…", choices: [
    { text: "Set the line: what we're doing, now.", face: "Sovereign" },
    { text: "Bring heat and courage to cut through the fog.", face: "Rebel" },
    { text: "Reframe their future so they can move.", face: "Visionary" },
    { text: "Trace the root cause and map next steps.", face: "Equalizer" },
    { text: "Stabilize the scene and keep them safe.", face: "Guardian" },
    { text: "Ask precise questions until the truth lands.", face: "Seeker" },
    { text: "Design a simple system they can follow half-asleep.", face: "Architect" },
    { text: "Rally them with presence so they don't quit.", face: "Spotlight" },
    { text: "Call the person who needs to hear them and broker peace.", face: "Diplomat" },
    { text: "Build a small, do-able plan together.", face: "Partner" },
    { text: "Bring what they need and stay until morning.", face: "Provider" },
    { text: "Fix the broken thing before dawn.", face: "Artisan" },
  ] },
  { stem: "At your best, others experience you as…", choices: [
    { text: "A clear axis the room can orient to.", face: "Sovereign" },
    { text: "A necessary disruption that restarts life.", face: "Rebel" },
    { text: "A horizon that pulls possibility closer.", face: "Visionary" },
    { text: "A decoder ring for hard problems.", face: "Equalizer" },
    { text: "A shield the whole group can rest behind.", face: "Guardian" },
    { text: "A lantern for the unknown.", face: "Seeker" },
    { text: "A builder of systems that last.", face: "Architect" },
    { text: "A spark that turns rooms alive.", face: "Spotlight" },
    { text: "A bridge that holds under load.", face: "Diplomat" },
    { text: "A maker of the next practical step.", face: "Partner" },
    { text: "A quiet force that keeps things working.", face: "Provider" },
    { text: "A craftsperson who brings precision and calm.", face: "Artisan" },
  ] },
];

type Tap = { phase: string; family: string; qnum?: number; face?: Face; mv: string; detail: string; ts: number };
type QuizResultPayload = {
  taps: Tap[];
  finalWinner: { face: Face; seed: number };
  duels: any[];
  secondaryFace: { face: Face; seed: number } | null;
  pureOneFace: boolean;
  axisProbe?: { items: string[]; answers: ("Yes"|"No"|"Maybe")[]; verdict: "PURE"|"WOBBLE"|"OFF"; main: Face; secondary: Face };
};

type Phase = "intro" | "quiz" | "sudden" | "probe" | "redirect";

const K_FLOOR = 4;
const MAX_Q = 21;

export default function Page() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [qIndex, setQIndex] = useState(0);

  const [hits, setHits] = useState<Record<Face, number>>(() => Object.fromEntries(FACES.map(f => [f, 0])) as any);
  const [shown, setShown] = useState<Record<Face, number>>(() => Object.fromEntries(FACES.map(f => [f, 0])) as any);
  const [options, setOptions] = useState<Face[]>([]);
  const [taps, setTaps] = useState<Tap[]>([]);
  const [cycleSeen, setCycleSeen] = useState<Set<Face>>(new Set());
  const [cyclePicks, setCyclePicks] = useState<Face[]>([]);
  const [main, setMain] = useState<Face | null>(null);
  const [secondary, setSecondary] = useState<Face | null>(null);
  const [probeAnswers, setProbeAnswers] = useState<("Yes"|"No"|"Maybe")[]>([]);

  const stage = qIndex % 3; // 0,1,2
  const progress = useMemo(() => phase==="quiz" ? Math.min(100, Math.round((qIndex / MAX_Q) * 100)) : 0, [phase, qIndex]);

  const activeFaces = (extra: Face[] = []) => FACES.filter(f => (f!==main && f!==secondary) || extra.includes(f));

  const leastShown = (exclude:Set<Face>) => activeFaces().filter(f => !exclude.has(f)).sort((a,b)=> (shown[a]-shown[b]) || (FACE_INDEX[a]-FACE_INDEX[b]));

  const topByHits = (n: number) => activeFaces().slice().sort((a,b)=> (hits[b]-hits[a])||(FACE_INDEX[a]-FACE_INDEX[b])).slice(0,n);

  const applyOptions = (faces: Face[]) => {
    setOptions(faces);
    setShown(prev => { const next = {...prev}; faces.forEach(f=> next[f]=(next[f]??0)+1); return next; });
    setCycleSeen(prev => new Set([...prev, ...faces]));
  };

  const start = () => {
    setPhase("quiz");
    setQIndex(0);
    setHits(Object.fromEntries(FACES.map(f => [f,0])) as any);
    setShown(Object.fromEntries(FACES.map(f => [f,0])) as any);
    setCycleSeen(new Set());
    setCyclePicks([]);
    setTaps([]);
    setMain(null); setSecondary(null);
    // Q1 of cycle 0: canonical first 5
    applyOptions(activeFaces().slice(0,5));
  };

  // Build stage options each question
  useEffect(()=>{
    if (phase!=="quiz") return;
    if (qIndex===0) return; // already seeded
    const s = stage;
    const converge = qIndex>=6 && !main;
    if (s===0) {
      // new cycle
      setCycleSeen(new Set());
      const prefer = activeFaces().filter(f=> shown[f]<K_FLOOR);
      const pool = (prefer.length>=5 ? prefer : leastShown(new Set()));
      let pick = pool.slice(0,5);
      if (converge) {
        const t2 = topByHits(2);
        pick = Array.from(new Set([...t2, ...pick])).slice(0,5);
      }
      applyOptions(pick);
    } else if (s===1) {
      // Q2 must ALWAYS introduce four new faces never seen in this cycle.
      const seed = cyclePicks[cyclePicks.length-1];
      const notInCycle = activeFaces([seed]).filter(f => !Array.from(cycleSeen).includes(f) && f!==seed);
      // honor exposure floor inside the unseen set
      const prefer = notInCycle.filter(f=> shown[f] < K_FLOOR);
      const ordered = (prefer.length >= 4 ? prefer : notInCycle)
        .sort((a,b)=> (shown[a]-shown[b]) || (FACE_INDEX[a]-FACE_INDEX[b]));
      const fill = ordered.slice(0,4);
      applyOptions([seed, ...fill]);
    } else if (s===2) {
      const [p1, p2] = cyclePicks.slice(-2);
      const base = Array.from(new Set([p1,p2])).filter(Boolean) as Face[];
      const remaining = activeFaces(base).filter(f => !Array.from(cycleSeen).includes(f));
      applyOptions([...base.filter(f=> activeFaces().includes(f)), ...remaining]); // no cap
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex]);

  const onPick = (face: Face, text: string) => {
    const nh = {...hits}; nh[face]=(nh[face]??0)+1; setHits(nh);
    setCyclePicks(p=> [...p, face]);
    const tap: Tap = { phase:"Q", family:"GZ21", qnum: qIndex + 1, face, mv: face[0].toUpperCase(), detail: `Q${qIndex+1}: ${text}`, ts: Date.now() };
    setTaps(t=> [...t, tap]);

    let m = main, s = secondary;
    if (!m && nh[face] >= 3) m = face;
    else if (m && !s && face!==m && nh[face] >= 3) s = face;
    if (m!==main) setMain(m!);
    if (s!==secondary) setSecondary(s!);

    const nextQ = qIndex + 1;
    if (m && s) return setPhase("probe");
    if (nextQ >= MAX_Q) return setPhase("sudden");
    setQIndex(nextQ);
  };

  // Sudden death: duel/tri-duel until two locks
  const suddenFaces = useMemo(()=> {
    const ranked = activeFaces().slice().sort((a,b)=> (hits[b]-hits[a]) || (FACE_INDEX[a]-FACE_INDEX[b]));
    return ranked.slice(0, Math.min(3, ranked.length));
  }, [hits, main, secondary]);

  const suddenPick = (f: Face) => {
    const nh = {...hits}; nh[f]=(nh[f]??0)+1; setHits(nh);
    let m = main, s = secondary;
    if (!m && nh[f] >=3) m = f;
    else if (m && !s && f!==m && nh[f] >=3) s = f;
    if (m!==main) setMain(m!);
    if (s!==secondary) setSecondary(s!);
    if (m && s) setPhase("probe");
  };

  // Axis Probe
  const AXIS_BANK: Record<Face, Record<Face, string[]>> = __AXIS_BANK__;
  const probeItems = useMemo(()=> {
    if (!main || !secondary) return [];
    const hit = AXIS_BANK[main]?.[secondary];
    if (hit && Array.isArray(hit) && hit.length===3) return hit as string[];
    return [
      `I act like ${main} even when it costs me.`,
      `I adjust for ${secondary} to keep balance.`,
      `${main} sets my line, ${secondary} shapes my method.`
    ];
  }, [main, secondary]);

  const answerProbe = (ans: "Yes"|"No"|"Maybe") => {
    const next = [...probeAnswers, ans]; setProbeAnswers(next);
    if (next.length < 3) return;
    let verdict: "PURE"|"WOBBLE"|"OFF" = "WOBBLE";
    if (next.every(a=> a==="Yes")) verdict="PURE";
    else if (next.every(a=> a==="No")) verdict="OFF";
    const payload: QuizResultPayload = {
      taps,
      finalWinner: { face: main!, seed: 1 },
      duels: [],
      secondaryFace: { face: secondary!, seed: 2 },
      pureOneFace: main===secondary,
      axisProbe: { items: probeItems, answers: next, verdict, main: main!, secondary: secondary! }
    };
    try { sessionStorage.setItem("quizResult", JSON.stringify(payload)); } catch {}
    setPhase("redirect");
    try { router.push(`/results/${main}`); } catch { if (typeof window!=="undefined") window.location.href=`/results/${main}`; }
  };

  return (
    <div className="min-h-screen flex">
      {phase==="intro" && (
        <div className="fixed top-4 left-4 z-50">
          <button onClick={start} className="text-white/70 text-sm font-medium bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-200">
            Start
          </button>
        </div>
      )}
      <div className="flex-1">
        <div className={phase==="intro" ? "min-h-screen" : "max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-6 -mt-6"}>
          {phase==="intro" && <Intro onStart={start} />}

          {phase==="quiz" && (
            <>
              <ProgressBar progress={progress} />
              <QuestionBlock
                qNum={qIndex+1} total={MAX_Q}
                question={Q[qIndex]}
                optionFaces={options}
                onPick={onPick}
              />
            </>
          )}

          {phase==="sudden" && (
            <SuddenDeath faces={suddenFaces} onPick={suddenPick} />
          )}

          {phase==="probe" && main && secondary && (
            <AxisProbe items={probeItems} onAnswer={answerProbe} />
          )}

          {phase==="redirect" && (
            <div className="text-center py-12">
              <p className="text-white/70">Calculating your result…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Intro({ onStart }: { onStart: ()=>void }) {
  return (
    <div className="wrap">
      <section className="hero center">
        <div className="glow" />
        <div className="logo" aria-hidden="true">
          <Image src="/THE-Axiarch.png" alt="Ground Zero Emblem" width={200} height={200} />
        </div>
        <h1>Ground Zero</h1>
        <p className="lead">Seeded engine • 12 faces • 21Q cap • first-to-3 locks</p>
        <div className="mt-4">
          <button className="btn" onClick={onStart}>Start Quiz</button>
          <div className="note" style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
            Cycles: Q1→Q2→Q3 • K=4 exposure floor • Convergence gate at Q6
          </div>
        </div>
      </section>
    </div>
  );
}

function ProgressBar({ progress }: { progress:number }) {
  return (
    <div className="fixed bottom-3 left-0 right-0 px-3 sm:px-4 md:px-6 z-10">
      <div className="flex items-center gap-2 sm:gap-3">
        <div aria-label="Progress" className="relative h-1 sm:h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 transition-[width] duration-200 rounded-full" style={{ width: `${progress}%` }}>
            <span aria-live="polite" className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] text-black/80 font-medium tabular-nums">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionBlock({
  qNum, total, question, optionFaces, onPick
}: {
  qNum:number; total:number; question:Question; optionFaces:Face[]; onPick:(f:Face, t:string)=>void;
}) {
  const faceSet = new Set(optionFaces);
  const visible = question.choices.filter(c=> faceSet.has(c.face));
  return (
    <div>
      <header className="flex items-center justify-center py-2 sm:py-3">
        <Image src="/THE-Axiarch.png" alt="Ground Zero" width={192} height={192} className="h-32 sm:h-40 md:h-48" />
      </header>
      <fieldset className="space-y-4 sm:space-y-6">
        <legend className="text-xl sm:text-2xl md:text-[28px] font-semibold tracking-tight px-1">
          {question.stem}
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch">
          {visible.map((ch, idx)=> (
            <div key={idx} className="h-full">
              <label className="group relative cursor-pointer rounded-xl gold-card-premium p-3 sm:p-4 transition-all duration-150 will-change-transform h-full flex flex-col">
                <input type="radio" name={`q${qNum}`} value={ch.text} className="sr-only" onClick={() => onPick(ch.face, ch.text)} />
                <div className="min-h-[50px] sm:min-h-[60px] md:min-h-[70px] text-sm sm:text-[15px] leading-relaxed text-[#E8E8E8] flex-1 relative z-10">
                  {ch.text}
                </div>
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
}

function SuddenDeath({ faces, onPick }: { faces: Face[]; onPick:(f:Face)=>void }) {
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <h2 className="text-center text-2xl font-semibold">Sudden Death</h2>
      <p className="text-center text-white/70">Pick until two faces hit 3. If three are in play, it’s a tri-duel.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {faces.map(f=> (
          <button key={f} onClick={()=>onPick(f)} className="rounded-xl gold-card-premium p-4 text-left">
            <div className="text-lg font-semibold">{f}</div>
            <div className="text-sm text-white/70">Tap to advance</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AxisProbe({ items, onAnswer }: { items: string[]; onAnswer:(a:"Yes"|"No"|"Maybe")=>void }) {
  const [idx, setIdx] = useState(0);
  const ask = items[idx] ?? "";
  const click = (a:"Yes"|"No"|"Maybe") => { onAnswer(a); setIdx(v => v+1); };
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h2 className="text-center text-2xl font-semibold">Axis Probe</h2>
      <p className="text-center text-white/70">Three quick checks. Answer with your gut.</p>
      <div className="rounded-xl gold-card-premium p-5">
        <div className="mb-4">{ask}</div>
        <div className="flex gap-2">
          <button className="btn" onClick={()=>click("Yes")}>Yes</button>
          <button className="btn" onClick={()=>click("Maybe")}>Maybe</button>
          <button className="btn" onClick={()=>click("No")}>No</button>
        </div>
        <div className="mt-4 text-xs text-white/60">Item {Math.min(idx+1,3)}/3</div>
      </div>
    </div>
  );
}

// Axis bank literal
const __AXIS_BANK__ : Record<Face, Record<Face, string[]>> = {"Sovereign": {"Sovereign": ["I take charge and make the call.", "I lead from the front.", "I own the decision."], "Rebel": ["I take charge even if it means breaking the rules.", "If a rule slows us down, I'll change it.", "I'd rather lead than be managed."], "Visionary": ["I want to call the shots that open the future, not just repeat the past.", "If a better path shows up, I'll change direction.", "I feel it's on me to push toward what's next."], "Equalizer": ["I want control, but only if the setup is fair.", "If it's lopsided, I'll hold back until it's fixed.", "I lead in ways that keep the balance."], "Guardian": ["I'll lead, but I stop if it's clearly unsafe.", "I don't want progress if it risks breaking people.", "My decisions have to protect the group."], "Seeker": ["I choose the unknown even when I'm the one steering.", "Curiosity drives the call.", "I own the risk of discovery."], "Architect": ["I won't make a call until the system underneath makes sense.", "I want structure before I move.", "I direct things to be repeatable, not one-off."], "Spotlight": ["When I decide, I don't hide it.", "I'll step into view to make sure the choice sticks.", "I want the call to be public, not private."], "Diplomat": ["I'll lead, but I try to keep everyone on board.", "If my way blows up alignment, I'll adjust.", "I want the last word, but not if it burns the group."], "Partner": ["I want the call, but I don't want to leave people behind.", "I'll match pace so we move together.", "I don't pick paths that cut others off."], "Provider": ["I decide, but only after the basics are set.", "I line up resources before I push.", "I own the timing so the run doesn't collapse."], "Artisan": ["I decide, then I prove it by building.", "I test my calls with real work.", "I stand by choices I can show in practice."]}, "Rebel": {"Sovereign": ["I refuse to be controlled and make my own calls.", "If rules are bad, I won't follow them.", "I'll rewrite the script to get my way."], "Rebel": ["I break rules to see who notices.", "I challenge authority when it's wrong.", "I won't follow orders that don't make sense."], "Visionary": ["I ditch the present to push into the future.", "I'll break what's stale to unlock what's new.", "I'll bend direction if tomorrow looks better."], "Equalizer": ["I fight setups that give someone too much power.", "I challenge terms that aren't even.", "I break what feels rigged."], "Guardian": ["I resist moves that endanger people.", "I stop reckless speed.", "I won't follow a path that looks unsafe."], "Seeker": ["I go against the known to chase the unknown.", "I reject safe answers if curiosity is calling.", "I change rules so discovery can happen."], "Architect": ["I hate hacks and quick fixes.", "I'll scrap a brittle system just to build it better.", "I push back until the design is clean."], "Spotlight": ["I'll speak up in public when things are wrong.", "I use visibility to fight bad norms.", "I want the mic if it sparks change."], "Diplomat": ["I resist authority, but I still explain myself.", "I'd rather negotiate better terms than submit.", "I'll translate my push so others get it."], "Partner": ["I don't ditch people just to win a fight.", "I pace my rebellion so we don't split.", "I'll take risks together, not alone."], "Provider": ["I fight scarcity by supplying what's missing.", "I route around blockages with resources.", "I support change with real stuff."], "Artisan": ["I prove my point by making something better.", "I'll build instead of argue.", "My protest is a working demo."]}, "Visionary": {"Sovereign": ["I see what's next and I want to lead us there.", "If the future shifts, I'll change direction.", "I pick options that expand tomorrow."], "Rebel": ["I drop the old path to reach something new.", "I break patterns to unlock growth.", "I move fast when the future pulls."], "Visionary": ["I imagine what's possible and push toward it.", "I see patterns others miss.", "I want to build the future I envision."], "Equalizer": ["I imagine futures where no one gets screwed.", "I won't chase growth if it leaves people behind.", "I push for upside that's shared."], "Guardian": ["I chase new things, but not at any cost.", "I time risk so people don't get wrecked.", "I don't trade safety for novelty."], "Seeker": ["I explore new options to see what's possible.", "Curiosity drives my vision.", "I follow mystery when the payoff looks real."], "Architect": ["I map the structure before betting on the future.", "I want design before I sprint.", "I build futures that last."], "Spotlight": ["I paint pictures people can follow.", "I tell the story of the future.", "I make tomorrow clear now."], "Diplomat": ["I bring people along into what's next.", "I translate risk into terms they'll accept.", "I pick paths that most can walk."], "Partner": ["I want to reach the future with others, not solo.", "I sync pace so we arrive together.", "I pick options that don't cut ties."], "Provider": ["I gather resources before pushing ahead.", "I stage basics before big moves.", "I pace visions with stability."], "Artisan": ["I test ideas by building them.", "I cut through theory with practice.", "I only believe the vision once I can touch it."]}, "Equalizer": {"Sovereign": ["I want control that doesn't tilt the table.", "If it's unfair, I slow the leader down.", "I set limits on power."], "Rebel": ["I fight setups that give some people an edge.", "I resist rules that exploit others.", "I break what feels rigged."], "Visionary": ["I see futures where the gains aren't just for a few.", "I won't chase growth if it leaves people behind.", "I push for upside that's shared."], "Equalizer": ["I balance the load so no one carries too much.", "I make sure everyone gets a fair shot.", "I keep things even when they want to tip."], "Guardian": ["I enforce safety without playing favorites.", "I stop if the risk falls unevenly.", "I protect those carrying more than their share."], "Seeker": ["I investigate hidden imbalances before moving.", "I'll pause curiosity to fix fairness.", "I chase discovery that doesn't exploit."], "Architect": ["I design systems that spread effort evenly.", "I won't launch structures that load one side.", "I fix designs that keep things lopsided."], "Spotlight": ["I call out when someone's hogging attention.", "I want credit to be shared, not stacked.", "I use visibility to balance the story."], "Diplomat": ["I push for trades that feel even.", "I cool fights by making terms fair.", "I want everyone walking away with something."], "Partner": ["I don't let one person do all the work.", "I match pace so the load is equal.", "I share credit and blame."], "Provider": ["I step in to fill gaps when others can't.", "I make sure supplies don't get hoarded.", "I keep resources distributed."], "Artisan": ["I fix problems hands-on until they're fair.", "I won't stop until the work is even.", "I balance through making, not just talk."]}, "Guardian": {"Sovereign": ["I'll follow a leader only if safety is respected.", "I say no when the call risks breaking people.", "I'll stop progress if it crosses the line."], "Rebel": ["I resist reckless control.", "I'll push back if people are being put at risk.", "I don't obey rules that ignore safety."], "Visionary": ["I want new ideas, but not if they're reckless.", "I slow down visions that skip safety.", "I pick novelty only if it holds the line."], "Equalizer": ["I enforce rules the same for everyone.", "I stop if one person shoulders more danger.", "I don't allow risk to pile up unevenly."], "Guardian": ["I protect people from harm.", "I keep everyone safe.", "I won't let anyone get hurt."], "Seeker": ["I chase the unknown only inside safe limits.", "Curiosity won't make me ignore danger.", "I cut off exploration if the cost's too high."], "Architect": ["I design protections before anything launches.", "I'll reject systems that cut safety corners.", "I build frameworks that guard people first."], "Spotlight": ["I speak up when danger's ignored.", "I use visibility to stop reckless moves.", "I go public if that's the only way to keep it safe."], "Diplomat": ["I negotiate limits everyone can accept.", "I explain safety rules to calm things down.", "I push for agreements that reduce risk."], "Partner": ["I slow down to protect others.", "I won't let someone take all the hits.", "I guard people before goals."], "Provider": ["I make sure basics are covered before we move.", "I stock safety nets.", "I resource things so risk doesn't spike."], "Artisan": ["I test things carefully before release.", "I refuse shortcuts under pressure.", "I prove safety with my own hands."]}, "Seeker": {"Sovereign": ["I want freedom to chase the unknown.", "I'll explore even if I'm steering.", "I take charge to discover."], "Rebel": ["I break rules if they block curiosity.", "I defy the known to find new ground.", "I won't accept stale answers."], "Visionary": ["I look to the future and go exploring.", "I chase mystery to see what's possible.", "I move toward upside no one sees yet."], "Equalizer": ["I pause to check if discovery is fair.", "I don't exploit what I find.", "I share the unknown, not hoard it."], "Guardian": ["I explore but I listen to danger signals.", "Curiosity doesn't excuse unsafe moves.", "I stop if the risk is too high."], "Seeker": ["I chase the unknown to find the truth.", "I dig deep to uncover what's hidden.", "I won't stop until I understand."], "Architect": ["I investigate systems to see how they work.", "I discover flaws others miss.", "I push curiosity into clean design."], "Spotlight": ["I talk openly about what I find.", "I bring others along into new territory.", "I make discovery visible."], "Diplomat": ["I explore and then translate findings.", "I explain unknowns so others can move.", "I share discovery in usable ways."], "Partner": ["I don't want to explore alone.", "I check in so we're still together.", "I share discovery with people I trust."], "Provider": ["I set up supplies before going off trail.", "I won't explore if the basics aren't ready.", "I pace curiosity with stability."], "Artisan": ["I explore by building.", "I learn by doing, not just imagining.", "I trust discoveries I can touch."]}, "Architect": {"Sovereign": ["I won't follow a leader without a solid system.", "I stop launches that ignore structure.", "I want control that respects design."], "Rebel": ["I tear down brittle setups.", "I break hacks to rebuild right.", "I reject mess and demand structure."], "Visionary": ["I design the base before chasing the future.", "I want vision that can scale.", "I pick futures with bones that hold."], "Equalizer": ["I design systems that share effort evenly.", "I fix structures that overburden.", "I won't ship something unfair."], "Guardian": ["I add guardrails before speed.", "I refuse shortcuts that risk safety.", "I design protections in from the start."], "Seeker": ["I explore by mapping how things work.", "I turn curiosity into clean structure.", "I test unknowns by systemizing them."], "Architect": ["I design systems that work.", "I build frameworks that last.", "I create structure that scales."], "Spotlight": ["I present designs clearly.", "I make frameworks visible so they're trusted.", "I explain systems in public."], "Diplomat": ["I negotiate designs people can live with.", "I translate structure into plain terms.", "I settle fights through better rules."], "Partner": ["I co-build so no one does it alone.", "I sync workflow for cleaner results.", "I design teamwork into the system."], "Provider": ["I supply structure like a resource.", "I make sure foundations are stocked.", "I build scaffolds others can rely on."], "Artisan": ["I prove design by making.", "I refine ideas through hands-on work.", "I test structure in real builds."]}, "Spotlight": {"Sovereign": ["I show the call in public.", "I carry decisions into view.", "I lead by being visible."], "Rebel": ["I use the mic to push back.", "I go public when something's wrong.", "I won't stay quiet about bad control."], "Visionary": ["I paint pictures people can follow.", "I tell the story of the future.", "I make tomorrow clear now."], "Equalizer": ["I call out unfair setups.", "I push visibility toward balance.", "I shine light on what's hidden."], "Guardian": ["I raise alarms when things are unsafe.", "I bring danger into view.", "I won't let risk stay unseen."], "Seeker": ["I share discoveries out loud.", "I talk about the unknowns I find.", "I make curiosity visible."], "Architect": ["I explain frameworks to the crowd.", "I put systems in plain view.", "I make design obvious."], "Spotlight": ["I shine light on what matters.", "I make things visible.", "I bring attention to what needs it."], "Diplomat": ["I speak so sides understand each other.", "I frame messages to cool things down.", "I translate conflict into clarity."], "Partner": ["I give credit publicly.", "I highlight others as much as myself.", "I share the stage."], "Provider": ["I shine light on who makes things possible.", "I spotlight resources others miss.", "I call out support work."], "Artisan": ["I show the work, not just talk.", "I display what I've built.", "I make making visible."]}, "Diplomat": {"Sovereign": ["I soften commands so they land.", "I keep leaders from blowing things up.", "I make decisions easier to accept."], "Rebel": ["I translate defiance so others get it.", "I argue for fairer terms.", "I explain rebellion without wrecking trust."], "Visionary": ["I describe the future in simple terms.", "I make risky ideas acceptable.", "I align people with what's next."], "Equalizer": ["I strike deals that feel fair.", "I cut tension with balanced terms.", "I want everyone to leave with something."], "Guardian": ["I explain safety rules so they stick.", "I get buy-in on limits.", "I frame rules as protection, not punishment."], "Seeker": ["I explain discoveries in plain words.", "I make unknowns less scary.", "I translate curiosity into steps."], "Architect": ["I negotiate rules people can live with.", "I bridge design fights.", "I find consensus in systems."], "Spotlight": ["I shape the story to calm conflict.", "I make sides feel seen.", "I use visibility to keep peace."], "Diplomat": ["I find common ground.", "I bridge differences.", "I keep the peace."], "Partner": ["I smooth over fights between teammates.", "I explain perspectives so we stay aligned.", "I keep relationships steady."], "Provider": ["I broker access to resources.", "I explain shortages without blame.", "I negotiate who gets what."], "Artisan": ["I mediate through examples.", "I show instead of argue.", "I prove balance with working stuff."]}, "Partner": {"Sovereign": ["I stick close even if they lead.", "I pace myself with the decision-maker.", "I back the person making the call."], "Rebel": ["I won't let them fight alone.", "I share the cost of breaking rules.", "I support the push even if it's risky."], "Visionary": ["I want to reach the future together.", "I match pace to stay aligned.", "I care less about solo glory than shared progress."], "Equalizer": ["I make sure no one carries more than me.", "I share credit and blame.", "I balance the load."], "Guardian": ["I slow down to protect people.", "I refuse to leave anyone exposed.", "I won't accept wins that break others."], "Seeker": ["I don't want to explore alone.", "I check in so we're still connected.", "I share discoveries openly."], "Architect": ["I co-build so no one owns it all.", "I sync workflow with others.", "I want shared design, not solo genius."], "Spotlight": ["I give others credit in public.", "I share the stage.", "I highlight teammates first."], "Diplomat": ["I cool fights between friends.", "I explain both sides so we stay intact.", "I keep the group steady."], "Partner": ["I work with others.", "I share the load.", "I build together."], "Provider": ["I step in when others can't.", "I cover gaps.", "I give stability people can lean on."], "Artisan": ["I work side by side.", "I build with people, not apart.", "I prove loyalty by making."]}, "Provider": {"Sovereign": ["I set up resources before the leader pushes.", "I won't let calls collapse for lack of basics.", "I keep timing grounded."], "Rebel": ["I supply what's missing so change can happen.", "I block scarcity from killing momentum.", "I back rebellion with real stuff."], "Visionary": ["I line up basics before chasing the future.", "I stage resources so visions can run.", "I won't let ideas die for lack of fuel."], "Equalizer": ["I make sure resources aren't hoarded.", "I fill gaps evenly.", "I distribute basics fairly."], "Guardian": ["I resource safety first.", "I stock protection.", "I cover needs so risk drops."], "Seeker": ["I prep supplies before exploration.", "I won't move unless basics are ready.", "I back curiosity with stability."], "Architect": ["I build scaffolds others can use.", "I set up structure like resources.", "I lay foundations before scale."], "Spotlight": ["I highlight the support behind the show.", "I make sure credit goes to the unseen.", "I shine light on what holds things up."], "Diplomat": ["I negotiate who gets what.", "I explain shortages without blame.", "I spread resources carefully."], "Partner": ["I step in so people aren't left hanging.", "I cover others' needs.", "I keep things steady so we stay together."], "Provider": ["I provide what's needed.", "I keep things running.", "I make sure everyone has what they need."], "Artisan": ["I make tools people can actually use.", "I supply solutions hands-on.", "I make stability real."]}, "Artisan": {"Sovereign": ["I prove calls by building them.", "I test leadership decisions in practice.", "I show results with my hands."], "Rebel": ["I protest by making something better.", "I replace arguments with working models.", "I disrupt with prototypes."], "Visionary": ["I turn ideas into things.", "I clear fuzziness by building.", "I test futures in real form."], "Equalizer": ["I fix imbalance by adjusting the work.", "I make fairness hands-on.", "I balance load with what I create."], "Guardian": ["I test carefully under pressure.", "I refuse shortcuts that break safety.", "I prove caution in real builds."], "Seeker": ["I explore by making.", "I learn with tools, not just thinking.", "I trust what I can build."], "Architect": ["I design through building.", "I refine frameworks hands-on.", "I prove systems by making them real."], "Spotlight": ["I show the work instead of talking.", "I display what I've built.", "I make craft visible."], "Diplomat": ["I explain through examples.", "I prove points by showing, not arguing.", "I bridge fights with working stuff."], "Partner": ["I work side by side.", "I share tasks in the build.", "I prove loyalty in practice."], "Provider": ["I make tools that cover needs.", "I supply fixes through craft.", "I create stability hands-on."], "Artisan": ["I build things that work.", "I craft with my hands.", "I make things that last."]}};
