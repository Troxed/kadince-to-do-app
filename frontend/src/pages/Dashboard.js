import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import axios from 'axios';
import apiClient from '../api/axios';
import Modal from '../components/Modal/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faEdit, faCheck, faUndo, faPlus } from '@fortawesome/free-solid-svg-icons';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/Dashboard.css';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

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
    const [reminder, setReminder] = useState(false);
    const [reminderHour, setReminderHour] = useState('12');
    const [reminderMinute, setReminderMinute] = useState('00');
    const [reminderPeriod, setReminderPeriod] = useState('AM');

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
        const reminderTime = `${reminderHour}:${reminderMinute} ${reminderPeriod}`;
        if (editingTodo) {
            response = await axios.put(`http://localhost:5000/todos/${editingTodo.id}`, {
                title,
                description,
                due_date: dueDate,
                priority,
                reminder,
                reminder_time: reminderTime
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTodos(todos.map(todo => todo.id === editingTodo.id ? response.data : todo));
        } else {
            response = await axios.post('http://localhost:5000/todos', {
                title,
                description,
                due_date: dueDate,
                priority,
                reminder,
                reminder_time: reminderTime
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTodos([...todos, response.data]);
        }
        setShowForm(false);
        setEditingTodo(null); // Reset editingTodo to null after creating or updating
        setTitle('');
        setDescription('');
        setDueDate('');
        setPriority('low');
        setReminder(false);
        setReminderHour('12');
        setReminderMinute('00');
        setReminderPeriod('AM');
    } catch (err) {
        setError('Error creating or updating to-do. Please try again.');
    }
};


    const handleEdit = (todo) => {
        console.log('Editing todo:', todo);
        setEditingTodo(todo);
        setTitle(todo.title);
        setDescription(todo.description);
        setDueDate(todo.due_date);
        setPriority(todo.priority);
        setReminder(todo.reminder);
        const [hour, minute, period] = todo.reminder_time.split(/[: ]/);
        setReminderHour(hour);
        setReminderMinute(minute);
        setReminderPeriod(period);
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
        if (filter === 'myDay') return dayjs(todo.due_date).isSame(dayjs(), 'day') && !todo.completed;
        if (filter === 'myWeek') return dayjs(todo.due_date).isSameOrBefore(dayjs().add(7, 'day')) && dayjs(todo.due_date).isAfter(dayjs().subtract(1, 'day')) && !todo.completed;
        return false;
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
                <button onClick={() => setFilter('myDay')} className={filter === 'myDay' ? 'active' : ''}>My Day</button>
                <button onClick={() => setFilter('myWeek')} className={filter === 'myWeek' ? 'active' : ''}>My Week</button>
                <button onClick={() => setFilter('pending')} className={filter === 'pending' ? 'active' : ''}>Pending</button>
                <button onClick={() => setFilter('completed')} className={filter === 'completed' ? 'active' : ''}>Completed</button>
                <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
            </div>
            <div className="view-title">{getTitle()}</div>
            <div className="date-title">{dayjs().format('dddd, MMMM D, YYYY')}</div>
            <button onClick={() => { setEditingTodo(null); setShowForm(true); }} className="create-todo-button" data-tooltip="Create To-Do"><FontAwesomeIcon icon={faPlus} /></button>
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
                                        <p>Reminder: {todo.reminder ? 'Yes' : 'No'}</p>
                                        <button onClick={() => handleEdit(todo)} className="todo-button" data-tooltip="Edit To-Do"><FontAwesomeIcon icon={faEdit} /></button>
                                        <button onClick={() => handleDelete(todo.id)} className="todo-button" data-tooltip="Delete To-Do"><FontAwesomeIcon icon={faTrashAlt} /></button>
                                        <button onClick={() => handleComplete(todo)} className="todo-button" data-tooltip={todo.completed ? "Mark as Incomplete" : "Mark as Complete"}>{todo.completed ? <FontAwesomeIcon icon={faUndo} /> : <FontAwesomeIcon icon={faCheck} />}</button>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
            </ul>
            <Modal show={showForm} handleClose={() => setShowForm(false)} title={editingTodo ? 'Edit To-Do' : 'Create To-Do'}>
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
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>
                            Email reminder?
                            <input
                                type="checkbox"
                                checked={reminder}
                                onChange={(e) => setReminder(e.target.checked)}
                            />
                        </label>
                        {reminder && (
                            <div className="form-group">
                                <label>Reminder Time:</label>
                                <div className="reminder-time">
                                    <select value={reminderHour} onChange={(e) => setReminderHour(e.target.value)}>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        ))}
                                    </select>
                                    <span>:</span>
                                    <select value={reminderMinute} onChange={(e) => setReminderMinute(e.target.value)}>
                                        {Array.from({ length: 60 }, (_, i) => (
                                            <option key={i} value={i < 10 ? `0${i}` : i}>{i < 10 ? `0${i}` : i}</option>
                                        ))}
                                    </select>
                                    <select value={reminderPeriod} onChange={(e) => setReminderPeriod(e.target.value)}>
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                    <button type="submit">{editingTodo ? 'Update' : 'Create'}</button>
                </form>
            </Modal>
        </div>
    );
};

export default Dashboard;
