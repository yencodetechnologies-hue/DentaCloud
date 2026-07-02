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
  missed: "badge-red",
  pending: "badge-amber",
  draft: "badge-gray",
  sent: "badge-blue",
  accepted: "badge-green",
  rejected: "badge-red",
  converted: "badge-green",
  present: "badge-green",
  absent: "badge-red",
  "half-day": "badge-amber",
  leave: "badge-amber",
  logged: "badge-gray",
  sent_notification: "badge-blue",
  failed: "badge-red",
};

export default function Badge({ value }) {
  if (value === undefined || value === null || value === "") return <span className="cell-sub">—</span>;
  const cls = MAP[String(value).toLowerCase()] || "badge-gray";
  return <span className={`badge-pill ${cls}`} style={{ textTransform: "capitalize" }}>{String(value).replace("-", " ")}</span>;
}
