import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function FarmPagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 24,
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate intelligent page numbers window (e.g. 1 ... 4 5 6 ... 20)
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3.5 bg-white/95 dark:bg-stone-900/80 border border-stone-200/90 dark:border-white/10 rounded-2xl px-4 py-3 backdrop-blur-xl shadow-sm dark:shadow-md transition-colors">
      {/* Left: Summary text & page size selector */}
      <div className="flex items-center gap-3 text-xs text-stone-600 dark:text-stone-300 font-medium">
        <span>
          Hiển thị <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{startItem} - {endItem}</strong> trên{' '}
          <strong className="text-stone-900 dark:text-white font-bold">{totalItems}</strong> cây
        </span>

        <span className="text-stone-300 dark:text-stone-600 hidden sm:inline">•</span>

        {/* Page size dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-stone-500 dark:text-stone-400 text-[11px] hidden sm:inline">Mỗi trang:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-white/10 text-stone-800 dark:text-white rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer transition-colors"
          >
            <option value={12}>12 cây</option>
            <option value={24}>24 cây</option>
            <option value={36}>36 cây</option>
            <option value={48}>48 cây</option>
          </select>
        </div>
      </div>

      {/* Right: Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* First page button */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-white/5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/70 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Trang đầu"
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Previous page button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-white/5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/70 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Trang trước"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page Number Pills */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span key={`dots-${idx}`} className="px-1 text-stone-400 dark:text-stone-500 text-xs select-none">
                ...
              </span>
            ) : (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentPage === p
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm scale-105'
                    : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700/80 hover:text-stone-900 dark:hover:text-white border border-stone-200/70 dark:border-white/5'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next page button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-white/5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/70 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Trang sau"
        >
          <ChevronRight size={14} />
        </button>

        {/* Last page button */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-white/5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/70 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Trang cuối"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
