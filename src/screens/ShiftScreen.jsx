import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaBars,
  FaTimes,
  FaStore,
  FaDownload,
  FaSearch,
  FaTimes as FaTimesIcon,
  FaFileAlt,
  FaBox,
  FaFilter,
  FaPlus
} from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import "../Css/ShiftScreen.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useNavigate } from "react-router-dom";
import RemainingTimeFooter from "../components/RemainingTimeFooter";
import ShiftModal from "../components/ShiftModal";

const ShiftScreen = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState([]);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [stores, setStoreData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState(null);
  const [containerShifts, setContainerShifts] = useState([]);
  const [modalShift, setModalShift] = useState(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (modalShift) {
      window.history.pushState({ modalOpen: true }, "");

      const handlePopState = () => {
        setModalShift(null);
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [modalShift]);

  useEffect(() => {
    if (selectedStores.length > 0) {
      onRefresh();
    }
  }, [selectedStores]);

  useEffect(() => {
    setSelectedStores(stores);
  }, [stores]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    if (email) {
      fetchStores();
    }
  }, [email]);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const email = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/storeRouter/stores?email=${encodeURIComponent(
          email
        )}`
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error("User not found or invalid email.");
        return;
      }

      const data = await response.json();
      setStoreData(data || []);
      
      if (data.length > 0) {
        setSelectedStores(data);
      }
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching stores.");
      }
      console.error("Error fetching stores:", error);
    }
  };

  const fetchShifts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId;
      
      const response = await fetch(
        `https://nexuspos.onrender.com/api/shiftsRouter/shifts?email=${encodeURIComponent(
          userEmail
        )}`
      );
      
      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error("User not found or invalid email.");
        return;
      }

      const shiftsFromServer = await response.json();

      const filteredShifts = shiftsFromServer.data.filter(
        (shift) => shift.userId === userId
      );

      setContainerShifts(filteredShifts);
      setLoading(false);
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching shifts.");
      }
      console.error("Error fetching shifts:", error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    NProgress.start();
    setIsRefreshing(true);
    setLoading(true);
    
    try {
      await fetchShifts();
    } catch (error) {
      console.error(error);
    } finally {
      NProgress.done();
      setIsRefreshing(false);
    }
  };

  const handleStoreSelect = (store) => {
    if (store === "All Stores") {
      if (selectedStores.length === stores.length) {
        setSelectedStores([]);
      } else {
        setSelectedStores([...stores]);
      }
    } else {
      const exists = selectedStores.some((s) => s.storeId === store.storeId);
      const updatedStores = exists
        ? selectedStores.filter((s) => s.storeId !== store.storeId)
        : [...selectedStores, store];
      setSelectedStores(updatedStores);
    }
  };

  const handleClickOutside = (event) => {
    if (
      isStoreDropdownOpen &&
      !event.target.closest(".shift-store-selector")
    ) {
      setIsStoreDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  const handleItemClick = (item) => {
    console.log("Opening shift details", item);
    setModalShift(item);
  };

  const filteredShifts = containerShifts
    .filter((shift) => {
      const shiftNumber = shift.shiftNumber?.toString() || "";
      const closedBy = shift.closedBy?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      
      return shiftNumber.includes(search) || 
             closedBy.includes(search) ||
             shift.createdBy?.toLowerCase().includes(search);
    })
    .sort((a, b) => new Date(b.closingDate) - new Date(a.closingDate));

  const getStatusColor = (shift) => {
    return shift.closingDate ? 'shift-status-closed' : 'shift-status-open';
  };

  const getStatusText = (shift) => {
    return shift.closingDate ? 'Closed' : 'Open';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="shift-container">
      <div className="shift-sidebar-toggle-wrapper">
        <button 
          className="shift-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: isSidebarOpen ? '280px' : '80px' }}
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`shift-content ${isSidebarOpen ? "shift-content-shifted" : "shift-content-collapsed"}`}>
        {/* Toolbar */}
        <div className="shift-toolbar">
          <div className="shift-toolbar-content">
            <h1 className="shift-toolbar-title">Shifts</h1>
            <div className="shift-toolbar-subtitle">
              View and manage store shifts
            </div>
          </div>
          <div className="shift-toolbar-actions">
            <button 
              className="shift-refresh-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <IoReload />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="shift-control-panel">
          <div className="shift-filter-controls">
            <div className="shift-store-selector">
              <button 
                className="shift-filter-btn"
                onClick={() => {
                  setIsStoreDropdownOpen(!isStoreDropdownOpen);
                }}
              >
                <FaStore />
                <span>
                  {selectedStores.length === 0
                    ? "Select Store"
                    : selectedStores.length === 1
                    ? selectedStores[0].storeName
                    : selectedStores.length === stores.length
                    ? "All Stores"
                    : `${selectedStores.length} stores`}
                </span>
              </button>
              
              {isStoreDropdownOpen && (
                <div className="shift-dropdown">
                  <div className="shift-dropdown-header">
                    <span>Select Stores</span>
                    <button 
                      className="shift-dropdown-select-all"
                      onClick={() => handleStoreSelect("All Stores")}
                    >
                      {selectedStores.length === stores.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="shift-dropdown-content">
                    {stores.map((store) => (
                      <div
                        className="shift-dropdown-item"
                        key={store.storeId}
                        onClick={() => handleStoreSelect(store)}
                      >
                        <div className="shift-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedStores.some((s) => s.storeId === store.storeId)}
                            readOnly
                          />
                          <div className="shift-checkbox-custom"></div>
                        </div>
                        <span className="shift-store-name">{store.storeName}</span>
                        <span className="shift-store-location">{store.location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="shift-search-filter">
          <div className="shift-search-container">
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by shift number or employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shift-search-input"
              style={{ paddingLeft: '40px' }}
            />
            {searchTerm && (
              <button 
                className="shift-search-clear"
                onClick={() => setSearchTerm("")}
              >
                <FaTimesIcon />
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="shift-table-container">
          <div className="shift-table-header">
            <h3>Shift Details</h3>
            <span className="shift-table-count">
              {isRefreshing ? 'Refreshing...' : 
               filteredShifts.length > 0 ? `Showing ${filteredShifts.length} shifts` : 
               loading ? 'Loading shifts...' : 'No shifts found'}
            </span>
          </div>
          
          <div className="shift-table-wrapper">
            <table className="shift-table">
              <thead>
                <tr>
                  <th>Shift #</th>
                  <th>Status</th>
                  <th>Closed By</th>
                  <th>Store Name</th>
                  <th>Opening Date</th>
                  <th>Closing Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredShifts.length > 0 ? (
                  filteredShifts.map((item, index) => {
                    const matchedStore = stores.find(
                      (store) => store.storeId === item.storeId
                    );
                    
                    return (
                      <tr 
                        key={`${item.shiftId || index}`} 
                        className="shift-table-row"
                        onClick={() => handleItemClick(item)}
                      >
                        <td className="shift-table-cell">
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>
                            #{item.shiftNumber}
                          </span>
                        </td>
                        <td className="shift-table-cell">
                          <span className={`shift-status ${getStatusColor(item)}`}>
                            {getStatusText(item)}
                          </span>
                        </td>
                        <td className="shift-table-cell">
                          {item.closedBy || item.createdBy || 'N/A'}
                        </td>
                        <td className="shift-table-cell">
                          {matchedStore?.storeName || 'Unknown Store'}
                        </td>
                        <td className="shift-table-cell">
                          {formatDate(item.openingDate)}
                        </td>
                        <td className="shift-table-cell">
                          {item.closingDate ? formatDate(item.closingDate) : 'Still Open'}
                        </td>
                        <td className="shift-table-cell">
                          <span className="shift-amount-badge">
                            ${Number(item.expectedCash || 0).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="shift-empty-state">
                      <div className="shift-empty-icon">
                        <FaBox />
                      </div>
                      <h3 className="shift-empty-title">
                        {loading ? 'Loading shifts...' : 
                         searchTerm ? `No results for "${searchTerm}"` : 
                         'No Shifts Found'}
                      </h3>
                      <p className="shift-empty-description">
                        {searchTerm ? 'Try adjusting your search' :
                         'No shifts available for the selected stores'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <RemainingTimeFooter />
      </div>
      
      {modalShift && (
        <ShiftModal
          selectedShift={modalShift}
          store={stores.find(store => store.storeId === modalShift.storeId)}
          email={email}
          onClose={() => setModalShift(null)}
        />
      )}
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default ShiftScreen;