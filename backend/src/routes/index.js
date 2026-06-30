import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { resourceRouter } from "./resourceRouter.js";
import authRoutes from "./auth.js";
import dashboardRoutes from "./dashboard.js";
import invoiceRoutes from "./invoices.js";
import uploadRoutes from "./uploads.js";

import Branch from "../models/Branch.js";
import Doctor from "../models/Doctor.js";
import Staff from "../models/Staff.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Treatment from "../models/Treatment.js";

const router = Router();

router.use("/auth", authRoutes);

// everything below requires a valid token
router.use(protect);

router.use("/dashboard", dashboardRoutes);
router.use("/uploads", uploadRoutes);

router.use("/branches", resourceRouter(Branch, { searchFields: ["name", "code", "city", "phone"] }));
router.use(
  "/doctors",
  resourceRouter(Doctor, { searchFields: ["name", "specialization", "email", "phone"], populate: ["branch"] })
);
router.use(
  "/staff",
  resourceRouter(Staff, { searchFields: ["name", "role", "email", "phone"], populate: ["branch"] })
);
router.use(
  "/patients",
  resourceRouter(Patient, { searchFields: ["name", "phone", "email", "patientId"], populate: ["branch"] })
);
router.use(
  "/appointments",
  resourceRouter(Appointment, {
    searchFields: ["treatment", "status", "time"],
    populate: ["patient", "doctor", "branch"],
  })
);

router.use(
  "/treatments",
  resourceRouter(Treatment, {
    searchFields: ["name", "category", "toothNumber", "status"],
    populate: ["patient", "doctor", "branch"],
  })
);

// invoices have custom create/update for invoiceNo + totals
router.use("/invoices", invoiceRoutes);

export default router;
