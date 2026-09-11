import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 12,
  pageSizeOptions = [8, 12, 16, 24],
  onPageChange,
  onPageSizeChange,
  itemLabel = 'mục',
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems <= pageSize && totalPages <= 1 && (!pageSizeOptions || pageSizeOptions.length <= 1)) {
    return null;
  }

  // Generate smart page window e.g. 1 ... 4 5 6 ... 20
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
    <div
      className={`w-full flex flex-col sm:flex-row items-center justify-between gap-3.5 bg-white dark:bg-surface-dark border border-hairline dark:border-divider-dark rounded-2xl px-4 py-3 shadow-sm transition-colors ${className}`}
    >
      {/* Left: Summary text & page size selector */}
      <div className="flex items-center gap-3 text-xs text-sub dark:text-on-dark-mute font-medium">
        <span>
          Hiển thị{' '}
          <strong className="text-primary dark:text-primary font-bold">
            {startItem} - {endItem}
          </strong>{' '}
          trên <strong className="text-ink dark:text-on-dark font-bold">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 0 && (
          <>
            <span className="text-hairline dark:text-divider-dark hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-mute text-[11px] hidden sm:inline">Mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="bg-surface-bone/60 dark:bg-surface-deep/70 border border-hairline dark:border-divider-dark text-ink dark:text-on-dark rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-primary cursor-pointer transition-colors"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} / trang
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Right: Page controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-xl text-sub dark:text-on-dark-mute hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="Trang đầu"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-xl text-sub dark:text-on-dark-mute hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 text-center text-mute text-xs select-none"
                >
                  •••
                </span>
              );
            }

            const isActive = currentPage === p;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30 scale-105'
                    : 'text-sub dark:text-on-dark-mute hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-xl text-sub dark:text-on-dark-mute hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="Trang sau"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-xl text-sub dark:text-on-dark-mute hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="Trang cuối"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
