import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import '../styles/Dashboard.css';
import Modal from '../components/Modal/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faEdit, faCheck, faUndo, faPlus } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'; // Import the plugin
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'; // Import the plugin

dayjs.extend(isSameOrBefore); // Extend dayjs with the plugin
dayjs.extend(isSameOrAfter); // Extend dayjs with the plugin

const Dashboard = () => {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('myDay');
    const [showForm, setShowForm] = useState(false);
    const [editingTodo, setEditingTodo] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('low');

    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await apiClient.get('/todos', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTodos(response.data);
                setLoading(false);
            } catch (err) {
                setError('Error fetching to-dos. Please try again.');
                setLoading(false);
            }
        };

        fetchTodos();
    }, []);

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

    const filteredTodos = todos.filter(todo => {
        if (filter === 'all') return true;
        if (filter === 'pending') return !todo.completed;
        if (filter === 'completed') return todo.completed;
        if (filter === 'myDay') return !todo.completed && dayjs(todo.due_date).isSame(dayjs(), 'day');
        if (filter === 'myWeek') return !todo.completed && dayjs(todo.due_date).isSameOrBefore(dayjs().add(7, 'day')) && dayjs(todo.due_date).isAfter(dayjs().subtract(1, 'day'));
        return false; // Ensures a boolean value is returned
    });

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const getTitle = () => {
        switch (filter) {
            case 'myDay':
                return 'My Day';
            case 'myWeek':
                return 'My Week';
            case 'pending':
                return 'Pending';
            case 'completed':
                return 'Completed';
            default:
                return 'All To-Dos';
        }
    };

    return (
        <div className="dashboard-container">
            <div className="filters">
                <button onClick={() => setFilter('myDay')}>My Day</button>
                <button onClick={() => setFilter('myWeek')}>My Week</button>
                <button onClick={() => setFilter('pending')}>Pending</button>
                <button onClick={() => setFilter('completed')}>Completed</button>
                <button onClick={() => setFilter('all')}>All</button>
            </div>
            <div className="view-title">{getTitle()}</div>
            <div className="date-title">{dayjs().format('dddd, MMMM D, YYYY')}</div>
            <button onClick={() => setShowForm(true)} className="create-todo-button" title="Create To-Do">
                <FontAwesomeIcon icon={faPlus} />
            </button>
            <ul className="todo-list">
                {Object.entries(filteredTodos.reduce((acc, todo) => {
                    const dateKey = dayjs(todo.due_date).format('YYYY-MM-DD');
                    if (!acc[dateKey]) acc[dateKey] = [];
                    acc[dateKey].push(todo);
                    return acc;
                }, {}))
                    .sort(([a], [b]) => new Date(a) - new Date(b))
                    .map(([date, todos]) => (
                        <li key={date}>
                            {filter !== 'myDay' && (
                                <h3>{dayjs(date).isSame(dayjs(), 'day') ? 'Today' : dayjs(date).isSame(dayjs().add(1, 'day'), 'day') ? 'Tomorrow' : dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day') ? 'Yesterday' : dayjs(date).format('dddd, MMMM D')}</h3>
                            )}
                            <ul className="todo-date-group">
                                {todos.map(todo => (
                                    <li key={todo.id} className="todo-item">
                                        <h3>{todo.title}</h3>
                                        <p>{todo.description}</p>
                                        <p>Due: {todo.due_date || 'No due date'}</p>
                                        <p>Priority: {todo.priority}</p>
                                        <button onClick={() => handleEdit(todo)} title="Edit"><FontAwesomeIcon icon={faEdit} /></button>
                                        <button onClick={() => handleDelete(todo.id)} title="Delete"><FontAwesomeIcon icon={faTrashAlt} /></button>
                                        <button onClick={() => handleComplete(todo)} title={todo.completed ? "Incomplete" : "Complete"}>{todo.completed ? <FontAwesomeIcon icon={faUndo} /> : <FontAwesomeIcon icon={faCheck} />}</button>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
            </ul>
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
        </div>
    );
};

export default Dashboard;
