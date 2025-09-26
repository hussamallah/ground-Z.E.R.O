# Batch script to update remaining result pages with Prize system and UX improvements
# Remaining pages: Artisan, Diplomat, Equalizer, Guardian, Navigator, Provider

$pages = @("Artisan", "Diplomat", "Equalizer", "Guardian", "Navigator", "Provider")

foreach ($page in $pages) {
    Write-Host "Updating $page page..." -ForegroundColor Green
    
    $filePath = "results\$page\page.tsx"
    
    if (Test-Path $filePath) {
        # Read the file
        $content = Get-Content $filePath -Raw
        
        # 1. Add Prize system after CURRENT_ARCHETYPE
        $prizeSystem = @"

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
    'Navigator': 'Artisan',
    
    // Stress → needs Pace
    'Catalyst': 'Navigator',
    'Artisan': 'Visionary',
    
    // Boundary → needs Bonding
    'Equalizer': 'Provider',
    'Guardian': 'Partner',
    
    // Bonding → needs Boundary
    'Partner': 'Guardian',
    'Provider': 'Equalizer'
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
"@

        # Add Prize system after CURRENT_ARCHETYPE
        $content = $content -replace "(const CURRENT_ARCHETYPE = `"$page`";)", "`$1$prizeSystem"
        
        # 2. Update HeroBand signature
        $content = $content -replace "const HeroBand = \(\{ finalWinner, secondaryFace, pureOneFace \}: \{ finalWinner: Seed \| null, secondaryFace\?: Seed \| null, pureOneFace\?: boolean \}\) => \(", "const HeroBand = ({ finalWinner, secondaryFace, pureOneFace, taps }: { finalWinner: Seed | null, secondaryFace?: Seed | null, pureOneFace?: boolean, taps: Tap[] }) => {`n    return ("
        
        # 3. Update HeroBand layout (centered, face name + sticker on one line)
        $heroBandPattern = '(    <div className="mb-10 pt-10">\s*<div className="max-w-4xl mx-auto flex flex-col items-start text-left gap-y-3">\s*<div className="flex items-baseline gap-x-4">\s*<h1\s*className="m-0 font-bold tracking-tight"\s*style=\{\s*fontSize: ''56px'',\s*lineHeight: 1\.1,\s*color: getFaceLight\(finalWinner\?\.face \|\| ''\)\),\s*\}\s*>\s*\{finalWinner\?\.face\}\s*</h1>\s*<img\s*src=\{`/\$\{\(finalWinner\?\.face \|\| ''$page''\)\.toLowerCase\(\)\}\.png`\}\s*alt=\{`\$\{finalWinner\?\.face \|\| ''$page''\} emblem\.`\}\s*width=\{80\}\s*height=\{80\}\s*className="rounded-lg"\s*style=\{\s*objectFit: ''contain'',\s*transform: ''translateY\(20px\)''\s*\}\s*/>\s*</div>)'
        
        $newHeroBand = @"
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
                <img
                    src={`/${(finalWinner?.face || '$page').toLowerCase()}.png`}
                    alt={`${finalWinner?.face || '$page'} emblem.`}
                    width={72}
                    height={72}
                    className="rounded"
                    style={{
                        objectFit: 'contain',
                        transform: 'translateY(5px)'
                    }}
                />
            </div>
"@
        
        $content = $content -replace $heroBandPattern, $newHeroBand
        
        # 4. Update chips section
        $chipsPattern = '(            <div className="flex items-center gap-x-6 mt-1">\s*\{pureOneFace && \(\s*<div className="px-3 py-1 rounded-full text-sm font-medium bg-white/10 border border-solid border-white/20 text-white/80">\s*Pure Match\s*</div>\s*\)\s*\}\s*\{secondaryFace && secondaryFace\.face !== finalWinner\?\.face && \(\s*<div className="flex items-center gap-x-3">\s*<div\s*className="px-3 py-1 rounded-full text-sm font-medium"\s*style=\{\s*background: `rgba\(\$\{getFaceLight\(secondaryFace\.face\)\.replace\(''#'', ''''\)\.match\(/\.\{2\}/g\)\?\.map\(hex => parseInt\(hex, 16\)\)\.join\('', ''\) \|\| ''148, 163, 184''\}, 0\.1\)`,\s*color: getFaceLight\(secondaryFace\.face\),\s*border: `1px solid rgba\(\$\{getFaceLight\(secondaryFace\.face\)\.replace\(''#'', ''''\)\.match\(/\.\{2\}/g\)\?\.map\(hex => parseInt\(hex, 16\)\)\.join\('', ''\) \|\| ''148, 163, 184''\}, 0\.2\)`\s*\}\s*>\s*Secondary: \{secondaryFace\.face\}\s*</div>\s*<div className="relative w-\[72px\] h-\[6px\]">\s*<div className="absolute inset-0 bg-white/20 rounded-full"></div>\s*<div\s*className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"\s*style=\{\s*left: ''36%'', // This would be computed\s*background: getFaceLight\(secondaryFace\.face\)\s*\}\s*></div>\s*</div>\s*</div>\s*\)\s*\}\s*</div>)'
        
        $newChips = @"
            {/* Compact chips row */}
            <div className="flex items-center gap-x-3 flex-wrap">
                {pureOneFace && (
                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 border border-solid border-white/20 text-white/80">
                        Pure Match
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
"@
        
        $content = $content -replace $chipsPattern, $newChips
        
        # 5. Close HeroBand function
        $content = $content -replace "(\s*</p>\s*</div>\s*</div>\s*\);", "`$1`n    );`n};"
        
        # 6. Add Legend and Prize sections before SummaryTab
        $legendAndPrize = @"

const LegendSection = () => (
    <div className="mb-6 max-w-6xl mx-auto">
        <div className="bg-black/40 rounded-lg p-4 border border-white/10">
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white">
                <div className="flex items-center gap-2">
                    <span className="text-white/60">⚡</span>
                    <strong>Main Archetype (Driver):</strong> your baseline way of moving through the world.
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-white/60">🎭</span>
                    <strong>Secondary Archetype (Presenter):</strong> the parallel pattern that shapes how the main shows up.
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-white/60">🔑</span>
                    <strong>Prize:</strong> the required pattern — the one you chase in yourself and look for in others, the lock that makes your movement click.
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-white/60">🏛️</span>
                    <strong>Families:</strong> seven decision jobs where your patterns show up.
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-white/60">🎯</span>
                    <strong>Styles:</strong> Action (push forward), Weighing (hold and compare), Reset (stop and restart).
                </div>
            </div>
        </div>
    </div>
);

const PrizeSection = ({ finalWinner, secondaryFace, taps }: { finalWinner: Seed | null, secondaryFace?: Seed | null, taps: Tap[] }) => {
    const prizeActivation = finalWinner ? evaluatePrizeActivation(finalWinner.face, secondaryFace || null, taps) : null;
    
    if (!prizeActivation) return null;
    
    return (
        <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ 
                backgroundColor: prizeActivation.state === "ACTIVE" ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                border: `1px solid ${prizeActivation.state === "ACTIVE" ? 'rgba(34, 197, 94, 0.3)' : 'rgba(156, 163, 175, 0.3)'}`
            }}>
                <span style={{ color: prizeActivation.state === "ACTIVE" ? '#22c55e' : '#9ca3af' }}>
                    {prizeActivation.state === "ACTIVE" ? '✓' : '○'}
                </span>
                <span style={{ color: prizeActivation.state === "ACTIVE" ? '#22c55e' : '#9ca3af' }}>
                    {prizeActivation.state === "ACTIVE" ? "Prize active" : "Prize dark"}
                </span>
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

"@
        
        $content = $content -replace "(const SummaryTab = \{ familyResults, taps, duels, finalWinner \}: \{ familyResults: any\[\], taps: Tap\[\], duels: MatchLog\[\], finalWinner: Seed \| null \}\) => \{)", "$legendAndPrize`$1"
        
        # 7. Update FamilyGrid signature
        $content = $content -replace "const FamilyGrid = \(\{ triad, finalWinner \}: \{ triad: any\[\], finalWinner: Seed \| null \}\) => \(", "const FamilyGrid = ({ triad, finalWinner, secondaryFace, taps }: { triad: any[], finalWinner: Seed | null, secondaryFace?: Seed | null, taps: Tap[] }) => {`n    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());`n    `n    const toggleCard = (familyName: string) => {`n        setExpandedCards(prev => {`n            const newSet = new Set(prev);`n            if (newSet.has(familyName)) {`n                newSet.delete(familyName);`n            } else {`n                newSet.add(familyName);`n            }`n            return newSet;`n        });`n    };`n    `n    const prizeActivation = finalWinner ? evaluatePrizeActivation(finalWinner.face, secondaryFace || null, taps) : null;`n    `n    return ("
        
        # 8. Update family card rendering with progressive disclosure
        $familyCardPattern = '(                return \(\s*<div\s*key=\{item\.family\}\s*className="bg-white/5 rounded-lg p-4 flex flex-col"\s*style=\{\s*minHeight: ''200px''\s*\}\s*>\s*<div className="flex items-start mb-2">\s*<h3 className="text-md font-semibold flex items-center gap-x-2">\s*<span>\{FAMILY_ICONS\[item\.family\]\}</span>\s*<span>\{item\.family\}</span>\s*</h3>\s*</div>\s*<div className="space-y-2 text-sm text-white/90 flex-grow" style=\{\s*lineHeight: 1\.4\s*\}>\s*<p style=\{\s*color: getFaceLight\(finalWinner\?\.face \|\| ''\)\s*\}>\s*\{item\.headline\.substring\(0, 90\)\}\{item\.headline\.length > 90 && ''\.\.\.''\}\s*</p>\s*<div className="space-y-1\.5">\s*\{actionLine && <div><span className="font-medium" style=\{\s*color: getFaceLight\(finalWinner\?\.face \|\| ''\)\s*\}>\s*Action style:</span> \{actionLine\.sentence\}</div>\}\s*\{scanLine && <div><span className="font-medium" style=\{\s*color: getFaceLight\(finalWinner\?\.face \|\| ''\)\s*\}>\s*Weighing style:</span> \{scanLine\.sentence\}</div>\}\s*\{resetLine && <div><span className="font-medium" style=\{\s*color: getFaceLight\(finalWinner\?\.face \|\| ''\)\s*\}>\s*Reset style:</span> \{resetLine\.sentence\}</div>\}\s*</div>\s*</div>\s*</div>\s*\);)'
        
        $newFamilyCard = @"
                const isExpanded = expandedCards.has(item.family);
                const isPrizeActive = prizeActivation?.state === "ACTIVE" && item.family === "Stress";
                
                return (
                    <div
                        key={item.family}
                        className={`bg-white/5 rounded-lg p-4 flex flex-col cursor-pointer transition-all duration-200 hover:bg-white/10 ${
                            isPrizeActive ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20' : ''
                        }`}
                        style={{ minHeight: '200px' }}
                        onClick={() => toggleCard(item.family)}
                    >
                        <div className="flex items-start mb-2">
                            <h3 className="text-md font-semibold flex items-center gap-x-2">
                                <span>{FAMILY_ICONS[item.family]}</span>
                                <span>{item.family}</span>
                            </h3>
                        </div>
                        <div className="space-y-2 text-sm text-white/90 flex-grow" style={{ lineHeight: 1.4 }}>
                            <p style={{ color: getFaceLight(finalWinner?.face || '') }}>
                                {item.headline.substring(0, 90)}{item.headline.length > 90 && '...'}
                            </p>
                            
                            {!isExpanded ? (
                                <div className="text-sm text-white/60">
                                    Click to reveal your decision styles
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {actionLine && <div><span className="font-medium" title="This describes how you push forward and commit to decisions" style={{ color: getFaceLight(finalWinner?.face || '') }}>Action style:</span> {actionLine.sentence}</div>}
                                    {scanLine && <div><span className="font-medium" title="This describes your thought process when evaluating options" style={{ color: getFaceLight(finalWinner?.face || '') }}>Weighing style:</span> {scanLine.sentence}</div>}
                                    {resetLine && <div><span className="font-medium" title="This describes how you stop, reframe, and restart when needed" style={{ color: getFaceLight(finalWinner?.face || '') }}>Reset style:</span> {resetLine.sentence}</div>}
                                </div>
                            )}
                        </div>
                    </div>
                );
"@
        
        $content = $content -replace $familyCardPattern, $newFamilyCard
        
        # 9. Close FamilyGrid function
        $content = $content -replace "(\s*</div>\s*</div>\s*\);)", "`$1`n    );`n};"
        
        # 10. Update ResultsScreen calls
        $content = $content -replace "(\s*<HeroBand finalWinner=\{finalWinner\} secondaryFace=\{secondaryFace\} pureOneFace=\{pureOneFace\} />)", "`$1`n            <LegendSection />`n            <PrizeSection finalWinner={finalWinner} secondaryFace={secondaryFace} taps={taps} />"
        
        $content = $content -replace "(\s*<FamilyGrid triad=\{triad\} finalWinner=\{finalWinner\} />)", "`$1`n            <FamilyGrid triad={triad} finalWinner={finalWinner} secondaryFace={secondaryFace} taps={taps} />"
        
        # Write the updated content back to the file
        Set-Content $filePath -Value $content -Encoding UTF8
        
        Write-Host "$page page updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "File not found: $filePath" -ForegroundColor Red
    }
}

Write-Host "`nAll remaining pages updated successfully!" -ForegroundColor Cyan
Write-Host "Updated pages: $($pages -join ', ')" -ForegroundColor Cyan
