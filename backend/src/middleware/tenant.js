import Branch from "../models/Branch.js";

function asId(v) {
  if (!v) return "";
  if (typeof v === "object") return String(v._id || v.id || "");
  return String(v);
}

export async function resolveTenant(req, res, next) {
  try {
    const enterpriseId = asId(req.user?.enterprise);
    const userBranchId = asId(req.user?.branch);
    const headerBranchId = String(req.headers["x-branch-id"] || "").trim();

    const branchId = headerBranchId || userBranchId;

    req.tenant = { enterpriseId: enterpriseId || "", branchId: branchId || "" };

    // If client provided a branch header, validate it belongs to the user's enterprise (when known).
    if (headerBranchId) {
      if (!enterpriseId) {
        return res.status(400).json({ message: "User is not linked to an enterprise" });
      }
      const ok = await Branch.exists({ _id: headerBranchId, enterprise: enterpriseId });
      if (!ok) {
        return res.status(403).json({ message: "Forbidden: branch does not belong to your enterprise" });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}

export function requireBranch(req, res, next) {
  if (!req.tenant?.branchId) {
    return res.status(400).json({ message: "Active clinic (branch) is required" });
  }
  next();
}

