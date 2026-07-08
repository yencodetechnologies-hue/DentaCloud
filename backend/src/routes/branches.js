import { Router } from "express";
import Branch from "../models/Branch.js";
import { asyncHandler } from "../controllers/crudController.js";

function addClinicName(branchDoc) {
  if (!branchDoc) return branchDoc;
  const obj = branchDoc.toObject ? branchDoc.toObject() : branchDoc;
  return {
    ...obj,
    clinicName: obj.enterprise && typeof obj.enterprise === "object" ? obj.enterprise.name || "" : "",
  };
}

function requireEnterprise(req, res) {
  const enterpriseId = req.user?.enterprise;
  if (!enterpriseId) {
    res.status(400).json({ message: "User is not linked to a clinic/enterprise" });
    return null;
  }
  return enterpriseId;
}

const router = Router();

// List only branches for the logged-in clinic (enterprise)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const enterpriseId = requireEnterprise(req, res);
    if (!enterpriseId) return;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const filter = { enterprise: enterpriseId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const rx = new RegExp(req.query.search.trim(), "i");
      filter.$or = [{ name: rx }, { code: rx }, { city: rx }, { phone: rx }];
    }

    const sort = req.query.sort || "-createdAt";
    const [items, total] = await Promise.all([
      Branch.find(filter).populate("enterprise").sort(sort).skip(skip).limit(limit),
      Branch.countDocuments(filter),
    ]);

    res.json({ data: items.map(addClinicName), total, page, pages: Math.ceil(total / limit) || 1 });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const enterpriseId = requireEnterprise(req, res);
    if (!enterpriseId) return;

    const item = await Branch.findOne({ _id: req.params.id, enterprise: enterpriseId }).populate("enterprise");
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(addClinicName(item));
  })
);

// Create: enterprise is always derived from logged-in user (ignore any provided enterprise)
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const enterpriseId = requireEnterprise(req, res);
    if (!enterpriseId) return;

    const payload = { ...req.body, enterprise: enterpriseId };
    const created = await Branch.create(payload);
    const item = await Branch.findById(created._id).populate("enterprise");
    res.status(201).json(addClinicName(item));
  })
);

// Update: do not allow moving branch across enterprises
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const enterpriseId = requireEnterprise(req, res);
    if (!enterpriseId) return;

    const item = await Branch.findOne({ _id: req.params.id, enterprise: enterpriseId });
    if (!item) return res.status(404).json({ message: "Not found" });

    const { enterprise, ...rest } = req.body || {};
    Object.assign(item, rest);
    await item.save();

    const populated = await Branch.findById(item._id).populate("enterprise");
    res.json(addClinicName(populated));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const enterpriseId = requireEnterprise(req, res);
    if (!enterpriseId) return;

    const item = await Branch.findOneAndDelete({ _id: req.params.id, enterprise: enterpriseId });
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted", id: req.params.id });
  })
);

export default router;

