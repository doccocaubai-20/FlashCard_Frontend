import { Activity } from 'lucide-react';

const getCellColor = (count) => {
    if (count >= 4) return 'bg-primary';
    if (count >= 3) return 'bg-primary/75';
    if (count >= 2) return 'bg-primary/45';
    if (count >= 1) return 'bg-primary/20';
    return 'bg-surface-bone dark:bg-surface-dark border-hairline dark:border-divider-dark';
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
        <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink dark:text-on-dark">
                <Activity size={18} className="text-primary" />
                Lịch sử học tập
            </div>
            
            <div className="grid grid-cols-14 gap-1">
                {normalized.map((item, index) => (
                    <div
                        key={`${item.date || index}-${index}`}
                        title={`${item.date || 'Không rõ'} — ${item.count} lần`}
                        className={`h-7 w-7 rounded-xs border border-hairline dark:border-divider-dark transition-colors duration-200 ${getCellColor(item.count)}`}
                    />
                ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-mute dark:text-on-dark-mute">
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-xs bg-surface-bone dark:bg-surface-dark border border-hairline dark:border-divider-dark" />
                    <span>0 lần</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-xs bg-primary/20" />
                    <span>1-2 lần</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-xs bg-primary/75" />
                    <span>3 lần</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-xs bg-primary" />
                    <span>4+ lần</span>
                </div>
            </div>
        </div>
    );
}
