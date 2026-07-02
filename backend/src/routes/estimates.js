import { Router } from "express";
import Estimate from "../models/Estimate.js";
import Invoice from "../models/Invoice.js";
import { crudController, asyncHandler } from "../controllers/crudController.js";

const router = Router();
const c = crudController(Estimate, {
  searchFields: ["estimateNo", "status"],
  populate: ["patient", "branch"],
});

async function nextEstimateNo() {
  const year = new Date().getFullYear();
  const count = await Estimate.countDocuments();
  return `EST-${year}-${String(count + 1).padStart(4, "0")}`;
}

async function nextInvoiceNo() {
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments();
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

router.get("/", c.list);
router.get("/:id", c.get);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.body.estimateNo) req.body.estimateNo = await nextEstimateNo();
    const created = await Estimate.create(req.body);
    const item = await Estimate.findById(created._id).populate("patient").populate("branch");
    res.status(201).json(item);
  })
);

router.put("/:id", c.update);
router.delete("/:id", c.remove);

router.post(
  "/:id/convert",
  asyncHandler(async (req, res) => {
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) return res.status(404).json({ message: "Not found" });
    if (estimate.status === "converted") {
      return res.status(400).json({ message: "Estimate already converted" });
    }

    const invoice = await Invoice.create({
      invoiceNo: await nextInvoiceNo(),
      patient: estimate.patient,
      branch: estimate.branch,
      items: estimate.items,
      discount: estimate.discount,
    });

    estimate.status = "converted";
    await estimate.save();

    const populated = await Invoice.findById(invoice._id).populate("patient").populate("branch");
    res.status(201).json(populated);
  })
);

export default router;
