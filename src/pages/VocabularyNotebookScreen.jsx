import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoriteWordsApi } from '../services/favoriteWordsApi';
import { 
  Star, 
  Search, 
  Download, 
  Printer, 
  Edit3, 
  Save, 
  X, 
  Trash2, 
  PenTool, 
  ArrowLeft,
  Volume2
} from 'lucide-react';

export default function VocabularyNotebookScreen() {
  const navigate = useNavigate();

  // Starred words states
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHsk, setFilterHsk] = useState('All');

  // Mnemonic notes states (stored in localStorage)
  const [notes, setNotes] = useState({});
  const [editingHanzi, setEditingHanzi] = useState(null);
  const [noteText, setNoteText] = useState('');

  // Load favorites and notes on mount
  const loadFavorites = async () => {
    setLoading(true);
    try {
      const res = await favoriteWordsApi.getFavorites();
      setFavorites(res.data || []);
    } catch (err) {
      console.error('Notebook: Failed to fetch starred words:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();

    // Load notes from localStorage
    try {
      const savedNotes = localStorage.getItem('chongzi_word_notes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (e) {
      console.error('Notebook: Failed to load saved notes from localStorage:', e);
    }
  }, []);

  const handleSpeak = (e, text) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleUnstar = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn bỏ đánh dấu sao từ này?')) return;
    try {
      await favoriteWordsApi.deleteFavorite(id);
      loadFavorites();
    } catch (err) {
      console.error('Notebook: Failed to delete favorite:', err);
    }
  };

  // Notes editing actions
  const startEditNote = (word) => {
    setEditingHanzi(word.hanzi);
    setNoteText(notes[word.hanzi] || '');
  };

  const saveNote = (hanzi) => {
    const updatedNotes = { ...notes, [hanzi]: noteText };
    setNotes(updatedNotes);
    setEditingHanzi(null);
    try {
      localStorage.setItem('chongzi_word_notes', JSON.stringify(updatedNotes));
    } catch (e) {
      console.error('Notebook: Failed to save note:', e);
    }
  };

  // CSV Export Action (Excel compatible)
  const handleExportCSV = () => {
    if (favorites.length === 0) {
      alert('Không có từ vựng nào để xuất dữ liệu.');
      return;
    }

    // CSV header columns
    let csvContent = 'Chữ Hán,Pinyin,Âm Hán Việt,Định nghĩa / Dịch nghĩa,Cấp độ HSK,Ghi chú cá nhân\r\n';

    favorites.forEach((f) => {
      const note = (notes[f.hanzi] || '').replace(/"/g, '""'); // escape double quotes
      const meaning = (f.vi || '').replace(/"/g, '""');
      
      csvContent += `"${f.hanzi}","${f.pinyin || ''}","${f.sv || ''}","${meaning}","${f.hsk ? 'HSK ' + f.hsk : ''}","${note}"\r\n`;
    });

    // Create file download link
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM for Excel Vietnamese characters display
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ChongZi_SoTayTuVungYeuThich.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter and Search logic
  const filteredFavorites = useMemo(() => {
    return favorites.filter((f) => {
      const matchesSearch = 
        f.hanzi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.pinyin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.vi || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.sv || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesHsk = 
        filterHsk === 'All' ||
        (filterHsk === 'None' && !f.hsk) ||
        (f.hsk && f.hsk.toString() === filterHsk);

      return matchesSearch && matchesHsk;
    });
  }, [favorites, searchQuery, filterHsk]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Dynamic print-only style sheet to format high-quality PDF/printed paper worksheets */}
      <style>{`
        @media print {
          /* Hide all UI elements except the printable dictionary list table */
          .no-print, header, aside, .app-sidebar, .mobile-header, .sidebar-container {
            display: none !important;
          }
          .app-layout {
            display: block !important;
            height: auto !important;
            width: auto !important;
            overflow: visible !important;
            background: white !important;
          }
          .app-content {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 12pt !important;
          }
          .print-header {
            display: block !important;
            margin-bottom: 20px !important;
            text-align: center !important;
            border-bottom: 2px solid #000 !important;
            padding-bottom: 10px !important;
          }
          .print-table {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 10px !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #000000 !important;
            padding: 8px !important;
            text-align: left !important;
          }
          .print-table th {
            background-color: #f2f2f2 !important;
            font-weight: bold !important;
          }
        }
        .print-header {
          display: none;
        }
        .print-table {
          display: none;
        }
      `}</style>

      {/* Print-only layout header */}
      <div className="print-header">
        <h1 className="text-2xl font-bold">Sổ tay từ vựng yêu thích ChongZi</h1>
        <p className="text-sm">Tổng hợp các từ vựng đã ghi nhớ kèm ghi chú và phiên âm học tập.</p>
        <p className="text-xs text-right mt-2">Ngày in: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Page Header (H1 - visible in screen) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-hairline dark:border-divider-dark pb-5 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-bone dark:hover:bg-black text-mute cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink dark:text-on-dark tracking-tight flex items-center gap-2">
              <Star className="text-amber-500 fill-amber-500 shrink-0" size={22} />
              Sổ tay từ vựng yêu thích
            </h1>
            <p className="text-xs text-mute mt-0.5">Quản lý từ vựng đã lưu, ghi chú gợi nhớ chữ Hán và xuất dữ liệu ôn tập.</p>
          </div>
        </div>

        {/* Toolbar buttons */}
        <div className="flex flex-wrap items-center gap-2 select-none">
          <button
            onClick={handleExportCSV}
            disabled={favorites.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-card hover:bg-surface-bone dark:bg-surface-dark dark:hover:bg-black border border-hairline dark:border-divider-dark text-ink dark:text-on-dark font-mono font-bold text-xs rounded-full cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Download size={13} />
            Xuất Excel (CSV)
          </button>

          <button
            onClick={handlePrint}
            disabled={favorites.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-deep text-white font-mono font-bold text-xs rounded-full cursor-pointer transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            <Printer size={13} />
            In sổ tay / Lưu PDF
          </button>
        </div>
      </div>

      {/* Search & Level Filters (Screen Only) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4 border-b border-hairline dark:border-divider-dark no-print">
        {/* Search bar */}
        <div className="md:col-span-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-mute">
            <Search size={14} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-card dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-full text-xs outline-none text-ink dark:text-on-dark focus:ring-1 focus:ring-primary focus:bg-surface-bone/35"
            placeholder="Tìm kiếm theo chữ Hán, Pinyin, Hán Việt hoặc nghĩa..."
          />
        </div>

        {/* HSK filters */}
        <div className="md:col-span-6 flex items-center justify-end gap-2 flex-wrap">
          <span className="text-[10px] font-mono font-bold text-mute uppercase">Lọc HSK:</span>
          {['All', '1', '2', '3', '4', '5', '6', 'None'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setFilterHsk(lvl)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                filterHsk === lvl
                  ? 'bg-primary border-transparent text-white shadow-xs'
                  : 'bg-surface-card hover:bg-surface-bone dark:bg-surface-dark border-hairline dark:border-divider-dark text-ink dark:text-on-dark'
              }`}
            >
              {lvl === 'All' ? 'Tất cả' : lvl === 'None' ? 'Khác' : `HSK ${lvl}`}
            </button>
          ))}
        </div>
      </div>

      {/* Favorites List Table (visible in screen) */}
      <div className="no-print">
        {loading ? (
          <div className="py-20 text-center text-mute flex flex-col items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-xs font-semibold">Đang tải danh sách từ vựng...</span>
          </div>
        ) : filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFavorites.map((item) => {
              const isEditing = editingHanzi === item.hanzi;
              const hasNote = notes[item.hanzi];

              return (
                <div
                  key={item.id}
                  className="rounded-md border border-hairline dark:border-divider-dark bg-surface-card dark:bg-surface-dark/40 p-5 shadow-xs hover:shadow-sm transition-all text-left flex flex-col justify-between gap-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    {/* Hanzi, pinyin and translation details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 
                          onClick={(e) => handleSpeak(e, item.hanzi)}
                          className="text-2xl font-extrabold text-ink dark:text-on-dark font-display cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          {item.hanzi}
                          <Volume2 size={14} className="text-mute/50 hover:text-primary" />
                        </h3>
                        {item.hsk && (
                          <span className="text-[8px] font-extrabold uppercase bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded">
                            HSK {item.hsk}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-mute dark:text-on-dark-mute">
                        <span className="text-primary font-mono">{item.pinyin}</span>
                        {item.sv && (
                          <>
                            <span>|</span>
                            <span className="text-charcoal dark:text-on-dark-mute uppercase text-[9px] tracking-wider">
                              Hán Việt: {item.sv}
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-body dark:text-on-dark-mute pt-1 leading-relaxed">
                        {item.vi}
                      </p>
                    </div>

                    {/* Unstar / Delete action */}
                    <button
                      onClick={() => handleUnstar(item.id)}
                      className="p-1.5 rounded-full hover:bg-red-500/10 hover:text-red-500 text-mute transition-colors cursor-pointer shrink-0 border border-transparent"
                      title="Bỏ lưu từ"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Notes Section */}
                  <div className="border-t border-hairline dark:border-divider-dark pt-3 mt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-mute uppercase tracking-wider flex items-center gap-1">
                        <PenTool size={10} />
                        Mẹo nhớ / Ghi chú cá nhân
                      </span>

                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => startEditNote(item)}
                          className="text-[10px] text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Edit3 size={9} />
                          {hasNote ? 'Sửa ghi chú' : 'Thêm ghi chú'}
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          rows={2}
                          className="w-full bg-surface-bone dark:bg-black/40 border border-hairline dark:border-divider-dark rounded p-2 text-xs outline-none text-ink dark:text-on-dark placeholder-mute text-left resize-none font-medium"
                          placeholder="Mẹo ghi nhớ hoặc ghi chú cách sử dụng..."
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingHanzi(null)}
                            className="p-1.5 rounded bg-surface-bone dark:bg-black/35 text-mute text-[10px] font-bold cursor-pointer flex items-center gap-0.5"
                          >
                            <X size={10} /> Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => saveNote(item.hanzi)}
                            className="p-1.5 rounded bg-primary text-white text-[10px] font-bold cursor-pointer flex items-center gap-0.5"
                          >
                            <Save size={10} /> Lưu lại
                          </button>
                        </div>
                      </div>
                    ) : hasNote ? (
                      <p className="text-xs text-mute dark:text-on-dark-mute italic bg-surface-bone/30 dark:bg-black/15 border border-hairline dark:border-divider-dark rounded p-2.5 leading-relaxed">
                        {notes[item.hanzi]}
                      </p>
                    ) : (
                      <p className="text-[10px] text-mute/60 italic leading-relaxed">
                        Chưa có ghi chú gợi nhớ cho từ này.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center text-xs text-mute dark:text-on-dark-mute bg-surface-card border border-hairline rounded-md border-dashed italic">
            Không tìm thấy từ vựng nào trong sổ tay phù hợp.
          </div>
        )}
      </div>

      {/* Print-only Table (renders only on paper/PDF export) */}
      <table className="print-table">
        <thead>
          <tr>
            <th>Chữ Hán</th>
            <th>Phiên âm (Pinyin)</th>
            <th>Hán Việt</th>
            <th>Dịch nghĩa</th>
            <th>Cấp độ HSK</th>
            <th>Ghi chú gợi nhớ</th>
          </tr>
        </thead>
        <tbody>
          {filteredFavorites.map((item) => (
            <tr key={item.id}>
              <td style={{ fontSize: '18pt', fontWeight: 'bold' }}>{item.hanzi}</td>
              <td style={{ fontFamily: 'monospace' }}>{item.pinyin}</td>
              <td style={{ textTransform: 'uppercase' }}>{item.sv}</td>
              <td>{item.vi}</td>
              <td>{item.hsk ? 'HSK ' + item.hsk : 'Khác'}</td>
              <td>{notes[item.hanzi] || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
