/* eslint-disable */

/* ========= Type Definitions ========= */
export type Tap = { phase: string; family: string; mv: string; detail: string; ts: number; };
export type FamilyResult = { family: string; winner: string; probs: { [key: string]: number; }; share: { A: number; S: number; R: number; }; lrScore: number; avgDetailNudge: number; confidence: string; taps: Tap[]; };
export type Seed = { face: string; family: string; votes: number; p: number; margin: number; _tb: number; seed: number; };
export type MatchLog = { round: string; left: { face: string; seed: number; }; right: { face: string; seed: number; }; chosen: string; };

/* ========= Face Art Mapping ========= */
export const FaceArt: { [key: string]: string } = {
    "Sovereign": "/sovereign.png",
    "Rebel": "/rebel.png",
    "Visionary": "/visionary.png",
    "Navigator": "/navigator.png",
    "Equalizer": "/equalizer.png",
    "Guardian": "/guardian.png",
    "Seeker": "/seeker.png",
    "Architect": "/architect.png",
    "Spotlight": "/spotlight.png",
    "Diplomat": "/diplomat.png",
    "Partner": "/partner.png",
    "Provider": "/provider.png",
    "Catalyst": "/catalyst.png",
    "Artisan": "/artisan.png"
};

export const FaceCopy: { [key: string]: string } = {
    "Sovereign": "I rise in direct ascent, wings locked, owning the sky. Nothing above me but the sun itself.",
    "Rebel": "I twist through air in erratic bursts, sharp turns breaking every pattern mid-flight. Order means nothing to me.",
    "Visionary": "I carve long arcs forward, eyes set on horizons no one else has seen yet. My body lives in tomorrow's wind.",
    "Navigator": "I glide across endless distances, adjusting course through every crosswind. Storm or calm, I find the way.",
    "Equalizer": "I hold altitude in balance, wings stretched level, symmetry unbroken. Night or day, the measure is steady.",
    "Guardian": "I circle wide, watching, shielding the formation. Approach with peace and I stay graceful; threaten and I rise fierce.",
    "Seeker": "I dive with piercing precision, cutting through veils and illusions. What lies beneath is mine to uncover.",
    "Architect": "I climb in measured steps, every angle chosen, every strand reinforced. My flight builds as much as it moves.",
    "Spotlight": "I spiral upward, radiant, all eyes pulled to my shimmer. Flight is my stage, the sky my mirror.",
    "Diplomat": "I weave gently through the currents, smoothing turbulence, easing the path of those beside me.",
    "Partner": "I fly in water if not in sky, always wing-to-wing, never breaking from the one I've chosen.",
    "Provider": "I lift with strength enough for others, carrying their weight in my draft. My currents are never just for me.",
    "Catalyst": "I explode off the air in impossible speed, scattering stillness, igniting motion where none existed.",
    "Artisan": "I stroke the air in slow, deliberate movements, each motion refined, each landing an act of grace."
};

/* ========= Canon ========= */
export const FAMILIES = ["Control", "Pace", "Boundary", "Truth", "Recognition", "Bonding", "Stress"];

export const ARCHETYPES = {
    Control: {
        L: {
            name: "Sovereign",
            definition: "Decisive enforcement. Sets direction, expects alignment.",
            signature: "High A, medium S, low R.",
            tells: ["A1a (Command)", "A2a (Sequence)", "S2b (Filter)"],
            strengths: "clarity, speed of decision, predictable enforcement.",
            blindspots: "brittle to dissent, can ignore nuance."
        },
        R: {
            name: "Rebel",
            definition: "Withholds or overturns imposed control; resets the frame.",
            signature: "Elevated R or low A; S variable.",
            tells: ["R1a (Over-push)", "R2b (Void/withdraw)", "S1b (Bias fallback)"],
            strengths: "breaks bad orders, prevents ossification.",
            blindspots: "destabilizes groups; appears obstructive."
        },
        sentences: { L: "Sets direction directly, enforces the move, expects alignment.", R: "Disrupts imposed control or withdraws to reset the field." }
    },
    Pace: {
        L: {
            name: "Visionary",
            definition: "Tests tempos and options; prefers exploration before commitment.",
            signature: "High S, moderate A.",
            tells: ["S1a (Balance)", "S1b (Bias)", "S2a (Delay)"],
            strengths: "finds novel rhythms, prevents premature lock-in.",
            blindspots: "indecision; misses deadlines."
        },
        R: {
            name: "Navigator",
            definition: "Designs and lands schedules; sequences and enforces tempo.",
            signature: "High A, moderate S.",
            tells: ["A2a (Sequence)", "A2b (Signal)", "A1a (Command)"],
            strengths: "delivers timetables, predictable execution.",
            blindspots: "rigidity, under-weights exploration."
        },
        sentences: { L: "Explores tempo and options, tests rhythms before locking one.", R: "Plans tempo step by step and lands deadlines with clear markers." }
    },
    Boundary: {
        L: {
            name: "Equalizer",
            definition: "Fairness-first boundary worker; calibrates rules to context.",
            signature: "S-dominant with measured A.",
            tells: ["S1a (Balance)", "S2a (Delay)", "S1b (Bias fallback)"],
            strengths: "fairness, context-sensitive limits.",
            blindspots: "slow enforcement; may appear indecisive."
        },
        R: {
            name: "Guardian",
            definition: "Clear guardrails and firm enforcement; limits are explicit.",
            signature: "A-dominant with supporting S for enforcement checks.",
            tells: ["A1a (Command)", "S2b (Filter)", "A2b (Signal)"],
            strengths: "reliability, prevents boundary erosion.",
            blindspots: "overbearing, escalates conflict."
        },
        sentences: { L: "Balances claims and context to draw a fair line.", R: "States non-negotiables and defends them without drift." }
    },
    Truth: {
        L: {
            name: "Seeker",
            definition: "Holds multiple hypotheses, waits for evidence; methodical tester.",
            signature: "S-heavy, low-to-medium A.",
            tells: ["S1a (Balance)", "S2a (Delay)", "S1b (Bias)"],
            strengths: "robust conclusions, fewer false positives.",
            blindspots: "slow closure when needed."
        },
        R: {
            name: "Architect",
            definition: "Builds evidence stacks and rules; closes on proof via sequence.",
            signature: "A-dominant, uses S minimally as filter.",
            tells: ["A2a (Sequence)", "A2b (Signal)", "S2b (Filter)"],
            strengths: "convincing cases, defensible decisions.",
            blindspots: "can over-index on a single source."
        },
        sentences: { L: "Runs alternatives and waits for decisive evidence.", R: "Builds a proof path from sources and sequences to closure." }
    },
    Recognition: {
        L: {
            name: "Diplomat",
            definition: "Balances recognition across people; preserves cohesion.",
            signature: "S-leaning with balancing tells.",
            tells: ["S1a (Balance)", "S1b (Bias fallback)", "S2a (Delay)"],
            strengths: "preserves relationships, fair attribution.",
            blindspots: "under-claims individual effort."
        },
        R: {
            name: "Spotlight",
            definition: "Makes contribution visible; claims and clarifies credit.",
            signature: "A-favouring, uses sequence/signal for visibility.",
            tells: ["A1b (Self-take)", "A2a/A2b (Sequence/Signal)"],
            strengths: "raises morale, prevents disappearing credit.",
            blindspots: "can hog credit, appear self-promoting."
        },
        sentences: { L: "Distributes credit proportionally and preserves cohesion.", R: "Makes contribution visible and specific, including self when needed." }
    },
    Bonding: {
        L: {
            name: "Partner",
            definition: "Co-regulates; holds space, offers options, mutual support.",
            signature: "S-dominant with warm A when stepping in.",
            tells: ["S1a (Balance)", "A1b (Self-take supportive)", "S2a (Delay/space)"],
            strengths: "emotional attunement, durable connections.",
            blindspots: "may avoid decisive action when needed."
        },
        R: {
            name: "Provider",
            definition: "Delivers concrete support plans and visible care.",
            signature: "A-leaning, sequence-driven support moves.",
            tells: ["A2a (Sequence)", "A1b (Self-take)", "A2b (Signal rituals)"],
            strengths: "dependable assistance, reduces friction.",
            blindspots: "smothering; ignores autonomy."
        },
        sentences: { L: "Co-regulates, offers choices, keeps space open.", R: "Delivers concrete support plans and visible care." }
    },
    Stress: {
        L: {
            name: "Artisan",
            definition: "Methodical under pressure; isolates the critical cue and fixes it.",
            signature: "S/A mixed but precise—filters signals to exact responses.",
            tells: ["S2b (Filter)", "S1a (Balance)", "A2a (Sequence fixes)"],
            strengths: "low-error fixes, calm precision.",
            blindspots: "slow under runaway crises; can over-optimize."
        },
        R: {
            name: "Catalyst",
            definition: "Drives motion under pressure; initiates recovery and pushes action.",
            signature: "High A, rapid R spike possible when forced.",
            tells: ["A1a (Command under fire)", "R1a (Over-push)", "A2b (Survival rule)"],
            strengths: "decisive rescue, momentum creation.",
            blindspots: "burns margins; can create collateral stress."
        },
        sentences: { L: "Works methodically under pressure, focusing on the critical cue.", R: "Initiates motion under pressure and drives recovery." }
    }
};

export const RESULTS_LIB: { [key: string]: { [key: string]: { label: string; sentence: string; }; }; } = {
    "Control": {
        "A1a": { "label": "Act • Command", "sentence": "You state the call clearly so everyone moves in the same direction." },
        "A1b": { "label": "Act • Self-take", "sentence": "You carry the call yourself to make the path visible." },
        "A2a": { "label": "Act • Sequence", "sentence": "You turn the call into steps so progress is enforceable." },
        "A2b": { "label": "Act • Signal", "sentence": "You anchor the call to one marker so drift can't hide." },
        "S1a": { "label": "Scan • Balance", "sentence": "You hold two calls in view and choose the one that survives reality." },
        "S1b": { "label": "Scan • Bias", "sentence": "You lean toward one call while keeping a workable fallback." },
        "S2a": { "label": "Scan • Delay", "sentence": "You wait briefly for context so the call lands with judgment." },
        "S2b": { "label": "Scan • Filter", "sentence": "You trust a single clean signal so the call cuts through noise." },
        "R1a": { "label": "Reset • Over-push", "sentence": "You press harder to break inertia when command stalls." },
        "R1b": { "label": "Reset • Cut-off", "sentence": "You shut competing calls down so one voice can steer." },
        "R2a": { "label": "Reset • Drop", "sentence": "You drop the current call to rebuild one that fits the field." },
        "R2b": { "label": "Reset • Void", "sentence": "You step into deliberate quiet so the frame can reset." }
    },
    "Pace": {
        "A1a": { "label": "Act • Command", "sentence": "You set the tempo firmly, dictating the speed of movement." },
        "A1b": { "label": "Act • Self-take", "sentence": "You push the pace yourself, leading from the front." },
        "A2a": { "label": "Act • Sequence", "sentence": "You create a time-block plan and move step by step." },
        "A2b": { "label": "Act • Signal", "sentence": "You tie progress to a clear signal — a bell, deadline, or cue." },
        "S1a": { "label": "Scan • Balance", "sentence": "You test two rhythms in parallel to see which holds." },
        "S1b": { "label": "Scan • Bias", "sentence": "You lean into one tempo but keep another as backup." },
        "S2a": { "label": "Scan • Delay", "sentence": "You hold the rhythm back, waiting for the right moment." },
        "S2b": { "label": "Scan • Filter", "sentence": "You screen out distractions to keep one steady beat." },
        "R1a": { "label": "Reset • Over-push", "sentence": "You rush beyond safe tempo, driving too hard." },
        "R1b": { "label": "Reset • Cut-off", "sentence": "You slam the brakes, halting pace abruptly." },
        "R2a": { "label": "Reset • Drop", "sentence": "You let the schedule collapse, abandoning timing altogether." },
        "R2b": { "label": "Reset • Void", "sentence": "You freeze rhythm, suspending movement until later." }
    },
    "Boundary": {
        "A1a": { "label": "Act • Command", "sentence": "You state limits clearly and enforce them without hesitation." },
        "A1b": { "label": "Act • Self-take", "sentence": "You carry the load yourself to hold the line." },
        "A2a": { "label": "Act • Sequence", "sentence": "You create conditional boundaries — clear rules and terms." },
        "A2b": { "label": "Act • Signal", "sentence": "You mark boundaries with visible signs or cues." },
        "S1a": { "label": "Scan • Balance", "sentence": "You weigh both yes and no, holding fairness in view." },
        "S1b": { "label": "Scan • Bias", "sentence": "You tilt toward refusal while leaving leeway." },
        "S2a": { "label": "Scan • Delay", "sentence": "You stall on decisions, buying time before setting a limit." },
        "S2b": { "label": "Scan • Filter", "sentence": "You allow one exception but block the rest firmly." },
        "R1a": { "label": "Reset • Over-push", "sentence": "You enforce boundaries too sharply, escalating conflict." },
        "R1b": { "label": "Reset • Cut-off", "sentence": "You sever ties suddenly to defend your line." },
        "R2a": { "label": "Reset • Drop", "sentence": "You let boundaries collapse, taking no stand." },
        "R2b": { "label": "Reset • Void", "sentence": "You vanish from the boundary, leaving it undefined." }
    },
    "Truth": {
        "A1a": { "label": "Act • Command", "sentence": "You assert conclusions directly, declaring what is fact." },
        "A1b": { "label": "Act • Self-take", "sentence": "You gather the proof yourself and put it forward." },
        "A2a": { "label": "Act • Sequence", "sentence": "You arrange facts step by step to build the case." },
        "A2b": { "label": "Act • Signal", "sentence": "You anchor everything on one trusted source or rule." },
        "S1a": { "label": "Scan • Balance", "sentence": "You keep two explanations alive, weighing them equally." },
        "S1b": { "label": "Scan • Bias", "sentence": "You favor one explanation while keeping another in reserve." },
        "S2a": { "label": "Scan • Delay", "sentence": "You wait for more data before finalizing truth." },
        "S2b": { "label": "Scan • Filter", "sentence": "You cut away noise, trusting only one line of evidence." },
        "R1a": { "label": "Reset • Over-push", "sentence": "You push a narrative too hard, bending past the evidence." },
        "R1b": { "label": "Reset • Cut-off", "sentence": "You dismiss counter-evidence suddenly, closing the debate." },
        "R2a": { "label": "Reset • Drop", "sentence": "You abandon fact-finding and accept uncertainty." },
        "R2b": { "label": "Reset • Void", "sentence": "You retreat from reasoning, leaving truth unspoken." }
    },
    "Recognition": {
        "A1a": { "label": "Act • Command", "sentence": "You assign credit directly, making contributions visible." },
        "A1b": { "label": "Act • Self-take", "sentence": "You claim your own contribution openly." },
        "A2a": { "label": "Act • Sequence", "sentence": "You list names and roles step by step." },
        "A2b": { "label": "Act • Signal", "sentence": "You mark credit with signatures or symbols." },
        "S1a": { "label": "Scan • Balance", "sentence": "You weigh recognition evenly across people." },
        "S1b": { "label": "Scan • Bias", "sentence": "You tilt credit toward one side while leaving fallback praise." },
        "S2a": { "label": "Scan • Delay", "sentence": "You postpone recognition until more clarity comes." },
        "S2b": { "label": "Scan • Filter", "sentence": "You honor only one trusted testimony as proof." },
        "R1a": { "label": "Reset • Over-push", "sentence": "You exaggerate proof, over-asserting recognition." },
        "R1b": { "label": "Reset • Cut-off", "sentence": "You erase others to spotlight yourself." },
        "R2a": { "label": "Reset • Drop", "sentence": "You skip recognition entirely, leaving it blank." },
        "R2b": { "label": "Reset • Void", "sentence": "You retreat from visibility, hiding the proof." }
    },
    "Bonding": {
        "A1a": { "label": "Act • Command", "sentence": "You create clear care structures, setting firm check-ins." },
        "A1b": { "label": "Act • Self-take", "sentence": "You step in personally to support or comfort." },
        "A2a": { "label": "Act • Sequence", "sentence": "You build plans of support in steady steps." },
        "A2b": { "label": "Act • Signal", "sentence": "You use gestures or rituals to anchor trust." },
        "S1a": { "label": "Scan • Balance", "sentence": "You balance your needs and theirs carefully." },
        "S1b": { "label": "Scan • Bias", "sentence": "You lean toward care but hold a reserve for yourself." },
        "S2a": { "label": "Scan • Delay", "sentence": "You wait, holding space without immediate action." },
        "S2b": { "label": "Scan • Filter", "sentence": "You focus on one channel of care, blocking noise." },
        "R1a": { "label": "Reset • Over-push", "sentence": "You smother with care, stripping autonomy." },
        "R1b": { "label": "Reset • Cut-off", "sentence": "You cut connection sharply when hurt." },
        "R2a": { "label": "Reset • Drop", "sentence": "You withdraw support and let the bond sag." },
        "R2b": { "label": "Reset • Void", "sentence": "You vanish from the bond, leaving it in limbo." }
    },
    "Stress": {
        "A1a": { "label": "Act • Command", "sentence": "You call the move under pressure, leading others through it." },
        "A1b": { "label": "Act • Self-take", "sentence": "You shoulder the stress yourself, acting directly." },
        "A2a": { "label": "Act • Sequence", "sentence": "You lay out a recovery plan in steps." },
        "A2b": { "label": "Act • Signal", "sentence": "You lock onto one survival rule and follow it." },
        "S1a": { "label": "Scan • Balance", "sentence": "You weigh two escape routes in parallel." },
        "S1b": { "label": "Scan • Bias", "sentence": "You lean into one escape, but keep another alive." },
        "S2a": { "label": "Scan • Delay", "sentence": "You hold one beat under fire to reassess." },
        "S2b": { "label": "Scan • Filter", "sentence": "You block panic noise and fix on one cue." },
        "R1a": { "label": "Reset • Over-push", "sentence": "You surge recklessly, breaking safety margins." },
        "R1b": { "label": "Reset • Cut-off", "sentence": "You shut down options suddenly, freezing others too." },
        "R2a": { "label": "Reset • Drop", "sentence": "You collapse under strain, stopping action." },
        "R2b": { "label": "Reset • Void", "sentence": "You dissociate from the pressure, leaving the field mentally." }
    }
};

/* ========= Family Intros ========= */
export const FAMILY_INTROS: { [key: string]: string } = {
    "Control": "In Control, you decide how calls are made, carried, structured, and reset.",
    "Pace": "In Pace, you decide how fast to move, how to hold the beat, and when to stop the clock.",
    "Boundary": "In Boundary, you decide where the line is, how to hold it, and when to redraw it.",
    "Truth": "In Truth, you decide how facts form, how they close, and how to reboot bad stories.",
    "Recognition": "In Recognition, you decide how contribution is witnessed, shared, and reset.",
    "Bonding": "In Bonding, you decide how care is offered, balanced, structured, and reset when strained.",
    "Stress": "In Stress, you decide how to act under fire, what you watch, and how you reset to recover."
};

/* ========= Dynamic Headlines ========= */
export const FAMILY_HEADLINES: { [key: string]: { [key: string]: string } } = {
    "Control": {
        "ACT": "You set the call.",
        "SCAN": "You weigh the call.",
        "RESET": "You break and reset the call.",
        "ACT+SCAN": "You test the call, then make it land.",
        "ACT+RESET": "You drive the call, and know when to rebuild it.",
        "SCAN+RESET": "You judge the call, and you reset when it fails."
    },
    "Pace": {
        "ACT": "You set the rhythm.",
        "SCAN": "You test the rhythm.",
        "RESET": "You stop and restart the rhythm.",
        "ACT+SCAN": "You try tempos, then land the beat.",
        "ACT+RESET": "You push the pace, then reset when it breaks.",
        "SCAN+RESET": "You sense the beat, and reset when it falters."
    },
    "Boundary": {
        "ACT": "You state the line.",
        "SCAN": "You weigh the line.",
        "RESET": "You redraw the line.",
        "ACT+SCAN": "You balance fairness and enforcement.",
        "ACT+RESET": "You hold the line, then clear it when needed.",
        "SCAN+RESET": "You weigh the line, and reset it when it fails."
    },
    "Truth": {
        "ACT": "You assert the fact.",
        "SCAN": "You test the fact.",
        "RESET": "You reset the story.",
        "ACT+SCAN": "You test truth, then close it.",
        "ACT+RESET": "You call truth, then reopen when needed.",
        "SCAN+RESET": "You weigh truth, then reset when it won't hold."
    },
    "Recognition": {
        "ACT": "You show the proof.",
        "SCAN": "You weigh the proof.",
        "RESET": "You reset how proof is shown.",
        "ACT+SCAN": "You share credit without breaking cohesion.",
        "ACT+RESET": "You spotlight, then dim when it's wrong-shaped.",
        "SCAN+RESET": "You balance recognition, then reset it when it distorts."
    },
    "Bonding": {
        "ACT": "You build the bond.",
        "SCAN": "You weigh the bond.",
        "RESET": "You reset the bond.",
        "ACT+SCAN": "You structure care and keep it attuned.",
        "ACT+RESET": "You show up strong, then pull back when needed.",
        "SCAN+RESET": "You weigh connection, then reset it when it strains."
    },
    "Stress": {
        "ACT": "You drive under pressure.",
        "SCAN": "You weigh under pressure.",
        "RESET": "You reset under pressure.",
        "ACT+SCAN": "You decide fast with just enough sensing.",
        "ACT+RESET": "You act hard, then reset when it burns out.",
        "SCAN+RESET": "You sense under fire, then reset when the frame breaks."
    }
};

/* ========= Joiner System ========= */
export const JOINERS: { [key: string]: { [key: string]: string } } = {
    "Control": {
        // Act joiners
        "A1a+A1b": "You don't just name the call; you model it so others can follow.",
        "A2a+A2b": "You make the call both trackable and unmistakable.",
        "A1a+A2a": "Clear direction becomes enforceable steps.",
        "A1b+A2a": "Personal carry becomes a plan others can execute.",
        "A1a+A2b": "A clear call stays aligned around a single marker.",
        "A1b+A2b": "Your first move locks the team onto the same signal.",
        "A1a+A1b+A2a+A2b": "You set, carry, structure, and signal the call end to end.",
        
        // Scan joiners
        "S1a+S1b": "You compare honestly, then commit with a safety net.",
        "S2a+S2b": "You pause just enough to cut noise without losing tempo.",
        "S1a+S2a": "You keep options alive until context makes the choice.",
        "S1b+S2b": "You lean with intention and protect the call with a clean signal.",
        "S1a+S1b+S2a+S2b": "You test, time, and tune the call until the right one carries.",
        
        // Reset joiners
        "R1a+R1b": "You remove friction either by force or by silence.",
        "R2a+R2b": "You clear the field by letting the wrong call die and the frame reset.",
        "R1a+R2a": "You break the jam, then rebuild the ask that fits.",
        "R1b+R2b": "You cut the noise, then let quiet re-center the room.",
        "R1a+R1b+R2a+R2b": "You can restart control by pressure, by pruning, or by a full reset.",
        
        // Cross-mode joiners
        "ACT+SCAN": "You move from testing calls to making one land.",
        "SCAN+RESET": "You refuse to prop a bad call; you reset the frame when evidence says so.",
        "ACT+RESET": "You enforce motion and also know when to stop and rebuild."
    },
    "Pace": {
        // Act joiners
        "A1a+A1b": "You don't just set speed; you pull the pack.",
        "A2a+A2b": "The plan is visible and the cues are unmistakable.",
        "A1a+A2a+A2b": "You define, lead, structure, and signal the tempo end to end.",
        
        // Scan joiners
        "S1a+S1b": "You test tempos honestly, then commit with a fallback.",
        "S2a+S2b": "You wait just enough to keep the beat clean.",
        "S1a+S1b+S2a+S2b": "You compare, time, and tune until the rhythm holds.",
        
        // Reset joiners
        "R1a+R1b": "You can jolt or brake to save timing.",
        "R2a+R2b": "You stop the clock so a better beat can form.",
        "R1a+R1b+R2a+R2b": "You can restart pace by push, stop, rebuild, or full freeze.",
        
        // Cross-mode joiners
        "ACT+SCAN": "You move from tested rhythms to a landed beat.",
        "SCAN+RESET": "When timing fails, you reset instead of forcing noise.",
        "ACT+RESET": "You drive speed and also know when to stop the metronome."
    },
    "Boundary": {
        // Act joiners
        "A1a+A1b": "You hold the line by clarity and personal load.",
        "A2a+A2b": "Rules and markers make the limit undeniable.",
        "A1a+A1b+A2a+A2b": "You declare, shoulder, systematize, and signal the boundary.",
        
        // Scan joiners
        "S1a+S1b": "You balance fairness with resolve.",
        "S2a+S2b": "You buy time yet keep exceptions tight.",
        "S1a+S1b+S2a+S2b": "You tune the line to the case without letting it blur.",
        
        // Reset joiners
        "R1a+R1b": "You can escalate or cut to stop erosion.",
        "R2a+R2b": "You clear space to set a better line.",
        "R1a+R1b+R2a+R2b": "You reset boundaries by force, pruning, drop, or void.",
        
        // Cross-mode joiners
        "ACT+SCAN": "You combine fairness with enforcement.",
        "SCAN+RESET": "When the context changes, you redraw rather than ossify.",
        "ACT+RESET": "You defend hard and also know when to wipe and re-line."
    },
    "Truth": {
        // Act joiners
        "A1a+A1b": "You don't just say the fact; you build it.",
        "A2a+A2b": "The case is both rigorous and anchored.",
        "A1a+A1b+A2a+A2b": "You assert, collect, sequence, and ground truth.",
        
        // Scan joiners
        "S1a+S1b": "You explore fairly, then lean with a safety valve.",
        "S2a+S2b": "You wait just enough and keep only clean signals.",
        "S1a+S1b+S2a+S2b": "You weigh, guard, time, and filter until the fact survives.",
        
        // Reset joiners
        "R1a+R1b": "You can over-close or over-cut when urgency spikes.",
        "R2a+R2b": "You clear the story so a better one can start.",
        "R1a+R1b+R2a+R2b": "You reboot truth by pressure, pruning, pause, or retreat.",
        
        // Cross-mode joiners
        "ACT+SCAN": "You move from hypotheses to defensible closure.",
        "SCAN+RESET": "If the data won't support it, you reset the claim.",
        "ACT+RESET": "You close when proof allows and reopen when it doesn't."
    },
    "Recognition": {
        // Act joiners
        "A1a+A1b": "You make credit visible for all, including yourself.",
        "A2a+A2b": "You make recognition both specific and unmistakable.",
        "A1a+A1b+A2a+A2b": "You assign, claim, enumerate, and mark contribution.",
        
        // Scan joiners
        "S1a+S1b": "You balance fairness with practical tilt.",
        "S2a+S2b": "You wait until it's clear and trust strong testimony.",
        "S1a+S1b+S2a+S2b": "You distribute, temper, time, and verify recognition.",
        
        // Reset joiners
        "R1a+R1b": "You can distort or erase under pressure.",
        "R2a+R2b": "You let visibility fall to reset how proof is shown.",
        "R1a+R1b+R2a+R2b": "You rehab recognition by cutting, pausing, or reappearing clean.",
        
        // Cross-mode joiners
        "ACT+SCAN": "You make credit visible without breaking cohesion.",
        "SCAN+RESET": "If recognition is wrong, you reset how it's done.",
        "ACT+RESET": "You can shine a light and also know when to darken the stage."
    },
    "Bonding": {
        // Act joiners
        "A1a+A1b": "You make care both organized and personal.",
        "A2a+A2b": "Plans and rituals make trust durable.",
        "A1a+A1b+A2a+A2b": "You structure, step in, schedule, and signal care.",
        
        // Scan joiners
        "S1a+S1b": "You care for them without burning yourself down.",
        "S2a+S2b": "You wait with presence and keep noise out.",
        "S1a+S1b+S2a+S2b": "You balance, reserve, pause, and focus to protect trust.",
        
        // Reset joiners
        "R1a+R1b": "You can over-hold or sever when hurt.",
        "R2a+R2b": "You clear space when the bond needs a reset.",
        "R1a+R1b+R2a+R2b": "You reset connection by loosen, cut, drop, or quiet.",
        
        // Cross-mode joiners
        "ACT+SCAN": "You give care that's both structured and attuned.",
        "SCAN+RESET": "When care is wrong-shaped, you reset instead of forcing it.",
        "ACT+RESET": "You can show up strongly and still stop when that's healthier."
    },
    "Stress": {
        // Act joiners
        "A1a+A1b": "You lead and you carry, not one without the other.",
        "A2a+A2b": "Recovery is both planned and rule-locked.",
        "A1a+A1b+A2a+A2b": "You command, absorb, sequence, and signal under pressure.",
        
        // Scan joiners
        "S1a+S1b": "You explore exits while keeping a live backup.",
        "S2a+S2b": "You pause just enough to keep focus clean.",
        "S1a+S1b+S2a+S2b": "You compare, commit, time, and filter to stay effective.",
        
        // Reset joiners
        "R1a+R1b": "You can overdrive or hard-freeze; both carry risk.",
        "R2a+R2b": "You clear the board when capacity collapses.",
        "R1a+R1b+R2a+R2b": "You reset under stress by surge, shut, drop, or void.",
        
        // Cross-mode joiners
        "ACT+SCAN": "You decide fast with just enough sensing.",
        "SCAN+RESET": "When the frame is broken, you reset rather than flail.",
        "ACT+RESET": "You can drive action and still know when to stop."
    }
};

/* ========= Quiz content (same flow as earlier build): 7x(6), 14 binaries, 7 binaries ========= */
export const PHASE1 = [
    {
        family: "Control", stem: "Plan split in 10 minutes. Pick a direction.",
        choices: [
            { text: "Pick route A, assign first three steps, roll.", mv: "A", detail: "A1a" },
            { text: "Pick route B, assign people, start now.", mv: "A", detail: "A1b" },
            { text: "Hold A and B; ask for one quick check each.", mv: "S", detail: "S1a" },
            { text: "Add route C; ask group to keep options open.", mv: "S", detail: "S1b" },
            { text: "Announce A then keep changing calls mid-start.", mv: "R", detail: "R1a" },
            { text: "Stall on perfect info; no start.", mv: "R", detail: "R2b" }
        ]
    },
    {
        family: "Pace", stem: "Trip late, two stops left.",
        choices: [
            { text: "Cut one stop, set the new arrival time, move.", mv: "A", detail: "A1a" },
            { text: "Keep both stops; shrink stop time to 10 minutes.", mv: "A", detail: "A2a" },
            { text: "Suggest two options, get quick feedback.", mv: "S", detail: "S1a" },
            { text: "Ask for one more idea before moving.", mv: "S", detail: "S2a" },
            { text: "Speed past limits; push people to rush.", mv: "R", detail: "R1a" },
            { text: "Pull over and rethink.", mv: "R", detail: "R2a" }
        ]
    },
    {
        family: "Boundary", stem: "Neighbor asks to store boxes in your hall for a week.",
        choices: [
            { text: "Decline clearly; suggest pickup window.", mv: "A", detail: "A1a" },
            { text: "Allow 24 hours; mark the boundary line.", mv: "A", detail: "A2b" },
            { text: "Offer one box spot; confirm removal date.", mv: "S", detail: "S1b" },
            { text: "Say maybe and avoid a date.", mv: "S", detail: "S2a" },
            { text: "Enforce harshly; escalate conflict.", mv: "R", detail: "R1a" },
            { text: "Avoid reply; let it pile up.", mv: "R", detail: "R2b" }
        ]
    },
    {
        family: "Truth", stem: "Conflicting dates; decision in 5 minutes.",
        choices: [
            { text: "Pick one source of record, verify once, decide.", mv: "A", detail: "A2b" },
            { text: "Call the host; confirm; publish final time.", mv: "A", detail: "A1b" },
            { text: "Keep two candidates; ask for one proof ping.", mv: "S", detail: "S1a" },
            { text: "Gather screenshots; no decision yet.", mv: "S", detail: "S2a" },
            { text: "Argue tone, not evidence.", mv: "R", detail: "R1a" },
            { text: "Accept whatever was said first.", mv: "R", detail: "R2a" }
        ]
    },
    {
        family: "Recognition", stem: "Unclear credit at hand-in.",
        choices: [
            { text: "List names with exact contributions; send.", mv: "A", detail: "A2a" },
            { text: "Ask lead to attach the list of what each did.", mv: "A", detail: "A2b" },
            { text: "Draft two ways to share credit; request quick pick.", mv: "S", detail: "S1a" },
            { text: "Nudge privately; hope the doc gets fixed.", mv: "S", detail: "S2a" },
            { text: "Claim more credit than you had in the summary.", mv: "R", detail: "R1a" },
            { text: "Submit without your name attached.", mv: "R", detail: "R2a" }
        ]
    },
    {
        family: "Bonding", stem: "Friend spiraling before their talk.",
        choices: [
            { text: "Block 15 minutes, rehearse opener, walk them in.", mv: "A", detail: "A1b" },
            { text: "Get water and seats; set one check-in time.", mv: "A", detail: "A2a" },
            { text: "Offer choices: vent, run notes, silent sit.", mv: "S", detail: "S1a" },
            { text: "Send a long voice note; no live help.", mv: "S", detail: "S2b" },
            { text: "Take over their plan yourself.", mv: "R", detail: "R1a" },
            { text: "Ghost to give space.", mv: "R", detail: "R2b" }
        ]
    },
    {
        family: "Stress", stem: "Flat tire en route to interview; 20 minutes buffer.",
        choices: [
            { text: "Call rideshare; message arrival time; keep moving.", mv: "A", detail: "A1a" },
            { text: "Swap to spare, confirm arrival, continue.", mv: "A", detail: "A2a" },
            { text: "Try both: call a ride while you try the spare.", mv: "S", detail: "S1a" },
            { text: "Phone three friends first.", mv: "S", detail: "S2a" },
            { text: "Rage at traffic; no move.", mv: "R", detail: "R1a" },
            { text: "Cancel; say nothing.", mv: "R", detail: "R2a" }
        ]
    }
];

export const PHASE2 = [
    {
        family: "Stress", stem: "Oven broken, dinner in 30 minutes.",
        A: { text: "Book earliest repair; switch meal to no-oven.", detail: "A2b" },
        S: { text: "Try quick reset; if fails, book repair.", detail: "S1a" }
    },
    {
        family: "Pace", stem: "Weekend overbooked; three invites overlap.",
        A: { text: "Cancel one; confirm the other two with times.", detail: "A1a" },
        S: { text: "Ask hosts for flexible windows before deciding.", detail: "S1a" }
    },
    {
        family: "Truth", stem: "Card charged twice at checkout.",
        A: { text: "Cancel and run again; verify receipt now.", detail: "A1b" },
        R: { text: "Walk out annoyed; fix later.", detail: "R2a" }
    },
    {
        family: "Control", stem: "Group chat spiraling; decision due today.",
        A: { text: "Propose single next step; turn off notifications for one hour.", detail: "A1a" },
        R: { text: "Rapid replies; escalate tone.", detail: "R1a" }
    },
    {
        family: "Pace", stem: "Ambiguous invite this week.",
        A: { text: "Offer two concrete slots; ask for one confirm.", detail: "A2b" },
        S: { text: "Ask clarifying questions about place and length.", detail: "S2a" }
    },
    {
        family: "Truth", stem: "Task handoff missing clear finish line.",
        A: { text: "Restate task result; confirm what done means.", detail: "A2a" },
        S: { text: "Start a draft; schedule a clarification call.", detail: "S1a" }
    },
    {
        family: "Pace", stem: "Wrong address sent; you’re en route.",
        A: { text: "Call; share live location, confirm which entrance.", detail: "A1b" },
        S: { text: "Text for a pin; slow down until reply.", detail: "S2a" }
    },
    {
        family: "Stress", stem: "Desk clutter blocking work; 15 minutes free.",
        A: { text: "Sort: trash, keep, act today.", detail: "A2a" },
        S: { text: "Tidy visible area; list remaining for tomorrow.", detail: "S1b" }
    },
    {
        family: "Boundary", stem: "Friend late twice this week.",
        A: { text: "Shift future meets 15 minutes later; confirm.", detail: "A2a" },
        S: { text: "Ask what timing works better; adjust once.", detail: "S1a" }
    },
    {
        family: "Truth", stem: "Two articles conflict.",
        A: { text: "Read methods; choose stronger evidence; write why.", detail: "A2a" },
        R: { text: "Share catchier headline without checking.", detail: "R1a" }
    },
    {
        family: "Recognition", stem: "Your name missing from photo book draft.",
        A: { text: "Add caption with your role; tag the editor.", detail: "A1b" },
        R: { text: "Ignore it; tell friends the book is wrong.", detail: "R2a" }
    },
    {
        family: "Pace", stem: "Double-booked calls in same hour.",
        A: { text: "Keep higher-impact call; reschedule the other.", detail: "A1a" },
        S: { text: "Ask both for 15-minute shifts; try to fit.", detail: "S1b" }
    },
    {
        family: "Boundary", stem: "Cousin asks for your streaming password.",
        A: { text: "Decline; help set up their own plan.", detail: "A2b" },
        R: { text: "Share password; worry later.", detail: "R2b" }
    },
    {
        family: "Bonding", stem: "Partner anxious at airport; 20 minutes.",
        A: { text: "Take bag, check gate, walk them in.", detail: "A1b" },
        S: { text: "Ask what helps most, stay close.", detail: "S1a" }
    }
];

export const PHASE3 = [
    {
        family: "Stress", stem: "Cluttered desk.",
        A: { text: "10-minute sweep: trash, keep, action.", detail: "A2a" },
        R: { text: "Close the door; deal tomorrow.", detail: "R2a" }
    },
    {
        family: "Boundary", stem: "Friend late twice.",
        A: { text: "Shift meets 15 minutes later; confirm.", detail: "A2a" },
        S: { text: "Ask timing that works; adjust once.", detail: "S1a" }
    },
    {
        family: "Truth", stem: "Conflicting article claims.",
        A: { text: "Read methods; accept the stronger one.", detail: "A2a" },
        R: { text: "Share the catchier headline.", detail: "R1a" }
    },
    {
        family: "Recognition", stem: "Photo book credit missing you.",
        A: { text: "Add your caption; tag editor.", detail: "A1b" },
        R: { text: "Skip the add; let it slide.", detail: "R2a" }
    },
    {
        family: "Pace", stem: "Double-booked calls.",
        A: { text: "Keep higher-impact; move the other.", detail: "A1a" },
        S: { text: "Ask both to shift 15 minutes.", detail: "S1b" }
    },
    {
        family: "Boundary", stem: "Cousin asks for login.",
        A: { text: "Decline; help set up instead.", detail: "A2b" },
        R: { text: "Share password, fix later.", detail: "R2b" }
    },
    {
        family: "Bonding", stem: "Partner tense before flight.",
        A: { text: "Take bag, check gate, walk them in.", detail: "A1b" },
        S: { text: "Ask what helps; stay close.", detail: "S1a" }
    }
];


// ========= Evidence scoring =========
export const TIE_ORDER: { [key: string]: string[] } = {
    Control: ["S", "A", "R"], // don't always hand Act the crown
    Pace: ["S", "A", "R"],
    Boundary: ["S", "A", "R"],
    Truth: ["S", "A", "R"],
    Recognition: ["S", "A", "R"],
    Bonding: ["S", "A", "R"],
    Stress: ["A", "S", "R"], // Stress keeps Act first; it's the emergency line
};


// ========= Archetype resolver =========
// Prior lean of movements toward Left/Right per family.
// Values are deltas added before normalization, small and symmetric.
export const priorLR: { [key: string]: { [key: string]: number } } = {
    Control: { A: +0.10, S: +0.00, R: -0.10 }, // Harmonized ±0.10 standard
    Pace: { A: -0.10, S: +0.10, R: 0.00 }, // Scan→Visionary(L), Act→Navigator(R)
    Boundary: { A: -0.10, S: +0.10, R: 0.00 }, // Scan→Equalizer(L), Act→Guardian(R)
    Truth: { A: -0.10, S: +0.10, R: 0.00 }, // Scan→Seeker(L), Act→Architect(R)
    Recognition: { A: -0.10, S: +0.10, R: 0.00 }, // Scan→Diplomat(L), Act→Spotlight(R)
    Bonding: { A: -0.10, S: +0.10, R: 0.00 }, // Scan→Partner(L), Act→Provider(R)
    Stress: { A: -0.05, S: +0.05, R: +0.05 }, // Harmonized ±0.05 for Stress
};

// Answer-to-archetype mapping
export const LEAN: { [key: string]: { [key: string]: string } } = {
    Control: {
        A1a: "Sovereign", A1b: "Sovereign", A2a: "Sovereign", A2b: "Sovereign",
        S1a: "Sovereign", S1b: "Rebel", S2a: "Rebel", S2b: "Sovereign",
        R1a: "Rebel", R1b: "Rebel", R2a: "Rebel", R2b: "Rebel",
    },
    Pace: {
        A1a: "Navigator", A1b: "Navigator", A2a: "Navigator", A2b: "Navigator",
        S1a: "Visionary", S1b: "Visionary", S2a: "Visionary", S2b: "Navigator",
        R1a: "Visionary", R1b: "Visionary", R2a: "Visionary", R2b: "Visionary",
    },
    Boundary: {
        A1a: "Guardian", A1b: "Guardian", A2a: "Guardian", A2b: "Guardian",
        S1a: "Equalizer", S1b: "Equalizer", S2a: "Equalizer", S2b: "Guardian",
        R1a: "Guardian", R1b: "Guardian", R2a: "Equalizer", R2b: "Equalizer",
    },
    Truth: {
        A1a: "Architect", A1b: "Architect", A2a: "Architect", A2b: "Architect",
        S1a: "Seeker", S1b: "Seeker", S2a: "Seeker", S2b: "Architect",
        R1a: "Architect", R1b: "Architect", R2a: "Seeker", R2b: "Seeker",
    },
    Recognition: {
        A1a: "Spotlight", A1b: "Spotlight", A2a: "Spotlight", A2b: "Spotlight",
        S1a: "Diplomat", S1b: "Diplomat", S2a: "Diplomat", S2b: "Spotlight",
        R1a: "Spotlight", R1b: "Spotlight", R2a: "Diplomat", R2b: "Diplomat",
    },
    Bonding: {
        A1a: "Provider", A1b: "Provider", A2a: "Provider", A2b: "Provider",
        S1a: "Partner", S1b: "Partner", S2a: "Partner", S2b: "Provider",
        R1a: "Provider", R1b: "Partner", R2a: "Partner", R2b: "Partner",
    },
    Stress: {
        A1a: "Catalyst", A1b: "Catalyst", A2a: "Artisan", A2b: "Catalyst",
        S1a: "Artisan", S1b: "Artisan", S2a: "Artisan", S2b: "Artisan",
        R1a: "Catalyst", R1b: "Catalyst", R2a: "Artisan", R2b: "Artisan",
    },
};

export const familyPair = (family: string) => {
    const map: { [key: string]: { left: string, right: string } } = {
        Control: { left: "Sovereign", right: "Rebel" },
        Pace: { left: "Visionary", right: "Navigator" },
        Boundary: { left: "Equalizer", right: "Guardian" },
        Truth: { left: "Seeker", right: "Architect" },
        Recognition: { left: "Diplomat", right: "Spotlight" },
        Bonding: { left: "Partner", right: "Provider" },
        Stress: { left: "Artisan", right: "Catalyst" },
    };
    return map[family];
}

// Hybrid tournament filtering - exact vote match + probability proximity
export const VOTE_WINDOW = 0;        // exact same votes as leader only
export const PROB_WINDOW = 0.02;     // within 2 percentage points of the leader's p
export const MIN_FINALISTS = 2;      // we always want at least a Final
export const PROB_BACKOFF = 0.03;    // if pool < 2, widen to 3%

export const DUEL_EPS = 0.02;

// Helper functions for quiz logic
export const familyScoresPure = (fam: string, allTaps: any[]) => {
    const A = allTaps.reduce((n, t) => n + (t.family === fam && t.mv === 'A' ? 1 : 0), 0);
    const S = allTaps.reduce((n, t) => n + (t.family === fam && t.mv === 'S' ? 1 : 0), 0);
    const R = allTaps.reduce((n, t) => n + (t.family === fam && t.mv === 'R' ? 1 : 0), 0);
    return { A, S, R, T: A + S + R || 1 };
};

export const detailNudge = (family: string, detail: string) => {
    const lean = (LEAN as any)[family]?.[detail];
    if (!lean) return 0;
    const pair = familyPair(family);
    return lean === pair.left ? +0.05 : -0.05;
};

export const band = (prob: number, margin: number, tapCount: number) => {
    if (prob >= 0.64 && margin >= 0.20 && tapCount >= 4) return "High";
    if (prob >= 0.55 && margin >= 0.12 && tapCount >= 3) return "Medium";
    return "Low";
};

export const resolveFamilyArchetype = (family: string, allTaps: any[]): any => {
    const familyTaps = allTaps.filter((t: any) => t.family === family);
    const counts = familyScoresPure(family, allTaps);
    const total = counts.T;
    const share = { A: counts.A / total, S: counts.S / total, R: counts.R / total };
    let raw = 0;
    for (const mv of ["A", "S", "R"]) {
        raw += share[mv as keyof typeof share] * ((priorLR as any)[family]?.[mv] || 0);
    }
    const nudgeSum = familyTaps.reduce((sum: number, t: any) => sum + detailNudge(family, t.detail), 0);
    const avgDetailNudge = familyTaps.length ? (nudgeSum / familyTaps.length) : 0;
    const lrScore = Math.max(-0.24, Math.min(+0.24, raw + avgDetailNudge));
    const left = Math.exp(+lrScore);
    const right = Math.exp(-lrScore);
    const pL = left / (left + right);
    const pR = right / (left + right);
    const pair = familyPair(family);
    const winner = pL >= pR ? pair.left : pair.right;
    const confidence = band(Math.max(pL, pR), Math.abs(pL - pR), familyTaps.length);
    return { family, winner, probs: { [pair.left]: pL, [pair.right]: pR }, share, lrScore, avgDetailNudge, confidence, taps: familyTaps };
};

export const resolveAllFamilies = (allTaps: any[]): any[] => FAMILIES.map(fam => resolveFamilyArchetype(fam, allTaps));

export const pickWinnerMovement = (counts: {A:number;S:number;R:number}, fam: string) => {
    const max = Math.max(counts.A, counts.S, counts.R);
    const order = (TIE_ORDER as any)[fam] || ["A","S","R"];
    return order.find((k: string) => (counts as any)[k] === max);
};

export const topDetailForMovement = (fam: string, mv: string, taps: any[]) => {
    const counts: {[k:string]: number} = {};
    taps.forEach((t: any) => { if (t.family===fam && t.mv===mv && t.detail) counts[t.detail] = (counts[t.detail]||0)+1; });
    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const fallback = mv==='A'?'A1a': mv==='S'?'S1a':'R1a';
    return { detail: (sorted[0]?.[0] || fallback), n: (sorted[0]?.[1] || 0) };
};

// ========= Atomic + Joiner System =========
export const calculateJoiners = (family: string, earnedLines: any[]) => {
    const familyJoiners = (JOINERS as any)[family] || {};
    const earnedCodes = earnedLines.map(line => line.detail);
    const joiners: string[] = [];
    
    // Helper to check if all codes in a joiner key are present
    const hasAllCodes = (joinerKey: string) => {
        const codes = joinerKey.split('+');
        return codes.every(code => earnedCodes.includes(code));
    };
    
    // Helper to check if any codes from a mode are present
    const hasMode = (mode: string) => {
        const modeCodes = earnedCodes.filter(code => code.startsWith(mode[0]));
        return modeCodes.length > 0;
    };
    
    // Priority order: within-cluster joiners first, then cross-mode
    const joinerKeys = Object.keys(familyJoiners);
    
    // Within-cluster joiners (Act, Scan, Reset)
    const withinClusterJoiners = joinerKeys.filter(key => 
        !key.includes('ACT+') && !key.includes('SCAN+') && !key.includes('RESET+')
    );
    
    // Cross-mode joiners
    const crossModeJoiners = joinerKeys.filter(key => 
        key.includes('ACT+') || key.includes('SCAN+') || key.includes('RESET+')
    );
    
    // Process within-cluster joiners (prefer longer overlaps first)
    const sortedWithinCluster = withinClusterJoiners.sort((a, b) => {
        const aLength = a.split('+').length;
        const bLength = b.split('+').length;
        if (aLength !== bLength) return bLength - aLength; // Longer first
        return a.localeCompare(b); // Alphabetical for same length
    });
    
    let withinClusterCount = 0;
    for (const key of sortedWithinCluster) {
        if (hasAllCodes(key) && withinClusterCount < 2) {
            joiners.push(familyJoiners[key]);
            withinClusterCount++;
        }
    }
    
    // Process cross-mode joiners (max 1)
    if (joiners.length < 3) {
        const hasAct = hasMode('ACT');
        const hasScan = hasMode('SCAN');
        const hasReset = hasMode('RESET');
        
        if (hasAct && hasScan && familyJoiners['ACT+SCAN']) {
            joiners.push(familyJoiners['ACT+SCAN']);
        } else if (hasScan && hasReset && familyJoiners['SCAN+RESET']) {
            joiners.push(familyJoiners['SCAN+RESET']);
        } else if (hasAct && hasReset && familyJoiners['ACT+RESET']) {
            joiners.push(familyJoiners['ACT+RESET']);
        }
    }
    
    return joiners.slice(0, 3); // Cap at 3 joiners max
};

export const calculateHeadline = (family: string, earnedLines: any[]) => {
    const familyHeadlines = (FAMILY_HEADLINES as any)[family] || {};
    const earnedCodes = earnedLines.map(line => line.detail);
    
    // Check which clusters are present
    const hasAct = earnedCodes.some(code => code.startsWith('A'));
    const hasScan = earnedCodes.some(code => code.startsWith('S'));
    const hasReset = earnedCodes.some(code => code.startsWith('R'));
    
    // Determine the cluster combination
    let clusterCombo = '';
    if (hasAct && hasScan && hasReset) {
        // All three - pick the most relevant cross-mode
        if (familyHeadlines['ACT+SCAN']) clusterCombo = 'ACT+SCAN';
        else if (familyHeadlines['ACT+RESET']) clusterCombo = 'ACT+RESET';
        else if (familyHeadlines['SCAN+RESET']) clusterCombo = 'SCAN+RESET';
    } else if (hasAct && hasScan) {
        clusterCombo = 'ACT+SCAN';
    } else if (hasAct && hasReset) {
        clusterCombo = 'ACT+RESET';
    } else if (hasScan && hasReset) {
        clusterCombo = 'SCAN+RESET';
    } else if (hasAct) {
        clusterCombo = 'ACT';
    } else if (hasScan) {
        clusterCombo = 'SCAN';
    } else if (hasReset) {
        clusterCombo = 'RESET';
    }
    
    return familyHeadlines[clusterCombo] || `You work with ${family.toLowerCase()} patterns.`;
};

export const renderFamilyContent = (family: string, earnedLines: any[]) => {
    const intro = (FAMILY_INTROS as any)[family] || `In ${family}, you work with movement patterns.`;
    const headline = calculateHeadline(family, earnedLines);
    const joiners = calculateJoiners(family, earnedLines);
    
    return {
        intro,
        headline,
        atomicLines: earnedLines,
        joiners
    };
};