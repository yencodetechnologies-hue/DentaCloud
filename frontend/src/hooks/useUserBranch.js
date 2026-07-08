import { useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";

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

  const branchId = refId(user?.branch);
  const branchName = refName(user?.branch);
  const enterpriseId = refId(user?.enterprise);
  const enterpriseName = refName(user?.enterprise);

  useEffect(() => {
    if (!user || branchName) return;
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
  }, [user, branchName, setUser]);

  return { branchId, branchName, enterpriseId, enterpriseName };
}
