import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="brand-logo">
          <Layers className="logo-icon" size={24} color="#3b82f6" />
          <span className="logo-text">JPW<span>-services</span></span>
        </Link>

        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#storage">MySQL Vault</a>
          <a href="#architecture">Architecture</a>
        </nav>

        <div className="nav-actions">
          <Link to="/auth?mode=login" className="btn btn-secondary">Sign In</Link>
          <Link to="/auth?mode=signup" className="btn btn-primary">Get Started</Link>
        </div>
      </div>
    </header>
  );
}