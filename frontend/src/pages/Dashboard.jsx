import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { Sparkles, Calendar, Bookmark, Users, FolderGit2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('jpw_user')) || { full_name: 'Developer' };

  const quotes = [
    '“First, solve the problem. Then, write the code.” – John Johnson',
    '“Focus is a muscle. The more you practice it, the stronger it becomes.”',
    '“Small daily disciplines lead to massive long-term achievements.”'
  ];
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  const [exams, setExams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [hrCount, setHrCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [exRes, asRes, bmRes, prRes, hrRes] = await Promise.all([
          API.get('/exams/').catch(() => ({ data: [] })),
          API.get('/assignments/').catch(() => ({ data: [] })),
          API.get('/bookmarks/').catch(() => ({ data: [] })),
          API.get('/projects/').catch(() => ({ data: [] })),
          API.get('/hr/').catch(() => ({ data: [] }))
        ]);

        // Safe extraction ensuring it is always an Array
        const safeEx = Array.isArray(exRes?.data) ? exRes.data : Array.isArray(exRes) ? exRes : [];
        const safeAs = Array.isArray(asRes?.data) ? asRes.data : Array.isArray(asRes) ? asRes : [];
        const safeBm = Array.isArray(bmRes?.data) ? bmRes.data : Array.isArray(bmRes) ? bmRes : [];
        const safePr = Array.isArray(prRes?.data) ? prRes.data : Array.isArray(prRes) ? prRes : [];
        const safeHr = Array.isArray(hrRes?.data) ? hrRes.data : Array.isArray(hrRes) ? hrRes : [];

        setExams(safeEx);
        setAssignments(safeAs);
        setBookmarksCount(safeBm.length);
        setProjectsCount(safePr.length);
        setHrCount(safeHr.length);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
        setExams([]);
        setAssignments([]);
      }
    };
    fetchDashboardData();
  }, []);

  // Calculate Days Remaining
  const getDaysLeft = (targetDateStr) => {
    if (!targetDateStr) return 999;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(targetDateStr);
      if (isNaN(target.getTime())) return 999;
      target.setHours(0, 0, 0, 0);
      const diffTime = target - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  };

  // Safe combine with Array.isArray checks
  const safeExamsList = Array.isArray(exams) ? exams : [];
  const safeAssignmentsList = Array.isArray(assignments) ? assignments : [];

  const allDeadlines = [
    ...safeExamsList.map((e) => ({
      id: `e-${e?.id || Math.random()}`,
      title: e?.title || e?.exam_name || 'Upcoming Exam',
      date: e?.exact_date || e?.date || '',
      type: 'Exam',
      daysLeft: getDaysLeft(e?.exact_date || e?.date)
    })),
    ...safeAssignmentsList.map((a) => {
      const isProject = a?.subject?.startsWith('[Project]');
      return {
        id: `a-${a?.id || Math.random()}`,
        title: a?.title || 'Assignment Deadline',
        date: a?.deadline_date || a?.date || '',
        type: isProject ? 'Project' : 'Assignment',
        daysLeft: getDaysLeft(a?.deadline_date || a?.date)
      };
    })
  ]
    .filter((item) => item.daysLeft >= 0) // Only future/today deadlines
    .sort((a, b) => a.daysLeft - b.daysLeft); // Nearest deadline first

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* Top Greeting */}
        <header className="page-header">
          <div>
            <h1>Welcome back, <span>{user?.full_name || 'Developer'}</span> 👋</h1>
            <p className="subtitle">Here is your daily command center overview.</p>
          </div>
        </header>

        {/* Daily Focus Card */}
        <div className="daily-focus-card">
          <div className="focus-header">
            <Sparkles size={15} color="#3b82f6" />
            <span>DAILY FOCUS</span>
          </div>
          <p>{quote}</p>
        </div>

        {/* Upcoming Schedule Section */}
        <div className="dashboard-card">
          <div className="card-top">
            <div className="card-title-group">
              <Calendar size={18} color="#3b82f6" />
              <h3>Upcoming Academic Deadlines & Exams</h3>
            </div>
            <Link to="/exams" className="view-all-link">
              Manage Schedule <ArrowRight size={14} />
            </Link>
          </div>

          <div className="deadlines-table">
            {allDeadlines.length === 0 ? (
              <p className="no-data">No upcoming exams or assignments scheduled.</p>
            ) : (
              allDeadlines.slice(0, 3).map((item) => (
                <div key={item.id} className={`deadline-row ${item.daysLeft <= 1 ? 'is-urgent' : ''}`}>
                  <span className={`tag ${item.type.toLowerCase()}`}>{item.type}</span>
                  <span className="name">{item.title}</span>
                  <span className="due-date">
                    Target: {item.date && !isNaN(new Date(item.date).getTime()) 
                      ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                      : 'Scheduled'}
                  </span>
                  <span className={`days-badge ${item.daysLeft <= 1 ? 'critical' : ''}`}>
                    {item.daysLeft === 0 ? 'Today' : item.daysLeft === 1 ? 'Tomorrow' : `In ${item.daysLeft} days`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3 Stats Overview Cards */}
        <div className="dashboard-stats-grid">
          <Link to="/bookmarks" className="stat-card">
            <div className="stat-icon wrap-blue">
              <Bookmark size={20} />
            </div>
            <div className="stat-info">
              <h3>{bookmarksCount} Saved Links</h3>
              <p>Website Bookmarks</p>
            </div>
          </Link>

          <Link to="/projects" className="stat-card">
            <div className="stat-icon wrap-orange">
              <FolderGit2 size={20} />
            </div>
            <div className="stat-info">
              <h3>{projectsCount} Active Projects</h3>
              <p>Live Builds & Repos</p>
            </div>
          </Link>

          <Link to="/hr-directory" className="stat-card">
            <div className="stat-icon wrap-purple">
              <Users size={20} />
            </div>
            <div className="stat-info">
              <h3>{hrCount} HR Contacts</h3>
              <p>Recruiter CRM Directory</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}