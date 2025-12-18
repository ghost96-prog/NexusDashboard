import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaBars,
  FaTimes,
  FaStore,
  FaUser,
  FaArrowDown,
  FaArrowUp,
  FaDownload,
  FaUserCircle,
} from "react-icons/fa";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { DateRangePicker, defaultStaticRanges } from "react-date-range";
import {
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  addDays,
  subWeeks,
  addWeeks,
  subMonths,
  addMonths,
  subYears,
  addYears,
  addHours,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import "../Css/ShiftScreen.css";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
import { IoCalendar } from "react-icons/io5";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReceiptModal from "../components/ReceiptModal";
import ReceiptListItem from "../components/ReceiptListItem";
import { jwtDecode } from "jwt-decode"; // Make sure this is imported
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import ShiftListItem from "../components/ShiftListItem";
import ShiftModal from "../components/ShiftModal";
import RemainingTimeFooter from "../components/RemainingTimeFooter";

const ShiftScreen = () => {
  // const stores = ["Store 1", "Store 2", "Store 3"];

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState([]);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [selectedExportOption, setSelectedExportOption] = useState("");
  const [stores, setStoreData] = useState([]);
  const [selectedStoreName, setSelectedStoreName] = useState("");
  const [selectedStartDate, setSelectedStartDate] = useState(startOfToday());
  const [selectedEndDate, setSelectedEndDate] = useState(endOfToday());
  const [selectedOption, setSelectedOption] = useState("today");
  const [selectedRange, setSelectedRange] = useState("Today");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dateRangePickerRef = useRef(null);
  const location = useLocation();
  const [receipts, setReceipts] = useState([]);
  const [modalShift, setModalShift] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [email, setEmail] = useState(null);
  const [containerShifts, setContainerShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);

  const [allReceipts, setAllReceipts] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("token"); // Or sessionStorage if needed

    if (!token) {
      toast.error("Authentication token is missing.");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setEmail(decoded.email); // Extract email from token
    } catch (error) {
      toast.error("Invalid authentication token.");
    }
  }, []);
  useEffect(() => {
    if (modalShift) {
      // Push a state into the history when modal opens
      window.history.pushState({ modalOpen: true }, "");

      const handlePopState = () => {
        setModalShift(null); // Close modal on back button
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [modalShift]);

  console.log("====================================");
  console.log(email);
  console.log("====================================");
  useEffect(() => {
    if (selectedStores.length > 0) {
      onRefresh();
    }
  }, [selectedStores]);

  useEffect(() => {
    setSelectedStores(stores);
  }, [selectedOption, stores]);
  useEffect(() => {
    console.log("Selected Option:", selectedOption);
  }, [selectedOption]);
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
      const token = localStorage.getItem("token"); // Or sessionStorage if that's where you store it

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
      const token = localStorage.getItem("token"); // Or sessionStorage if that's where you store it

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
      console.log("====================================");
      console.log("shiftsFromServer", shiftsFromServer);
      console.log("====================================");

      // Filter shifts based on userId
      const filteredShifts = shiftsFromServer.data.filter(
        (shift) => shift.userId === userId
      );

      // Set the filtered shifts to the state for rendering
      setContainerShifts(filteredShifts);
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching shifts.");
      }
      console.error("Error fetching stores:", error);
    }
  };

  const formatNumber = (number) => {
    if (number === 0) return "$0";
    const formattedNumber = number.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `$${formattedNumber}`;
  };

  const onRefresh = async () => {
    NProgress.start(); // 🔵 Start progress bar
    setIsRefreshing(true);
    await fetchShifts()
      .then(() => {
        NProgress.done(); // ✅ End progress bar
        setIsRefreshing(false);
      })
      .catch((error) => {
        console.error(error);
        setIsRefreshing(false);
      });
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
      !event.target.closest(".buttonContainerStoresReceipts")
    ) {
      setIsStoreDropdownOpen(false);
      console.log("Selected Stores:", selectedStores);

      if (selectedStores.length === 0) {
        setContainerShifts([]);
      } else {
        // onRefresh(selectedOption, selectedStartDate, selectedEndDate);
      }
    }

    if (
      isExportDropdownOpen &&
      !event.target.closest(".buttonContainerExportReceipts")
    ) {
      setIsExportDropdownOpen(false);
      console.log("Selected Export Option:");
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dateRangePickerRef.current &&
        !dateRangePickerRef.current.contains(event.target)
      ) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dateRangePickerRef]);

  function handleItemClick(item) {
    console.log("open receipt", item);
    setModalShift(item);
  }
  const handleToggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleSignOut = () => {
    NProgress.start(); // ✅ End progress bar

    localStorage.removeItem("token");
    window.location.href = "/"; // or navigate to login using React Router
    NProgress.done(); // ✅ End progress bar
  };
  // Filter receipts based on the search term
  const filteredShifts = containerShifts
    .filter(
      (shift) =>
        shift.shiftNumber.toString().includes(searchTerm) ||
        (shift.closedBy &&
          shift.closedBy.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => new Date(b.closingDate) - new Date(a.closingDate));

  return (
    <div className="mainContainerReceipts">
      {showDropdown && (
        <div className="dropdownMenu">
          <button className="signOutButton" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      )}
      <div className="toolBarReceipts">
        {isSidebarOpen ? (
          <FaTimes className="sidebar-icon" onClick={toggleSidebar} />
        ) : (
          <FaBars className="sidebar-icon" onClick={toggleSidebar} />
        )}
        <span className="toolBarTitle">Shifts</span>
      </div>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="buttonsContainerShifts">
        <div className="buttonContainerStoresReceipts">
          <button
            className="inputButtonStore"
            onClick={() => {
              setIsStoreDropdownOpen(!isStoreDropdownOpen);
              setIsEmployeeDropdownOpen(false);
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

        {/* <div className="buttonContainerExportReceipts">
          <button
            className="inputButtonExportReceipts"
            onClick={() => {
              setIsExportDropdownOpen(!isExportDropdownOpen);
              setIsEmployeeDropdownOpen(false);
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
                  console.log("PDF");
                }}
              >
                <span className="storeName">PDF</span>
              </div>
              <div
                className="dropdownItem"
                onClick={() => {
                  setIsExportDropdownOpen(false);
                  console.log("PDF");
                }}
              >
                <span className="storeName">CSV</span>
              </div>
            </div>
          )}
        </div> */}
      </div>

      <div className="shiftsContainerShifts">
        {/* Search Input */}
        <div className="searchBar">
          <input
            type="text"
            placeholder="Search by shift number/employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="searchInput"
          />
          {searchTerm && (
            <button className="clearButton" onClick={() => setSearchTerm("")}>
              ×
            </button>
          )}
        </div>


<div className="shift-table-container">
  <div className="receiptHeader">
    <div className="headerItem">Shift Number</div>
    <div className="headerItem">Closed By</div>
    <div className="headerItem">Store Name</div>
    <div className="headerItem">Opening Date</div>
    <div className="headerItem">Closing Date</div>
    <div className="headerItem">Amount</div>
  </div>
  {filteredShifts.map((item, index) => {
    const matchedStore = stores.find(
      (store) => store.storeId === item.storeId
    );
    return (
<ShiftListItem
  key={index}
  closedBy={item.createdBy}
  shiftNumber={item.shiftNumber}
  closingDate={item.closingDate}
  openingDate={item.openingDate}
  storeName={matchedStore?.storeName || "Unknown Store"}
  amount={Number(item.expectedCash).toFixed(2)}
  baseCurrency={item.baseCurrency || "USD"} // Add this
  onClick={() => handleItemClick(item)}
/>
    );
  })}
</div>
      </div>
      {modalShift &&
        (() => {
          // Compute the matching store before returning JSX
          const matchedStore = stores.find(
            (store) => store.storeId === modalShift.storeId
          );
          return (
            <ShiftModal
              selectedShift={modalShift}
              store={matchedStore}
              email={email}
              onClose={() => setModalShift(null)}
            />
          );
        })()}
      <RemainingTimeFooter />

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ShiftScreen;
