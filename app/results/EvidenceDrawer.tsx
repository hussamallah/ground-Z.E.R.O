"use client";

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { MatchLog, FaceArt } from "../quiz-data";

type EvidenceDrawerProps = {
    duels: MatchLog[];
};

export default function EvidenceDrawer({ duels }: EvidenceDrawerProps) {
    const [open, setOpen] = useState<boolean>(false);

    const groupedByRound = useMemo(() => {
        const map: { [round: string]: MatchLog[] } = {};
        (duels || []).forEach(d => {
            if (!map[d.round]) map[d.round] = [];
            map[d.round].push(d);
        });
        const entries = Object.entries(map)
            .sort((a, b) => a[0].localeCompare(b[0]));
        return entries;
    }, [duels]);

    const total = duels?.length || 0;

    return (
        <div className="max-w-4xl mx-auto mb-10">
            <div className="bg-white/5 border border-white/10 rounded-lg">
                <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/10 transition-colors"
                    onClick={() => setOpen(v => !v)}
                    aria-expanded={open}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-white/80 font-medium">Evidence</span>
                        <span className="text-white/50 text-sm">{total} duels</span>
                    </div>
                    <span className="text-white/60">{open ? '▾' : '▸'}</span>
                </button>

                {open && (
                    <div className="px-4 pb-4 space-y-4">
                        {groupedByRound.map(([round, logs]) => (
                            <div key={round}>
                                <div className="text-white/60 text-xs uppercase tracking-wide mb-2">{round}</div>
                                <div className="space-y-2">
                                    {logs.map((m, idx) => (
                                        <div key={`${round}-${idx}`} className="flex items-center justify-between bg-white/5 rounded-md px-3 py-2">
                                            <Side face={m.left.face} chosen={m.chosen === m.left.face} />
                                            <span className="text-white/50 text-xs">vs</span>
                                            <Side face={m.right.face} chosen={m.chosen === m.right.face} align="right" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {groupedByRound.length === 0 && (
                            <div className="text-white/60 text-sm">No duels recorded.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Side({ face, chosen, align }: { face: string; chosen: boolean; align?: 'left'|'right' }) {
    return (
        <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
            <div className="w-6 h-6 relative rounded overflow-hidden bg-white/10">
                <Image src={FaceArt[face] || '/next.svg'} alt={face} fill sizes="24px" style={{ objectFit: 'contain' }} />
            </div>
            <span className="text-white/80 text-sm">{face}</span>
            {chosen && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">chosen</span>
            )}
        </div>
    );
}


