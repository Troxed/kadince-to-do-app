import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Account.css';

const Account = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [isEmailEdit, setIsEmailEdit] = useState(false);
    const [isPasswordEdit, setIsPasswordEdit] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/account/details', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUsername(response.data.username);
                setEmail(response.data.email);
            } catch (err) {
                setMessage('Error fetching user details');
            }
        };

        fetchUserDetails();
    }, []);

    const handleEmailChange = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/account/email', { email }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage('Email updated successfully');
            setIsEmailEdit(false);
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
            setIsPasswordEdit(false);
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
        <div className="account-page">
            <h2 className="account-title">Account Settings</h2>
            <div className="account-container">
                {message && <p>{message}</p>}
                <div className="user-details">
                    <div className="user-info">
                        <p className="username-value">{username}</p>
                    </div>
                    <div className="user-info">
                        <p className="user-email-value">{email}</p>
                    </div>
                </div>
                <div className="account-actions">
                    {isEmailEdit ? (
                        <form onSubmit={handleEmailChange}>
                            <div className="form-group">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <div className="button-group">
                                    <button type="button" onClick={() => setIsEmailEdit(false)}>Cancel</button>
                                    <button type="submit">Save</button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <button onClick={() => setIsEmailEdit(true)}>Change Email</button>
                    )}
                    {isPasswordEdit ? (
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <div className="button-group">
                                    <button type="button" onClick={() => setIsPasswordEdit(false)}>Cancel</button>
                                    <button type="submit">Save</button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <button onClick={() => setIsPasswordEdit(true)}>Change Password</button>
                    )}
                    <button onClick={handleDeleteAccount} className="delete-button">Delete Account</button>
                    <button onClick={handleResetAccount} className="reset-button">Reset Account</button>
                </div>
            </div>
        </div>
    );
};

export default Account;