import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Enterprises from "./pages/Enterprises.jsx";
import Branches from "./pages/Branches.jsx";
import Doctors from "./pages/Doctors.jsx";
import Staff from "./pages/Staff.jsx";
import Patients from "./pages/Patients.jsx";
import Appointments from "./pages/Appointments.jsx";
import Treatments from "./pages/Treatments.jsx";
import Billing from "./pages/Billing.jsx";
import Estimates from "./pages/Estimates.jsx";
import FollowUps from "./pages/FollowUps.jsx";
import Reports from "./pages/Reports.jsx";
import Finance from "./pages/Finance.jsx";
import Procedures from "./pages/Procedures.jsx";
import Vendors from "./pages/Vendors.jsx";
import Inventory from "./pages/Inventory.jsx";
import Equipment from "./pages/Equipment.jsx";
import Attendance from "./pages/Attendance.jsx";
import Notifications from "./pages/Notifications.jsx";
import CallLogs from "./pages/CallLogs.jsx";
import PatientPortal from "./pages/PatientPortal.jsx";
import VendorPortal from "./pages/VendorPortal.jsx";

const ADMIN = ["dental-admin", "admin"];
const CLINICAL = [...ADMIN, "doctor", "staff", "csa"];

function Protected({ children, allow, accountTypes }) {
  const { isAuthed, user } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user?.role)) return <Navigate to="/" replace />;
  if (accountTypes && !accountTypes.includes(user?.accountType || "clinic")) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { isAuthed } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthed ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthed ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={isAuthed ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
      <Route path="/reset-password" element={isAuthed ? <Navigate to="/" replace /> : <ResetPasswordPage />} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/enterprises" element={<Protected allow={ADMIN} accountTypes={["enterprise"]}><Enterprises /></Protected>} />
        <Route path="/branches" element={<Protected allow={ADMIN} accountTypes={["enterprise"]}><Branches /></Protected>} />
        <Route path="/doctors" element={<Protected allow={ADMIN}><Doctors /></Protected>} />
        <Route path="/staff" element={<Protected allow={ADMIN}><Staff /></Protected>} />
        <Route path="/patients" element={<Protected allow={CLINICAL}><Patients /></Protected>} />
        <Route path="/appointments" element={<Protected allow={CLINICAL}><Appointments /></Protected>} />
        <Route path="/follow-ups" element={<Protected allow={CLINICAL}><FollowUps /></Protected>} />
        <Route path="/treatments" element={<Protected allow={CLINICAL}><Treatments /></Protected>} />
        <Route path="/reports" element={<Protected allow={CLINICAL}><Reports /></Protected>} />
        <Route path="/attendance" element={<Protected allow={[...ADMIN, "security"]}><Attendance /></Protected>} />
        <Route path="/billing" element={<Protected allow={CLINICAL}><Billing /></Protected>} />
        <Route path="/estimates" element={<Protected allow={CLINICAL}><Estimates /></Protected>} />
        <Route path="/finance" element={<Protected allow={ADMIN}><Finance /></Protected>} />
        <Route path="/procedures" element={<Protected allow={ADMIN}><Procedures /></Protected>} />
        <Route path="/vendors" element={<Protected allow={[...ADMIN, "vendor"]}><Vendors /></Protected>} />
        <Route path="/inventory" element={<Protected allow={[...ADMIN, "housekeeping"]}><Inventory /></Protected>} />
        <Route path="/equipment" element={<Protected allow={[...ADMIN, "housekeeping"]}><Equipment /></Protected>} />
        <Route path="/notifications" element={<Protected allow={ADMIN}><Notifications /></Protected>} />
        <Route path="/call-logs" element={<Protected allow={CLINICAL}><CallLogs /></Protected>} />
        <Route path="/patient-portal" element={<Protected allow={["patient"]}><PatientPortal /></Protected>} />
        <Route path="/vendor-portal" element={<Protected allow={["vendor"]}><VendorPortal /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
