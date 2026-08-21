import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API, { getCachedData, saveCacheData } from '../services/api';
import { 
  Users, 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Trash2, 
  X 
} from 'lucide-react';
import './HrDirectory.css';

const DEFAULT_FORM = {
  hr_name: '',
  company_name: '',
  hr_number: '',
  email_id: '',
  location: ''
};

export default function HrDirectory() {
  const [contacts, setContacts] = useState(() => getCachedData('jpw_cache_hr', []));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  const fetchContacts = async () => {
    try {
      const res = await API.get('/hr');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setContacts(res.data);
        saveCacheData('jpw_cache_hr', res.data);
      }
    } catch (err) {
      console.warn('Syncing from cache fallback');
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...(prev || DEFAULT_FORM), [name]: value }));
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    if (!formData?.hr_name?.trim() || !formData?.company_name?.trim()) return;

    setLoading(true);
    const tempContact = {
      id: Date.now(),
      hr_name: formData.hr_name.trim(),
      company_name: formData.company_name.trim(),
      hr_number: (formData.hr_number || '').trim(),
      email_id: (formData.email_id || '').trim(),
      location: (formData.location || '').trim()
    };

    setContacts((prev) => {
      const next = [tempContact, ...(Array.isArray(prev) ? prev : [])];
      saveCacheData('jpw_cache_hr', next);
      return next;
    });

    setFormData(DEFAULT_FORM);
    setIsModalOpen(false);

    try {
      const res = await API.post('/hr', tempContact);
      const serverItem = res.data?.data || res.data;
      if (serverItem && serverItem.id) {
        setContacts((prev) => {
          const next = (prev || []).map((c) => (c.id === tempContact.id ? serverItem : c));
          saveCacheData('jpw_cache_hr', next);
          return next;
        });
      }
    } catch (err) {
      console.warn('Saved offline in local storage');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (id) => {
    setContacts((prev) => {
      const next = (prev || []).filter((c) => c && c.id !== id);
      saveCacheData('jpw_cache_hr', next);
      return next;
    });

    try {
      await API.delete(`/hr/${id}`);
    } catch (err) {
      console.warn('Deleted locally');
    }
  };

  // Safe search filtering against null/undefined contacts
  const safeContacts = Array.isArray(contacts) ? contacts.filter(Boolean) : [];
  const filteredContacts = safeContacts.filter((c) => {
    const query = (searchQuery || '').toLowerCase().trim();
    if (!query) return true;
    return (
      (c.hr_name || '').toLowerCase().includes(query) ||
      (c.company_name || '').toLowerCase().includes(query) ||
      (c.location || '').toLowerCase().includes(query) ||
      (c.email_id || '').toLowerCase().includes(query) ||
      (c.hr_number || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* Header */}
        <header className="page-header hr-header">
          <div>
            <h1>Recruiter <span>CRM</span></h1>
            <p className="subtitle">Track HR contacts, company listings, and one-click reach triggers.</p>
          </div>

          <button 
            type="button" 
            onClick={() => setIsModalOpen(true)} 
            className="btn btn-primary"
          >
            <Plus size={18} /> Add HR Contact
          </button>
        </header>

        {/* Controls Bar */}
        <div className="hr-controls-bar">
          <div className="search-bar">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by recruiter name, company, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="contact-count-badge">
            {filteredContacts.length} {filteredContacts.length === 1 ? 'Contact' : 'Contacts'}
          </div>
        </div>

        {/* Contacts Cards Display */}
        {filteredContacts.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <Users size={44} color="#334155" style={{ margin: '0 auto 12px' }} />
            <p>No recruiter contacts found. Click "Add HR Contact" to save one.</p>
          </div>
        ) : (
          <div className="hr-grid">
            {filteredContacts.map((contact, idx) => (
              <div key={contact.id || idx} className="hr-exact-card">
                {/* Top Row: Name + Delete Icon */}
                <div className="hr-exact-top">
                  <h3 className="hr-exact-name">{contact.hr_name || 'HR Contact'}</h3>
                  <button 
                    type="button"
                    onClick={() => handleDeleteContact(contact.id)} 
                    className="hr-exact-delete" 
                    title="Delete Contact"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Company Name */}
                {contact.company_name && (
                  <div className="hr-exact-row company-row">
                    <Building2 size={16} className="icon-blue" />
                    <span>{contact.company_name}</span>
                  </div>
                )}

                {/* Phone / WhatsApp */}
                {contact.hr_number && (
                  <div className="hr-exact-row">
                    <Phone size={16} className="icon-green" />
                    <a href={`tel:${contact.hr_number}`} className="hr-link">{contact.hr_number}</a>
                  </div>
                )}

                {/* Gmail / Work Email */}
                {contact.email_id && (
                  <div className="hr-exact-row">
                    <Mail size={16} className="icon-blue-email" />
                    <a href={`mailto:${contact.email_id}`} className="hr-link">{contact.email_id}</a>
                  </div>
                )}

                {/* Job Location */}
                {contact.location && (
                  <div className="hr-exact-row">
                    <MapPin size={16} className="icon-orange" />
                    <span>{contact.location}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Popup Modal */}
        {isModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-wrap">
                  <Users size={20} color="#3b82f6" />
                  <h2>Add Recruiter Contact</h2>
                </div>
                <button 
                  type="button" 
                  className="modal-close-btn" 
                  onClick={() => setIsModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateContact} className="modal-form">
                <div className="form-group">
                  <label>HR Name *</label>
                  <input
                    type="text"
                    name="hr_name"
                    placeholder="e.g. Priya Sharma"
                    value={formData?.hr_name || ''}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    name="company_name"
                    placeholder="e.g. Google / Microsoft"
                    value={formData?.company_name || ''}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone / WhatsApp</label>
                  <input
                    type="text"
                    name="hr_number"
                    placeholder="e.g. +91 9876543210"
                    value={formData?.hr_number || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Gmail / Work Email</label>
                  <input
                    type="email"
                    name="email_id"
                    placeholder="e.g. hr@company.com"
                    value={formData?.email_id || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Job Location</label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g. Hyderabad / Bangalore / Remote"
                    value={formData?.location || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="modal-footer-btns">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : '+ Save Contact'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}