import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Protected from './components/Protected.jsx';
import Brandmark from './components/Brandmark.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Intake from './pages/Intake.jsx';
import Chat from './pages/Chat.jsx';
import ResumeBuilder from './pages/ResumeBuilder.jsx';
import Trends from './pages/Trends.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  const { booting } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <div className="boot-screen">
        <Brandmark size={56} className="boot-logo" />
        <p>Loading SkillForge AI…</p>
      </div>
    );
  }

  return (
    <Routes location={location}>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/intake"
          element={
            <Protected>
              <Intake />
            </Protected>
          }
        />
        <Route
          path="/chat"
          element={
            <Protected>
              <Chat />
            </Protected>
          }
        />
        <Route
          path="/resume"
          element={
            <Protected>
              <ResumeBuilder />
            </Protected>
          }
        />
        <Route
          path="/trends"
          element={
            <Protected>
              <Trends />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />
        <Route
          path="/admin"
          element={
            <Protected adminOnly>
              <Admin />
            </Protected>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export function GuestOnly({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}