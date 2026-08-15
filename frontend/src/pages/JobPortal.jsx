import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  Briefcase, 
  ExternalLink, 
  Search, 
  Plus, 
  Trash2, 
  Building2, 
  Sparkles 
} from 'lucide-react';
import './JobPortal.css';

export default function JobPortal() {
  const initialPlatforms = [
    { id: '1', name: 'LinkedIn Jobs', category: 'Professional & Tech', url: 'https://www.linkedin.com/jobs', desc: 'World’s largest professional network for global hiring and networking.', badge: 'Top Pick', isCustom: false },
    { id: '2', name: 'Naukri.com', category: 'General & IT', url: 'https://www.naukri.com', desc: 'Leading job search platform with thousands of daily tech and corporate openings.', badge: 'Popular', isCustom: false },
    { id: '3', name: 'Indeed', category: 'General & Remote', url: 'https://indeed.com', desc: 'Comprehensive global job search engine across industries and experience levels.', badge: 'Global', isCustom: false },
    { id: '4', name: 'Wellfound (AngelList)', category: 'Startups & Tech', url: 'https://wellfound.com', desc: 'Direct access to high-growth startups and tech talent hiring.', badge: 'Startups', isCustom: false },
    { id: '5', name: 'Internshala', category: 'Internships & Fresher', url: 'https://internshala.com', desc: 'Premier platform for college internships, fresher jobs, and remote gigs.', badge: 'Internships', isCustom: false },
    { id: '6', name: 'Cuvette', category: 'Tech Internships', url: 'https://cuvette.tech', desc: 'Simplified software and tech internship platform tailored for students.', badge: 'Student', isCustom: false },
    { id: '7', name: 'Unstop', category: 'Competitions & Hiring', url: 'https://unstop.com', desc: 'Hackathons, hiring challenges, and campus recruitment opportunities.', badge: 'Hiring Challenges', isCustom: false },
    { id: '8', name: 'RemoteOK', category: 'Remote Work', url: 'https://remoteok.com', desc: 'Curated remote job board for developers, designers, and marketers.', badge: 'Remote', isCustom: false },
    { id: '9', name: 'We Work Remotely', category: 'Remote Work', url: 'https://weworkremotely.com', desc: 'One of the largest remote work communities with global listings.', badge: 'Remote', isCustom: false },
    { id: '10', name: 'Foundit (Monster)', category: 'General & IT', url: 'https://www.foundit.in', desc: 'Career management and recruitment platform across diverse sectors.', badge: 'Corporate', isCustom: false }
  ];

  // Load user platforms from localStorage
  const [platforms, setPlatforms] = useState(() => {
    const saved = localStorage.getItem('custom_job_portals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...initialPlatforms, ...parsed];
      } catch (e) {
        return initialPlatforms;
      }
    }
    return initialPlatforms;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // New portal input state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: 'General & IT',
    desc: ''
  });

  const categories = ['All', 'Professional & Tech', 'Startups & Tech', 'Internships & Fresher', 'Remote Work', 'General & IT', 'Custom'];

  // Handle Form Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add Portal
  const handleAddPortal = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) return;

    let formattedUrl = formData.url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newPortal = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      url: formattedUrl,
      category: formData.category,
      desc: formData.desc.trim() || 'Custom portal added by user.',
      badge: 'Custom',
      isCustom: true
    };

    const updatedList = [newPortal, ...platforms];
    setPlatforms(updatedList);

    // Save custom items to localStorage
    const customItems = updatedList.filter(item => item.isCustom);
    localStorage.setItem('custom_job_portals', JSON.stringify(customItems));

    // Reset Form
    setFormData({
      name: '',
      url: '',
      category: 'General & IT',
      desc: ''
    });
  };

  // Delete Portal
  const handleDeletePortal = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    const updatedList = platforms.filter(item => item.id !== id);
    setPlatforms(updatedList);

    const customItems = updatedList.filter(item => item.isCustom);
    localStorage.setItem('custom_job_portals', JSON.stringify(customItems));
  };

  const filtered = platforms.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' 
      ? true 
      : selectedCategory === 'Custom' 
      ? p.isCustom 
      : p.category.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="job-page-wrapper">
      <Sidebar />

      <main className="job-page-main">
        <header className="page-header">
          <div>
            <h1>Job Portals & <span>Career Launchpad</span></h1>
            <p className="subtitle">Curated recruitment platforms, startup hubs, and custom portals to fast-track your career.</p>
          </div>
        </header>

        {/* Add Custom Job Portal Section */}
        <div className="add-portal-card">
          <div className="card-header-line">
            <Sparkles size={18} color="#3b82f6" />
            <h3>Add Custom Job Portal</h3>
          </div>
          <form onSubmit={handleAddPortal} className="add-portal-form">
            <div className="input-group">
              <label>Portal Name *</label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Glassdoor, Instahyre"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Portal Link (URL) *</label>
              <input
                type="text"
                name="url"
                placeholder="e.g. https://www.glassdoor.com"
                value={formData.url}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Category</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange}
                className="select-category"
              >
                <option value="Professional & Tech">Professional & Tech</option>
                <option value="Startups & Tech">Startups & Tech</option>
                <option value="Internships & Fresher">Internships & Fresher</option>
                <option value="Remote Work">Remote Work</option>
                <option value="General & IT">General & IT</option>
              </select>
            </div>

            <div className="input-group">
              <label>Short Description (Optional)</label>
              <input
                type="text"
                name="desc"
                placeholder="e.g. Company reviews and salary insights"
                value={formData.desc}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="btn-add-portal">
              <Plus size={16} /> Add Portal
            </button>
          </form>
        </div>

        {/* Filter & Search Bar */}
        <div className="job-controls-panel">
          <div className="category-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`chip-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="search-bar">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search portals or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Grid List */}
        <div className="job-grid">
          {filtered.length === 0 ? (
            <div className="empty-search-state">
              <Building2 size={36} color="#94a3b8" />
              <p>No job platforms found matching "{searchTerm}".</p>
            </div>
          ) : (
            filtered.map((item) => (
              <a 
                key={item.id} 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="job-card"
              >
                <div className="job-card-header">
                  <div className="job-title-wrap">
                    <div className="job-icon">
                      <Briefcase size={18} color="#3b82f6" />
                    </div>
                    <h3>{item.name}</h3>
                  </div>
                  <div className="header-badges-wrap">
                    <span className="job-badge">{item.badge}</span>
                    {item.isCustom && (
                      <button 
                        onClick={(e) => handleDeletePortal(item.id, e)} 
                        className="delete-portal-btn"
                        title="Delete custom portal"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="job-desc">{item.desc}</p>

                <div className="job-card-footer">
                  <span className="job-category">{item.category}</span>
                  <span className="job-redirect-link">
                    Explore <ExternalLink size={13} />
                  </span>
                </div>
              </a>
            ))
          )}
        </div>
      </main>
    </div>
  );
}