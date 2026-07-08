import { Router } from "express";
import { asyncHandler } from "../controllers/crudController.js";
import Branch from "../models/Branch.js";
import Doctor from "../models/Doctor.js";
import Staff from "../models/Staff.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Treatment from "../models/Treatment.js";
import FollowUp from "../models/FollowUp.js";
import Invoice from "../models/Invoice.js";
import Estimate from "../models/Estimate.js";
import Vendor from "../models/Vendor.js";
import InventoryItem from "../models/InventoryItem.js";
import Equipment from "../models/Equipment.js";
import Attendance from "../models/Attendance.js";
import Notification from "../models/Notification.js";
import Enterprise from "../models/Enterprise.js";

const router = Router();

function dayRange(d = new Date()) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

const HANDLERS = {
  enterprises: async () => {
    const [total, active] = await Promise.all([
      Enterprise.countDocuments(),
      Enterprise.countDocuments({ status: "active" }),
    ]);
    return { total, active, inactive: total - active };
  },
  branches: async () => {
    const [total, active] = await Promise.all([
      Branch.countDocuments(),
      Branch.countDocuments({ status: "active" }),
    ]);
    return { total, active, inactive: total - active };
  },
  doctors: async () => {
    const [total, active, onLeave] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ status: "active" }),
      Doctor.countDocuments({ status: "on-leave" }),
    ]);
    return { total, active, onLeave };
  },
  staff: async () => {
    const [total, active] = await Promise.all([
      Staff.countDocuments(),
      Staff.countDocuments({ status: "active" }),
    ]);
    return { total, active, inactive: total - active };
  },
  patients: async () => {
    const [total, active] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ status: "active" }),
    ]);
    return { total, active, inactive: total - active };
  },
  appointments: async () => {
    const { start, end } = dayRange();
    const [total, today, completed] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: { $gte: start, $lte: end } }),
      Appointment.countDocuments({ status: "completed", date: { $gte: start, $lte: end } }),
    ]);
    return { total, today, completed };
  },
  treatments: async () => {
    const [total, ongoing, completed] = await Promise.all([
      Treatment.countDocuments(),
      Treatment.countDocuments({ status: { $in: ["planned", "ongoing"] } }),
      Treatment.countDocuments({ status: "completed" }),
    ]);
    return { total, ongoing, completed };
  },
  "follow-ups": async () => {
    const { start } = dayRange();
    const [total, pending, overdue] = await Promise.all([
      FollowUp.countDocuments(),
      FollowUp.countDocuments({ status: "pending" }),
      FollowUp.countDocuments({ status: "pending", dueDate: { $lt: start } }),
    ]);
    return { total, pending, overdue };
  },
  invoices: async () => {
    const { start, end } = dayRange();
    const [total, unpaid, todayRevenue] = await Promise.all([
      Invoice.countDocuments(),
      Invoice.countDocuments({ status: { $in: ["unpaid", "partial"] } }),
      Invoice.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$paid" } } },
      ]),
    ]);
    return { total, unpaid, todayRevenue: todayRevenue[0]?.total || 0 };
  },
  estimates: async () => {
    const [total, draft, accepted] = await Promise.all([
      Estimate.countDocuments(),
      Estimate.countDocuments({ status: "draft" }),
      Estimate.countDocuments({ status: "accepted" }),
    ]);
    return { total, draft, accepted };
  },
  vendors: async () => {
    const [total, active] = await Promise.all([
      Vendor.countDocuments(),
      Vendor.countDocuments({ status: "active" }),
    ]);
    return { total, active, inactive: total - active };
  },
  inventory: async () => {
    const [total, lowStock] = await Promise.all([
      InventoryItem.countDocuments(),
      InventoryItem.countDocuments({ $expr: { $lte: ["$quantity", "$reorderLevel"] } }),
    ]);
    return { total, lowStock };
  },
  equipment: async () => {
    const [total, active, underRepair] = await Promise.all([
      Equipment.countDocuments(),
      Equipment.countDocuments({ status: "active" }),
      Equipment.countDocuments({ status: "under-repair" }),
    ]);
    return { total, active, underRepair };
  },
  attendance: async () => {
    const { start, end } = dayRange();
    const [total, present, absent] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: start, $lte: end } }),
      Attendance.countDocuments({ date: { $gte: start, $lte: end }, status: "present" }),
      Attendance.countDocuments({ date: { $gte: start, $lte: end }, status: "absent" }),
    ]);
    return { total, present, absent };
  },
  notifications: async () => {
    const [total, sent, failed] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ status: "sent" }),
      Notification.countDocuments({ status: "failed" }),
    ]);
    return { total, sent, failed };
  },
  reports: async () => {
    const [total, treatment, xray] = await Promise.all([
      (await import("../models/Report.js")).default.countDocuments(),
      (await import("../models/Report.js")).default.countDocuments({ type: "treatment-report" }),
      (await import("../models/Report.js")).default.countDocuments({ type: "xray" }),
    ]);
    return { total, treatment, xray };
  },
  procedures: async () => {
    const Procedure = (await import("../models/Procedure.js")).default;
    const [total, active, agg] = await Promise.all([
      Procedure.countDocuments(),
      Procedure.countDocuments({ status: "active" }),
      Procedure.aggregate([{ $group: { _id: null, avg: { $avg: "$charge" } } }]),
    ]);
    return { total, active, avgCharge: Math.round(agg[0]?.avg || 0) };
  },
  finance: async () => {
    const FixedCost = (await import("../models/FixedCost.js")).default;
    const Investment = (await import("../models/Investment.js")).default;
    const FinancialProfile = (await import("../models/FinancialProfile.js")).default;
    const [fixedAgg, invAgg, profiles] = await Promise.all([
      FixedCost.aggregate([{ $match: { status: "active" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Investment.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
      FinancialProfile.countDocuments(),
    ]);
    return { fixedCosts: fixedAgg[0]?.total || 0, investments: invAgg[0]?.total || 0, profiles };
  },
  "call-logs": async () => {
    const CallLog = (await import("../models/CallLog.js")).default;
    const { start, end } = dayRange();
    const [total, today, callback] = await Promise.all([
      CallLog.countDocuments(),
      CallLog.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      CallLog.countDocuments({ outcome: "callback" }),
    ]);
    return { total, today, callback };
  },
};

router.get(
  "/:resource",
  asyncHandler(async (req, res) => {
    const handler = HANDLERS[req.params.resource];
    if (!handler) return res.status(404).json({ message: "Unknown resource" });
    const stats = await handler();
    res.json(stats);
  })
);

export default router;
