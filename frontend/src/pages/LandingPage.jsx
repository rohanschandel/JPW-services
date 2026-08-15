import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  Zap, 
  ArrowRight, 
  Database, 
  ShieldCheck, 
  Rocket, 
  Bookmark, 
  AlertCircle, 
  Briefcase, 
  FileText, 
  Code2, 
  HardDrive 
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-wrapper">
      {/* Hero Glow Background Effect */}
      <div className="bg-hero-glow"></div>

      {/* Navigation Header */}
      <nav className="marketing-navbar">
        <div className="nav-brand">
          <Layers className="text-primary" size={24} />
          <span className="brand-title">JPW-services</span>
        </div>

        <div className="nav-menu">
          <a href="#features" className="nav-item">Features</a>
          <a href="#modules" className="nav-item">Core Modules</a>
          <a href="#architecture" className="nav-item">MySQL Vault</a>
        </div>

        <div className="nav-cta-group">
          <Link to="/auth" className="nav-link-auth">Sign In</Link>
          <Link to="/auth" className="btn-get-started">Get Started</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="badge-chip">
            <Zap size={14} className="text-primary" />
            <span>JOB PREPARTION WEBSITE SERVICES</span>
          </div>

          <h1 className="hero-heading">
            Your links, code, exams & career in <br className="hidden-mobile" />
            <span className="text-gradient">one command center.</span>
          </h1>

          <p className="hero-description">
            Engineered for absolute focus. Chrome quick-launch bookmarks, automated Red Alert exam deadlines, recruiter CRM, and lifetime data persistence directly in your local MySQL storage.
          </p>

          <div className="hero-actions">
            <Link to="/auth" className="btn-hero-launch group">
              Launch Workspace 
              <ArrowRight size={18} className="arrow-icon" />
            </Link>
            <a href="#modules" className="btn-hero-secondary">
              Explore Modules
            </a>
          </div>
        </section>

        {/* 3 Pillars / Value Proposition Grid */}
        <section className="pillars-grid" id="features">
          <div className="pillar-card">
            <div className="pillar-icon-wrap">
              <Database size={24} className="text-primary" />
            </div>
            <h3>MySQL</h3>
            <p>Local Disk Storage</p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-wrap">
              <ShieldCheck size={24} className="text-primary" />
            </div>
            <h3>Zero-Loss</h3>
            <p>Lifetime Retention</p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon-wrap">
              <Rocket size={24} className="text-primary" />
            </div>
            <h3>1-Click</h3>
            <p>Direct Chrome Launch</p>
          </div>
        </section>

        {/* Core Modules Showcase */}
        <section className="modules-section" id="modules">
          <div className="section-header">
            <h2>Core Modules</h2>
            <p>Everything you need to manage your technical life, isolated in a high-performance local environment.</p>
          </div>

          <div className="modules-grid">
            {/* Card 1 */}
            <div className="module-card">
              <div className="module-icon-wrap">
                <Bookmark size={22} className="text-primary" />
              </div>
              <h3>Website Bookmarks</h3>
              <p>Save any URL with custom naming. Click directly to launch in Chrome tabs without losing context.</p>
            </div>

            {/* Card 2: Red Alert */}
            <div className="module-card urgent-card">
              <div className="urgent-glow"></div>
              <div className="module-icon-wrap urgent-icon-wrap">
                <AlertCircle size={22} className="text-danger" />
              </div>
              <h3>Red Alert Deadlines</h3>
              <p>Exams and assignments scheduled within 24–48 hours jump to the top highlighted with a bold red deadline border.</p>
            </div>

            {/* Card 3 */}
            <div className="module-card">
              <div className="module-icon-wrap">
                <Briefcase size={22} className="text-primary" />
              </div>
              <h3>HR & Recruiter CRM</h3>
              <p>Store HR names, company names, contact numbers, Gmail IDs, and office locations with 1-click email and call actions.</p>
            </div>

            {/* Card 4 */}
            <div className="module-card">
              <div className="module-icon-wrap">
                <FileText size={22} className="text-primary" />
              </div>
              <h3>Workspace Notebook</h3>
              <p>Distraction-free scratchpad for notes, revision outlines, or code snippets with instant persistence.</p>
            </div>

            {/* Card 5 */}
            <div className="module-card">
              <div className="module-icon-wrap">
                <Code2 size={22} className="text-primary" />
              </div>
              <h3>Project Portfolio</h3>
              <p>Keep track of all your active web builds, staging URLs, and GitHub repos in a single clean view.</p>
            </div>

            {/* Card 6 */}
            <div className="module-card" id="architecture">
              <div className="module-icon-wrap">
                <HardDrive size={22} className="text-primary" />
              </div>
              <h3>Lifetime Local Database</h3>
              <p>All data is safely housed in MySQL on your machine. Zero cloud expiration—everything stays until you delete it.</p>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="cta-banner">
          <div className="cta-content">
            <h2>Ready to take control?</h2>
            <p>Deploy your local workspace today and consolidate your digital life into a single, high-performance command center.</p>
            <Link to="/auth" className="btn-cta-launch">
              Get Started Now
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="marketing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <Layers size={18} />
            <span>© 2026 JPW-services. Built for power users.</span>
          </div>

          <div className="footer-links">
            <a href="#features">Privacy Policy</a>
            <a href="#features">Terms of Service</a>
            <a href="#features">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}