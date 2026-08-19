import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API, { getCachedData, saveCacheData } from '../services/api';
import { Plus, Trash2, CheckCircle2, Circle, CheckSquare, Search } from 'lucide-react';
import './TodosPage.css';

export default function TodosPage() {
  // Instant Load from Cache
  const [todos, setTodos] = useState(() => getCachedData('jpw_cache_todos', []));
  const [taskInput, setTaskInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const fetchTodos = async () => {
    try {
      const res = await API.get('/todos/');
      if (Array.isArray(res.data)) {
        const normalized = res.data.map(t => ({
          ...t,
          task: t.task || t.title,
          is_completed: t.is_completed ?? t.completed ?? false
        }));
        setTodos(normalized);
        saveCacheData('jpw_cache_todos', normalized);
      }
    } catch (err) {
      console.warn('Loaded todos from local cache');
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    setLoading(true);
    const tempTodo = {
      id: Date.now(),
      task: taskInput.trim(),
      title: taskInput.trim(),
      is_completed: false,
      completed: false
    };

    // Instant UI + Cache Update
    const updated = [tempTodo, ...todos];
    setTodos(updated);
    saveCacheData('jpw_cache_todos', updated);
    setTaskInput('');

    try {
      const res = await API.post('/todos/', { task: tempTodo.task, title: tempTodo.task });
      if (res.data && res.data.id) {
        const finalized = todos.map(t => t.id === tempTodo.id ? { ...res.data, task: res.data.task || res.data.title, is_completed: false } : t);
        setTodos(finalized);
        saveCacheData('jpw_cache_todos', finalized);
      }
    } catch (err) {
      console.warn('Offline task saved to local cache');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTodo = async (id) => {
    const updated = todos.map(t => t.id === id ? { ...t, is_completed: !t.is_completed, completed: !t.is_completed } : t);
    setTodos(updated);
    saveCacheData('jpw_cache_todos', updated);

    try {
      await API.patch(`/todos/${id}/toggle`);
    } catch (err) {
      console.warn('Toggled locally');
    }
  };

  const handleDeleteTodo = async (id) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    saveCacheData('jpw_cache_todos', updated);

    try {
      await API.delete(`/todos/${id}`);
    } catch (err) {
      console.warn('Deleted locally');
    }
  };

  const filteredTodos = todos.filter(t => {
    const taskName = (t.task || t.title || '').toLowerCase();
    const matchesSearch = taskName.includes(searchTerm.toLowerCase());
    const isDone = t.is_completed || t.completed;
    if (filter === 'pending') return matchesSearch && !isDone;
    if (filter === 'completed') return matchesSearch && isDone;
    return matchesSearch;
  });

  const pendingCount = todos.filter(t => !(t.is_completed || t.completed)).length;
  const completedCount = todos.filter(t => (t.is_completed || t.completed)).length;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="page-header">
          <div>
            <h1>Tasks & <span>To-Dos</span></h1>
            <p className="subtitle">Track daily development priorities, revisions, and operational targets.</p>
          </div>
        </header>

        <div className="add-todo-card">
          <form onSubmit={handleAddTodo} className="todos-main-form">
            <div className="todo-input-wrap">
              <input
                type="text"
                placeholder="What do you need to get done today?"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Plus size={18} /> {loading ? 'Adding...' : 'Add Task'}
            </button>
          </form>
        </div>

        <div className="todos-control-bar">
          <div className="filter-chips">
            <button 
              className={`chip ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({todos.length})
            </button>
            <button 
              className={`chip ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({pendingCount})
            </button>
            <button 
              className={`chip ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({completedCount})
            </button>
          </div>

          <div className="search-bar">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="todos-list-container">
          {filteredTodos.length === 0 ? (
            <div className="empty-state">
              <CheckSquare size={42} color="#334155" />
              <p>No tasks matching this filter. Keep it up!</p>
            </div>
          ) : (
            <div className="todos-grid">
              {filteredTodos.map((todo) => {
                const isDone = todo.is_completed || todo.completed;
                return (
                  <div key={todo.id} className={`todo-page-card ${isDone ? 'done' : ''}`}>
                    <button 
                      className="toggle-task-btn" 
                      onClick={() => handleToggleTodo(todo.id)}
                    >
                      {isDone ? (
                        <CheckCircle2 size={20} color="#10b981" />
                      ) : (
                        <Circle size={20} color="#94a3b8" />
                      )}
                    </button>

                    <span className="task-content">{todo.task || todo.title}</span>

                    <button 
                      className="delete-task-btn" 
                      onClick={() => handleDeleteTodo(todo.id)}
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}