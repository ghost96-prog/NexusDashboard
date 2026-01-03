import React from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import "../Css/Toolbar.css";

const Toolbar = ({ toggleSidebar, isSidebarOpen, title = "Dashboard", subtitle = "" }) => {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button 
          className="toolbar-menu-button"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        
        <div className="toolbar-title-section">
          <h1 className="toolbar-title">{title}</h1>
          {subtitle && <p className="toolbar-subtitle">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;