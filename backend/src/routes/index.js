import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { resourceRouter } from "./resourceRouter.js";
import authRoutes from "./auth.js";
import dashboardRoutes from "./dashboard.js";
import pageStatsRoutes from "./pageStats.js";
import patientRoutes from "./patients.js";
import invoiceRoutes from "./invoices.js";
import estimateRoutes from "./estimates.js";
import uploadRoutes from "./uploads.js";
import branchesRoutes from "./branches.js";

import Branch from "../models/Branch.js";
import Enterprise from "../models/Enterprise.js";
import Doctor from "../models/Doctor.js";
import Staff from "../models/Staff.js";
import Appointment from "../models/Appointment.js";
import Treatment from "../models/Treatment.js";
import FollowUp from "../models/FollowUp.js";
import Report from "../models/Report.js";
import Procedure from "../models/Procedure.js";
import Vendor from "../models/Vendor.js";
import InventoryItem from "../models/InventoryItem.js";
import Equipment from "../models/Equipment.js";
import Attendance from "../models/Attendance.js";
import Notification from "../models/Notification.js";
import FixedCost from "../models/FixedCost.js";
import Investment from "../models/Investment.js";
import FinancialProfile from "../models/FinancialProfile.js";
import CallLog from "../models/CallLog.js";
import { resolveTenant } from "../middleware/tenant.js";

const ADMIN_ROLES = ["dental-admin", "admin", "staff"];
const ADMIN_ONLY = ["dental-admin", "admin"];

const router = Router();

router.use("/auth", authRoutes);
router.use(protect);
router.use(resolveTenant);

router.use("/dashboard", dashboardRoutes);
router.use("/page-stats", pageStatsRoutes);
router.use("/uploads", uploadRoutes);

router.use("/enterprises", authorize(...ADMIN_ONLY), resourceRouter(Enterprise, { searchFields: ["name", "code", "owner", "gstin"] }));
router.use("/branches", branchesRoutes);
router.use(
  "/doctors",
  resourceRouter(Doctor, {
    searchFields: ["name", "firstName", "lastName", "specialization", "email", "phone", "location", "upid", "dciRegNo"],
    populate: ["branch"],
  })
);
router.use(
  "/staff",
  resourceRouter(Staff, {
    searchFields: ["name", "firstName", "lastName", "email", "phone", "location", "qualification", "bankName", "employeeId"],
    populate: ["branch"],
  })
);
router.use("/patients", patientRoutes);
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
router.use(
  "/reports",
  resourceRouter(Report, {
    searchFields: ["title", "notes", "type"],
    populate: ["patient", "doctor", "branch"],
  })
);
router.use(
  "/procedures",
  authorize(...ADMIN_ONLY),
  resourceRouter(Procedure, {
    searchFields: ["name", "code", "category"],
    populate: ["branch", "enterprise"],
  })
);

router.use("/invoices", invoiceRoutes);
router.use("/estimates", estimateRoutes);

router.use(
  "/vendors",
  authorize(...ADMIN_ROLES, "vendor"),
  resourceRouter(Vendor, { searchFields: ["name", "contactPerson", "phone", "email", "gstin"], populate: ["branch"] })
);
router.use(
  "/inventory",
  authorize(...ADMIN_ROLES, "housekeeping"),
  resourceRouter(InventoryItem, { searchFields: ["name", "category"], populate: ["vendor", "branch"] })
);
router.use(
  "/equipment",
  authorize(...ADMIN_ROLES, "housekeeping"),
  resourceRouter(Equipment, { searchFields: ["name", "type"], populate: ["branch"] })
);
router.use(
  "/attendance",
  authorize(...ADMIN_ONLY, "security"),
  resourceRouter(Attendance, { searchFields: ["status"], populate: ["person", "branch"] })
);
router.use(
  "/notifications",
  authorize(...ADMIN_ONLY),
  resourceRouter(Notification, { searchFields: ["type", "channel", "recipientName", "status"], populate: ["branch"] })
);
router.use(
  "/fixed-costs",
  authorize(...ADMIN_ONLY),
  resourceRouter(FixedCost, { searchFields: ["name", "category"], populate: ["branch", "enterprise"] })
);
router.use(
  "/investments",
  authorize(...ADMIN_ONLY),
  resourceRouter(Investment, { searchFields: ["name", "category", "notes"], populate: ["branch", "enterprise"] })
);
router.use(
  "/financial-profiles",
  authorize(...ADMIN_ONLY),
  resourceRouter(FinancialProfile, { searchFields: ["notes"], populate: ["branch", "enterprise"] })
);
router.use(
  "/call-logs",
  resourceRouter(CallLog, {
    searchFields: ["contact", "notes", "outcome"],
    populate: ["patient", "calledBy", "branch"],
  })
);

export default router;
