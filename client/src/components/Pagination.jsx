import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (start === 1) {
        end = maxVisiblePages;
      } else if (end === totalPages) {
        start = totalPages - maxVisiblePages + 1;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border-color bg-bg-card text-xs">
      <span className="text-text-secondary font-medium">
        Showing Page <strong className="text-text-main">{currentPage}</strong> of <strong className="text-text-main">{totalPages}</strong>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-lg border border-border-color/80 bg-bg-main/30 hover:bg-bg-main hover:text-text-main text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer active:scale-95"
          title="Previous Page"
        >
          <FaChevronLeft className="text-[10px]" />
        </button>

        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer active:scale-95 text-xs flex items-center justify-center ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 border border-indigo-600"
                  : "border border-border-color/60 bg-bg-main/10 hover:bg-bg-main text-text-secondary hover:text-text-main"
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-lg border border-border-color/80 bg-bg-main/30 hover:bg-bg-main hover:text-text-main text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer active:scale-95"
          title="Next Page"
        >
          <FaChevronRight className="text-[10px]" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
