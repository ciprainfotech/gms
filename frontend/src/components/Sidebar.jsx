import React from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTachometerAlt, faWrench, faFileInvoiceDollar, faFolderOpen,
    faReceipt, faUsers, faBoxOpen, faChartPie, faPaperPlane
} from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/saman-logo.png";

const Sidebar = () => {
    const navLinkClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

    return (
        <>
            <div className="sidebar-header">
                <NavLink to="/dashboard">
                    <img src={logo} alt="Saman Motors Logo" />
                </NavLink>
            </div>
            <div className="sidebar-content">
                <ul className="nav flex-column">
                    <h6 className="sidebar-heading">Workflow</h6>
                    <li className="nav-item">
                        <NavLink to="/dashboard" className={navLinkClass}>
                            <FontAwesomeIcon icon={faTachometerAlt} className="fa-fw" /> Dashboard
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/active-jobsheets" className={navLinkClass}>
                            <FontAwesomeIcon icon={faWrench} className="fa-fw" /> Active Job Sheets
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/create-invoice" className={navLinkClass}>
                            <FontAwesomeIcon icon={faFileInvoiceDollar} className="fa-fw" /> Create Invoice
                        </NavLink>
                    </li>

                    <h6 className="sidebar-heading">Management</h6>
                    <li className="nav-item">
                        <NavLink to="/job-sheets" className={navLinkClass}>
                            <FontAwesomeIcon icon={faFolderOpen} className="fa-fw" /> Job Sheets Archive
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/invoices" className={navLinkClass}>
                            <FontAwesomeIcon icon={faReceipt} className="fa-fw" /> Invoices
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/accounts" className={navLinkClass}>
                            <FontAwesomeIcon icon={faFileInvoiceDollar} className="fa-fw" /> Accounts
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/reminders" className={navLinkClass}>
                            <FontAwesomeIcon icon={faPaperPlane} className="fa-fw" /> Reminders
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/customers-vehicles" className={navLinkClass}>
                            <FontAwesomeIcon icon={faUsers} className="fa-fw" /> Customers & Vehicles
                        </NavLink>
                    </li>

                    <h6 className="sidebar-heading">Reports & Tools</h6>
                    <li className="nav-item">
                        <NavLink to="/stock" className={navLinkClass}>
                            <FontAwesomeIcon icon={faBoxOpen} className="fa-fw" /> Manage Stock
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/purchase-entry" className={navLinkClass}>
                            <FontAwesomeIcon icon={faBoxOpen} className="fa-fw" /> Record Purchase
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/purchase-history" className={navLinkClass}>
                            <FontAwesomeIcon icon={faBoxOpen} className="fa-fw" /> Purchase History
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to="/analytics-reports" className={navLinkClass}>
                            <FontAwesomeIcon icon={faChartPie} className="fa-fw" /> Analytics & Reports
                        </NavLink>
                    </li>
                </ul>
            </div>
        </>
    );
};

export default Sidebar;