import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Account.css';

const Account = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleEmailChange = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/account/email', { email }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage('Email updated successfully');
        } catch (err) {
            setMessage('Error updating email');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/account/password', { password }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage('Password updated successfully');
        } catch (err) {
            setMessage('Error updating password');
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.delete('http://localhost:5000/account/delete', {
                headers: { Authorization: `Bearer ${token}` },
            });
            localStorage.removeItem('token');
            setMessage('Account deleted successfully');
            navigate('/');
        } catch (err) {
            setMessage('Error deleting account');
        }
    };

    const handleResetAccount = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/account/reset', {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage('Account reset successfully');
        } catch (err) {
            setMessage('Error resetting account');
        }
    };

    return (
        <div className="account-container">
            <h2>Account Settings</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleEmailChange}>
                <div className="form-group">
                    <label>Change Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit">Update Email</button>
                </div>
            </form>
            <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                    <label>Change Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Update Password</button>
                </div>
            </form>
            <button onClick={handleDeleteAccount} className="delete-button">Delete Account</button>
            <button onClick={handleResetAccount} className="reset-button">Reset Account</button>
        </div>
    );
};

export default Account;
