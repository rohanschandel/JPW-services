import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API, { getCachedData, saveCacheData } from '../services/api';
import {
  FolderGit2,
  Plus,
  Github,
  Trash2,
  Globe
} from 'lucide-react';
import './Projects.css';

export default function Projects() {
  // Instant Load from Cache
  const [projects, setProjects] = useState(() => getCachedData('jpw_cache_projects', []));
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    live_url: '',
    github_url: '',
    status: 'Live'
  });

  const fetchProjects = async () => {
    try {
      const res = await API.get('/projects');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setProjects(res.data);
        saveCacheData('jpw_cache_projects', res.data);
      }
    } catch (err) {
      console.warn('Backend sync failed, maintaining saved projects');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setFormData({ ...formData, [name]: value.slice(0, 23) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.live_url.trim()) return;

    setLoading(true);
    const tempProject = {
      id: Date.now(),
      title: formData.name.trim().slice(0, 23),
      project_title: formData.name.trim().slice(0, 23),
      name: formData.name.trim().slice(0, 23),
      live_url: formData.live_url.trim(),
      github_url: formData.github_url.trim(),
      status: formData.status
    };

    // Instant UI + Cache Update
    const updated = [tempProject, ...projects];
    setProjects(updated);
    saveCacheData('jpw_cache_projects', updated);

    setFormData({
      name: '',
      live_url: '',
      github_url: '',
      status: 'Live'
    });

    try {
      const res = await API.post('/projects/', tempProject);
      if (res.data && res.data.id) {
        const finalized = projects.map(p => p.id === tempProject.id ? res.data : p);
        setProjects(finalized);
        saveCacheData('jpw_cache_projects', finalized);
      }
    } catch (err) {
      console.warn('Backend sync failed, saved locally');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    saveCacheData('jpw_cache_projects', updated);

    try {
      await API.delete(`/projects/${id}`);
    } catch (err) {
      console.warn('Deleted locally');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Live':
        return 'status-live';
      case 'In Progress':
        return 'status-progress';
      case 'Completed':
        return 'status-completed';
      default:
        return 'status-live';
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="page-header">
          <div>
            <h1>Project Portfolio & <span>Links</span></h1>
            <p className="subtitle">Catalog your live website builds, web applications, and GitHub repositories.</p>
          </div>
        </header>

        {/* Add Project Form Box */}
        <div className="project-form-card">
          <div className="form-card-title">
            <FolderGit2 size={18} color="#3b82f6" />
            <span>Add New Web Project</span>
          </div>

          <form onSubmit={handleCreateProject} className="project-form-row">
            <div className="form-field-group">
              <label>Project Title ({formData.name.length}/23) *</label>
              <input
                type="text"
                name="name"
                maxLength={23}
                placeholder="e.g. Chat App Frontend"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field-group">
              <label>Live URL / Staging *</label>
              <input
                type="url"
                name="live_url"
                placeholder="e.g. https://myproject.vercel.app"
                value={formData.live_url}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field-group">
              <label>GitHub Repository</label>
              <input
                type="url"
                name="github_url"
                placeholder="e.g. https://github.com/..."
                value={formData.github_url}
                onChange={handleChange}
              />
            </div>

            <div className="form-field-group status-select-group">
              <label>Build Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Live">Live</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary form-submit-btn" disabled={loading}>
              <Plus size={16} /> {loading ? 'Saving...' : 'Save Project'}
            </button>
          </form>
        </div>

        {/* Projects Cards Display Grid */}
        <div className="projects-grid">
          {projects.length === 0 ? (
            <div className="empty-state">
              <FolderGit2 size={44} color="#334155" />
              <p>No projects cataloged yet. Add your first project above.</p>
            </div>
          ) : (
            projects.map((project) => {
              const projectTitle = project.name || project.title || project.project_title || 'Project';
              return (
                <div key={project.id} className="project-card">
                  <div className="project-card-top">
                    <h3 className="project-title" title={projectTitle}>{projectTitle}</h3>
                    <span className={`status-pill ${getStatusBadgeClass(project.status)}`}>
                      {project.status || 'Live'}
                    </span>
                  </div>

                  <div className="project-card-actions">
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-action-link"
                    >
                      <Globe size={14} /> Open Live Site
                    </a>

                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-action-link"
                      >
                        <Github size={14} /> GitHub Repo
                      </a>
                    )}

                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="project-delete-btn"
                      title="Delete Project"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}