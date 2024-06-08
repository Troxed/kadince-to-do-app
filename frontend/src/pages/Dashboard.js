import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import Modal from '../components/Modal/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCheck, faUndo } from '@fortawesome/free-solid-svg-icons';
import { format, isToday, isTomorrow, isYesterday, parseISO, isBefore, subDays } from 'date-fns';
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
        if (filter === 'completed') {
            return todo.completed;
        } else if (filter === 'pending') {
            return !todo.completed;
        } else {
            return true;
        }
    });

    const groupTodosByDate = (todos) => {
        const overdue = [];
        const grouped = todos.reduce((groups, todo) => {
            const date = todo.due_date || 'No due date';
            const todoDate = date !== 'No due date' ? parseISO(date) : null;
            if (todoDate && isBefore(todoDate, subDays(new Date(), 1))) {
                overdue.push(todo);
            } else {
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(todo);
            }
            return groups;
        }, {});
        return { overdue, grouped };
    };

    const formatDate = (dateString) => {
        const date = parseISO(dateString);
        if (isToday(date)) {
            return 'Today';
        } else if (isTomorrow(date)) {
            return 'Tomorrow';
        } else if (isYesterday(date)) {
            return 'Yesterday';
        } else {
            return format(date, 'EEEE, MMMM do');
        }
    };

    const { overdue, grouped } = groupTodosByDate(filteredTodos);

    const currentDate = format(new Date(), 'EEEE, MMMM do, yyyy');

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="dashboard-container">
            <h2>{currentDate}</h2>
            <div className="filters">
                <button onClick={() => setFilter('all')}>All</button>
                <button onClick={() => setFilter('completed')}>Completed</button>
                <button onClick={() => setFilter('pending')}>Pending</button>
            </div>
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
                {overdue.length > 0 && (
                    <div>
                        <h3 className="todo-date-header">Overdue</h3>
                        {overdue.map(todo => (
                            <div key={todo.id} className="todo-item">
                                <h3>{todo.title}</h3>
                                <p>{todo.description}</p>
                                <p>Due: {todo.due_date || 'No due date'}</p>
                                <p>Priority: {todo.priority}</p>
                                <p>Status: {todo.completed ? 'Completed' : 'Pending'}</p>
                                <button onClick={() => handleEdit(todo)}><FontAwesomeIcon icon={faEdit} /></button>
                                <button onClick={() => handleDelete(todo.id)}><FontAwesomeIcon icon={faTrash} /></button>
                                <button onClick={() => handleComplete(todo)}>
                                    <FontAwesomeIcon icon={todo.completed ? faUndo : faCheck} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {Object.keys(grouped).map(date => (
                    <div key={date}>
                        <h3 className="todo-date-header">{date !== 'No due date' ? formatDate(date) : date}</h3>
                        {grouped[date].map(todo => (
                            <div key={todo.id} className="todo-item">
                                <h3>{todo.title}</h3>
                                <p>{todo.description}</p>
                                <p>Due: {todo.due_date || 'No due date'}</p>
                                <p>Priority: {todo.priority}</p>
                                <p>Status: {todo.completed ? 'Completed' : 'Pending'}</p>
                                <button onClick={() => handleEdit(todo)}><FontAwesomeIcon icon={faEdit} /></button>
                                <button onClick={() => handleDelete(todo.id)}><FontAwesomeIcon icon={faTrash} /></button>
                                <button onClick={() => handleComplete(todo)}>
                                    <FontAwesomeIcon icon={todo.completed ? faUndo : faCheck} />
                                </button>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
