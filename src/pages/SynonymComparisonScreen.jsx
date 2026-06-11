import React, { useState, useEffect } from 'react';
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
  const [history, setHistory] = useState([]);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chongzi_synonym_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load synonym history:', e);
    }
  }, []);

  const handleCompare = async (e) => {
    e.preventDefault();
    const w1 = word1.trim();
    const w2 = word2.trim();
    if (!w1 || !w2) return;

    setLoading(true);
    setExplanation('');

    // Check if it already exists in history to save token cost
    const key = [w1, w2].sort().join('-');
    const cached = history.find((h) => h.key === key);
    if (cached) {
      setExplanation(cached.explanation);
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/api/dictionary/compare-synonyms', {
        word1: w1,
        word2: w2,
      });
      if (res.data && res.data.explanation) {
        const expl = res.data.explanation;
        setExplanation(expl);

        // Update history cache
        const newHistoryItem = {
          key,
          word1: w1,
          word2: w2,
          explanation: expl,
          timestamp: Date.now(),
        };
        const updatedHistory = [
          newHistoryItem,
          ...history.filter((h) => h.key !== key),
        ].slice(0, 20); // Keep last 20 comparisons
        setHistory(updatedHistory);
        localStorage.setItem('chongzi_synonym_history', JSON.stringify(updatedHistory));
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

  const renderTableHtml = (headers, rows) => {
    const headerCols = headers
      .map(
        (h) =>
          `<th class="p-3 text-left font-mono font-bold text-xs uppercase tracking-wider text-mute border-b border-hairline dark:border-divider-dark bg-surface-bone/50 dark:bg-black/35">${h}</th>`
      )
      .join('');
    
    const bodyRows = rows
      .map((row) => {
        const cells = row
          .map(
            (cell) =>
              `<td class="p-3 text-xs leading-relaxed text-body dark:text-on-dark-mute border-b border-hairline/50 dark:border-divider-dark/40">${cell}</td>`
          )
          .join('');
        return `<tr class="hover:bg-surface-bone/20 dark:hover:bg-black/10 transition-colors">${cells}</tr>`;
      })
      .join('');

    return `
      <div class="my-4 overflow-x-auto rounded-lg border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/30 shadow-xs">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr>${headerCols}</tr>
          </thead>
          <tbody class="divide-y divide-hairline dark:divide-divider-dark/40">
            ${bodyRows}
          </tbody>
        </table>
      </div>
    `;
  };

  const renderContentAsHtml = (text) => {
    if (!text) return '';

    // First escape HTML entities
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Split by newlines to parse block elements (like tables, headers, lists)
    const lines = escaped.split('\n');
    const result = [];
    
    let inTable = false;
    let tableHeaders = [];
    let tableRows = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if it is a table line
      if (line.startsWith('|') && line.endsWith('|')) {
        // Extract cells, filtering out empty outer cells
        const cells = line
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        // Check if it is the separator line e.g., |:---|:---|
        const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));
        
        if (isSeparator) {
          continue;
        }

        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        continue;
      } else {
        // Close table if we were in one
        if (inTable) {
          result.push(renderTableHtml(tableHeaders, tableRows));
          inTable = false;
          tableHeaders = [];
          tableRows = [];
        }
      }

      // Check for headers
      if (line.startsWith('### ')) {
        result.push(`<h4 class="text-sm font-bold text-primary mt-4 mb-2">${line.slice(4)}</h4>`);
      } else if (line.startsWith('## ')) {
        result.push(`<h3 class="text-base font-bold text-primary mt-5 mb-2">${line.slice(3)}</h3>`);
      } else if (line.startsWith('# ')) {
        result.push(`<h2 class="text-lg font-extrabold text-primary mt-6 mb-3">${line.slice(2)}</h2>`);
      }
      // Check for bullet lists
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        result.push(`<li class="ml-4 list-disc text-xs leading-relaxed mt-1">${line.slice(2)}</li>`);
      }
      // Empty line
      else if (line === '') {
        result.push('<div class="h-2"></div>');
      }
      // Normal paragraph text
      else {
        result.push(`<p class="text-xs leading-relaxed text-body dark:text-on-dark-mute">${line}</p>`);
      }
    }

    if (inTable) {
      result.push(renderTableHtml(tableHeaders, tableRows));
    }

    let finalHtml = result.join('\n');

    // Inline elements: Bold (**text** or __text__)
    finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    finalHtml = finalHtml.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Inline code tags `code`
    finalHtml = finalHtml.replace(
      /`(.*?)`/g,
      '<code class="bg-surface-bone dark:bg-black/35 px-1.5 py-0.5 rounded font-mono text-[10px] text-primary font-bold border border-hairline dark:border-divider-dark">$1</code>'
    );

    return finalHtml;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
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
        
        {/* Left column: Input Form & History */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-xl p-5 shadow-sm space-y-4 text-left">
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

          {/* History Panel */}
          {history.length > 0 && (
            <div className="bg-surface-card dark:bg-surface-dark/50 border border-hairline dark:border-divider-dark rounded-xl p-5 shadow-sm space-y-3 text-left">
              <h4 className="text-[10px] font-bold text-mute uppercase tracking-widest border-b border-hairline dark:border-divider-dark pb-2 flex justify-between items-center select-none">
                <span>Lịch sử đã so sánh</span>
                <button 
                  type="button" 
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem('chongzi_synonym_history');
                  }}
                  className="text-[9px] text-red-500 hover:underline cursor-pointer"
                >
                  Xóa lịch sử
                </button>
              </h4>
              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                {history.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setWord1(item.word1);
                      setWord2(item.word2);
                      setExplanation(item.explanation);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-hairline dark:border-divider-dark bg-surface-bone/25 dark:bg-black/15 hover:bg-surface-bone dark:hover:bg-black text-left transition-all cursor-pointer text-xs group"
                  >
                    <span className="font-semibold text-ink dark:text-on-dark group-hover:text-primary transition-colors">
                      {item.word1} vs {item.word2}
                    </span>
                    <span className="text-[9px] text-mute font-mono">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
