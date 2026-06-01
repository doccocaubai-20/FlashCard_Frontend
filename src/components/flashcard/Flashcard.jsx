import { RotateCcw } from 'lucide-react';

export default function Flashcard({ cardData, isFlipped, onFlip }) {
    const { character, pinyin, meaning, example } = cardData || {};
    const cardStyle = {
        transformStyle: 'preserve-3d',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
    };
    const faceStyle = {
        backfaceVisibility: 'hidden',
    };

    return (
        <div className="relative w-full max-w-xl" style={{ perspective: '1200px' }}>
            <div
                className="relative w-full h-96 rounded-3xl shadow-2xl transition-transform duration-700 ease-in-out"
                style={cardStyle}
            >
                <button
                    type="button"
                    onClick={onFlip}
                    className="absolute top-4 right-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-slate-50"
                >
                    <RotateCcw size={16} />
                    Lật thẻ
                </button>

                <div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-inner"
                    style={faceStyle}
                >
                    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                        <div className="text-8xl font-black tracking-tight">{character || '漢'}</div>
                        <div className="rounded-3xl bg-white/10 px-5 py-4 text-sm leading-6 text-slate-200 shadow-lg">
                            Nhấn nút hoặc chạm để xem pinyin, nghĩa và ví dụ.
                        </div>
                    </div>
                </div>

                <div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white via-sky-100 to-slate-100 p-8 text-slate-900 shadow-lg"
                    style={{ ...faceStyle, transform: 'rotateY(180deg)' }}
                >
                    <div className="flex h-full flex-col justify-between gap-6">
                        <div>
                            <div className="text-sm uppercase tracking-[0.3em] text-slate-500">Giải nghĩa</div>
                            <div className="mt-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                                <div className="text-5xl font-bold text-slate-900">{character || '漢'}</div>
                                <div className="mt-4 text-2xl font-semibold text-sky-700">{pinyin || 'hàn'}</div>
                                <div className="mt-3 text-lg text-slate-700">{meaning || 'nghĩa tiếng Việt...'}</div>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-slate-900/5 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                            <div className="font-semibold text-slate-800">Ví dụ</div>
                            <p className="mt-3 leading-7">{example || 'Ví dụ sẽ hiện tại đây khi thẻ có dữ liệu đầy đủ.'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
