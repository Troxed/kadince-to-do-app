import React, { useState } from 'react';
import Modal from 'react-modal';
import apiClient from '../api/axios';
import './Modal/Modal.css';

const AccountSettingsModal = ({ show, handleClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUpdateEmail = async () => {
        try {
            const response = await apiClient.put('/account/email', { email });
            alert(response.data.message);
        } catch (error) {
            alert('Failed to update email');
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        try {
            const response = await apiClient.put('/account/password', { password, newPassword });
            alert(response.data.message);
        } catch (error) {
            alert('Failed to change password');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const response = await apiClient.delete('/account');
            alert(response.data.message);
        } catch (error) {
            alert('Failed to delete account');
        }
    };

    return (
        <Modal isOpen={show} onRequestClose={handleClose} className="todo-modal" overlayClassName="modal-overlay">
            <h2>Account Settings</h2>
            <div className="form-group">
                <label>Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button onClick={handleUpdateEmail}>Update Email</button>
            </div>
            <div className="form-group">
                <label>Current Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <label>New Password:</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <label>Confirm New Password:</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button onClick={handleChangePassword}>Change Password</button>
            </div>
            <button onClick={handleDeleteAccount}>Delete Account</button>
            <button onClick={handleClose} className="close-button">Close</button>
        </Modal>
    );
};

export default AccountSettingsModal;
