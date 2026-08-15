import React, { useState, useEffect } from "react";
import axios from "axios";

const Dashboard = () => {
  const [user, setUser] = useState({ full_name: "Rohan Singh", email: "" });
  const [stats, setStats] = useState({ saved_links: 0, active_projects: 0, hr_contacts: 0 });
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch user profile
        const userRes = await axios.get("/api/auth/me", { headers }).catch(() => null);
        if (userRes?.data) setUser(userRes.data);

        // Fetch stats
        const statsRes = await axios.get("/api/stats", { headers }).catch(() => null);
        if (statsRes?.data && typeof statsRes.data === "object") setStats(statsRes.data);

        // Fetch exams/deadlines
        const examsRes = await axios.get("/api/exams", { headers }).catch(() => null);
        if (Array.isArray(examsRes?.data)) {
          setExams(examsRes.data);
        } else {
          setExams([]);
        }
      } catch (err) {
        console.error("Dashboard Load Error:", err);
        setExams([]);
      }
    };

    fetchData();
  }, []);

  const safeExams = Array.isArray(exams) ? exams : [];

  return (
    <div className="min-h-screen bg-[#070c18] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800/80 bg-[#0b1329] p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">JPW</div>
            <span className="text-xl font-bold tracking-wide">JPW<span className="text-blue-500">-services</span></span>
          </div>

          <nav className="space-y-2">
            <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl font-medium">
              📊 Dashboard
            </a>
            <a href="/todos" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/40 rounded-xl transition">
              📝 To-Dos & Tasks
            </a>
            <a href="/ai-tools" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/40 rounded-xl transition">
              🤖 AI Tools Hub
            </a>
            <a href="/job-portal" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/40 rounded-xl transition">
              💼 JobPortal
            </a>
            <a href="/hr-contacts" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/40 rounded-xl transition">
              👥 HR Contacts
            </a>
            <a href="/project-links" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/40 rounded-xl transition">
              🔗 Project Links
            </a>
            <a href="/exams" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/40 rounded-xl transition">
              📅 Exams & Deadlines
            </a>
            <a href="/workspace" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/40 rounded-xl transition">
              📁 Workspace
            </a>
          </nav>
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/auth";
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition"
        >
          🚪 Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, <span className="text-blue-500">{user.full_name || "Rohan"}</span> 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Here is your daily command center overview.</p>
        </header>

        {/* Daily Focus */}
        <section className="mb-8 p-6 bg-[#0e172e] border border-blue-500/20 rounded-2xl relative overflow-hidden shadow-lg">
          <span className="text-xs uppercase tracking-wider font-bold text-blue-400 block mb-2">✨ Daily Focus</span>
          <p className="text-lg italic text-gray-200">“Focus is a muscle. The more you practice it, the stronger it becomes.”</p>
        </section>

        {/* Upcoming Academic Deadlines */}
        <section className="mb-8 p-6 bg-[#0e172e] border border-gray-800 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              📅 Upcoming Academic Deadlines & Exams
            </h2>
            <a href="/exams" className="text-sm text-blue-400 hover:underline">Manage Schedule →</a>
          </div>

          {safeExams.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No upcoming exams or assignments scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {safeExams.map((exam, idx) => (
                <div key={exam.id || idx} className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex justify-between items-center">
                  <span className="font-medium">{exam.title || exam.exam_name || "Academic Deadline"}</span>
                  <span className="text-xs text-blue-400 px-3 py-1 bg-blue-500/10 rounded-full">{exam.date || "Scheduled"}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#0e172e] border border-gray-800 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xl">🔖</div>
            <div>
              <div className="text-2xl font-bold">{stats.saved_links ?? 0} Saved Links</div>
              <div className="text-gray-400 text-xs mt-0.5">Website Bookmarks</div>
            </div>
          </div>

          <div className="p-6 bg-[#0e172e] border border-gray-800 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xl">⚡</div>
            <div>
              <div className="text-2xl font-bold">{stats.active_projects ?? 0} Active Projects</div>
              <div className="text-gray-400 text-xs mt-0.5">Live Builds & Repos</div>
            </div>
          </div>

          <div className="p-6 bg-[#0e172e] border border-gray-800 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl">👥</div>
            <div>
              <div className="text-2xl font-bold">{stats.hr_contacts ?? 0} HR Contacts</div>
              <div className="text-gray-400 text-xs mt-0.5">Recruiter CRM Directory</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;