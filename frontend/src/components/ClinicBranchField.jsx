import { useEffect } from "react";
import useUserBranch from "../hooks/useUserBranch.js";

export default function ClinicBranchField({
  value,
  onChange,
  label = "Branch",
  required,
  includeClinicName = false,
}) {
  const { branchId, branchName, enterpriseName } = useUserBranch();

  useEffect(() => {
    if (!branchId || value === branchId) return;
    onChange(branchId);
  }, [branchId, value, onChange]);

  const displayValue = includeClinicName
    ? [enterpriseName, branchName].filter(Boolean).join(" — ") || "—"
    : (branchName || "—");

  return (
    <div className="field">
      <label>
        {label} {required && <span className="req">*</span>}
      </label>
      <input type="text" value={displayValue} readOnly disabled />
    </div>
  );
}
