import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Staff from "../models/Staff.js";
import Appointment from "../models/Appointment.js";

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toIsoDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function parseDatePhrase(phrase) {
  const clean = normalize(phrase);
  const now = new Date();
  if (!clean || clean.includes("today")) return toIsoDate(now);
  if (clean.includes("tomorrow")) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return toIsoDate(d);
  }
  if (clean.includes("day after tomorrow")) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return toIsoDate(d);
  }
  const dmy = clean.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (dmy) {
    const dd = Number(dmy[1]);
    const mm = Number(dmy[2]);
    const yy = Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]);
    return toIsoDate(new Date(yy, mm - 1, dd));
  }
  return toIsoDate(clean);
}

async function resolveByName(Model, search, branchId) {
  const filter = { ...(branchId ? { branch: branchId } : {}) };
  const rx = new RegExp(String(search || "").trim(), "i");
  filter.$or = [{ name: rx }, { firstName: rx }, { lastName: rx }];
  const rows = await Model.find(filter).limit(10).sort("-createdAt");
  if (!rows.length) return null;
  const exact = rows.find((r) => normalize(r.name) === normalize(search));
  return exact || rows[0];
}

export const TOOL_DECLARATIONS = [
  {
    name: "navigate_page",
    description: "Navigate the user to a page in the dental admin panel.",
    parameters: {
      type: "object",
      properties: {
        page: {
          type: "string",
          enum: [
            "dashboard",
            "doctors",
            "staff",
            "patients",
            "appointments",
            "billing",
            "follow-ups",
            "reports",
            "treatments",
            "notifications",
          ],
        },
      },
      required: ["page"],
    },
  },
  {
    name: "add_patient",
    description: "Create a new patient after collecting all details. Only call when name, phone, and gender are known and user confirmed.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        gender: { type: "string", enum: ["male", "female", "other"] },
        email: { type: "string" },
        address: { type: "string" },
      },
      required: ["name", "phone", "gender"],
    },
  },
  {
    name: "add_staff",
    description: "Create a new staff member after collecting details and user confirmed.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        gender: { type: "string", enum: ["male", "female", "other"] },
        email: { type: "string" },
        role: { type: "string", description: "Admin, CSA, Housekeeping, Security, or custom role" },
      },
      required: ["name"],
    },
  },
  {
    name: "add_doctor",
    description: "Create a new doctor after collecting details one by one and user confirmed. Prefer asking each field separately before calling.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        gender: { type: "string", enum: ["male", "female", "other"] },
        dob: { type: "string", description: "YYYY-MM-DD" },
        address: { type: "string" },
        specialization: { type: "string" },
        qualification: { type: "string" },
      },
      required: ["name", "phone", "gender"],
    },
  },
  {
    name: "book_appointment",
    description: "Book an appointment for a patient with a doctor.",
    parameters: {
      type: "object",
      properties: {
        patientName: { type: "string" },
        doctorName: { type: "string" },
        date: { type: "string", description: "Date like today, tomorrow, or YYYY-MM-DD" },
        time: { type: "string" },
        treatment: { type: "string" },
      },
      required: ["patientName", "doctorName", "date"],
    },
  },
  {
    name: "search_records",
    description: "Search patients, doctors, or staff by name or phone.",
    parameters: {
      type: "object",
      properties: {
        resource: { type: "string", enum: ["patients", "doctors", "staff", "appointments"] },
        query: { type: "string" },
      },
      required: ["resource", "query"],
    },
  },
];

const WRITE_TOOLS = new Set(["add_patient", "add_staff", "add_doctor", "book_appointment"]);

export function toolNeedsConfirmation(name) {
  return WRITE_TOOLS.has(name);
}

export async function executeTool(name, params, req) {
  const branchId = req.tenant?.branchId || "";
  if (!branchId && ["add_patient", "add_staff", "add_doctor", "book_appointment", "search_records"].includes(name)) {
    throw new Error("Active clinic branch is required. Please select a branch first.");
  }

  switch (name) {
    case "navigate_page": {
      const routes = {
        dashboard: "/",
        doctors: "/doctors",
        staff: "/staff",
        patients: "/patients",
        appointments: "/appointments",
        billing: "/billing",
        "follow-ups": "/follow-ups",
        reports: "/reports",
        treatments: "/treatments",
        notifications: "/notifications",
      };
      const path = routes[params.page];
      if (!path) throw new Error(`Unknown page: ${params.page}`);
      return { success: true, navigateTo: path, message: `Opened ${params.page} page.` };
    }

    case "add_patient": {
      const created = await Patient.create({
        name: params.name,
        phone: String(params.phone).replace(/[^\d]/g, ""),
        gender: params.gender,
        email: params.email || undefined,
        address: params.address ? { street: params.address } : undefined,
        status: "active",
        branch: branchId,
      });
      return { success: true, navigateTo: "/patients", message: `Patient ${created.name} added successfully.`, id: created._id };
    }

    case "add_staff": {
      const created = await Staff.create({
        name: params.name,
        phone: params.phone ? String(params.phone).replace(/[^\d]/g, "") : undefined,
        email: params.email || undefined,
        gender: params.gender || undefined,
        role: params.role || "Admin",
        designation: params.role || "Admin",
        status: "active",
        branch: branchId,
      });
      return { success: true, navigateTo: "/staff", message: `Staff ${created.name} added successfully.`, id: created._id };
    }

    case "add_doctor": {
      const parts = String(params.name || "").trim().split(/\s+/);
      const firstName = parts[0] || params.name;
      const lastName = parts.slice(1).join(" ");
      const created = await Doctor.create({
        name: params.name,
        titlePrefix: "Dr.",
        firstName,
        lastName: lastName || undefined,
        phone: params.phone ? String(params.phone).replace(/[^\d]/g, "") : undefined,
        email: params.email || undefined,
        gender: params.gender || undefined,
        dob: params.dob || undefined,
        address1: params.address || undefined,
        specialization: params.specialization || undefined,
        qualification: params.qualification || undefined,
        status: "active",
        branch: branchId,
      });
      return { success: true, navigateTo: "/doctors", message: `Doctor ${created.name} added successfully.`, id: created._id };
    }

    case "book_appointment": {
      const patient = await resolveByName(Patient, params.patientName, branchId);
      if (!patient) throw new Error(`Patient not found: ${params.patientName}`);
      const doctor = await resolveByName(Doctor, params.doctorName, branchId);
      if (!doctor) throw new Error(`Doctor not found: ${params.doctorName}`);

      const created = await Appointment.create({
        patient: patient._id,
        doctor: doctor._id,
        branch: branchId,
        date: parseDatePhrase(params.date),
        time: params.time || "",
        treatment: params.treatment || "",
        status: "scheduled",
      });
      return {
        success: true,
        navigateTo: "/appointments",
        message: `Appointment booked for ${patient.name} with Dr. ${doctor.name}.`,
        id: created._id,
      };
    }

    case "search_records": {
      const models = { patients: Patient, doctors: Doctor, staff: Staff, appointments: Appointment };
      const Model = models[params.resource];
      if (!Model) throw new Error(`Unknown resource: ${params.resource}`);

      const filter = { ...(branchId ? { branch: branchId } : {}) };
      const rx = new RegExp(String(params.query || "").trim(), "i");
      if (params.resource === "appointments") {
        filter.$or = [{ treatment: rx }, { time: rx }, { status: rx }];
      } else {
        filter.$or = [{ name: rx }, { firstName: rx }, { lastName: rx }, { phone: rx }];
      }

      const rows = await Model.find(filter).limit(5).sort("-createdAt");
      const summary = rows.map((r) => {
        if (params.resource === "appointments") {
          return `Appointment on ${r.date?.toISOString?.().slice(0, 10) || "-"} at ${r.time || "-"}`;
        }
        return `${r.name}${r.phone ? ` (${r.phone})` : ""}`;
      });
      return {
        success: true,
        message: summary.length ? `Found: ${summary.join("; ")}` : "No matching records found.",
        results: summary,
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
