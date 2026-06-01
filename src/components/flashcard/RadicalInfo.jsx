import { Sparkles } from 'lucide-react';

export default function RadicalInfo({ radicals }) {
    if (!radicals) {
        return null;
    }

    return (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Sparkles size={18} className="text-sky-500" />
                Phân tích bộ thủ
            </div>
            <p className="whitespace-pre-wrap rounded-2xl bg-white/80 px-4 py-4 text-sm leading-7 text-slate-700 ring-1 ring-slate-200">
                {radicals}
            </p>
        </div>
    );
}
