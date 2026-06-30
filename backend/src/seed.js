import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Branch from "./models/Branch.js";
import Doctor from "./models/Doctor.js";
import Staff from "./models/Staff.js";
import Patient from "./models/Patient.js";
import Appointment from "./models/Appointment.js";
import Invoice from "./models/Invoice.js";
import Treatment from "./models/Treatment.js";
import Counter from "./models/Counter.js";

function daysFromNow(n, hour = 10, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, min, 0, 0);
  return d;
}

async function run() {
  await connectDB();
  console.log("[seed] clearing collections...");
  await Promise.all([
    User.deleteMany({}),
    Branch.deleteMany({}),
    Doctor.deleteMany({}),
    Staff.deleteMany({}),
    Patient.deleteMany({}),
    Appointment.deleteMany({}),
    Invoice.deleteMany({}),
    Treatment.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  console.log("[seed] creating admin user...");
  await User.create({
    name: "Prabhu Raj",
    email: "admin@evident.com",
    password: "admin123",
    role: "dental-admin",
    avatar: "PR",
  });
  await User.create({ name: "Dr. Anitha Suresh", email: "doctor@evident.com", password: "doctor123", role: "doctor" });
  await User.create({ name: "Front Desk", email: "staff@evident.com", password: "staff123", role: "staff" });

  console.log("[seed] creating branches...");
  const branches = await Branch.create([
    { name: "Adyar HQ", code: "ADY", city: "Chennai", address: "12 Sardar Patel Rd, Adyar", phone: "+91 44 2440 1100", email: "adyar@evident.com", manager: "Kavya Nair", status: "active" },
    { name: "Velachery", code: "VLC", city: "Chennai", address: "88 Velachery Main Rd", phone: "+91 44 2255 3300", email: "velachery@evident.com", manager: "Rahul Menon", status: "active" },
    { name: "OMR", code: "OMR", city: "Chennai", address: "200 Rajiv Gandhi Salai", phone: "+91 44 6677 8800", email: "omr@evident.com", manager: "Sneha Pillai", status: "active" },
    { name: "Anna Nagar", code: "ANR", city: "Chennai", address: "5 2nd Ave, Anna Nagar", phone: "+91 44 2626 4400", email: "annanagar@evident.com", manager: "Vivek Rao", status: "active" },
  ]);
  const [adyar, velachery, omr, annanagar] = branches;

  console.log("[seed] creating doctors...");
  const doctors = await Doctor.create([
    { name: "Dr. Anitha Suresh", specialization: "Endodontist", email: "anitha@evident.com", phone: "+91 90000 11111", qualification: "BDS, MDS", experience: 12, consultationFee: 800, branch: adyar._id, status: "active" },
    { name: "Dr. Vivek Iyer", specialization: "Orthodontist", email: "vivek@evident.com", phone: "+91 90000 22222", qualification: "BDS, MDS", experience: 9, consultationFee: 700, branch: velachery._id, status: "active" },
    { name: "Dr. Faisal Rahman", specialization: "General Dentist", email: "faisal@evident.com", phone: "+91 90000 33333", qualification: "BDS", experience: 6, consultationFee: 500, branch: omr._id, status: "active" },
    { name: "Dr. Meera Krishnan", specialization: "Periodontist", email: "meera@evident.com", phone: "+91 90000 44444", qualification: "BDS, MDS", experience: 14, consultationFee: 900, branch: annanagar._id, status: "active" },
  ]);
  const [anitha, vivek, faisal] = doctors;

  console.log("[seed] creating staff...");
  await Staff.create([
    { name: "Lakshmi R", role: "Receptionist", email: "lakshmi@evident.com", phone: "+91 80000 11111", shift: "morning", salary: 22000, branch: adyar._id },
    { name: "Suresh B", role: "Dental Assistant", email: "suresh@evident.com", phone: "+91 80000 22222", shift: "full-day", salary: 28000, branch: velachery._id },
    { name: "Divya P", role: "Lab Technician", email: "divya@evident.com", phone: "+91 80000 33333", shift: "evening", salary: 30000, branch: omr._id },
    { name: "Karthik V", role: "Accountant", email: "karthik@evident.com", phone: "+91 80000 44444", shift: "morning", salary: 35000, branch: annanagar._id },
  ]);

  console.log("[seed] creating patients...");
  const patients = await Patient.create([
    { name: "Ravi Kumar", age: 34, gender: "male", phone: "+91 98400 10001", email: "ravi@example.com", address: { street: "Adyar", city: "Chennai" }, bloodGroup: "O+", medical: { bloodPressure: true }, branch: adyar._id },
    { name: "Sara Mathew", age: 28, gender: "female", phone: "+91 98400 10002", email: "sara@example.com", address: { street: "Velachery", city: "Chennai" }, bloodGroup: "B+", branch: velachery._id },
    { name: "Joseph Paul", age: 45, gender: "male", phone: "+91 98400 10003", email: "joseph@example.com", address: { street: "Adyar", city: "Chennai" }, bloodGroup: "A+", medical: { diabetes: true }, branch: adyar._id },
    { name: "Nila Thomas", age: 31, gender: "female", phone: "+91 98400 10004", email: "nila@example.com", address: { street: "OMR", city: "Chennai" }, bloodGroup: "AB+", branch: omr._id },
    { name: "Arjun K", age: 19, gender: "male", phone: "+91 98400 10005", email: "arjun@example.com", address: { street: "Velachery", city: "Chennai" }, bloodGroup: "O-", previousTreatment: true, ongoingProblem: "Braces", branch: velachery._id },
  ]);
  const [ravi, sara, joseph, nila, arjun] = patients;

  console.log("[seed] creating appointments...");
  await Appointment.create([
    { patient: ravi._id, doctor: anitha._id, branch: adyar._id, date: daysFromNow(0, 10, 30), time: "10:30 AM", treatment: "Root Canal (Tooth #36)", status: "confirmed" },
    { patient: sara._id, doctor: vivek._id, branch: velachery._id, date: daysFromNow(0, 11, 0), time: "11:00 AM", treatment: "Scaling & Polishing", status: "confirmed" },
    { patient: joseph._id, doctor: anitha._id, branch: adyar._id, date: daysFromNow(0, 12, 15), time: "12:15 PM", treatment: "Crown Fitting", status: "scheduled" },
    { patient: nila._id, doctor: faisal._id, branch: omr._id, date: daysFromNow(0, 14, 0), time: "2:00 PM", treatment: "Consultation", status: "confirmed" },
    { patient: arjun._id, doctor: vivek._id, branch: velachery._id, date: daysFromNow(1, 15, 45), time: "3:45 PM", treatment: "Braces Adjustment", status: "scheduled" },
    { patient: ravi._id, doctor: anitha._id, branch: adyar._id, date: daysFromNow(-2, 9, 0), time: "9:00 AM", treatment: "Filling", status: "completed" },
  ]);

  console.log("[seed] creating invoices...");
  await Invoice.create([
    { invoiceNo: "INV-" + new Date().getFullYear() + "-0001", patient: ravi._id, branch: adyar._id, date: new Date(), items: [{ description: "Root Canal", qty: 1, price: 6000 }, { description: "X-Ray", qty: 1, price: 500 }], tax: 0, discount: 500, paid: 6000, paymentMethod: "card" },
    { invoiceNo: "INV-" + new Date().getFullYear() + "-0002", patient: sara._id, branch: velachery._id, date: new Date(), items: [{ description: "Scaling & Polishing", qty: 1, price: 2500 }], tax: 0, discount: 0, paid: 2500, paymentMethod: "upi" },
    { invoiceNo: "INV-" + new Date().getFullYear() + "-0003", patient: joseph._id, branch: adyar._id, date: new Date(), items: [{ description: "Crown", qty: 1, price: 8000 }], tax: 0, discount: 0, paid: 4000, paymentMethod: "cash" },
  ]);

  console.log("[seed] creating treatments...");
  await Treatment.create([
    { name: "Root Canal Therapy", patient: ravi._id, doctor: anitha._id, branch: adyar._id, category: "Endodontics", toothNumber: "36", cost: 6000, sessions: 3, status: "ongoing", notes: "2 of 3 sessions done" },
    { name: "Scaling & Polishing", patient: sara._id, doctor: vivek._id, branch: velachery._id, category: "Periodontics", toothNumber: "Full", cost: 2500, sessions: 1, status: "completed" },
    { name: "Dental Crown", patient: joseph._id, doctor: anitha._id, branch: adyar._id, category: "Prosthodontics", toothNumber: "24", cost: 8000, sessions: 2, status: "planned" },
    { name: "Braces (Metal)", patient: arjun._id, doctor: vivek._id, branch: velachery._id, category: "Orthodontics", toothNumber: "Full", cost: 45000, sessions: 12, status: "ongoing", notes: "Monthly adjustment" },
    { name: "Teeth Whitening", patient: nila._id, doctor: faisal._id, branch: omr._id, category: "Cosmetic", toothNumber: "Front", cost: 7000, sessions: 1, status: "planned" },
  ]);

  console.log("\n[seed] done. Demo login:");
  console.log("  Admin  -> admin@evident.com / admin123");
  console.log("  Doctor -> doctor@evident.com / doctor123");
  console.log("  Staff  -> staff@evident.com / staff123");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed] error:", err);
  process.exit(1);
});
