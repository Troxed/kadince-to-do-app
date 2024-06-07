import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';

const ToDoList = () => {
  const [todos, setTodos] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    if (token) {
      apiClient.get('/todos', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => setTodos(response.data))
        .catch(error => console.error(error));
    }
  }, [token]);

  // Add more functions for creating, updating, and deleting todos

  return (
    <div>
      <h1>To-Do List</h1>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default ToDoList;
