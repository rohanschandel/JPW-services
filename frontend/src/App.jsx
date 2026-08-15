import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import TodosPage from './pages/TodosPage';

import AiDirectory from './pages/AiDirectory';
import ExamsTracker from './pages/ExamsTracker';
import Projects from './pages/Projects';
import HrDirectory from './pages/HrDirectory';
import Workspace from './pages/Workspace';
import JobPortal from './pages/JobPortal';

// Route Guard for Protected Pages
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('jpw_token');
  return token ? children : <Navigate to="/auth" replace />;
};

// Component to manage System vs Manual Theme
function ThemeHandler() {
  const location = useLocation();

  useEffect(() => {
    const isPublicPage = location.pathname === '/' || location.pathname === '/auth';

    const applySystemTheme = () => {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isSystemDark ? 'dark' : 'light');
    };

    if (isPublicPage) {
      // 1. Landing & Auth pages adhere strictly to system / Chrome appearance
      applySystemTheme();

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleThemeChange = (e) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleThemeChange);
      return () => mediaQuery.removeEventListener('change', handleThemeChange);
    } else {
      // 2. Protected App pages use user-selected theme or fallback to dark
      const savedTheme = localStorage.getItem('jpw_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ThemeHandler />
      <Routes>
        {/* Public Routes (Auto System Theme) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected Dashboard & App Modules */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/todos" element={<ProtectedRoute><TodosPage /></ProtectedRoute>} />
       
        <Route path="/ai-directory" element={<ProtectedRoute><AiDirectory /></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute><ExamsTracker /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/hr-directory" element={<ProtectedRoute><HrDirectory /></ProtectedRoute>} />
        <Route path="/workspace" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
        <Route path="/jobportal" element={<JobPortal />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;