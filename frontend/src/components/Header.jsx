import React from "react";
import { FaUserCircle, FaSearch } from "react-icons/fa";

const Header = () => {
  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Search submitted");
  };

  return (
    <div className="header-content d-flex align-items-center justify-content-between w-100">
      {/* Search Bar */}
      <form className="search-container" onSubmit={handleSearch}>
        <input type="text" placeholder="Search job sheets, customers..." />
        <button type="submit" className="search-btn" aria-label="Search">
          <FaSearch />
        </button>
      </form>

      {/* User Profile */}
      <div className="user-profile">
        <span className="user-name">Admin</span>
        <FaUserCircle className="user-icon" />
      </div>
    </div>
  );
};

export default Header;
