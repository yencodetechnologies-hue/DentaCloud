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
}) {
  return (
    <div className="table-card">
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={c.width ? { width: c.width } : undefined}>{c.header}</th>
              ))}
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1}>
                  <div className="table-loading">Loading…</div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1}>
                  <div className="empty-state">
                    <div className="big">🦷</div>
                    <div>{emptyLabel}</div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row._id}>
                  {columns.map((c) => (
                    <td key={c.key}>{c.render ? c.render(row) : row[c.key] ?? "—"}</td>
                  ))}
                  <td>
                    <div className="row-actions">
                      {onView && (
                        <button className="act-btn" title="View" onClick={() => onView(row)}>👁️</button>
                      )}
                      {onEdit && (
                        <button className="act-btn" title="Edit" onClick={() => onEdit(row)}>✏️</button>
                      )}
                      {onDelete && (
                        <button className="act-btn danger" title="Delete" onClick={() => onDelete(row)}>🗑️</button>
                      )}
                    </div>
                  </td>
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
