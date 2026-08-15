import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Bot, ExternalLink, Search, Sparkles } from 'lucide-react';
import './AiDirectory.css';

export default function AiDirectory() {
  const [searchTerm, setSearchTerm] = useState('');

const aiTools = [
    // Top Famous Conversational AIs
    { name: 'ChatGPT', category: 'Conversational & Coding', url: 'https://chatgpt.com', desc: 'OpenAI conversational assistant for code, content, and analysis.', badge: 'Popular' },
    { name: 'Gemini', category: 'Conversational AI', url: 'https://gemini.google.com', desc: 'Google’s multimodal AI assistant for writing, planning, and learning.', badge: 'Google' },
    { name: 'Claude AI', category: 'Deep Reasoning & Coding', url: 'https://claude.ai', desc: 'Anthropic AI powerhouse with massive context and nuance.', badge: 'Recommended' },
    { name: 'Copilot', category: 'Productivity & Search', url: 'https://copilot.microsoft.com', desc: 'Microsoft AI companion integrated across the web and coding IDEs.', badge: 'Microsoft' },
    { name: 'Grok AI (xAI)', category: 'Real-time & Unfiltered', url: 'https://grok.com', desc: 'Real-time search and witty conversational intelligence from xAI.', badge: 'Trending' },
    
    // Top Research, Search & UI Generation
    { name: 'Perplexity AI', category: 'AI Search Engine', url: 'https://www.perplexity.ai', desc: 'Interactive search engine with inline citations and real-time facts.', badge: 'Search' },
    { name: 'DeepSeek', category: 'Open-weights Coding', url: 'https://chat.deepseek.com', desc: 'Fast, highly capable math and code-reasoning AI.', badge: 'Coding' },
    { name: 'v0 by Vercel', category: 'Frontend UI Generation', url: 'https://v0.dev', desc: 'Generates responsive React/Tailwind UI code from text prompts.', badge: 'UI Dev' },
    
    // Developer & Learning Tools
    { name: 'GitHub', category: 'Version Control & AI', url: 'https://github.com', desc: 'The ultimate platform for software development and GitHub Copilot.', badge: 'Dev Tool' },
    { name: 'LeetCode', category: 'Algorithm Practice', url: 'https://leetcode.com', desc: 'Platform to practice programming skills and prepare for technical interviews.', badge: 'Interview Prep' },
    
    // Google Tech & Labs
    { name: 'Google Labs', category: 'Experimental AI', url: 'https://labs.google', desc: 'Test early-stage AI experiments and features directly from Google.', badge: 'Experimental' },
    { name: 'Google Flow (TensorFlow)', category: 'Machine Learning', url: 'https://www.tensorflow.org', desc: 'Google’s end-to-end open source machine learning and AI framework.', badge: 'ML Framework' },
    
    // Creative & Media
    { name: 'Midjourney', category: 'Generative Art', url: 'https://midjourney.com', desc: 'Hyper-realistic digital art and concept image generation.', badge: 'Design' },
    { name: 'Suno AI', category: 'AI Music Generation', url: 'https://suno.com', desc: 'Create high-quality original songs, vocals, and music using AI.', badge: 'Music' },
    { name: 'Stitch AI', category: 'Web-Design & UI', url: 'https://stitch.withgoogle.com/', desc: 'Create high-quality ui/ux webpages and designs using AI.', badge: 'UI Dev' },
  ];

  const filtered = aiTools.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ai-page-wrapper">
      <Sidebar />

      <main className="ai-page-main">
        <header className="page-header">
          <div>
            <h1>AI Tools <span>Directory</span></h1>
            <p className="subtitle">Curated directory of top-tier AI platforms. Click any tool to redirect instantly.</p>
          </div>
        </header>

        <div className="list-controls">
          <h2>Direct AI Launchpad ({filtered.length})</h2>
          <div className="search-bar">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search AI tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="ai-grid">
          {filtered.map((ai, index) => (
            <a 
              key={index} 
              href={ai.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="ai-card"
            >
              <div className="ai-card-header">
                <div className="ai-title-wrap">
                  <div className="ai-icon"><Bot size={20} color="#3b82f6" /></div>
                  <h3>{ai.name}</h3>
                </div>
                <span className="ai-badge">{ai.badge}</span>
              </div>
              <p className="ai-desc">{ai.desc}</p>
              <div className="ai-card-footer">
                <span className="ai-category">{ai.category}</span>
                <span className="ai-redirect-link">Launch <ExternalLink size={13} /></span>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}