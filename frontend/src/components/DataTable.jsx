import { useEffect, useState } from "react";

export default function DataTable({
  columns,
  rows,
  loading,
  page,
  pages,
  total,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  emptyLabel = "No records yet",
  selectable = false,
  sortable = false,
  hideDelete = false,
  actionVariant = "default",
  showActions = true,
}) {
  const [selected, setSelected] = useState(() => new Set());

  useEffect(() => {
    setSelected(new Set());
  }, [rows]);

  const allIds = rows.map((r) => r._id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasActions = showActions && (onView || onEdit || (!hideDelete && onDelete));
  const colSpan = columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className={`data-table-wrap ${selectable || sortable || actionVariant === "teal" ? "table-card--list" : ""}`}>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th className="th-select" style={{ width: 48 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} style={c.width ? { width: c.width } : undefined}>
                  <span className="th-label">
                    {c.header}
                    {sortable && c.sortable !== false && <span className="th-sort" aria-hidden>↕</span>}
                  </span>
                </th>
              ))}
              {hasActions && (
                <th style={{ textAlign: actionVariant === "teal" ? "left" : "right" }}>
                  <span className="th-label">
                    Action
                    {sortable && <span className="th-sort" aria-hidden>↕</span>}
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpan}>
                  <div className="table-loading">Loading…</div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan}>
                  <div className="empty-state">
                    <div className="big">🦷</div>
                    <div>{emptyLabel}</div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={row._id} className={selected.has(row._id) ? "is-selected" : undefined}>
                  {selectable && (
                    <td className="td-select">
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={selected.has(row._id)}
                        onChange={() => toggleOne(row._id)}
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key}>{c.render ? c.render(row, rowIndex) : row[c.key] ?? "—"}</td>
                  ))}
                  {hasActions && (
                    <td>
                      <div className={`row-actions ${actionVariant === "teal" ? "row-actions--teal" : ""}`}>
                        {onEdit && (
                          <button
                            type="button"
                            className={`act-btn ${actionVariant === "teal" ? "act-btn--teal" : ""}`}
                            title="Edit"
                            onClick={() => onEdit(row)}
                          >
                            {actionVariant === "teal" ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M4 20h4l10-10-4-4L4 16v4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                <path d="M13 7l4 4" stroke="currentColor" strokeWidth="2" />
                              </svg>
                            ) : "✏️"}
                          </button>
                        )}
                        {onView && (
                          <button
                            type="button"
                            className={`act-btn ${actionVariant === "teal" ? "act-btn--teal" : ""}`}
                            title="View"
                            onClick={() => onView(row)}
                          >
                            {actionVariant === "teal" ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                              </svg>
                            ) : "👁️"}
                          </button>
                        )}
                        {!hideDelete && onDelete && (
                          <button type="button" className="act-btn danger" title="Delete" onClick={() => onDelete(row)}>
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-foot">
        <span>{total} record{total === 1 ? "" : "s"}</span>
        <div className="pager">
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹</button>
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === pages)
            .map((p, idx, arr) => (
              <span key={p} style={{ display: "flex" }}>
                {idx > 0 && p - arr[idx - 1] > 1 && <span style={{ padding: "0 4px" }}>…</span>}
                <button className={p === page ? "active" : ""} onClick={() => onPageChange(p)}>{p}</button>
              </span>
            ))}
          <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}>›</button>
        </div>
      </div>
    </div>
  );
}
