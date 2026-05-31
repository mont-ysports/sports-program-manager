import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Confirmation from './pages/Confirmation.jsx';
import ParentDashboard from './pages/ParentDashboard.jsx';
import CheckIn from './pages/CheckIn.jsx';
import StaffPortal from './pages/StaffPortal.jsx';
import StaffLogin from './pages/StaffLogin.jsx';
import NotFound from './pages/NotFound.jsx';
import { StaffAuthProvider } from './hooks/useStaffAuth.jsx';

export default function App() {
  return (
    <StaffAuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="register" element={<Register />} />
          <Route path="confirmation/:registrationId" element={<Confirmation />} />
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="checkin" element={<CheckIn />} />
          <Route path="staff/login" element={<StaffLogin />} />
          <Route path="staff" element={<StaffPortal />} />
          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </StaffAuthProvider>
  );
}
