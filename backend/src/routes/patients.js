import { Router } from "express";
import Patient from "../models/Patient.js";
import { crudController, asyncHandler } from "../controllers/crudController.js";
import { sendThankYouEmail } from "../services/notify.js";

const router = Router();
const c = crudController(Patient, {
  searchFields: ["name", "firstName", "lastName", "phone", "email", "patientId"],
  populate: ["branch", "referredByPatient"],
});

router.get("/", c.list);
router.get("/:id", c.get);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.tenant?.branchId) {
      return res.status(400).json({ message: "Active clinic (branch) is required" });
    }
    // Tenant scoping is enforced inside the generic controller, but this route
    // has custom post-create logic (thank-you email), so we also force branch here.
    const payload = { ...req.body, branch: req.tenant.branchId };
    const created = await Patient.create(payload);
    if (created.email) {
      try {
        await sendThankYouEmail(created);
        created.thankYouSentAt = new Date();
        await created.save();
      } catch (err) {
        console.error("[patients] thank-you email failed:", err.message);
      }
    }
    const item = await Patient.findById(created._id).populate(["branch", "referredByPatient"]);
    res.status(201).json(item);
  })
);

router.put("/:id", c.update);
router.delete("/:id", c.remove);

export default router;
