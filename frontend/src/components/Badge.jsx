const MAP = {
  active: "badge-green",
  paid: "badge-green",
  completed: "badge-green",
  confirmed: "badge-green",
  scheduled: "badge-blue",
  partial: "badge-amber",
  "on-leave": "badge-amber",
  unpaid: "badge-red",
  cancelled: "badge-red",
  "no-show": "badge-red",
  inactive: "badge-gray",
};

export default function Badge({ value }) {
  if (value === undefined || value === null || value === "") return <span className="cell-sub">—</span>;
  const cls = MAP[String(value).toLowerCase()] || "badge-gray";
  return <span className={`badge-pill ${cls}`} style={{ textTransform: "capitalize" }}>{String(value).replace("-", " ")}</span>;
}
