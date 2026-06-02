import React from 'react';
import { XCircle, AlertTriangle, CheckCircle2, ThumbsUp } from 'lucide-react';

const ratingButtons = [
    { label: 'Quên', value: 1, keyHint: '1', color: 'bg-red-600 hover:bg-red-700 active:scale-95 shadow-red-500/10 hover:shadow-red-500/20', icon: XCircle },
    { label: 'Khó', value: 2, keyHint: '2', color: 'bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-orange-500/10 hover:shadow-orange-500/20', icon: AlertTriangle },
    { label: 'Tốt', value: 3, keyHint: '3', color: 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-500/10 hover:shadow-emerald-500/20', icon: CheckCircle2 },
    { label: 'Dễ', value: 4, keyHint: '4', color: 'bg-sky-600 hover:bg-sky-700 active:scale-95 shadow-sky-500/10 hover:shadow-sky-500/20', icon: ThumbsUp },
];

export default function SRSButtons({ onRate }) {
    return (
        <div className="grid gap-3 grid-cols-4 w-full">
            {ratingButtons.map(({ label, value, keyHint, color, icon: Icon }) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => onRate?.(value)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-3 px-2 text-white shadow-lg transition-all duration-150 cursor-pointer ${color}`}
                >
                    <span className="flex items-center gap-1.5 font-bold text-sm">
                        <Icon size={16} />
                        <span>{label}</span>
                    </span>
                    <span className="text-[10px] font-medium opacity-80 bg-black/15 px-2 py-0.5 rounded-full select-none">
                        Phím {keyHint}
                    </span>
                </button>
            ))}
        </div>
    );
}
