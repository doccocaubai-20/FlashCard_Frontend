import { Activity } from 'lucide-react';

const getCellColor = (count) => {
    if (count >= 4) return 'bg-emerald-700';
    if (count >= 3) return 'bg-emerald-600';
    if (count >= 2) return 'bg-emerald-400';
    if (count >= 1) return 'bg-emerald-200';
    return 'bg-slate-200';
};

export default function Heatmap({ data = [] }) {
    const normalized = Array.isArray(data)
        ? data.map((item) => {
            if (item && typeof item === 'object') {
                return {
                    date: item.date,
                    count: Number(item.count || 0),
                };
            }
            return {
                date: null,
                count: Number(item || 0),
            };
        })
        : [];

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Activity size={18} className="text-sky-500" />
                Lịch sử học
            </div>
            <div className="grid grid-cols-14 gap-1">
                {normalized.map((item, index) => (
                    <div
                        key={`${item.date || index}-${index}`}
                        title={`${item.date || 'Không rõ'} — ${item.count} lần`}
                        className={`h-7 w-7 rounded-sm border border-slate-100 ${getCellColor(item.count)}`}
                    />
                ))}
            </div>
            <div className="mt-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-slate-200 border border-slate-100" />
                    0
                </div>
                <div className="mt-2 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-emerald-200 border border-slate-100" />
                    1-2
                </div>
                <div className="mt-2 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-emerald-600 border border-slate-100" />
                    3-4+
                </div>
            </div>
        </div>
    );
}
