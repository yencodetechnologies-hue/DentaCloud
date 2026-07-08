import { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const ACTIVE_BRANCH_KEY = "dc_active_branch";

function refId(ref) {
  if (!ref) return "";
  if (typeof ref === "object") return String(ref.id || ref._id || "");
  return String(ref);
}

export default function ActiveBranchSelect() {
  const { user } = useAuth();
  const isEnterpriseAdmin = (user?.accountType || "clinic") === "enterprise" && ["dental-admin", "admin"].includes(user?.role);

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState(() => (localStorage.getItem(ACTIVE_BRANCH_KEY) || "").trim());

  useEffect(() => {
    if (!isEnterpriseAdmin) return;
    let active = true;
    setLoading(true);
    api
      .get("/branches", { params: { limit: 200, status: "active" } })
      .then(({ data }) => {
        if (!active) return;
        const list = data?.data || [];
        setBranches(list);

        // If no explicit selection yet, default to user's branch (if any) or first active branch.
        if (!activeBranchId) {
          const fallback = refId(user?.branch) || refId(list[0]?._id || list[0]?.id);
          if (fallback) {
            localStorage.setItem(ACTIVE_BRANCH_KEY, fallback);
            setActiveBranchId(fallback);
          }
        }
      })
      .catch(() => {
        if (active) setBranches([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isEnterpriseAdmin]);

  const activeName = useMemo(() => {
    const b = branches.find((x) => refId(x?._id) === activeBranchId || refId(x?.id) === activeBranchId);
    return b?.name || "";
  }, [branches, activeBranchId]);

  if (!isEnterpriseAdmin) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, opacity: 0.8 }}>Clinic</span>
      <select
        className="select"
        value={activeBranchId}
        disabled={loading || branches.length === 0}
        onChange={(e) => {
          const next = e.target.value;
          setActiveBranchId(next);
          localStorage.setItem(ACTIVE_BRANCH_KEY, next);
          // Hard reload ensures all pages/options re-fetch with the new clinic header.
          window.location.reload();
        }}
      >
        {branches.length === 0 ? (
          <option value="">{loading ? "Loading..." : "No branches"}</option>
        ) : (
          branches.map((b) => (
            <option key={refId(b?._id || b?.id)} value={refId(b?._id || b?.id)}>
              {b?.name || "Branch"}
            </option>
          ))
        )}
      </select>
      {activeName ? null : null}
    </div>
  );
}

