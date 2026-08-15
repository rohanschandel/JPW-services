import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { Copy, Check, Trash2 } from 'lucide-react';
import './Workspace.css';

export default function Workspace() {
  const [content, setContent] = useState(() => {
    return localStorage.getItem('jpw_workspace_notes') || '';
  });
  const [copied, setCopied] = useState(false);
  const debounceTimerRef = useRef(null);

  // 1. Load notes on startup
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const res = await API.get('/workspace/');
        if (res.data && res.data.content !== undefined) {
          setContent(res.data.content);
          localStorage.setItem('jpw_workspace_notes', res.data.content);
        }
      } catch (err) {
        console.error('Failed to fetch workspace:', err);
      }
    };
    fetchWorkspace();
  }, []);

  // 2. Silent Auto-Save to Backend
  const saveToBackend = async (text) => {
    try {
      await API.post('/workspace/', { content: text });
    } catch (err) {
      console.error('Auto-save error:', err);
    }
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setContent(newText);
    localStorage.setItem('jpw_workspace_notes', newText);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      saveToBackend(newText);
    }, 500);
  };

  // 3. Direct Instant Clear (No popup confirmation)
  const handleClearAll = async () => {
    setContent('');
    localStorage.removeItem('jpw_workspace_notes');
    try {
      await API.post('/workspace/', { content: '' });
    } catch (err) {
      console.error('Failed to clear notes on backend:', err);
    }
  };

  // Copy to Clipboard Action
  const handleCopyNotes = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="page-header">
          <div>
            <h1>Developer <span>Workspace</span></h1>
            <p className="subtitle">Distraction-free scratchpad for notes, code drafts, and logic outlines.</p>
          </div>
        </header>

        {/* Editor Box with Integrated Top-Right Action Bar */}
        <div className="workspace-editor-card">
          <div className="editor-top-bar">
            <span className="editor-label">Scratchpad</span>

            <div className="editor-actions">
              <button 
                onClick={handleCopyNotes} 
                className="editor-btn editor-btn-ghost" 
                title="Copy All"
                disabled={!content.trim()}
              >
                {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy All'}</span>
              </button>

              <button 
                onClick={handleClearAll} 
                className="editor-btn editor-btn-danger" 
                title="Clear All Notes"
                disabled={!content.trim()}
              >
                <Trash2 size={13} />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          <textarea
            className="workspace-textarea"
            placeholder="Write your notes, queries, revision checklists, or code snippets here..."
            value={content}
            onChange={handleTextChange}
            spellCheck="false"
          />

          <div className="editor-footer">
            <span>{content.length} characters</span>
            <span>{content.trim() ? content.trim().split(/\s+/).length : 0} words</span>
          </div>
        </div>
      </main>
    </div>
  );
}