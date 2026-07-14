import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";

const ACTIVE_BRANCH_KEY = "dc_active_branch";

function refId(ref) {
  if (!ref) return "";
  if (typeof ref === "object") return ref.id || ref._id || "";
  return String(ref);
}

function refName(ref) {
  if (!ref || typeof ref !== "object") return "";
  return ref.name || "";
}

export default function useUserBranch() {
  const { user, setUser } = useAuth();

  const userBranchId = refId(user?.branch);
  const userBranchName = refName(user?.branch);
  const userEnterpriseId = refId(user?.enterprise);
  const userEnterpriseName = refName(user?.enterprise);

  const activeBranchId = useMemo(() => {
    const picked = (localStorage.getItem(ACTIVE_BRANCH_KEY) || "").trim();
    return picked || userBranchId;
  }, [userBranchId]);

  const [activeBranch, setActiveBranch] = useState(null);

  useEffect(() => {
    if (!user || userBranchName) return;
    let active = true;
    api
      .get("/auth/me")
      .then(({ data }) => {
        if (!active || !data.user) return;
        localStorage.setItem("dc_user", JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, userBranchName, setUser]);

  useEffect(() => {
    // For enterprise admins, the "Clinic" dropdown sets dc_active_branch.
    // Resolve branch + clinic names based on the active branch selection.
    if (!user || !activeBranchId) return;

    // If the active branch is the user's own branch and we already have names, no need to fetch.
    const alreadyHaveUserNames = !!userBranchName && !!userEnterpriseName;
    if (activeBranchId === userBranchId && alreadyHaveUserNames) return;

    let mounted = true;
    api
      .get(`/branches/${activeBranchId}`)
      .then(({ data }) => {
        if (!mounted) return;
        setActiveBranch(data || null);
      })
      .catch(() => {
        if (mounted) setActiveBranch(null);
      });

    return () => {
      mounted = false;
    };
  }, [user, activeBranchId, userBranchId, userBranchName, userEnterpriseName]);

  const branchId = activeBranchId || userBranchId;
  const branchName = activeBranch?.name || userBranchName;
  const enterpriseId = activeBranch?.enterprise?._id || activeBranch?.enterprise?.id || userEnterpriseId;
  const enterpriseName = activeBranch?.clinicName || activeBranch?.enterprise?.name || userEnterpriseName;

  return { branchId, branchName, enterpriseId, enterpriseName };
}
