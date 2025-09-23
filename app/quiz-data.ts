/* eslint-disable */

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
        "A1a": { "label": "Act • Command", "sentence": "You act by giving orders clearly, setting direction for others." },
        "A1b": { "label": "Act • Self-take", "sentence": "You act by stepping in yourself, carrying the decision forward." },
        "A2a": { "label": "Act • Sequence", "sentence": "You commit by breaking the task into steps, then enforcing them." },
        "A2b": { "label": "Act • Signal", "sentence": "You commit by anchoring everything on one rule or marker." },
        "S1a": { "label": "Scan • Balance", "sentence": "You keep two commands alive, weighing them evenly before choosing." },
        "S1b": { "label": "Scan • Bias", "sentence": "You lean toward one option but hold a fallback ready." },
        "S2a": { "label": "Scan • Delay", "sentence": "You stall, waiting for just a bit more context before deciding." },
        "S2b": { "label": "Scan • Filter", "sentence": "You block noise, trusting only a single signal before moving." },
        "R1a": { "label": "Reset • Over-push", "sentence": "You over-assert control, pressing harder than needed to force action." },
        "R1b": { "label": "Reset • Cut-off", "sentence": "You shut down others abruptly to regain command." },
        "R2a": { "label": "Reset • Drop", "sentence": "You abandon leadership, letting the call slip to others." },
        "R2b": { "label": "Reset • Void", "sentence": "You withdraw into silence, forcing the group to fill the gap." }
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
