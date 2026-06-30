export function DetailGrid({ children }) {
  return <div className="detail-grid">{children}</div>;
}

export function DetailItem({ label, value, full }) {
  return (
    <div className={`detail-item ${full ? "full" : ""}`}>
      <div className="k">{label}</div>
      <div className="v">{value ?? "—"}</div>
    </div>
  );
}
