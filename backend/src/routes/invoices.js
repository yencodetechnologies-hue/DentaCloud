import { Router } from "express";
import Invoice from "../models/Invoice.js";
import { crudController, asyncHandler } from "../controllers/crudController.js";

const router = Router();
const c = crudController(Invoice, {
  searchFields: ["invoiceNo", "status", "paymentMethod"],
  populate: ["patient", "branch"],
});

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
    if (!req.body.invoiceNo) req.body.invoiceNo = await nextInvoiceNo();
    const created = await Invoice.create(req.body);
    const item = await Invoice.findById(created._id).populate("patient").populate("branch");
    res.status(201).json(item);
  })
);

router.put("/:id", c.update);
router.delete("/:id", c.remove);

export default router;
