import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api.js'; // IMPORTED: Our new API service

// Import assets from the root /assets folder (paths assumed correct)
import Logo from '../assets/logo.svg';
import MechanicAvatar from '../assets/mechanic-avatar.png';
import UserIcon from '../assets/user-icon.svg';
import KeyIcon from '../assets/key-icon.svg';
import EyeOpenIcon from '../assets/eye-open.svg';
import EyeClosedIcon from '../assets/eye-closed.svg';
import GearIcon from '../assets/tool-gear.svg';
import WrenchIcon from '../assets/tool-wrench.svg';
import PistonIcon from '../assets/tool-piston.svg';

// Ensure this CSS path is correct for your project structure
import '../AuthPage.css';

// Self-contained animated spanner icon (Unchanged)
const SpannerIcon = () => (
    <svg className="quantum-spanner-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
);

// This component now accepts the onLoginSuccess prop from App.jsx
const AuthPage = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, error, success
    const [errorMessage, setErrorMessage] = useState(''); // ADDED: State for API error messages

    const blueprintPanelRef = useRef(null);

    // Effect for entry animations & 3D parallax (Unchanged)
    useEffect(() => {
        document.body.classList.add('auth-page-active');
        const container = document.querySelector('.login-container');
        const timer = setTimeout(() => {
            if (container) container.classList.add('loaded');
        }, 100);

        const handleMouseMove = (e) => {
            if (!blueprintPanelRef.current || 'ontouchstart' in window) return;
            const { clientX, clientY, currentTarget } = e;
            const { left, top, width, height } = currentTarget.getBoundingClientRect();
            const x = (clientX - left - width / 2) / (width / 2);
            const y = (clientY - top - height / 2) / (height / 2);
            currentTarget.style.setProperty('--mouse-x', x);
            currentTarget.style.setProperty('--mouse-y', y);
        };
        
        const panel = blueprintPanelRef.current;
        if (panel) panel.addEventListener('mousemove', handleMouseMove);

        return () => {
            document.body.classList.remove('auth-page-active');
            clearTimeout(timer);
            if (panel) panel.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // MODIFIED: handleLogin now uses the API
    const handleLogin = (e) => {
        e.preventDefault();
        if (status === 'loading' || status === 'success') return;
        console.log('[Frontend] Attempting login with:', { email, password });
        
        setStatus('loading');
        setErrorMessage('');

        // This 3s delay MUST match the button's loading animation.
        // The API call happens inside this timed window.
        setTimeout(async () => {
            try {
                const response = await api.post('/auth/login', { email, password });
                const data = await response.json();

                if (response.ok && data.success) {
                    setStatus('success');
                    // The onLoginSuccess prop is called after the internal success animation starts.
                    // It now passes the user data up to App.jsx.
                    setTimeout(() => {
                        onLoginSuccess(data);
                    }, 1500); // This delay allows the user to see the success message
                } else {
                    // Handle API-level errors (e.g., suspended account or invalid credentials)
                    const isSuspended = data.code === 'GARAGE_SUSPENDED' || response.status === 403;
                    const msg = isSuspended 
                        ? (data.message || '🔒 Account Suspended: Your garage workspace subscription has been suspended by Super Admin. Contact support.') 
                        : (data.message || 'Login failed. Please check your credentials.');
                    
                    setErrorMessage(msg);
                    setStatus('error');
                    setTimeout(() => setStatus('idle'), isSuspended ? 6000 : 3000);
                }
            } catch (err) {
                // Handle network/server errors
                console.error('Login API error:', err);
                setErrorMessage('Unable to connect to the server. Please try again later.');
                setStatus('error');
                setTimeout(() => setStatus('idle'), 2000);
            }
        }, 3000);
    };

    return (
        <>
            {/* Background Icons (Unchanged) */}
            <ul className="background-icons">
                <li><img src={GearIcon} alt="gear" /></li>
                <li><img src={WrenchIcon} alt="wrench" /></li>
                <li><img src={PistonIcon} alt="piston" /></li>
                <li><img src={GearIcon} alt="gear" /></li>
                <li><img src={WrenchIcon} alt="wrench" /></li>
                <li><img src={PistonIcon} alt="piston" /></li>
                <li><img src={GearIcon} alt="gear" /></li>
                <li><img src={WrenchIcon} alt="wrench" /></li>
            </ul>

            <div className={`auth-page-wrapper status-${status}`}>
                <div className="login-container">
                    {/* Blueprint Panel (Unchanged) */}
                    <div className="blueprint-panel" ref={blueprintPanelRef}>
                        <div className="blueprint-glare"></div>
                        <div className="blueprint-grid-feed"></div>
                        <div className="blueprint-content">
                            <div className="avatar-energy-conduit">
                                <div className="ring"></div>
                                <div className="ring"></div>
                                <div className="ring"></div>
                                <img src={MechanicAvatar} alt="Mechanic Avatar" className="mechanic-avatar" />
                            </div>
                            <h1 className="blueprint-title">CGMS</h1>
                            <p className="blueprint-subtitle">Garage Management System</p>
                        </div>
                    </div>

                    <div className="control-panel">
                        <div className="control-panel-content">
                            {/* Success State (Unchanged) */}
                            <div className="success-state">
                                <svg className="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                                </svg>
                                <h3>Login Successful</h3>
                                <p>System Online. Redirecting...</p>
                            </div>
                            
                            {/* Login Form and inputs */}
                            <div className="login-state">
                                <div className="console-header">
                                    <img src={Logo} alt="CGMS Logo" className="console-logo" />
                                    <h2 className="console-title">System Login</h2>
                                </div>
                                <p className="console-subtitle">Enter your credentials to access the dashboard.</p>
                                <form onSubmit={handleLogin} noValidate>
                                    <div className="input-wrapper">
                                        <input id="email" type="email" className="form-control-custom" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={status !== 'idle' && status !== 'error'}/>
                                        <img src={UserIcon} alt="user icon" className="input-icon" />
                                    </div>
                                    <div className="input-wrapper">
                                        <input id="password" type={showPassword ? 'text' : 'password'} className="form-control-custom" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={status !== 'idle' && status !== 'error'}/>
                                        <img src={KeyIcon} alt="key icon" className="input-icon" />
                                        <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} disabled={status !== 'idle' && status !== 'error'}>
                                            <img src={showPassword ? EyeClosedIcon : EyeOpenIcon} alt="Toggle Visibility" />
                                        </button>
                                    </div>
                                    {/* MODIFIED: Using dynamic error message state */}
                                    {status === 'error' && <div className="alert-error">{errorMessage}</div>}
                                    <button type="submit" className="login-btn" disabled={status === 'loading' || status === 'success'}>
                                        <span className="btn-text">{status === 'loading' ? 'LOGGING IN...' : 'LOGIN'}</span>
                                        <div className="btn-progress-track">
                                            <div className="btn-progress-bar"></div>
                                            <SpannerIcon />
                                        </div>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Footer (Unchanged) */}
                <footer className="auth-footer">
                    © {new Date().getFullYear()} CIPRA Infotech Pvt. Ltd. All Rights Reserved.
                </footer>
            </div>
        </>
    );
};

export default AuthPage;