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
import "../Css/ReceiptsScreen.css";
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

const ReceiptsScreen = () => {
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
  const [modalReceipt, setModalReceipt] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [email, setEmail] = useState(null);

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
    if (modalReceipt) {
      // Push a state into the history when modal opens
      window.history.pushState({ modalOpen: true }, "");

      const handlePopState = () => {
        setModalReceipt(null); // Close modal on back button
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [modalReceipt]);

  console.log("====================================");
  console.log(email);
  console.log("====================================");
  useEffect(() => {
    if (selectedStores.length > 0) {
      onRefresh(selectedOption, selectedStartDate, selectedEndDate);
    }
  }, [selectedStores, selectedOption, selectedStartDate, selectedEndDate]);

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
  const fetchAllReceiptsData = async (timeframe, startDate, endDate) => {
    try {
      const token = localStorage.getItem("token"); // Or sessionStorage if that's where you store it

      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      console.log("====================================");
      console.log(timeframe, startDate, endDate);
      console.log("====================================");
      // Format the startDate and endDate as strings in ISO format
      const formattedStartDate = startDate;
      const formattedEndDate = endDate;
      const response = await fetch(
        `https://nexuspos.onrender.com/api/dashboardRouter/${timeframe}?startDate=${formattedStartDate}&endDate=${formattedEndDate}&email=${encodeURIComponent(
          userEmail
        )}`
      );
      const responseData = await response.json();
      console.log(`Receipts for ${timeframe}:`);
      if (!response.ok) {
        const errorMessage = await response.text(); // or response.json() if you return JSON errors
        toast.error(`Error: ${"User not found or invalid email."}`);
      }
      const {
        totalAmountSum,
        totalCostAmountSumWithoutRefunds,
        receiptsNet: rawReceiptsNet,
        totalDiscount,
        netSales,
        receipts: rawReceipts,
        totalAmountDifferencePercentage,
        totalCostDifferencePercentage,
        receiptsDifference,
      } = responseData;

      const selectedStoreIds = selectedStores.map((store) => store.storeId);

      const receipts = rawReceipts
        .map((receipt) => ({
          ...receipt,
          dateTime: convertFirestoreTimestampToISO(receipt.dateTime),
        }))
        .filter((receipt) => selectedStoreIds.includes(receipt.storeId));

      const receiptsNet = rawReceiptsNet
        .map((receipt) => ({
          ...receipt,
          dateTime: convertFirestoreTimestampToISO(receipt.dateTime),
        }))
        .filter((receipt) => selectedStoreIds.includes(receipt.storeId));

      setReceipts(receiptsNet);
      setAllReceipts(receipts);
      console.log("====================================");
      console.log("runnnnnnnnnnnnnnnnnnning");
      console.log("====================================");
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching receipts.");
      }
      console.error("Error fetching receipts:", error);
    }
  };
  const onRefresh = async (
    selectedOption,
    selectedStartRange,
    selectedEndRange
  ) => {
    NProgress.start(); // 🔵 Start progress bar
    setIsRefreshing(true);
    await fetchAllReceiptsData(
      selectedOption,
      selectedStartRange,
      selectedEndRange
    )
      .then(() => {
        NProgress.done(); // ✅ End progress bar
        setIsRefreshing(false);
      })
      .catch((error) => {
        console.error(error);
        setIsRefreshing(false);
      });
  };
  const convertFirestoreTimestampToISO = (timestamp) => {
    const date = new Date(
      timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000
    );
    return date.toISOString();
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
        setReceipts([]);
      } else {
        onRefresh(selectedOption, selectedStartDate, selectedEndDate);
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

  const handleDateRangeChange = (ranges) => {
    const { startDate, endDate } = ranges.selection;

    const selectedRange = customStaticRanges.find(
      (range) =>
        range.range().startDate.getTime() === startDate.getTime() &&
        range.range().endDate.getTime() === endDate.getTime()
    );
    console.log("====================================");
    console.log(customStaticRanges);
    console.log("====================================");
    if (selectedRange) {
      if (selectedRange.label === "Today") {
        setSelectedOption("today");
        setSelectedRange("Today");
        setIsDatePickerOpen(false);
      } else if (selectedRange.label === "Yesterday") {
        setSelectedOption("customPeriod");
        setSelectedRange("Yesterday");
        setIsDatePickerOpen(false);
      } else if (selectedRange.label === "This Week") {
        setSelectedOption("thisWeek");
        setSelectedRange("This Week");
        setIsDatePickerOpen(false);
      } else if (selectedRange.label === "Last Week") {
        setSelectedOption("customPeriod");
        setSelectedRange("Last Week");
        setIsDatePickerOpen(false);
      } else if (selectedRange.label === "This Month") {
        setSelectedOption("thisMonth");
        setSelectedRange("This Month");
        setIsDatePickerOpen(false);
      } else if (selectedRange.label === "Last Month") {
        setSelectedOption("customPeriod");
        setSelectedRange("Last Month");
        setIsDatePickerOpen(false);
      } else if (selectedRange.label === "This Year") {
        setSelectedOption("thisYear");
        setSelectedRange("This Year");
        setIsDatePickerOpen(false);
      }
    }

    setSelectedStartDate(startDate);
    setSelectedEndDate(endDate);
    onRefresh(selectedOption, startDate, endDate);
  };

  const customStaticRanges = [
    ...defaultStaticRanges,
    {
      label: "This Year",
      range: () => ({
        startDate: new Date(new Date().getFullYear(), 0, 1), // January 1st of the current year
        endDate: new Date(new Date().getFullYear(), 11, 31), // December 31st of the current year
      }),
      isSelected: () => selectedOption === "This Year",
    },
  ];

  const handleBackClick = () => {
    let newStartDate, newEndDate;

    switch (selectedRange) {
      case "Today":
        newStartDate = subDays(selectedStartDate, 1);
        newEndDate = subDays(selectedEndDate, 1);
        break;
      case "Yesterday":
        newStartDate = subDays(selectedStartDate, 1);
        newEndDate = subDays(selectedEndDate, 1);
        break;
      case "This Week":
        newStartDate = subWeeks(selectedStartDate, 1);
        newEndDate = subWeeks(selectedEndDate, 1);
        break;
      case "Last Week":
        newStartDate = subWeeks(selectedStartDate, 1);
        newEndDate = subWeeks(selectedEndDate, 1);
        break;
      case "This Month":
        newStartDate = subMonths(selectedStartDate, 1);
        newEndDate = subMonths(selectedEndDate, 1);
        break;
      case "Last Month":
        newStartDate = subMonths(selectedStartDate, 1);
        newEndDate = subMonths(selectedEndDate, 1);
        break;
      case "This Year":
        newStartDate = subYears(selectedStartDate, 1);
        newEndDate = subYears(selectedEndDate, 1);
        break;
      default:
        newStartDate = subDays(selectedStartDate, 1);
        newEndDate = subDays(selectedEndDate, 1);
    }

    setSelectedStartDate(newStartDate);
    setSelectedEndDate(newEndDate);
    onRefresh(selectedOption, newStartDate, newEndDate);
  };

  const handleForwardClick = () => {
    let newStartDate, newEndDate;

    switch (selectedRange) {
      case "Today":
        newStartDate = addDays(selectedStartDate, 1);
        newEndDate = addDays(selectedEndDate, 1);
        break;
      case "Yesterday":
        newStartDate = addDays(selectedStartDate, 1);
        newEndDate = addDays(selectedEndDate, 1);
        break;
      case "This Week":
        newStartDate = addWeeks(selectedStartDate, 1);
        newEndDate = addWeeks(selectedEndDate, 1);
        break;
      case "Last Week":
        newStartDate = addWeeks(selectedStartDate, 1);
        newEndDate = addWeeks(selectedEndDate, 1);
        break;
      case "This Month":
        newStartDate = addMonths(selectedStartDate, 1);
        newEndDate = addMonths(selectedEndDate, 1);
        break;
      case "Last Month":
        newStartDate = addMonths(selectedStartDate, 1);
        newEndDate = addMonths(selectedEndDate, 1);
        break;
      case "This Year":
        newStartDate = addYears(selectedStartDate, 1);
        newEndDate = addYears(selectedEndDate, 1);
        break;
      default:
        newStartDate = addDays(selectedStartDate, 1);
        newEndDate = addDays(selectedEndDate, 1);
    }

    // Check if newEndDate is beyond end of today
    if (selectedEndDate <= new Date()) {
      setSelectedStartDate(newStartDate);
      setSelectedEndDate(newEndDate);
      onRefresh(selectedOption, newStartDate, newEndDate);
    }
  };

  function handleItemClick(item) {
    setModalReceipt(item);
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
  const filteredReceipts = allReceipts
    .filter((receipt) =>
      receipt.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

  // Function to generate the table rows based on data
  const generateRows = () => {
    return data.map((row, index) => (
      <tr key={index}>
        <td>{row.paymentType}</td>
        <td>{row.paymentAmount}</td>
      </tr>
    ));
  };
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
        <span className="toolBarTitle">Receipts</span>
      </div>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="buttonsContainerReceipts">
        <div className="buttonContainerDateReceipts">
          <div className="iconContainerBack" onClick={handleBackClick}>
            <IoIosArrowBack color="grey" className="iconLeft" />
          </div>

          <button
            className="inputButtonDate"
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
          >
            <IoCalendar color="grey" className="iconRiconCalenderight" />
            {selectedStartDate && selectedEndDate
              ? `${selectedStartDate.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })} - ${selectedEndDate.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`
              : "Select Date Range"}
          </button>

          <div className="iconContainerForward" onClick={handleForwardClick}>
            <IoIosArrowForward color="grey" className="iconRight" />
          </div>
        </div>

        {isDatePickerOpen && (
          <div ref={dateRangePickerRef} className="datePickerContainerReceipts">
            <DateRangePicker
              ranges={[
                {
                  startDate: selectedStartDate,
                  endDate: selectedEndDate,
                  key: "selection",
                },
              ]}
              onChange={handleDateRangeChange}
              moveRangeOnFirstSelection={true}
              months={2}
              direction="horizontal"
              locale={enUS}
              staticRanges={customStaticRanges}
            />
          </div>
        )}
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

      <div className="receiptsContainerReceipts">
        {/* Search Input */}
        <div className="searchBar">
          <input
            type="text"
            placeholder="Search by receipt number..."
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
        <div className="receiptsSubContainer">
          <div className="receiptHeader">
            <div className="headerItem">Receipt Number</div>
            <div className="headerItem">Date</div>
            <div className="headerItem">Store Name</div>
            <div className="headerItem">Payment Type</div>
            <div className="headerItem">Total Sales</div>
          </div>
          {[...filteredReceipts]
            .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
            .map((item, index) => {
              const matchedStore = stores.find(
                (store) => store.storeId === item.storeId
              );
              return (
                <ReceiptListItem
                  key={index}
                  label={item.label}
                  receiptNumber={item.ticketNumber}
                  date={item.dateTime}
                  storeName={matchedStore?.storeName || "Unknown Store"}
                  type={item.selectedCurrency}
                  totalSales={Number(item.totalAmountUsd * item.rate).toFixed(
                    2
                  )}
                  onClick={() => handleItemClick(item)}
                />
              );
            })}
        </div>
      </div>
      {modalReceipt &&
        (() => {
          // Compute the matching store before returning JSX
          const matchedStore = stores.find(
            (store) => store.storeId === modalReceipt.storeId
          );
          return (
            <ReceiptModal
              receipt={modalReceipt}
              store={matchedStore}
              email={email}
              onClose={() => setModalReceipt(null)}
            />
          );
        })()}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ReceiptsScreen;
