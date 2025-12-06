import React, { useState, useEffect, useRef } from "react";
import {
  FaUserCircle,
  FaChartLine,
  FaListAlt,
  FaChartPie,
  FaSignOutAlt,
} from "react-icons/fa";
import "../Css/Sidebar.css";
import { FaChartColumn } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

const Sidebar = ({ isOpen }) => {
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication token is missing.");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log(decoded);
      setEmail(decoded.email || "user@example.com");
      // You can set company name from token or use default
      setCompanyName(decoded.companyName || "COMPANY NAME");
    } catch (error) {
      console.error("Error decoding token:", error);
      setEmail("user@example.com");
      setCompanyName("COMPANY NAME");
    }
  }, []);

  const handleLogoutConfirm = () => {
    NProgress.start();

    // Clear all auth related data
    localStorage.removeItem("token");
    
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
      navigate("/login");
      window.location.reload(); // Optional: to ensure clean state
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

    const itemRect = event.target.closest(".listItem").getBoundingClientRect();
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
        .closest(".listItem")
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
      // Close submenus when clicking outside
      if (submenuRef.current && !submenuRef.current.contains(event.target)) {
        if (!showLogoutModal) {
          setHoveredItem(null);
          setClickedItem(null);
        }
      }
      
      // Close logout modal when clicking outside
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
      icon: <FaChartLine className="icon" size={15} color="darkblue" />,
      label: "Reports",
      subItems: [
        { label: "Sales Summary", path: "/salesSummery" },
        { label: "Top Selling Items", path: "/soldItems" },
        { label: "Receipts", path: "/receiptsScreen" },
        { label: "Laybyes", path: "/laybye" },
      ],
    },
    {
      icon: <FaListAlt className="icon" size={15} color="green" />,
      label: "Items List",
      subItems: [{ label: "Products", path: "/products" }],
    },
    {
      icon: <FaChartColumn className="icon" size={15} color="purple" />,
      label: "Inventory Management",
      subItems: [
        { label: "Inventory History", path: "/inventory" },
        { label: "Inventory Value", path: "/inventory-value" },
      ],
    },
    {
      icon: <FaChartPie className="icon" size={15} color="red" />,
      label: "Shifts",
      subItems: [{ label: "Shifts Reports", path: "/shifts" }],
    },
    {
      icon: <FaSignOutAlt className="icon" size={15} color="#dc3545" />,
      label: "Sign Out",
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
        <div className="modal-overlay">
          <div className="logout-modal" ref={logoutModalRef}>
            <div className="logout-modal-header">
              <span className="logout-modal-icon">🚪</span>
              <h3 className="logout-modal-title">Confirm Logout</h3>
            </div>
            <div className="logout-modal-content">
              <p className="logout-modal-message">
                Are you sure you want to logout?
              </p>
              <div className="logout-modal-user">
                <span className="user-email">{email || "user@example.com"}</span>
                <span className="company-name">{companyName || "COMPANY NAME"}</span>
              </div>
            </div>
            <div className="logout-modal-actions">
              <button 
                className="logout-modal-cancel"
                onClick={handleLogoutCancel}
              >
                Cancel
              </button>
              <button 
                className="logout-modal-confirm"
                onClick={handleLogoutConfirm}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
        <div className="sidebar-header">
          <FaUserCircle className="user" />
          {isOpen && <span className="userEmailside">{email || "user@example.com"}</span>}
        </div>
        <div className="line"></div>
        <div className="listItemsContainer">
          <ul className="unorderedListContainer">
            {menuItems.map((item, index) => (
              <li
                key={index}
                className={`listItem ${clickedItem === index ? "active" : ""}`}
                onMouseEnter={(e) => handleMouseEnter(index, e)}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => handleItemClick(index, e)}
              >
                {item.icon}
                {isOpen && <span className="labelside">{item.label}</span>}
                {isOpen && item.subItems && (
                  <span className="arrow-icon">
                    {shouldShowSubmenu(index) ? "▲" : "▼"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Submenus for regular items */}
      {menuItems.map(
        (item, index) =>
          shouldShowSubmenu(index) &&
          !item.isSignOut && (
            <div
              key={`submenu-${index}`}
              className="subRoutes"
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
              {item.subItems.map((subItem, subIndex) => (
                <div
                  key={subIndex}
                  className="subItem"
                  onClick={() => handleSubItemClick(subItem.path)}
                >
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