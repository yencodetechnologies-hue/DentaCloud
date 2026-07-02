import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { resourceRouter } from "./resourceRouter.js";
import authRoutes from "./auth.js";
import dashboardRoutes from "./dashboard.js";
import invoiceRoutes from "./invoices.js";
import estimateRoutes from "./estimates.js";
import uploadRoutes from "./uploads.js";

import Branch from "../models/Branch.js";
import Doctor from "../models/Doctor.js";
import Staff from "../models/Staff.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Treatment from "../models/Treatment.js";
import FollowUp from "../models/FollowUp.js";
import Vendor from "../models/Vendor.js";
import InventoryItem from "../models/InventoryItem.js";
import Equipment from "../models/Equipment.js";
import Attendance from "../models/Attendance.js";
import Notification from "../models/Notification.js";

const ADMIN_ROLES = ["dental-admin", "admin", "staff"];

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

router.use(
  "/follow-ups",
  resourceRouter(FollowUp, {
    searchFields: ["reason", "status", "notes"],
    populate: ["patient", "doctor", "branch", "relatedAppointment"],
  })
);

// invoices have custom create/update for invoiceNo + totals
router.use("/invoices", invoiceRoutes);
router.use("/estimates", estimateRoutes);

router.use(
  "/vendors",
  authorize(...ADMIN_ROLES),
  resourceRouter(Vendor, { searchFields: ["name", "contactPerson", "phone", "email"], populate: ["branch"] })
);
router.use(
  "/inventory",
  authorize(...ADMIN_ROLES),
  resourceRouter(InventoryItem, { searchFields: ["name", "category"], populate: ["vendor", "branch"] })
);
router.use(
  "/equipment",
  authorize(...ADMIN_ROLES),
  resourceRouter(Equipment, { searchFields: ["name", "type"], populate: ["branch"] })
);
router.use(
  "/attendance",
  authorize(...ADMIN_ROLES),
  resourceRouter(Attendance, { searchFields: ["status"], populate: ["person", "branch"] })
);
router.use(
  "/notifications",
  resourceRouter(Notification, { searchFields: ["type", "channel", "recipientName", "status"], populate: ["branch"] })
);

export default router;
