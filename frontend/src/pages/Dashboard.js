import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import Modal from '../components/Modal/Modal';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingTodo, setEditingTodo] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('low');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await apiClient.get('/todos', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { filter }
                });
                setTodos(response.data);
                setLoading(false);
            } catch (err) {
                setError('Error fetching to-dos. Please try again.');
                setLoading(false);
            }
        };

        fetchTodos();
    }, [filter]);

    const handleCreateOrUpdateTodo = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            let response;
            if (editingTodo) {
                response = await apiClient.put(`/todos/${editingTodo.id}`, {
                    title,
                    description,
                    due_date: dueDate,
                    priority,
                    completed: editingTodo.completed
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTodos(todos.map(todo => todo.id === editingTodo.id ? response.data : todo));
            } else {
                response = await apiClient.post('/todos', {
                    title,
                    description,
                    due_date: dueDate,
                    priority
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTodos([...todos, response.data]);
            }
            setShowForm(false);
            setEditingTodo(null);
            setTitle('');
            setDescription('');
            setDueDate('');
            setPriority('low');
        } catch (err) {
            setError('Error creating or updating to-do. Please try again.');
        }
    };

    const handleEdit = (todo) => {
        setEditingTodo(todo);
        setTitle(todo.title);
        setDescription(todo.description);
        setDueDate(todo.due_date);
        setPriority(todo.priority);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await apiClient.delete(`/todos/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTodos(todos.filter(todo => todo.id !== id));
        } catch (err) {
            setError('Error deleting to-do. Please try again.');
        }
    };

    const handleComplete = async (todo) => {
        try {
            const token = localStorage.getItem('token');
            const response = await apiClient.put(`/todos/${todo.id}`, {
                completed: !todo.completed
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTodos(todos.map(t => t.id === todo.id ? response.data : t));
        } catch (err) {
            setError('Error updating to-do. Please try again.');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="dashboard-container">
            <h2>Dashboard</h2>
            <button onClick={() => {
                setShowForm(true);
                setEditingTodo(null);
                setTitle('');
                setDescription('');
                setDueDate('');
                setPriority('low');
            }}>
                Create To-Do
            </button>
            <div className="filters">
                <button onClick={() => setFilter('all')}>All</button>
                <button onClick={() => setFilter('pending')}>Pending</button>
                <button onClick={() => setFilter('complete')}>Complete</button>
            </div>
            <Modal show={showForm} handleClose={() => setShowForm(false)}>
                <form onSubmit={handleCreateOrUpdateTodo} className="create-todo-form">
                    <div className="form-group">
                        <label>Title:</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Description:</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Due Date:</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Priority:</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                    <button type="submit">{editingTodo ? 'Update' : 'Create'}</button>
                </form>
            </Modal>
            <div className="todos-list">
                {todos.length > 0 ? (
                    todos.map((todo) => (
                        <div key={todo.id} className="todo-item">
                            <h3>{todo.title}</h3>
                            <p>{todo.description}</p>
                            <p>Due: {todo.due_date || 'No due date'}</p>
                            <p>Priority: {todo.priority}</p>
                            <p>Status: {todo.completed ? 'Completed' : 'Pending'}</p>
                            <button onClick={() => handleEdit(todo)}>Edit</button>
                            <button onClick={() => handleDelete(todo.id)}>Delete</button>
                            <button onClick={() => handleComplete(todo)}>{todo.completed ? 'Mark as Incomplete' : 'Mark as Complete'}</button>
                        </div>
                    ))
                ) : (
                    <p>No to-dos available.</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
