export default function GoalTracker({ completed = 0, target = 1 }) {
    const progress = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;

    return (
        <div className="rounded-md border border-hairline dark:border-divider-dark bg-surface-bone dark:bg-black/20 p-5">
            <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-ink dark:text-on-dark">
                <span>Mục tiêu ngày</span>
                <span className="text-mute dark:text-on-dark-mute font-mono">{completed}/{target}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 text-xs text-mute dark:text-on-dark-mute font-mono">Tiến độ: {progress}%</div>
        </div>
    );
}
