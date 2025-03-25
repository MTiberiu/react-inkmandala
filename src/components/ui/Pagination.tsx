import React from 'react';
import './Pagination.css'

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers: (number | string)[] = [];

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      Math.abs(i - currentPage) <= 1
    ) {
      pageNumbers.push(i);
    } else if (
      i === currentPage - 2 ||
      i === currentPage + 2
    ) {
      pageNumbers.push('...');
    }
  }

  // elimină duplicate de "..."
  const cleaned: (number | string)[] = [];
  let prev: number | string | null = null;
  for (const item of pageNumbers) {
    if (item === '...' && prev === '...') continue;
    cleaned.push(item);
    prev = item;
  }

  return (
    <div className="pagination-numbers">
      {cleaned.map((item, index) =>
        item === '...' ? (
          <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item as number)}
            className={item === currentPage ? 'active' : ''}
          >
            {item}
          </button>
        )
      )}
    </div>
  );
};

export default Pagination;
