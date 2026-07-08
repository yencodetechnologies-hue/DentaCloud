import { useEffect, useState } from "react";
import api from "../api/client.js";

/**
 * Mini stat cards shown at the top of CRUD pages.
 * @param {string} resource - page-stats resource key (e.g. "doctors")
 * @param {{ key: string, label: string, icon?: string, prefix?: string }[]} cards
 * @param {any} refreshKey - change to refetch stats
 */
export default function PageDashboard({ resource, cards, refreshKey }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resource) return;
    setLoading(true);
    api
      .get(`/page-stats/${resource}`)
      .then(({ data }) => setStats(data))
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, [resource, refreshKey]);

  if (!cards?.length) return null;

  return (
    <div className="page-dash stat-grid" style={{ marginBottom: 20 }}>
      {cards.map((c) => (
        <div className="stat-card page-stat-card" key={c.key}>
          <div className="top-row">
            {c.icon && (
              <div className="ic" style={{ background: c.bg || "#E3FBF6" }}>
                {c.icon}
              </div>
            )}
          </div>
          <div className="num">
            {loading
              ? "—"
              : `${c.prefix || ""}${Number(stats?.[c.key] ?? 0).toLocaleString("en-IN")}`}
          </div>
          <div className="lbl">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
