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
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const submenuRef = useRef(null);
  const timeoutRef = useRef(null);
  const [email, setEmail] = useState(null);

  const handleSignOut = () => {
    NProgress.start();

    // Remove auth token
    localStorage.removeItem("token");

    // Reset toast counters
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("toastCounter_")) {
        localStorage.removeItem(key);
      }
    });

    // Redirect to login/home
    window.location.href = "/";

    NProgress.done();
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication token is missing.");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setEmail(decoded.email);
    } catch (error) {
      toast.error("Invalid authentication token.");
    }
  }, []);

  const handleMouseEnter = (index, event) => {
    // Clear clicked item if hovering over a different item
    if (clickedItem !== null && clickedItem !== index) {
      setClickedItem(null);
    }

    const itemRect = event.target.closest(".listItem").getBoundingClientRect();
    setHoveredItem({ index, top: itemRect.top, left: itemRect.right });
    clearTimeout(timeoutRef.current);
  };

  const handleMouseLeave = () => {
    // Only close if not clicked and not showing signout confirmation
    if (clickedItem === null && !showSignOutConfirm) {
      timeoutRef.current = setTimeout(() => {
        setHoveredItem(null);
      }, 200);
    }
  };

  const handleItemClick = (index, event) => {
    event.stopPropagation();

    if (index === 4) {
      // Sign Out item
      setShowSignOutConfirm(true);
      const itemRect = event.target
        .closest(".listItem")
        .getBoundingClientRect();
      setHoveredItem({ index, top: itemRect.top, left: itemRect.right });
      return;
    }

    if (clickedItem === index) {
      // Clicking the same item closes it
      setClickedItem(null);
      setHoveredItem(null);
    } else {
      // Open clicked item
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

  const handleDocumentClick = (event) => {
    if (submenuRef.current && !submenuRef.current.contains(event.target)) {
      setHoveredItem(null);
      setClickedItem(null);
      setShowSignOutConfirm(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      clearTimeout(timeoutRef.current);
    };
  }, []);

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
      icon: <FaSignOutAlt className="icon" size={15} color="purple" />,
      label: "Sign Out",
      isSignOut: true,
    },
  ];

  const shouldShowSubmenu = (index) => {
    // Only show submenu for the currently hovered item or if it's the clicked item
    return (
      (hoveredItem?.index === index && clickedItem === null) || // Show on hover when nothing is clicked
      clickedItem === index // Or show if this is the clicked item
    );
  };

  return (
    <>
      <div className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
        <div className="sidebar-header">
          <FaUserCircle className="user" />
          {isOpen && <span className="userEmailside">{email}</span>}
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
          {/* {isOpen && (
            <div className="signOutButtonContainer">
              <button
                className="signOutButton"
                onClick={() => setShowSignOutConfirm(true)}
              >
                Sign Out
              </button>
            </div>
          )} */}
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

      {/* Sign Out confirmation tooltip */}
      {showSignOutConfirm && (
        <div
          className="signOutConfirm"
          ref={submenuRef}
          // style={{
          //   top: hoveredItem?.top,
          //   left: hoveredItem?.left,
          // }}
        >
          <div className="confirmText">Are you sure you want to sign out?</div>
          <div className="confirmButtons">
            <button className="confirmButton confirm" onClick={handleSignOut}>
              Yes
            </button>
            <button
              className="confirmButton cancel"
              onClick={() => setShowSignOutConfirm(false)}
            >
              No
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
