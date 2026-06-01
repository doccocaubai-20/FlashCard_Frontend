export default function GoalTracker({ completed = 0, target = 1 }) {
    const progress = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;

    return (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                <span>Mục tiêu ngày</span>
                <span className="text-slate-500">{completed}/{target}</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 text-xs text-slate-500">Tiến độ: {progress}%</div>
        </div>
    );
}
