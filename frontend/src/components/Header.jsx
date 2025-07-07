import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaBell, FaBars, FaUserCircle, FaCog, FaSignOutAlt } from "react-icons/fa";
import logoIcon from "../assets/logo-icon.svg";
import userAvatar from "../assets/avatar.jpg";

// The Header now accepts 'onLogout' in addition to 'onMenuToggle'
const Header = ({ onMenuToggle, onLogout }) => {
    // State to manage the user dropdown visibility
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    
    // Ref to detect clicks outside the dropdown
    const dropdownRef = useRef(null);

    const handleSearch = (e) => {
        e.preventDefault();
        console.log("Search submitted");
    };
    
    // Effect to handle closing the dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        // Add event listener when the dropdown is open
        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        // Cleanup the event listener on component unmount or when dropdown closes
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

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

                {/* --- USER DROPDOWN FEATURE --- */}
                <div className="user-profile-container" ref={dropdownRef}>
                    <div
                        className="user-profile"
                        role="button"
                        aria-haspopup="true"
                        aria-expanded={isDropdownOpen}
                        onClick={() => setDropdownOpen(!isDropdownOpen)}
                    >
                        <div className="user-avatar">
                            <img src={userAvatar} alt="User Avatar" />
                        </div>
                        <span className="user-name">Admin</span>
                    </div>

                    {/* Conditionally render the dropdown menu */}
                    {isDropdownOpen && (
                        <div className="user-dropdown">
                            <div className="dropdown-header">
                                <span className="dropdown-user-name">Admin</span>
                                <span className="dropdown-user-email">admin@garage.com</span>
                            </div>
                            <hr className="dropdown-divider" />
                            <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                <FaUserCircle className="dropdown-item-icon" />
                                My Profile
                            </Link>
                            <Link to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                <FaCog className="dropdown-item-icon" />
                                Settings
                            </Link>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item logout-btn" onClick={handleLogoutClick}>
                                <FaSignOutAlt className="dropdown-item-icon" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header;