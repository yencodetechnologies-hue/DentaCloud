const ADMIN = ["dental-admin", "admin"];
const CLINICAL = [...ADMIN, "doctor", "staff", "csa"];

export const MENU = [
  { section: "Overview" },
  { id: "dashboard", label: "Dashboard", icon: "📊", path: "/" },
  { section: "Management" },
  { id: "branches", label: "Branches", icon: "🏢", path: "/branches", roles: ADMIN },
  { id: "doctors", label: "Doctors", icon: "👨‍⚕️", path: "/doctors", roles: ADMIN },
  { id: "staff", label: "Staff", icon: "🧑‍💼", path: "/staff", roles: ADMIN },
  { id: "patients", label: "Patients", icon: "👥", path: "/patients", roles: CLINICAL },
  { section: "Operations" },
  { id: "appointments", label: "Appointments", icon: "📅", path: "/appointments", roles: CLINICAL },
  { id: "follow-ups", label: "Follow-ups", icon: "🔁", path: "/follow-ups", roles: CLINICAL },
  { id: "treatments", label: "Treatments", icon: "🦷", path: "/treatments", roles: CLINICAL },
  { id: "attendance", label: "Attendance", icon: "🕒", path: "/attendance", roles: ADMIN },
  { section: "Finance" },
  { id: "billing", label: "Billing & Payments", icon: "💳", path: "/billing", roles: CLINICAL },
  { id: "estimates", label: "Estimates", icon: "🧾", path: "/estimates", roles: CLINICAL },
  { section: "Inventory & Equipment" },
  { id: "vendors", label: "Vendors", icon: "🚚", path: "/vendors", roles: ADMIN },
  { id: "inventory", label: "Inventory", icon: "📦", path: "/inventory", roles: ADMIN },
  { id: "equipment", label: "Equipment", icon: "🛠️", path: "/equipment", roles: ADMIN },
  { section: "Communication" },
  { id: "notifications", label: "Notifications", icon: "🔔", path: "/notifications", roles: ADMIN },
];
