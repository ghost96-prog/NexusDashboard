import React, { useState, useEffect, useRef } from "react";
import {
  FaUserCircle,
  FaChartLine,
  FaListAlt,
  FaChartPie,
  FaSignOutAlt,
  FaBars,
  FaTimes
} from "react-icons/fa";
import "../Css/Sidebar.css";
import { FaChartColumn } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [clickedItem, setClickedItem] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const submenuRef = useRef(null);
  const logoutModalRef = useRef(null);
  const timeoutRef = useRef(null);
  const [email, setEmail] = useState(null);
  const [companyName, setCompanyName] = useState(null);
  const [userInitial, setUserInitial] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication token is missing.");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log(decoded);
      const userEmail = decoded.email || "user@example.com";
      setEmail(userEmail);
      setUserInitial(userEmail.charAt(0).toUpperCase());
      setCompanyName(decoded.companyName || "COMPANY NAME");
    } catch (error) {
      console.error("Error decoding token:", error);
      setEmail("user@example.com");
      setUserInitial("U");
      setCompanyName("COMPANY NAME");
    }
  }, []);

  const handleLogoutConfirm = () => {
    NProgress.start();

    // Clear all auth related data
    localStorage.removeItem("token");
    localStorage.removeItem("inventoryCounts");
    localStorage.removeItem("userData");
    
    // Reset toast counters
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("toastCounter_")) {
        localStorage.removeItem(key);
      }
    });

    // Close modal and redirect
    setShowLogoutModal(false);
    
    // Redirect to login
    setTimeout(() => {
      NProgress.done();
      navigate("/loginBackOffice");
      window.location.reload();
    }, 300);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
    setHoveredItem(null);
    setClickedItem(null);
  };

  const handleMouseEnter = (index, event) => {
    if (clickedItem !== null && clickedItem !== index) {
      setClickedItem(null);
    }

    const itemRect = event.target.closest(".sidebar-list-item").getBoundingClientRect();
    setHoveredItem({ index, top: itemRect.top, left: itemRect.right });
    clearTimeout(timeoutRef.current);
  };

  const handleMouseLeave = () => {
    if (clickedItem === null && !showLogoutModal) {
      timeoutRef.current = setTimeout(() => {
        setHoveredItem(null);
      }, 200);
    }
  };

  const handleItemClick = (index, event) => {
    event.stopPropagation();

    if (index === 4) { // Sign Out item
      setShowLogoutModal(true);
      setClickedItem(null);
      setHoveredItem(null);
      return;
    }

    if (clickedItem === index) {
      setClickedItem(null);
      setHoveredItem(null);
    } else {
      setClickedItem(index);
      const itemRect = event.target
        .closest(".sidebar-list-item")
        .getBoundingClientRect();
      setHoveredItem({ index, top: itemRect.top, left: itemRect.right });
    }
  };

  const handleSubItemClick = (path) => {
    navigate(path);
    setClickedItem(null);
    setHoveredItem(null);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (submenuRef.current && !submenuRef.current.contains(event.target)) {
        if (!showLogoutModal) {
          setHoveredItem(null);
          setClickedItem(null);
        }
      }
      
      if (showLogoutModal && logoutModalRef.current && !logoutModalRef.current.contains(event.target)) {
        setShowLogoutModal(false);
        setHoveredItem(null);
        setClickedItem(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearTimeout(timeoutRef.current);
    };
  }, [showLogoutModal]);

  // Menu items configuration
  const menuItems = [
    {
      icon: <FaChartLine className="sidebar-icon" size={18} color="#6366f1"/>,
      label: "Reports",
      color: "#6366f1",
      gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      subItems: [
        { label: "Sales Summary", path: "/salesSummery" },
        { label: "Top Selling Items", path: "/soldItems" },
        { label: "Receipts", path: "/receiptsScreen" },
        { label: "Laybyes", path: "/laybye" },
        { label: "Pay In / Pay Out", path: "/payin_payout" },
      ],
    },
    {
      icon: <FaListAlt className="sidebar-icon" size={18} color="#10b981"/>,
      label: "Items List",
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981, #34d399)",
      subItems: [
        { label: "Products", path: "/products" },
        { label: "Categories", path: "/categories" },
        { label: "Discounts", path: "/discounts" },
      ],
    },
    {
      icon: <FaChartColumn className="sidebar-icon" size={18} color="#8b5cf6"/>,
      label: "Inventory",
      color: "#8b5cf6",
      gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
      subItems: [
        { label: "Inventory History", path: "/inventory" },
        { label: "Inventory Value", path: "/inventory-value" },
        { label: "Inventory Counts", path: "/counts" },
        { label: "Inventory GRVs", path: "/goods-received" },
        { label: "Stock Transfers", path: "/stock-transfers" },
      ],
    },
    {
      icon: <FaChartPie className="sidebar-icon" size={18} color="#f59e0b"/>,
      label: "Shifts",
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
      subItems: [{ label: "Shifts Reports", path: "/shifts" }],
    },
    {
      icon: <FaSignOutAlt className="sidebar-icon" size={18} color="#ef4444"/>,
      label: "Sign Out",
      color: "#ef4444",
      gradient: "linear-gradient(135deg, #ef4444, #f87171)",
      isSignOut: true,
    },
  ];

  const shouldShowSubmenu = (index) => {
    return (
      (hoveredItem?.index === index && clickedItem === null) ||
      clickedItem === index
    );
  };

  return (
    <>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="sidebar-modal-overlay">
          <div className="sidebar-logout-modal" ref={logoutModalRef}>
            <div className="sidebar-logout-modal-header">
              <div className="sidebar-logout-modal-icon">
                <FaSignOutAlt size={24} />
              </div>
              <h3 className="sidebar-logout-modal-title">Confirm Logout</h3>
            </div>
            <div className="sidebar-logout-modal-content">
              <p className="sidebar-logout-modal-message">
                Are you sure you want to logout from your account?
              </p>
              <div className="sidebar-logout-modal-user">
                <div className="sidebar-user-avatar">
                  {userInitial}
                </div>
                <div className="sidebar-user-info">
                  <span className="sidebar-user-email">{email || "user@example.com"}</span>
                  <span className="sidebar-company-name">{companyName || "COMPANY NAME"}</span>
                </div>
              </div>
            </div>
            <div className="sidebar-logout-modal-actions">
              <button 
                className="sidebar-logout-modal-cancel"
                onClick={handleLogoutCancel}
              >
                Cancel
              </button>
              <button 
                className="sidebar-logout-modal-confirm"
                onClick={handleLogoutConfirm}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`sidebar ${isOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
        {/* Hamburger Menu Toggle */}
        {/* <div className="sidebar-toggle-container">
          <button 
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div> */}
        
        <div className="sidebar-header">
          <div className="sidebar-user-avatar-container">
            <div className="sidebar-user-avatar-large">
              {userInitial}
            </div>
            {isOpen && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-email">{email || "user@example.com"}</span>
                <span className="sidebar-user-role">Admin</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="sidebar-divider"></div>
        
        <div className="sidebar-nav">
          <ul className="sidebar-nav-list">
            {menuItems.map((item, index) => (
              <li
                key={index}
                className={`sidebar-list-item ${clickedItem === index ? "sidebar-item-active" : ""}`}
                style={{ '--item-color': item.color }}
                onMouseEnter={(e) => handleMouseEnter(index, e)}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => handleItemClick(index, e)}
              >
                <div className="sidebar-item-icon">
                  {item.icon}
                </div>
                {isOpen && (
                  <>
                    <span className="sidebar-item-label">{item.label}</span>
                    {item.subItems && (
                      <span className="sidebar-item-arrow">
                        {shouldShowSubmenu(index) ? <FiChevronLeft /> : <FiChevronRight />}
                      </span>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        {isOpen && (
          <div className="sidebar-footer">
            <div className="sidebar-version">v2.0.1</div>
            <div className="sidebar-status">
              <div className="sidebar-status-dot"></div>
              <span>Online</span>
            </div>
          </div>
        )}
      </div>

      {/* Submenus for regular items */}
      {menuItems.map(
        (item, index) =>
          shouldShowSubmenu(index) &&
          !item.isSignOut && (
            <div
              key={`submenu-${index}`}
              className="sidebar-submenu"
              ref={submenuRef}
              style={{
                top: hoveredItem?.top,
                left: hoveredItem?.left,
              }}
              onMouseEnter={() => clearTimeout(timeoutRef.current)}
              onMouseLeave={() => {
                if (clickedItem === null) {
                  handleMouseLeave();
                }
              }}
            >
              <div className="sidebar-submenu-header" style={{ background: item.gradient }}>
                <span className="sidebar-submenu-title">{item.label}</span>
                {/* <div className="sidebar-submenu-icon">
                  {item.icon}
                </div> */}
              </div>
              {item.subItems.map((subItem, subIndex) => (
                <div
                  key={subIndex}
                  className="sidebar-submenu-item"
                  onClick={() => handleSubItemClick(subItem.path)}
                >
                  <div className="sidebar-submenu-item-dot"></div>
                  {subItem.label}
                </div>
              ))}
            </div>
          )
      )}
    </>
  );
};

export default Sidebar;