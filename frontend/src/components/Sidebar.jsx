import React from "react";
import { NavLink } from "react-router-dom"; // Use NavLink for active styling
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTachometerAlt, // Dashboard
    faWrench,         // Active Job Sheets
    faFileInvoiceDollar, // Create Invoice
    faTasks,          // Task Dashboard
    faFolderOpen,     // Job Sheets Archive
    faReceipt,        // Invoices List
    faUsers,          // Customers & Vehicles
    faBoxOpen,        // Low Stock Report
    faChartPie        // Analytics & Reports (New)
} from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/saman-logo.png"; // Make sure path is correct
// Removed App.css import here, it should be imported in App.jsx or index.js

const Sidebar = () => {
    // This function applies the 'active' class if the NavLink route matches the current URL
    const navLinkClass = ({ isActive }) => isActive ? "nav-link active" : "nav-link";

    return (
        // The main 'sidebar' class should be applied in App.jsx's layout div
        <div className="sidebar-content"> {/* Added a wrapper for content */}
            <div className="sidebar-header">
                <NavLink to="/dashboard">
                    <img src={logo} alt="Saman Motors Logo" />
                 </NavLink>
            </div>
            <ul className="nav flex-column">
                {/* --- Core Workflow --- */}
                <h6 className="sidebar-heading">Workflow</h6>
                <li className="nav-item">
                    <NavLink to="/dashboard" className={navLinkClass}>
                        <FontAwesomeIcon icon={faTachometerAlt} className="fa-fw me-2" /> Dashboard
                    </NavLink>
                </li>
                 <li className="nav-item">
                    <NavLink to="/active-jobsheets" className={navLinkClass}>
                        <FontAwesomeIcon icon={faWrench} className="fa-fw me-2" /> Active Job Sheets
                    </NavLink>
                </li>
                 <li className="nav-item">
                    <NavLink to="/create-invoice" className={navLinkClass}>
                        <FontAwesomeIcon icon={faFileInvoiceDollar} className="fa-fw me-2" /> Create Invoice
                    </NavLink>
                </li>
                {/* <li className="nav-item"> // Removed Task Dashboard for now as page wasn't fully built
                    <NavLink to="/task-dashboard" className={navLinkClass}>
                        <FontAwesomeIcon icon={faTasks} className="fa-fw me-2" /> Task Dashboard
                    </NavLink>
                </li> */}


                {/* --- Management/Admin --- */}
                <h6 className="sidebar-heading">Management</h6>
                 <li className="nav-item">
                    <NavLink to="/job-sheets" className={navLinkClass}>
                        <FontAwesomeIcon icon={faFolderOpen} className="fa-fw me-2" /> Job Sheets Archive
                    </NavLink>
                </li>
                 <li className="nav-item">
                    <NavLink to="/invoices" className={navLinkClass}>
                        <FontAwesomeIcon icon={faReceipt} className="fa-fw me-2" /> Invoices
                    </NavLink>
                </li>
                 <li className="nav-item">
                    <NavLink to="/customers-vehicles" className={navLinkClass}>
                        <FontAwesomeIcon icon={faUsers} className="fa-fw me-2" /> Customers & Vehicles
                    </NavLink>
                </li>


                {/* --- Reports & Others --- */}
                 <h6 className="sidebar-heading">Reports & Tools</h6>
                <li className="nav-item">
                    <NavLink to="/stock" className={navLinkClass}>
                        <FontAwesomeIcon icon={faBoxOpen} className="fa-fw me-2" /> Manage Stock
                    </NavLink>
                </li>
                <li className="nav-item">
                    <NavLink to="/purchase-entry" className={navLinkClass}>
                        <FontAwesomeIcon icon={faBoxOpen} className="fa-fw me-2" /> Record Purchase
                    </NavLink>
                </li>
                <li className="nav-item">
                    <NavLink to="/purchase-history" className={navLinkClass}>
                        <FontAwesomeIcon icon={faBoxOpen} className="fa-fw me-2" /> Purchase History
                    </NavLink>
                </li>
                 <li className="nav-item">
                     <NavLink to="/analytics-reports" className={navLinkClass}>
                         <FontAwesomeIcon icon={faChartPie} className="fa-fw me-2" /> Analytics & Reports
                     </NavLink>
                 </li>
                 {/* Add other links like Settings, User Management etc. later */}

            </ul>
        </div>
    );
};

export default Sidebar;