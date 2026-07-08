import { Router } from "express";
import Branch from "../models/Branch.js";
import Doctor from "../models/Doctor.js";
import Staff from "../models/Staff.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Invoice from "../models/Invoice.js";
import Treatment from "../models/Treatment.js";
import FollowUp from "../models/FollowUp.js";
import Attendance from "../models/Attendance.js";
import Equipment from "../models/Equipment.js";
import FixedCost from "../models/FixedCost.js";
import FinancialProfile from "../models/FinancialProfile.js";
import Procedure from "../models/Procedure.js";
import { asyncHandler } from "../controllers/crudController.js";

const router = Router();

function dayRange(d = new Date()) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function branchFilter(req) {
  const filter = {};
  if (req.query.branch) filter.branch = req.query.branch;
  if (req.query.enterprise) {
    const branches = await Branch.find({ enterprise: req.query.enterprise }).select("_id");
    filter.branch = { $in: branches.map((b) => b._id) };
  }
  return filter;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { start, end } = dayRange();
    const scope = await branchFilter(req);

    const apptFilter = { date: { $gte: start, $lte: end }, ...scope };
    const invoiceFilter = { date: { $gte: start, $lte: end }, ...scope };
    const attendanceFilter = { date: { $gte: start, $lte: end }, ...scope };

    const [
      branches,
      doctors,
      staff,
      patients,
      todayAppointments,
      pendingTreatments,
      revenueAgg,
      upcoming,
      branchAgg,
      followUpsUpcoming,
      followUpsMissed,
      missedAppointments,
      scheduledAppts,
      repairAgg,
      fixedCostAgg,
      financialProfiles,
    ] = await Promise.all([
      Branch.countDocuments(req.query.enterprise ? { enterprise: req.query.enterprise } : {}),
      Doctor.countDocuments(scope.branch ? { branch: scope.branch } : {}),
      Staff.countDocuments(scope.branch ? { branch: scope.branch } : {}),
      Patient.countDocuments(scope.branch ? { branch: scope.branch } : {}),
      Appointment.countDocuments(apptFilter),
      Treatment.countDocuments({ status: { $in: ["planned", "ongoing"] }, ...scope }),
      Invoice.aggregate([
        { $match: invoiceFilter },
        { $group: { _id: null, total: { $sum: "$paid" } } },
      ]),
      Appointment.find({ date: { $gte: start }, ...scope })
        .sort("date time")
        .limit(6)
        .populate("patient", "name phone")
        .populate("doctor", "name")
        .populate("branch", "name"),
      Appointment.aggregate([
        { $match: apptFilter },
        { $group: { _id: "$branch", appts: { $sum: 1 } } },
      ]),
      FollowUp.countDocuments({ status: "pending", dueDate: { $gte: start }, ...scope }),
      FollowUp.countDocuments({ status: "pending", dueDate: { $lt: start }, ...scope }),
      Appointment.countDocuments({ status: "no-show", date: { $gte: start, $lte: end }, ...scope }),
      Appointment.find({
        date: { $gte: start, $lte: end },
        status: { $in: ["scheduled", "confirmed"] },
        ...scope,
      }).populate("doctor", "consultationFee"),
      Equipment.aggregate([
        { $match: scope.branch ? { branch: scope.branch } : {} },
        { $group: { _id: null, total: { $sum: "$repairCost" } } },
      ]),
      FixedCost.aggregate([
        { $match: { status: "active", ...(scope.branch ? { branch: scope.branch } : {}) } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      FinancialProfile.find(scope.branch ? { branch: scope.branch } : {}).populate("branch", "name"),
    ]);

    const staffPresent = await Attendance.countDocuments({ ...attendanceFilter, status: "present" });

    const defaultProcedureFee = await Procedure.findOne({ status: "active" }).sort("charge");
    const avgFee =
      scheduledAppts.reduce((s, a) => s + (a.doctor?.consultationFee || defaultProcedureFee?.charge || 500), 0) ||
      0;
    const projectedRevenue = scheduledAppts.reduce(
      (s, a) => s + (a.doctor?.consultationFee || defaultProcedureFee?.charge || 500),
      0
    );

    const feesCollection = revenueAgg[0]?.total || 0;
    const repairMaintenance = repairAgg[0]?.total || 0;
    const fixedCosts = fixedCostAgg[0]?.total || 0;
    const openingCapital = financialProfiles.reduce((s, p) => s + (p.openingCapital || 0), 0);
    const workingCapital = feesCollection - fixedCosts - repairMaintenance + openingCapital * 0.01;

    const branchDocs = await Branch.find(req.query.enterprise ? { enterprise: req.query.enterprise } : {}).select("name");
    const branchRevenue = await Invoice.aggregate([
      { $match: invoiceFilter },
      { $group: { _id: "$branch", revenue: { $sum: "$paid" } } },
    ]);
    const apptMap = Object.fromEntries(branchAgg.map((b) => [String(b._id), b.appts]));
    const revMap = Object.fromEntries(branchRevenue.map((b) => [String(b._id), b.revenue]));
    const branchwise = branchDocs.map((b) => ({
      id: b._id,
      name: b.name,
      appts: apptMap[String(b._id)] || 0,
      revenue: revMap[String(b._id)] || 0,
    }));

    res.json({
      stats: {
        branches,
        doctors,
        staff,
        patients,
        todayAppointments,
        pendingTreatments,
        todayRevenue: feesCollection,
        projectedRevenue,
        feesCollection,
        workingCapital: Math.round(workingCapital),
        repairMaintenance,
        fixedCosts,
        followUpsUpcoming,
        followUpsMissed,
        missedAppointments,
        staffPresent,
        avgFee: scheduledAppts.length ? Math.round(avgFee / scheduledAppts.length) : 0,
      },
      upcoming,
      branchwise,
      financialProfiles,
    });
  })
);

export default router;
