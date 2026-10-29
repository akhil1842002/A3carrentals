import React, { useState, useEffect } from 'react';
import { 
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiCornerDownLeft
} from 'react-icons/fi';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  onPageChange,
  onPageSizeChange,
  label = 'items',
  stepSize = 5
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const [jumpPage, setJumpPage] = useState(safeCurrentPage);

  useEffect(() => {
    setJumpPage(safeCurrentPage);
  }, [safeCurrentPage]);

  if (totalItems === 0) return null;

  const startItem = (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const target = parseInt(jumpPage, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      onPageChange(target);
    } else {
      setJumpPage(safeCurrentPage);
    }
  };

  const handleStepJump = (delta) => {
    const target = Math.min(Math.max(1, safeCurrentPage + delta), totalPages);
    onPageChange(target);
  };

  // Calculate visible page buttons (max 5 buttons centered on current page)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, safeCurrentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="cb-pagination-wrap">
      <div className="cb-pagination-info">
        <span>
          Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{totalItems}</strong> {label}
        </span>
        {onPageSizeChange && (
          <div className="cb-pagination-size-select">
            <label htmlFor="cb-user-page-size">Per page:</label>
            <select
              id="cb-user-page-size"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                if (onPageChange) onPageChange(1);
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="cb-pagination-controls">
        {/* First Page */}
        <button
          type="button"
          className="cb-page-btn icon-btn"
          disabled={safeCurrentPage === 1}
          onClick={() => onPageChange(1)}
          title="First Page (Page 1)"
        >
          <FiChevronsLeft size={15} />
        </button>

        {/* Multi-step back (-5 pages) */}
        {totalPages > stepSize && (
          <button
            type="button"
            className="cb-page-btn step-btn"
            disabled={safeCurrentPage <= 1}
            onClick={() => handleStepJump(-stepSize)}
            title={`Step back ${stepSize} pages`}
          >
            -{stepSize}
          </button>
        )}

        {/* Single Step Prev */}
        <button
          type="button"
          className="cb-page-btn icon-btn"
          disabled={safeCurrentPage === 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          title="Previous Page"
        >
          <FiChevronLeft size={15} />
        </button>

        {pages[0] > 1 && (
          <>
            <button
              type="button"
              className={`cb-page-btn ${safeCurrentPage === 1 ? 'active' : ''}`}
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {pages[0] > 2 && <span className="cb-page-dots">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`cb-page-btn ${safeCurrentPage === p ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="cb-page-dots">…</span>}
            <button
              type="button"
              className={`cb-page-btn ${safeCurrentPage === totalPages ? 'active' : ''}`}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Single Step Next */}
        <button
          type="button"
          className="cb-page-btn icon-btn"
          disabled={safeCurrentPage === totalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          title="Next Page"
        >
          <FiChevronRight size={15} />
        </button>

        {/* Multi-step forward (+5 pages) */}
        {totalPages > stepSize && (
          <button
            type="button"
            className="cb-page-btn step-btn"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => handleStepJump(stepSize)}
            title={`Step forward ${stepSize} pages`}
          >
            +{stepSize}
          </button>
        )}

        {/* Last Page */}
        <button
          type="button"
          className="cb-page-btn icon-btn"
          disabled={safeCurrentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          title={`Last Page (Page ${totalPages})`}
        >
          <FiChevronsRight size={15} />
        </button>

        {/* Step Input Direct Page Jump */}
        {totalPages > 2 && (
          <form onSubmit={handleJumpSubmit} className="cb-pagination-step-jump">
            <span className="step-jump-label">Go to:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              aria-label="Direct page number"
            />
            <span className="step-jump-total">/ {totalPages}</span>
            <button type="submit" className="cb-step-jump-btn" title="Jump to page">
              <FiCornerDownLeft size={11} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
