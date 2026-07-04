import { useState, useEffect } from 'react';
import { X, Sparkles, Volume2, Copy, Check, Loader2, BookOpen, Save } from 'lucide-react';
import { deckApi } from '../../services/deckApi';
import { speakChinese } from '../../utils/tts';
import HoverableText from './HoverableText';

export default function AiParagraphModal({ deckId, flashcards = [], onClose, onSaveSuccess }) {
  const [selectedWords, setSelectedWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Mặc định chọn tất cả từ vựng khi mở modal
  useEffect(() => {
    if (flashcards && flashcards.length > 0) {
      setSelectedWords(flashcards.map((c) => c.front || c.hanzi));
    }
  }, [flashcards]);

  const handleToggleWord = (word) => {
    setSelectedWords((prev) => {
      const isSelected = prev.includes(word);
      setError('');
      return isSelected ? prev.filter((w) => w !== word) : [...prev, word];
    });
  };

  const handleSelectAll = () => {
    setSelectedWords(flashcards.map((c) => c.front || c.hanzi));
    setError('');
  };

  const handleDeselectAll = () => {
    setSelectedWords([]);
    setError('');
  };

  const handleSelectFirst30 = () => {
    setSelectedWords(flashcards.slice(0, 30).map((c) => c.front || c.hanzi));
    setError('');
  };

  const handleGenerate = async () => {
    if (selectedWords.length === 0) {
      setError('Vui lòng chọn ít nhất 1 từ để tạo đoạn văn.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await deckApi.generateParagraph(deckId, selectedWords);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          'Có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    setError('');
    try {
      await deckApi.saveParagraph(deckId, {
        hanzi: result.paragraphHanzi,
        pinyin: result.paragraphPinyin,
        meaning: result.paragraphMeaning,
        words: selectedWords,
        wordUsage: result.wordUsage,
      });
      setIsSaved(true);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          'Có lỗi xảy ra khi lưu đoạn văn. Vui lòng thử lại sau.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    if (!result?.paragraphHanzi) return;
    navigator.clipboard.writeText(result.paragraphHanzi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!result?.paragraphHanzi) return;
    speakChinese(result.paragraphHanzi);
  };

  // Lọc từ hiển thị trong danh sách chọn dựa vào từ khóa tìm kiếm
  const filteredCards = flashcards.filter(
    (card) =>
      (card.front || card.hanzi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.back || card.meaning || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-card dark:bg-surface-dark rounded-xl shadow-2xl max-w-3xl w-full border border-hairline dark:border-divider-dark overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline dark:border-divider-dark bg-surface-bone/20 dark:bg-black/10">
          <h3 className="text-lg font-bold text-ink dark:text-on-dark font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
            Tạo đoạn văn thông minh bằng AI
          </h3>
          <button
            onClick={onClose}
            className="text-mute hover:text-ink dark:text-on-dark-mute dark:hover:text-on-dark p-1.5 rounded-full hover:bg-surface-bone dark:hover:bg-black/30 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-medium border border-red-100 dark:border-red-900/50">
              Lỗi: {error}
            </div>
          )}

          {/* Chọn từ vựng nếu chưa tạo kết quả, hoặc khi muốn tạo lại */}
          {!result && !loading && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="font-bold text-ink dark:text-on-dark flex items-center gap-1.5">
                    <BookOpen size={16} className="text-primary" />
                    Chọn từ vựng để tạo đoạn văn
                  </h4>
                  <p className="text-xs text-mute dark:text-on-dark-mute mt-0.5">
                    AI sẽ dùng các từ đã chọn để viết thành một đoạn văn hoàn chỉnh.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2.5 py-1 text-xs rounded border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black/30 text-ink dark:text-on-dark transition cursor-pointer font-medium"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectFirst30}
                    className="px-2.5 py-1 text-xs rounded border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black/30 text-ink dark:text-on-dark transition cursor-pointer font-medium"
                  >
                    Chọn 30 từ đầu
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1 text-xs rounded border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black/30 text-ink dark:text-on-dark transition cursor-pointer font-medium"
                  >
                    Bỏ chọn hết
                  </button>
                </div>
              </div>

              {/* Tìm kiếm nhanh */}
              <input
                type="text"
                placeholder="Tìm kiếm nhanh từ vựng trong bộ bài..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark text-ink dark:text-on-dark focus:outline-none focus:ring-1 focus:ring-primary text-xs"
              />

              {/* Grid danh sách từ */}
              <div className="border border-hairline dark:border-divider-dark rounded-lg p-4 bg-surface-bone/10 dark:bg-black/5 max-h-[30vh] overflow-y-auto">
                {filteredCards.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {filteredCards.map((card) => {
                      const word = card.front || card.hanzi;
                      const isSelected = selectedWords.includes(word);
                      return (
                        <div
                          key={card.id || word}
                          onClick={() => handleToggleWord(word)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-center select-none active:scale-[0.98] ${
                            isSelected
                              ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary font-bold shadow-xs'
                              : 'border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark text-ink dark:text-on-dark hover:bg-surface-bone dark:hover:bg-black/20'
                          }`}
                        >
                          <span className="text-base font-extrabold truncate">{word}</span>
                          <span className="text-[10px] text-mute dark:text-on-dark-mute truncate font-medium mt-0.5">
                            {card.back || card.meaning}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-mute dark:text-on-dark-mute">
                    Không tìm thấy từ vựng nào phù hợp.
                  </div>
                )}
              </div>

              <div className="text-xs font-semibold text-right text-mute dark:text-on-dark-mute">
                Đã chọn: <span className="text-primary font-bold">{selectedWords.length}</span> / {flashcards.length} từ
              </div>
            </div>
          )}

          {/* Trạng thái Loading */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <div className="text-center space-y-1">
                <p className="font-bold text-ink dark:text-on-dark text-base">DeepSeek đang xử lý...</p>
                <p className="text-xs text-mute dark:text-on-dark-mute">
                  Đang dùng {selectedWords.length} từ để tạo đoạn văn bằng tiếng Trung giản thể.
                </p>
              </div>

              {/* Shimmering Skeleton screen */}
              <div className="w-full max-w-lg mt-6 space-y-3 p-4 border border-dashed border-hairline dark:border-divider-dark rounded-xl animate-pulse">
                <div className="h-4 bg-surface-bone dark:bg-black/20 rounded-full w-3/4"></div>
                <div className="h-4 bg-surface-bone dark:bg-black/20 rounded-full w-5/6"></div>
                <div className="h-4 bg-surface-bone dark:bg-black/20 rounded-full w-2/3"></div>
              </div>
            </div>
          )}

          {/* Hiển thị kết quả đoạn văn tạo bởi AI */}
          {result && !loading && (
            <div className="space-y-6">
              
              {/* Đoạn văn Chữ Hán */}
              <div className="rounded-xl border border-hairline dark:border-divider-dark bg-surface-bone/35 dark:bg-black/10 p-6 space-y-4 shadow-xs relative group">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={handleSpeak}
                    className="p-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark hover:text-primary transition cursor-pointer active:scale-95 shadow-xs"
                    title="Nghe đọc đoạn văn"
                  >
                    <Volume2 size={16} />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-full border border-hairline dark:border-divider-dark bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark hover:text-primary transition cursor-pointer active:scale-95 shadow-xs"
                    title="Sao chép văn bản"
                  >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || isSaved}
                    className={`p-2 rounded-full border border-hairline dark:border-divider-dark transition cursor-pointer active:scale-95 shadow-xs flex items-center gap-1.5 ${
                      isSaved
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 font-bold'
                        : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black text-ink dark:text-on-dark hover:text-primary'
                    }`}
                    title={isSaved ? "Đã lưu thành công" : "Lưu đoạn văn vào bộ bài"}
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin text-primary" />
                    ) : isSaved ? (
                      <Check size={16} />
                    ) : (
                      <Save size={16} />
                    )}
                    <span className="text-[10px] pr-1 font-bold">
                      {isSaving ? 'Đang lưu...' : isSaved ? 'Đã lưu' : 'Lưu đoạn văn'}
                    </span>
                  </button>
                </div>

                <div className="pr-16">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                    Đoạn văn tiếng Trung (Rê chuột lên từ để tra từ điển)
                  </div>
                  <div className="text-2xl font-extrabold text-ink dark:text-on-dark font-display leading-loose tracking-wide animate-in fade-in duration-300">
                    <HoverableText text={result.paragraphHanzi} />
                  </div>
                </div>
              </div>

              {/* Phiên âm và Dịch nghĩa trong 2 cột */}
              <div className="grid gap-4 md:grid-cols-2">
                
                {/* Phiên âm Pinyin */}
                <div className="p-5 rounded-xl border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/45 space-y-2">
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                    Phiên âm Pinyin
                  </div>
                  <p className="text-sm font-medium text-body dark:text-on-dark-mute leading-relaxed">
                    {result.paragraphPinyin}
                  </p>
                </div>

                {/* Bản dịch nghĩa tiếng Việt */}
                <div className="p-5 rounded-xl border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/45 space-y-2">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">
                    Dịch nghĩa Tiếng Việt
                  </div>
                  <p className="text-sm font-medium text-body dark:text-on-dark-mute leading-relaxed">
                    {result.paragraphMeaning}
                  </p>
                </div>

              </div>

              {/* Danh sách giải thích các từ sử dụng */}
              {result.wordUsage && result.wordUsage.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-ink dark:text-on-dark flex items-center gap-1.5">
                    📖 Phân tích từ vựng sử dụng trong đoạn văn
                  </h4>
                  <div className="border border-hairline dark:border-divider-dark rounded-xl overflow-hidden divide-y divide-hairline dark:divide-divider-dark bg-surface-card dark:bg-surface-dark/25 animate-in slide-in-from-bottom-3 duration-300">
                    {result.wordUsage.map((item, idx) => (
                      <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-start gap-2.5 sm:gap-4 hover:bg-surface-bone/35 dark:hover:bg-black/5 transition-colors">
                        <div className="sm:w-1/4 shrink-0">
                          <span className="text-base font-extrabold text-ink dark:text-on-dark font-display">
                            {item.word}
                          </span>
                          <span className="block text-xs text-mute dark:text-on-dark-mute font-medium">
                            {item.pinyin}
                          </span>
                          <span className="block text-xs text-body dark:text-on-dark-mute font-semibold truncate mt-0.5">
                            {item.meaning}
                          </span>
                        </div>
                        <div className="text-xs text-body dark:text-on-dark-mute leading-relaxed font-medium">
                          <span className="font-bold text-primary mr-1">Cách dùng:</span>
                          {item.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-hairline dark:border-divider-dark flex justify-between items-center bg-surface-bone/20 dark:bg-black/10">
          <div>
            {result && (
              <button
                type="button"
                onClick={() => setResult(null)}
                className="px-4 py-2 border border-hairline dark:border-divider-dark rounded-full hover:bg-surface-bone dark:hover:bg-black text-ink dark:text-on-dark text-xs font-semibold transition cursor-pointer active:scale-95"
              >
                ← Quay lại danh sách từ
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-hairline dark:border-divider-dark rounded-full hover:bg-surface-bone dark:hover:bg-black text-ink dark:text-on-dark text-xs font-semibold transition cursor-pointer active:scale-95"
            >
              Đóng
            </button>
            
            {(!result || result) && !loading && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={selectedWords.length === 0}
                className="px-6 py-2.5 bg-primary hover:bg-primary-deep disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-full cursor-pointer transition active:scale-95 shadow-md flex items-center gap-1.5"
              >
                <Sparkles size={14} className="fill-white" />
                {result ? 'Tạo lại đoạn văn' : 'Tạo đoạn văn'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
