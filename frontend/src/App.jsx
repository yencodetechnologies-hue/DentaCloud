import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Branches from "./pages/Branches.jsx";
import Doctors from "./pages/Doctors.jsx";
import Staff from "./pages/Staff.jsx";
import Patients from "./pages/Patients.jsx";
import Appointments from "./pages/Appointments.jsx";
import Treatments from "./pages/Treatments.jsx";
import Billing from "./pages/Billing.jsx";
import Estimates from "./pages/Estimates.jsx";
import FollowUps from "./pages/FollowUps.jsx";
import Vendors from "./pages/Vendors.jsx";
import Inventory from "./pages/Inventory.jsx";
import Equipment from "./pages/Equipment.jsx";
import Attendance from "./pages/Attendance.jsx";
import Notifications from "./pages/Notifications.jsx";

const ADMIN = ["dental-admin", "admin"];

function Protected({ children, allow }) {
  const { isAuthed, user } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { isAuthed } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthed ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/branches" element={<Protected allow={ADMIN}><Branches /></Protected>} />
        <Route path="/doctors" element={<Protected allow={ADMIN}><Doctors /></Protected>} />
        <Route path="/staff" element={<Protected allow={ADMIN}><Staff /></Protected>} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/follow-ups" element={<FollowUps />} />
        <Route path="/treatments" element={<Treatments />} />
        <Route path="/attendance" element={<Protected allow={ADMIN}><Attendance /></Protected>} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/estimates" element={<Estimates />} />
        <Route path="/vendors" element={<Protected allow={ADMIN}><Vendors /></Protected>} />
        <Route path="/inventory" element={<Protected allow={ADMIN}><Inventory /></Protected>} />
        <Route path="/equipment" element={<Protected allow={ADMIN}><Equipment /></Protected>} />
        <Route path="/notifications" element={<Protected allow={ADMIN}><Notifications /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
