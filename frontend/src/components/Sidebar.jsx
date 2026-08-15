import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Bookmark,
  Bot,
  Calendar,
  FolderGit2,
  Users,
  Edit3,
  LogOut,
  Layers,
  Sun,
  Moon,
  Briefcase
} from 'lucide-react';
import './sidebar.css';

export default function Sidebar({ isOpen }) {
  const navigate = useNavigate();

  // 1. Detect saved theme or fallback strictly to device/Chrome preference
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('jpw_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jpw_theme', theme);
  }, [theme]);

  // 2. Listen to system preference changes dynamically
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      if (!localStorage.getItem('jpw_theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = () => {
    localStorage.removeItem('jpw_token');
    localStorage.removeItem('jpw_user');
    navigate('/auth');
  };

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <Layers size={22} color="#3b82f6" />
        <span>JPW<span>-services</span></span>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/todos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CheckSquare size={18} /> <span>To-Dos & Tasks</span>
        </NavLink>

        <NavLink to="/ai-directory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Bot size={18} /> <span>AI Tools Hub</span>
        </NavLink>
        <NavLink to="/JobPortal" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Edit3 size={18} /> <span>JobPortal</span>
        </NavLink>
        <NavLink to="/hr-directory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={18} /> <span>HR Contacts</span>
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FolderGit2 size={18} /> <span>Project Links</span>
        </NavLink>
        <NavLink to="/exams" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Calendar size={18} /> <span>Exams & Deadlines</span>
        </NavLink>
        <NavLink to="/workspace" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Edit3 size={18} /> <span>Workspace</span>
        </NavLink>

      </nav>

      {/* Theme Switcher & User Logout Section */}
      <div className="sidebar-footer">
        <button onClick={toggleTheme} className="theme-toggle-btn">
          {theme === 'dark' ? (
            <>
              <Sun size={16} color="#f59e0b" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={16} color="#6366f1" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={16} /> <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}