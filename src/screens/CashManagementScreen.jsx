import React, { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../components/Sidebar";
import CashManagementListItem from "../components/CashManagementListItem"; // IMPORT THIS
import { FaBars, FaTimes } from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import { FaStore, FaDownload } from "react-icons/fa";
import RemainingTimeFooter from "../components/RemainingTimeFooter";
import "../Css/CashManagementScreen.css";

function CashManagementScreen() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cashManagementData, setCashManagementData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [stores, setStores] = useState([]);
  const [selectedStoreName, setSelectedStoreName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState([]);
  const storeDropdownRef = useRef(null);
  const exportDropdownRef = useRef(null);
  
  const itemsPerPage = 3;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserEmail(decoded.email);
        setUserId(decoded.userId.toString());
      } catch (error) {
        toast.error("Invalid authentication token.");
      }
    }
    fetchStores();
  }, []);

  useEffect(() => {
    if (userEmail && userId) {
      onRefresh();
    }
  }, [userEmail, userId]);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target)) {
        setIsStoreDropdownOpen(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setIsExportDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        `https://nexuspos.onrender.com/api/storeRouter/stores?email=${encodeURIComponent(email)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch stores");
      }

      const data = await response.json();
      setStores(data || []);
      
      // Select all stores by default (like ShiftsScreen)
      if (data.length > 0) {
        setSelectedStores(data);
        const storeNames = data.map(store => store.storeName);
        if (storeNames.length === 1) {
          setSelectedStoreName(storeNames[0]);
        } else {
          setSelectedStoreName("Multiple Stores Available");
        }
      } else {
        setSelectedStoreName("No Stores Found");
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("Error fetching stores!");
    }
  };

  const fetchCashManagementData = async () => {
    try {
      if (!navigator.onLine) {
        toast.error("No internet connection!");
        return;
      }

      const response = await fetch(
        `https://nexuspos.onrender.com/api/cashManagementRouter/cashmanagement?email=${encodeURIComponent(userEmail)}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch cash management data");
      }
      
      const cashManagementDataFromServer = await response.json();
      
      // Filter cash management data by userId
      const filteredData = cashManagementDataFromServer.data.filter(
        (item) => item.userId === userId
      );
      
      setCashManagementData(filteredData);
    } catch (error) {
      console.error("Error fetching cash management data:", error);
      toast.error("Error fetching cash management data!");
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchCashManagementData()
      .then(() => setIsRefreshing(false))
      .catch((error) => {
        console.error(error);
        setIsRefreshing(false);
        toast.error("Failed to refresh data");
      });
  };

  const handleSearch = (text) => {
    setSearchText(text);
    setCurrentPage(1);
  };

  const handleStoreSelect = (store) => {
    if (store === "All Stores") {
      if (selectedStores.length === stores.length) {
        setSelectedStores([]);
        setSelectedStoreName("Select Store");
      } else {
        setSelectedStores([...stores]);
        setSelectedStoreName("All Stores");
      }
    } else {
      const exists = selectedStores.some((s) => s.storeId === store.storeId);
      const updatedStores = exists
        ? selectedStores.filter((s) => s.storeId !== store.storeId)
        : [...selectedStores, store];
      
      setSelectedStores(updatedStores);
      
      if (updatedStores.length === 0) {
        setSelectedStoreName("Select Store");
      } else if (updatedStores.length === 1) {
        setSelectedStoreName(updatedStores[0].storeName);
      } else if (updatedStores.length === stores.length) {
        setSelectedStoreName("All Stores");
      } else {
        setSelectedStoreName("Multiple Stores Selected");
      }
    }
  };

  const filteredData = cashManagementData
    .filter(item =>
      item.comment?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.type?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.currency?.name?.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="mainContainerReceipts">
      {/* Toolbar */}
      <div className="toolBarReceipts">
        {isSidebarOpen ? (
          <FaTimes className="sidebar-icon" onClick={toggleSidebar} />
        ) : (
          <FaBars className="sidebar-icon" onClick={toggleSidebar} />
        )}
        <span className="toolBarTitle">PAY IN / PAY OUT</span>
      </div>

      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Buttons Container */}
      <div className="buttonsContainerShifts">
        {/* Store Dropdown */}
        <div className="buttonContainerStoresReceipts" ref={storeDropdownRef}>
          <button
            className="inputButtonStore"
            onClick={() => {
              setIsStoreDropdownOpen(!isStoreDropdownOpen);
              setIsExportDropdownOpen(false);
            }}
          >
            {selectedStores.length === 0
              ? "Select Store"
              : selectedStores.length === 1
              ? selectedStores[0].storeName
              : selectedStores.length === stores.length
              ? "All Stores"
              : selectedStores.map((s) => s.storeName).join(", ")}{" "}
            <FaStore className="icon" color="grey" />
          </button>
          {isStoreDropdownOpen && (
            <div className="dropdown">
              <div
                className="dropdownItem"
                onClick={() => handleStoreSelect("All Stores")}
              >
                <div className="checkboxContainer">
                  <input
                    className="inputCheckBox"
                    type="checkbox"
                    checked={selectedStores.length === stores.length}
                    readOnly
                  />
                </div>
                <span className="storeName">All Stores</span>
              </div>
              {stores.map((store) => (
                <div
                  className="dropdownItem"
                  key={store.storeId}
                  onClick={() => handleStoreSelect(store)}
                >
                  <div className="checkboxContainer">
                    <input
                      className="inputCheckBox"
                      type="checkbox"
                      checked={selectedStores.some(
                        (s) => s.storeId === store.storeId
                      )}
                      readOnly
                    />
                  </div>
                  <span className="storeName">{store.storeName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export Dropdown
        <div className="buttonContainerExportReceipts" ref={exportDropdownRef}>
          <button
            className="inputButtonExportReceipts"
            onClick={() => {
              setIsExportDropdownOpen(!isExportDropdownOpen);
              setIsStoreDropdownOpen(false);
            }}
          >
            Export
            <FaDownload className="icon" color="grey" />
          </button>
          {isExportDropdownOpen && (
            <div className="dropdown">
              <div
                className="dropdownItem"
                onClick={() => {
                  setIsExportDropdownOpen(false);
                  toast.info("PDF export coming soon!");
                }}
              >
                <span className="storeName">PDF</span>
              </div>
              <div
                className="dropdownItem"
                onClick={() => {
                  setIsExportDropdownOpen(false);
                  toast.info("CSV export coming soon!");
                }}
              >
                <span className="storeName">CSV</span>
              </div>
            </div>
          )}
        </div> */}
      </div>

      {/* Main Container */}
      <div className="shiftsContainerShifts">
        {/* Search Bar */}
        <div className="searchBar">
          <input
            type="text"
            placeholder="Search by comment/type/currency..."
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            className="searchInput"
          />
          {searchText && (
            <button className="clearButton" onClick={() => setSearchText("")}>
              ×
            </button>
          )}
        </div>

        {/* Table Container */}
        <div className="shift-table-container">
          {/* Table Header */}
          <div className="receiptHeader">
            <div className="headerItem">Comment</div>
            <div className="headerItem">Type</div>
            <div className="headerItem">Currency</div>
            <div className="headerItem">Amount</div>
            <div className="headerItem">Date & Time</div>
          </div>

          {/* USE CashManagementListItem COMPONENT HERE */}
          {paginatedItems.length > 0 ? (
            paginatedItems.map((item, index) => (
              <CashManagementListItem
                key={index}
                icon="analytics-outline"
                comment={item.comment}
                currency={item.currency?.name || "USD"}
                type={item.type} // THIS IS WHERE THE TYPE COMES FROM
                amount={parseFloat(item.amount).toFixed(2)}
                date={item.date}
              />
            ))
          ) : (
            <div className="no-items-container">
              <div className="icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div className="no-items-text">
                No cash management data found
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="pagination-container">
          <button
            className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
          >
            ←
          </button>

          <div className="page-text">
            Page {currentPage} of {totalPages}
          </div>

          <button
            className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            →
          </button>
        </div>
      )}

      <RemainingTimeFooter />
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default CashManagementScreen;