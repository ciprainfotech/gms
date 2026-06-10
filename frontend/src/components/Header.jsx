import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaBell, FaBars, FaUserCircle, FaCog, FaSignOutAlt } from "react-icons/fa";
import logoIcon from "../assets/logo-icon.svg";
import userAvatar from "../assets/avatar.jpg"; // Using a static avatar for now

/**
 * The main application header.
 * @param {object} props
 * @param {function} props.onMenuToggle - Function to toggle the sidebar.
 * @param {function} props.onLogout - Function to handle user logout.
 * @param {object|null} props.user - The currently logged-in user object.
 */
const Header = ({ onMenuToggle, onLogout, user }) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // This handler remains the same
    const handleSearch = (e) => {
        e.preventDefault();
        console.log("Search submitted");
    };
    
    // This effect to handle clicks outside the dropdown remains the same
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    // This logout handler remains the same
    const handleLogoutClick = () => {
        setDropdownOpen(false); // Close dropdown first
        onLogout(); // Call the logout function from App.jsx
    }

    return (
        <div className="header-content">
            <Link to="/dashboard" className="header-logo-mobile">
                <img src={logoIcon} alt="Saman Motors Icon" />
            </Link>

            <button
                type="button"
                className="menu-toggle sidebar-mobile-toggle"
                onClick={onMenuToggle}
                aria-label="Toggle sidebar"
            >
                <FaBars />
            </button>

            <form className="search-container" onSubmit={handleSearch}>
                <button type="submit" className="search-btn" aria-label="Search">
                    <FaSearch />
                </button>
                <input type="text" placeholder="Search job sheets, customers..." />
            </form>

            <div className="header-actions">
                <div className="notification-icon" role="button" aria-label="Notifications">
                    <FaBell />
                </div>

                {/* --- MODIFIED USER DROPDOWN FEATURE --- */}
                <div className="user-profile-container" ref={dropdownRef}>
                    <div
                        className="user-profile"
                        role="button"
                        aria-haspopup="true"
                        aria-expanded={isDropdownOpen}
                        onClick={() => setDropdownOpen(!isDropdownOpen)}
                    >
                        <div className="user-avatar">
                            {/* In the future, you could replace this with a user-specific avatar */}
                            <img src={userAvatar} alt="User Avatar" />
                        </div>
                        {/* MODIFIED: Display the logged-in user's name */}
                        <span className="user-name">{user ? user.name : '...'}</span>
                    </div>

                    {/* MODIFIED: The dropdown now uses dynamic data */}
                     <div className={`user-dropdown ${isDropdownOpen ? 'is-open' : ''}`}>
                            <div className="dropdown-header">
                                {/* Display user's name and email from props */}
                                <span className="dropdown-user-name">{user ? user.name : 'Loading...'}</span>
                                <span className="dropdown-user-email">{user ? user.email : '...'}</span>
                            </div>
                            <hr className="dropdown-divider" />
                            <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                <FaUserCircle className="dropdown-item-icon" />
                                <span>My Profile</span>
                            </Link>
                            <Link to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                <FaCog className="dropdown-item-icon" />
                                <span>Settings</span>
                            </Link>
                            <hr className="dropdown-divider" />
                            <button type="button" className="dropdown-item logout-btn" onClick={handleLogoutClick}>
                                <FaSignOutAlt className="dropdown-item-icon" />
                                <span>Logout</span>
                            </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;