import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Sparkles, Languages } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function SynonymComparisonScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [word1, setWord1] = useState('');
  const [word2, setWord2] = useState('');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!word1.trim() || !word2.trim()) return;

    setLoading(true);
    setExplanation('');
    try {
      const res = await api.post('/api/dictionary/compare-synonyms', {
        word1: word1.trim(),
        word2: word2.trim(),
      });
      if (res.data && res.data.explanation) {
        setExplanation(res.data.explanation);
      } else {
        showToast('Không nhận được phản hồi từ AI.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Lỗi kết nối hoặc xử lý phân tích.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderContentAsHtml = (text) => {
    if (!text) return '';
    // Basic Markdown conversion for simplicity without extra packages
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br />');

    // Bold (**text** or __text__)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Headers (###, ##, #)
    html = html.replace(/### (.*?)(<br \/>|$)/g, '<h4 class="text-sm font-bold text-primary mt-4 mb-2">$1</h4>');
    html = html.replace(/## (.*?)(<br \/>|$)/g, '<h3 class="text-base font-bold text-primary mt-5 mb-2">$1</h3>');
    html = html.replace(/# (.*?)(<br \/>|$)/g, '<h2 class="text-lg font-extrabold text-primary mt-6 mb-3">$1</h2>');

    // List items (* or -)
    html = html.replace(/(?:^|<br \/>)[*-] (.*?)(?=<br \/>|$)/g, '<li class="ml-4 list-disc text-xs leading-relaxed mt-1">$1</li>');

    return html;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline dark:border-divider-dark pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reference-hub')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-mute dark:text-on-dark-mute hover:text-ink dark:hover:text-on-dark transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
              <Languages size={22} className="text-primary" />
              So sánh Từ đồng nghĩa AI
            </h1>
            <p className="text-xs text-mute mt-0.5">Phân tích sự khác biệt về ngữ pháp, ngữ cảnh và cách dùng giữa 2 từ gần nghĩa.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Input Form */}
        <div className="lg:col-span-4 bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-xl p-5 shadow-sm space-y-4 text-left">
          <h3 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-1.5 border-b border-hairline dark:border-divider-dark pb-3">
            <Sparkles size={14} className="text-primary" />
            Nhập cặp từ cần so sánh
          </h3>
          <form onSubmit={handleCompare} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-mute tracking-wider">Từ thứ nhất</label>
              <input
                type="text"
                required
                value={word1}
                onChange={(e) => setWord1(e.target.value)}
                placeholder="Ví dụ: 觉得"
                className="w-full text-xs p-3 rounded-lg border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-black/20 text-ink dark:text-on-dark focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-mute tracking-wider">Từ thứ hai</label>
              <input
                type="text"
                required
                value={word2}
                onChange={(e) => setWord2(e.target.value)}
                placeholder="Ví dụ: 认为"
                className="w-full text-xs p-3 rounded-lg border border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-black/20 text-ink dark:text-on-dark focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !word1.trim() || !word2.trim()}
              className="w-full py-2.5 bg-primary hover:bg-primary-deep disabled:bg-stone text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs active:scale-95"
            >
              <Sparkles size={14} />
              {loading ? 'AI đang phân tích...' : 'So sánh bằng AI'}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-8 bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-xl p-6 shadow-sm min-h-[350px] text-left flex flex-col gap-4">
          <h3 className="text-xs font-bold text-ink dark:text-on-dark uppercase tracking-wider flex items-center gap-1.5 border-b border-hairline dark:border-divider-dark pb-3">
            🎯 Kết quả phân biệt chi tiết
          </h3>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-mute gap-3 flex-1">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-xs font-semibold">AI đang phân tích và soạn bài giảng so sánh...</span>
            </div>
          )}

          {!loading && explanation && (
            <div
              className="bg-surface-bone/30 dark:bg-surface-dark/20 p-5 rounded-lg border border-hairline dark:border-divider-dark text-xs text-body dark:text-on-dark-mute leading-relaxed space-y-2 select-text"
              dangerouslySetInnerHTML={{ __html: renderContentAsHtml(explanation) }}
            />
          )}

          {!loading && !explanation && (
            <div className="flex flex-col items-center justify-center py-20 text-mute flex-1 text-center">
              <Languages size={40} className="stroke-1 opacity-30 mb-2" />
              <p className="text-xs italic max-w-xs">Nhập hai từ đồng nghĩa (như 觉得 và 认为 hoặc 能 và 会) ở khung bên trái để xem so sánh của giáo viên AI.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
