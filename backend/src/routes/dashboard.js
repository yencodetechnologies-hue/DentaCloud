import { Router } from "express";
import Branch from "../models/Branch.js";
import Doctor from "../models/Doctor.js";
import Staff from "../models/Staff.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Invoice from "../models/Invoice.js";
import Treatment from "../models/Treatment.js";
import { asyncHandler } from "../controllers/crudController.js";

const router = Router();

function dayRange(d = new Date()) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { start, end } = dayRange();

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
    ] = await Promise.all([
      Branch.countDocuments(),
      Doctor.countDocuments(),
      Staff.countDocuments(),
      Patient.countDocuments(),
      Appointment.countDocuments({ date: { $gte: start, $lte: end } }),
      Treatment.countDocuments({ status: { $in: ["planned", "ongoing"] } }),
      Invoice.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$paid" } } },
      ]),
      Appointment.find({ date: { $gte: start } })
        .sort("date time")
        .limit(6)
        .populate("patient", "name")
        .populate("doctor", "name")
        .populate("branch", "name"),
      Appointment.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: "$branch", appts: { $sum: 1 } } },
      ]),
    ]);

    // build branch-wise breakdown with names + today's revenue
    const branchDocs = await Branch.find().select("name");
    const branchRevenue = await Invoice.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
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
        todayRevenue: revenueAgg[0]?.total || 0,
      },
      upcoming,
      branchwise,
    });
  })
);

export default router;
