import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api.js';

import Logo from '../assets/cipra-logo.png';
import MechanicAvatar from '../assets/mechanic-avatar.png';

import '../AuthPage.css';

// Outline Icons
const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

const EyeOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const EyeClosedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

const QuantumSpannerIcon = () => (
    <svg className="quantum-spanner-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
);

const AlertCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);

const AuthPage = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState('idle'); 
    const [errorMessage, setErrorMessage] = useState('');
    const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
    const [touched, setTouched] = useState({ email: false, password: false });
    
    const wrapperRef = useRef(null);
    const ANIM_DURATION = 2500;

    useEffect(() => {
        document.body.classList.add('auth-page-active');
        const container = document.querySelector('.auth-page-wrapper');
        const timer = setTimeout(() => {
            if (container) container.classList.add('loaded');
        }, 100);

        const handleMouseMove = (e) => {
            if (!wrapperRef.current || 'ontouchstart' in window) return;
            const x = (e.clientX / window.innerWidth) * 2 - 1; 
            const y = (e.clientY / window.innerHeight) * 2 - 1; 
            
            const avatar = wrapperRef.current.querySelector('.avatar-energy-conduit');
            if (avatar) {
                avatar.style.setProperty('--mouse-x', x);
                avatar.style.setProperty('--mouse-y', y);
            }
        };
        
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            document.body.classList.remove('auth-page-active');
            clearTimeout(timer);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const validateField = (name, value) => {
        if (name === 'email') {
            if (!value.trim()) return 'Email address is required.';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email address.';
        }
        if (name === 'password') {
            if (!value) return 'Password is required.';
            if (value.length < 6) return 'Password must be at least 6 characters.';
        }
        return '';
    };

    const handleEmailChange = (val) => {
        setEmail(val);
        if (touched.email) setFieldErrors(prev => ({ ...prev, email: validateField('email', val) }));
    };

    const handlePasswordChange = (val) => {
        setPassword(val);
        if (touched.password) setFieldErrors(prev => ({ ...prev, password: validateField('password', val) }));
    };

    const handleBlur = (field) => {
        const val = field === 'email' ? email : password;
        setTouched(prev => ({ ...prev, [field]: true }));
        setFieldErrors(prev => ({ ...prev, [field]: validateField(field, val) }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        const emailErr = validateField('email', email);
        const passErr = validateField('password', password);
        
        setTouched({ email: true, password: true });
        setFieldErrors({ email: emailErr, password: passErr });
        
        if (emailErr || passErr) return;

        setStatus('loading');
        setErrorMessage('');

        const startTime = Date.now();
        let apiResult = null;
        let apiError = null;

        try {
            const response = await api.post('/auth/login', { email, password });
            
            // fetch doesn't throw on 4xx/5xx, so we must check response.ok
            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('Invalid response from server.');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Invalid credentials or server error.');
            }
            
            apiResult = data;
        } catch (error) {
            apiError = error;
        }

        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, ANIM_DURATION - elapsed);

        setTimeout(() => {
            if (apiError) {
                setStatus('error');
                // The error is a native JS Error object because we threw it, not an Axios error
                setErrorMessage(apiError.message || 'Invalid credentials or server error.');
                setPassword('');
            } else {
                setStatus('success');
                localStorage.setItem('token', apiResult.token);
                setTimeout(() => {
                    onLoginSuccess(apiResult.user);
                }, 1000);
            }
        }, remainingTime);
    };

    // Inline SVGs for background
    const BgGear = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1" style={{width: '100%', height: '100%'}}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
    const BgWrench = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1" style={{width: '100%', height: '100%'}}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>;

    return (
        <>
            <ul className="background-icons">
                <li><BgGear /></li>
                <li><BgWrench /></li>
                <li><BgGear /></li>
                <li><BgWrench /></li>
                <li><BgGear /></li>
                <li><BgWrench /></li>
            </ul>

            <div className="auth-page-wrapper" ref={wrapperRef}>
                <div className="login-container">
                    
                    {/* Left Blueprint Panel */}
                    <div className="blueprint-panel">
                        <div className="blueprint-grid"></div>
                        <div className="ambient-glow"></div>
                        
                        <div className="blueprint-content">
                            <div className="avatar-energy-conduit">
                                <div className="ring"></div>
                                <div className="ring"></div>
                                <div className="ring"></div>
                                <img src={MechanicAvatar} alt="Mechanic Avatar" className="mechanic-avatar" />
                            </div>
                            <h1 className="blueprint-title">CIPRA GMS</h1>
                            <p className="blueprint-subtitle">Garage Management System</p>
                        </div>
                    </div>
                    
                    {/* Right Control Panel */}
                    <div className={`control-panel ${status === 'success' ? 'status-success' : ''}`}>
                        
                        <div className="success-state">
                            <svg className="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                            </svg>
                            <h3>Login Successful</h3>
                            <p>System Online. Redirecting...</p>
                        </div>
                        
                        <div className="login-state">
                            
                            <div className="console-header">
                                <div className="brand-lockup">
                                    <img src={Logo} alt="Cipra Infotech" className="cipra-brand-logo" />
                                    <div className="brand-divider"></div>
                                    <span className="brand-product-name">CIPRA GMS</span>
                                </div>
                                
                                <h3 className="statement-title">Garage Management System</h3>
                                <p className="console-statement">Everything your garage needs, in one place.</p>
                                
                                <hr className="console-divider" />
                                
                                <p className="console-welcome">
                                    Welcome back. Please enter your credentials to securely access your workspace.
                                </p>
                            </div>

                            {status === 'error' && (
                                <div className="server-error-box">
                                    <AlertCircleIcon />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            <form onSubmit={handleLogin} noValidate>
                                
                                {/* Email Input */}
                                <div className="auth-input-group">
                                    <label htmlFor="email" className="modern-label">Work Email</label>
                                    <div className="input-wrapper">
                                        <input 
                                            id="email" 
                                            type="email" 
                                            className={`modern-input ${fieldErrors.email ? 'is-invalid' : ''}`}
                                            value={email} 
                                            onChange={(e) => handleEmailChange(e.target.value)} 
                                            onBlur={() => handleBlur('email')}
                                            disabled={status === 'loading'}
                                            placeholder="hello@garage.com"
                                        />
                                        <MailIcon />
                                    </div>
                                    <div className="error-container">
                                        {fieldErrors.email && <div className="field-error-msg">{fieldErrors.email}</div>}
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="auth-input-group">
                                    <label htmlFor="password" className="modern-label">Password</label>
                                    <div className="input-wrapper">
                                        <input 
                                            id="password" 
                                            type={showPassword ? "text" : "password"} 
                                            className={`modern-input ${fieldErrors.password ? 'is-invalid' : ''}`}
                                            value={password} 
                                            onChange={(e) => handlePasswordChange(e.target.value)}
                                            onBlur={() => handleBlur('password')}
                                            disabled={status === 'loading'}
                                            placeholder="••••••••"
                                        />
                                        <LockIcon />
                                        
                                        <button 
                                            type="button" 
                                            className="password-toggle-btn" 
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex="-1"
                                        >
                                            {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                                        </button>
                                    </div>
                                    <div className="error-container">
                                        {fieldErrors.password && <div className="field-error-msg">{fieldErrors.password}</div>}
                                    </div>
                                </div>

                                <div className="form-options">
                                    <label className="remember-me">
                                        <input type="checkbox" disabled={status === 'loading'} />
                                        Remember me
                                    </label>
                                </div>

                                <button 
                                    type="submit" 
                                    className={`login-btn ${status === 'loading' ? 'status-loading' : ''}`}
                                    disabled={status === 'loading'}
                                >
                                    <span className="btn-text">
                                        Secure Login
                                    </span>
                                    {status === 'loading' && (
                                        <div className="btn-progress-track">
                                            <div className="btn-progress-bar"></div>
                                            <QuantumSpannerIcon />
                                        </div>
                                    )}
                                </button>
                            </form>
                            
                        </div>
                    </div>
                </div>

                {/* Page Level Footer */}
                <div className="page-footer">
                    &copy; {new Date().getFullYear()} Cipra Infotech Pvt. Ltd. &middot; All rights reserved.<br/>
                    <span className="brand-text-bold">Cipra GMS</span> &middot; A product by Cipra Infotech
                </div>
            </div>
        </>
    );
};

export default AuthPage;