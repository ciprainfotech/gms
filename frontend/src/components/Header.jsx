import React from "react";
import { FaUserCircle, FaSearch } from "react-icons/fa";
// Removed App.css import here

const Header = () => {
  // Placeholder search handler
  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Search submitted (not implemented)");
    // Implement actual search logic here - potentially using context or state lifting
  };

  return (
    // The 'header' class should be applied in App.jsx's layout div
    <div className="header-content d-flex align-items-center justify-content-between w-100">
      {/* Search Bar */}
      <form className="search-container" onSubmit={handleSearch}>
        <input type="text" placeholder="Search job sheets, customers..." />
        <button type="submit" className="search-btn">
          <FaSearch />
        </button>
      </form>

      {/* User Profile */}
      <div className="user-profile">
        <span>Admin</span> {/* Replace with dynamic username later */}
        <FaUserCircle className="user-icon" />
        {/* Add dropdown/logout functionality later */}
      </div>
    </div>
  );
};

export default Header;