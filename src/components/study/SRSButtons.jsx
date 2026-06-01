import { XCircle, AlertTriangle, CheckCircle2, ThumbsUp } from 'lucide-react';

const ratingButtons = [
    { label: 'Quên', value: 1, color: 'bg-red-600 hover:bg-red-700', icon: XCircle },
    { label: 'Khó', value: 2, color: 'bg-orange-500 hover:bg-orange-600', icon: AlertTriangle },
    { label: 'Tốt', value: 3, color: 'bg-emerald-500 hover:bg-emerald-600', icon: CheckCircle2 },
    { label: 'Dễ', value: 4, color: 'bg-sky-600 hover:bg-sky-700', icon: ThumbsUp },
];

export default function SRSButtons({ onRate }) {
    return (
        <div className="grid gap-3 sm:grid-cols-4">
            {ratingButtons.map(({ label, value, color, icon: Icon }) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => onRate?.(value)}
                    className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors ${color}`}
                >
                    <Icon size={18} />
                    {label}
                </button>
            ))}
        </div>
    );
}
