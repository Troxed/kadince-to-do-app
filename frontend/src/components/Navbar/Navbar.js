import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import kadinceLogo from '../../assets/images/kadince-logo.svg';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <img src={kadinceLogo} alt="Kadince Logo" className="kadince-logo" />
                </Link>
                <h1 className="navbar-title">To Do</h1>
                <div className="navbar-links">
                    {isAuthenticated ? (
                        <>
                            <Link to="/account" className="navbar-link">Account</Link>
                            <button onClick={handleLogout} className="navbar-button">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/" className="navbar-link">Login</Link>
                            <Link to="/signup" className="navbar-link">Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
