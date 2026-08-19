import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API, { getCachedData, saveCacheData } from '../services/api';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Calendar, 
  FolderKanban, 
  CheckCircle2 
} from 'lucide-react';
import './ExamsTracker.css';

export default function ExamsTracker() {
  const sortUpcomingDeadlines = (data) => {
    if (!Array.isArray(data)) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...data].sort((a, b) => {
      const dateA = new Date(a.deadline_date || a.date);
      const dateB = new Date(b.deadline_date || b.date);
      dateA.setHours(0, 0, 0, 0);
      dateB.setHours(0, 0, 0, 0);

      const isPastA = dateA < today;
      const isPastB = dateB < today;

      if (isPastA && !isPastB) return 1;
      if (!isPastA && isPastB) return -1;
      return dateA - dateB;
    });
  };

  // Instant Load from Cache
  const [items, setItems] = useState(() => sortUpcomingDeadlines(getCachedData('jpw_cache_deadlines', [])));
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: 'Assignment',
    title: '',
    subject: '',
    deadline_date: ''
  });

  const fetchItems = async () => {
    try {
      const res = await API.get('/assignments');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const sorted = sortUpcomingDeadlines(res.data);
        setItems(sorted);
        saveCacheData('jpw_cache_deadlines', sorted);
      }
    } catch (err) {
      console.warn('Backend sync failed, maintaining saved deadlines');
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.deadline_date) return;

    setLoading(true);
    const tempItem = {
      id: Date.now(),
      title: formData.title.trim(),
      subject: formData.type === 'Project' ? `[Project] ${formData.subject.trim() || 'General'}` : formData.subject.trim(),
      deadline_date: formData.deadline_date,
      date: formData.deadline_date
    };

    // Instant UI + Cache Update
    const updated = sortUpcomingDeadlines([tempItem, ...items]);
    setItems(updated);
    saveCacheData('jpw_cache_deadlines', updated);

    setFormData({
      type: 'Assignment',
      title: '',
      subject: '',
      deadline_date: ''
    });

    try {
      const res = await API.post('/assignments/', tempItem);
      if (res.data && res.data.id) {
        const finalized = items.map(i => i.id === tempItem.id ? res.data : i);
        setItems(sortUpcomingDeadlines(finalized));
        saveCacheData('jpw_cache_deadlines', finalized);
      }
    } catch (err) {
      console.error('Save to server queued in cache');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    saveCacheData('jpw_cache_deadlines', updated);

    try {
      await API.delete(`/assignments/${id}`);
    } catch (err) {
      console.error('Delete request failed on server');
    }
  };

  const isUrgent = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(dateString);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 2;
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="page-header">
          <div>
            <h1>Academic & Project <span>Deadlines</span></h1>
            <p className="subtitle">Track assignments, submissions, and project milestones organized by date.</p>
          </div>
        </header>

        <div className="tracker-split-layout">
          {/* Form */}
          <div className="tracker-form-container">
            <div className="tracker-card">
              <div className="tracker-card-header">
                <BookOpen size={20} className="icon-purple" />
                <h2>Schedule New Deadline</h2>
              </div>

              <form onSubmit={handleAddItem} className="tracker-form">
                <div className="input-group">
                  <label>Type / Category *</label>
                  <select 
                    name="type" 
                    value={formData.type} 
                    onChange={handleChange}
                    className="select-type-input"
                  >
                    <option value="Assignment">Assignment / Homework</option>
                    <option value="Project">Course / Web Project</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>{formData.type} Title *</label>
                  <input
                    type="text"
                    name="title"
                    placeholder={formData.type === 'Project' ? 'e.g. Fullstack Application' : 'e.g. Analysis PDF'}
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Subject / Tech Stack</label>
                  <input
                    type="text"
                    name="subject"
                    placeholder={formData.type === 'Project' ? 'e.g. React, Python, SQLite' : 'e.g. Data Collection'}
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label>Exact Deadline Date *</label>
                  <input
                    type="date"
                    name="deadline_date"
                    value={formData.deadline_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button type="submit" className="btn-full btn-purple" disabled={loading}>
                  <Plus size={16} /> {loading ? 'Saving...' : `+ Save ${formData.type}`}
                </button>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="tracker-list-container">
            <div className="list-header-row">
              <h3>Active Deadlines ({items.length})</h3>
              <span className="sorted-badge">Sorted by Upcoming Date</span>
            </div>

            <div className="deadlines-vertical-list">
              {items.length === 0 ? (
                <div className="empty-tracker-box">
                  <CheckCircle2 size={40} color="#94a3b8" />
                  <p>No active deadlines scheduled. Fill out the form on the left to add one.</p>
                </div>
              ) : (
                items.map((item) => {
                  const isProject = item.subject?.startsWith('[Project]');
                  const displaySubject = isProject ? item.subject.replace('[Project]', '').trim() : item.subject;

                  return (
                    <div 
                      key={item.id} 
                      className={`deadline-card ${isUrgent(item.deadline_date) ? 'urgent-deadline-card' : ''}`}
                    >
                      <div className="deadline-card-body">
                        <div className="deadline-top-line">
                          <span className={`type-badge ${isProject ? 'badge-project' : 'badge-assignment'}`}>
                            {isProject ? <FolderKanban size={13} /> : <BookOpen size={13} />}
                            {isProject ? 'Project' : 'Assignment'}
                          </span>

                          <div className="date-tag">
                            <Calendar size={13} />
                            <span>{new Date(item.deadline_date || item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>

                        <h4 className="deadline-title">
                          {item.title}
                          {isUrgent(item.deadline_date) && (
                            <span className="red-alert-flag">
                              <AlertCircle size={13} /> Approaching
                            </span>
                          )}
                        </h4>

                        {displaySubject && (
                          <p className="deadline-subject-tag">{displaySubject}</p>
                        )}
                      </div>

                      <button 
                        onClick={() => handleDeleteItem(item.id)} 
                        className="deadline-delete-btn" 
                        title="Delete Deadline"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}