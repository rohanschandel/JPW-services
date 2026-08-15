import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import { Plus, Trash2, CheckCircle2, Circle, CheckSquare, Search, Filter } from 'lucide-react';
import './TodosPage.css';

export default function TodosPage() {
  const [todos, setTodos] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'completed'
  const [loading, setLoading] = useState(false);

  const fetchTodos = async () => {
    try {
      const res = await API.get('/todos/');
      setTodos(res.data);
    } catch (err) {
      console.error('Failed to load todos:', err);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    setLoading(true);
    try {
      const res = await API.post('/todos/', { task: taskInput.trim() });
      setTodos([res.data, ...todos]);
      setTaskInput('');
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTodo = async (id) => {
    try {
      await API.patch(`/todos/${id}/toggle`);
      setTodos(todos.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t));
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await API.delete(`/todos/${id}`);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const filteredTodos = todos.filter(t => {
    const matchesSearch = t.task.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'pending') return matchesSearch && !t.is_completed;
    if (filter === 'completed') return matchesSearch && t.is_completed;
    return matchesSearch;
  });

  const pendingCount = todos.filter(t => !t.is_completed).length;
  const completedCount = todos.filter(t => t.is_completed).length;

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

        {/* Task Creator Form */}
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

        {/* Filter Controls & Search */}
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

        {/* Tasks List */}
        <div className="todos-list-container">
          {filteredTodos.length === 0 ? (
            <div className="empty-state">
              <CheckSquare size={42} color="#334155" />
              <p>No tasks matching this filter. Keep it up!</p>
            </div>
          ) : (
            <div className="todos-grid">
              {filteredTodos.map((todo) => (
                <div key={todo.id} className={`todo-page-card ${todo.is_completed ? 'done' : ''}`}>
                  <button 
                    className="toggle-task-btn" 
                    onClick={() => handleToggleTodo(todo.id)}
                  >
                    {todo.is_completed ? (
                      <CheckCircle2 size={20} color="#10b981" />
                    ) : (
                      <Circle size={20} color="#94a3b8" />
                    )}
                  </button>

                  <span className="task-content">{todo.task}</span>

                  <button 
                    className="delete-task-btn" 
                    onClick={() => handleDeleteTodo(todo.id)}
                    title="Delete task"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}