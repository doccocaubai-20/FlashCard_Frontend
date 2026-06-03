import { Sparkles } from 'lucide-react';

export default function RadicalInfo({ radicals }) {
    if (!radicals) {
        return null;
    }

    return (
        <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-bone dark:bg-black/20 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink dark:text-on-dark">
                <Sparkles size={18} className="text-primary" />
                <span>Phân tích bộ thủ</span>
            </div>
            <p className="whitespace-pre-wrap rounded-md bg-surface-card dark:bg-surface-dark px-4 py-4 text-sm leading-relaxed text-body dark:text-on-dark-mute border border-hairline dark:border-divider-dark">
                {radicals}
            </p>
        </div>
    );
}
