const ADMIN = ["dental-admin", "admin"];
const CLINICAL = [...ADMIN, "doctor", "staff", "csa"];
const OPERATIONS = [...CLINICAL, "housekeeping", "security"];
const VENDOR_ROLE = ["vendor"];

export const MENU = [
  { section: "Overview" },
  { id: "dashboard", label: "Dashboard", icon: "📊", path: "/" },
  { section: "Organization", accountTypes: ["enterprise"] },
  { id: "enterprises", label: "Enterprises", icon: "🏛️", path: "/enterprises", roles: ADMIN, accountTypes: ["enterprise"] },
  { id: "branches", label: "Branches", icon: "🏢", path: "/branches", roles: ADMIN, accountTypes: ["enterprise"] },
  { section: "Management" },
  { id: "doctors", label: "Doctors", icon: "👨‍⚕️", path: "/doctors", roles: ADMIN },
  { id: "staff", label: "Staff", icon: "🧑‍💼", path: "/staff", roles: ADMIN },
  { id: "patients", label: "Patients", icon: "👥", path: "/patients", roles: CLINICAL },
  { section: "Operations" },
  { id: "appointments", label: "Appointments", icon: "📅", path: "/appointments", roles: CLINICAL },
  { id: "follow-ups", label: "Follow-ups", icon: "🔁", path: "/follow-ups", roles: CLINICAL },
  { id: "treatments", label: "Treatments", icon: "🦷", path: "/treatments", roles: CLINICAL },
  { id: "reports", label: "Reports", icon: "📋", path: "/reports", roles: CLINICAL },
  { id: "attendance", label: "Attendance", icon: "🕒", path: "/attendance", roles: [...ADMIN, "security"] },
  { section: "Finance" },
  { id: "billing", label: "Billing & Payments", icon: "💳", path: "/billing", roles: CLINICAL },
  { id: "estimates", label: "Estimates", icon: "🧾", path: "/estimates", roles: CLINICAL },
  { id: "finance", label: "Finance", icon: "💰", path: "/finance", roles: ADMIN },
  { id: "procedures", label: "Procedures", icon: "📝", path: "/procedures", roles: ADMIN },
  { section: "Inventory & Equipment" },
  { id: "vendors", label: "Vendors", icon: "🚚", path: "/vendors", roles: [...ADMIN, ...VENDOR_ROLE] },
  { id: "inventory", label: "Inventory", icon: "📦", path: "/inventory", roles: [...ADMIN, "housekeeping"] },
  { id: "equipment", label: "Equipment", icon: "🛠️", path: "/equipment", roles: [...ADMIN, "housekeeping"] },
  { section: "Communication" },
  { id: "notifications", label: "Notifications", icon: "🔔", path: "/notifications", roles: ADMIN },
  { id: "call-logs", label: "Call Logs", icon: "📞", path: "/call-logs", roles: CLINICAL },
  { section: "Portal" },
  { id: "patient-portal", label: "My Records", icon: "🩺", path: "/patient-portal", roles: ["patient"] },
  { id: "vendor-portal", label: "Vendor Portal", icon: "📦", path: "/vendor-portal", roles: VENDOR_ROLE },
];
