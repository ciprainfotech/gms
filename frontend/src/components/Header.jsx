import React from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaBell, FaBars } from "react-icons/fa";
import logoIcon from "../assets/logo-icon.svg";
import userAvatar from "../assets/avatar.jpg";

// The Header now accepts a prop to handle the menu toggle click
const Header = ({ onMenuToggle }) => {
    const handleSearch = (e) => {
        e.preventDefault();
        console.log("Search submitted");
    };

    return (
        <div className="header-content">
            {/* Mobile-only Logo: Appears on the left */}
            <Link to="/dashboard" className="header-logo-mobile">
                <img src={logoIcon} alt="Saman Motors Icon" />
            </Link>

            {/* Mobile-only Menu Toggle Button: Will be moved to the far right by CSS */}
            <button
                type="button"
                className="menu-toggle sidebar-mobile-toggle"
                onClick={onMenuToggle}
                aria-label="Toggle sidebar"
            >
                <FaBars />
            </button>

            {/* Search Bar: Will be centered on mobile */}
            <form className="search-container" onSubmit={handleSearch}>
                <button type="submit" className="search-btn" aria-label="Search">
                    <FaSearch />
                </button>
                <input type="text" placeholder="Search job sheets, customers..." />
            </form>

            {/* Header Actions: Grouped on the right */}
            <div className="header-actions">
                <div className="notification-icon" role="button" aria-label="Notifications">
                    <FaBell />
                </div>
                <div className="user-profile" role="button" aria-label="User menu">
                    <div className="user-avatar">
                        <img src={userAvatar} alt="User Avatar" />
                    </div>
                    <span className="user-name">Admin</span>
                </div>
            </div>
        </div>
    );
};

export default Header;