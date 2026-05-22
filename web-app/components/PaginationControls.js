'use client';

import React from 'react';

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrev
}) {
  if (totalPages <= 1) return null;

  // Generate page numbers to show (e.g., limit display range if total pages is large)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show page 1
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pages.push('ellipsis-start');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pages = getPageNumbers();

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t mt-4" style={{ borderColor: 'var(--border-default)' }}>
      {/* Mobile view info */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-xl border px-4 py-2 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none hover:bg-[var(--bg-card-hover)]"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Sebelumnya
        </button>
        <div className="flex items-center">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Halaman {currentPage} dari {totalPages}
          </span>
        </div>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-xl border px-4 py-2 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none hover:bg-[var(--bg-card-hover)]"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Selanjutnya
        </button>
      </div>

      {/* Desktop view */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Menampilkan halaman <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{currentPage}</span> dari <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{totalPages}</span> halaman
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm gap-1" aria-label="Pagination">
            {/* Prev Button */}
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-lg p-2 text-xs font-medium border transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none hover:bg-[var(--bg-card-hover)]"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
              aria-label="Halaman sebelumnya"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Page Numbers */}
            {pages.map((page, index) => {
              if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-3 py-1.5 text-xs font-semibold"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    ...
                  </span>
                );
              }

              const isActive = page === currentPage;

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center rounded-lg px-3.5 py-1.5 text-xs font-semibold border transition-all active:scale-95 ${
                    isActive
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                      : 'hover:bg-[var(--bg-card-hover)]'
                  }`}
                  style={!isActive ? { background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' } : {}}
                >
                  {page}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-lg p-2 text-xs font-medium border transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none hover:bg-[var(--bg-card-hover)]"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
              aria-label="Halaman berikutnya"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
