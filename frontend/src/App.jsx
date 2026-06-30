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

function Protected({ children }) {
  const { isAuthed } = useAuth();
  return isAuthed ? children : <Navigate to="/login" replace />;
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
        <Route path="/branches" element={<Branches />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/treatments" element={<Treatments />} />
        <Route path="/billing" element={<Billing />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
