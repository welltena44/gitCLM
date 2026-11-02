import { useEffect, useState } from "react";
import "./Pagination.css";

const PAGE_SIZES = [10, 25, 50];

export default function Pagination({ items, resetKey, children }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const firstItem = items.length ? (page - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(page * pageSize, items.length);
  const visibleItems = items.slice(firstItem - 1, lastItem);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  return (
    <>
      {children(visibleItems)}
      {items.length > 0 && (
        <nav className="list-pagination" aria-label="Pagination des résultats">
          <label>
            Lignes par page
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <span className="list-pagination-range" aria-live="polite">
            {firstItem}–{lastItem} sur {items.length}
          </span>
          <div className="list-pagination-navigation">
            <button
              type="button"
              aria-label="Page précédente"
              title="Page précédente"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <span>
              Page {page} / {pageCount}
            </span>
            <button
              type="button"
              aria-label="Page suivante"
              title="Page suivante"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => current + 1)}
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </>
  );
}