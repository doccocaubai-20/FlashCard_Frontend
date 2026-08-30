import React from 'react';


const ratingButtons = [
    { label: 'Quên', value: 1, keyHint: '1', color: 'bg-red-600 hover:bg-red-700 hover:scale-102 active:scale-98' },
    { label: 'Khó', value: 2, keyHint: '2', color: 'bg-orange-500 hover:bg-orange-600 hover:scale-102 active:scale-98' },
    { label: 'Tốt', value: 3, keyHint: '3', color: 'bg-badge-success hover:bg-emerald-700 hover:scale-102 active:scale-98' },
    { label: 'Dễ', value: 4, keyHint: '4', color: 'bg-primary hover:bg-primary-deep hover:scale-102 active:scale-98' },
];

export default function SRSButtons({ onRate }) {
    return (
        <div className="grid gap-3 grid-cols-4 w-full">
            {ratingButtons.map(({ label, value, keyHint, color }) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => onRate?.(value)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-full py-2.5 px-4 text-white font-mono font-bold text-xs transition-all duration-150 cursor-pointer shadow-sm ${color}`}
                >
                    <span>{label}</span>
                    <span className="hidden sm:inline text-[9px] opacity-75 bg-black/15 px-2 py-0.5 rounded-full select-none">
                        {keyHint}
                    </span>
                </button>
            ))}
        </div>
    );
}
