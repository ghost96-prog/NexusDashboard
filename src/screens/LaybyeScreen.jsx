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
  isAfter,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import "../Css/LaybyeScreen.css";
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
import LaybyeListItem from "../components/LaybyeListItem";
import PaymentsScreen from "./PaymentsScreen";

const LaybyeScreen = () => {
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
  const [filterStatus, setFilterStatus] = useState("all");
  const [paymentsData, setPaymentsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLaybye, setSelectedLaybye] = useState(null);
  const [selectedLaybyeData, setSelectedLaybyeData] = useState(null);

  const [laybyes, setLaybyes] = useState([]);
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
  const fetchDepositsandPayments = async () => {
    setLoading(true);
    try {
      await fetchDepositsOnlineAndSetToRealm();
      await fetchPaymentsOnlineAndSetToRealm();
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };
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
  const fetchPaymentsOnlineAndSetToRealm = async () => {
    try {
      const token = localStorage.getItem("token"); // Or sessionStorage if that's where you store it

      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/laybyeRouter/laybyes?email=${encodeURIComponent(
          userEmail
        )}`
      );
      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error("User not found or invalid email.");
        return;
      }

      const responsedata = await response.json();
      setPaymentsData(responsedata.data); // Set payments data to state
      const depositLaybyes = responsedata.data.filter(
        (payment) => payment.type === "Deposit"
      );
      setLaybyes(depositLaybyes); // Set laybyes state with filtered data
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching stores.");
      }
      console.error("Error fetching stores:", error);
    }
  };

  const fetchDepositsOnlineAndSetToRealm = async () => {
    try {
      const token = localStorage.getItem("token"); // Or sessionStorage if that's where you store it

      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/laybyeRouter/laybyes?email=${encodeURIComponent(
          userEmail
        )}`
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error("User not found or invalid email.");
        return;
      }

      const responsedata = await response.json();
      console.log("====================================");
      console.log("data", responsedata);
      console.log("====================================");
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching stores.");
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
    setIsRefreshing(true);
    NProgress.start(); // 🔵 Start progress bar
    await fetchDepositsandPayments()
      .then(() => {
        NProgress.done(); // ✅ End progress bar
        setIsRefreshing(false);
      })
      .catch((error) => {
        console.error(error);
        NProgress.done(); // ✅ End progress bar

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
      !event.target.closest(".buttonContainerStoreslaybyes")
    ) {
      setIsStoreDropdownOpen(false);
      console.log("Selected Stores:", selectedStores);

      if (selectedStores.length === 0) {
        setlaybyes([]);
      } else {
        onRefresh(selectedOption, selectedStartDate, selectedEndDate);
      }
    }

    if (
      isExportDropdownOpen &&
      !event.target.closest(".buttonContainerExportlaybyes")
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

  const handleLaybyePress = (laybye) => {
    setSelectedLaybye(laybye);
    setModalVisible(true);
  };
  const handleToggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };
  // Helper function to calculate late payment fee
  const calculateLatePayment = (
    totalBill,
    totalPaid,
    balance,
    finalPaymentDate
  ) => {
    if (balance > 0 && finalPaymentDate) {
      const currentDate = new Date();
      const isLate = isAfter(currentDate, new Date(finalPaymentDate));
      if (isLate) {
        const overdueAmount = totalBill - totalPaid;
        const lateFee = overdueAmount * 0.05; // 5% late fee
        return lateFee;
      }
    }
    return 0;
  };
  const handleNavigatePayLaybye = (item) => {
    const formattedItem = {
      ...item,
      date: new Date(item.date).toISOString(),
      finalPaymentDate: new Date(item.finalPaymentDate).toISOString(),
    };

    setSelectedLaybyeData({
      laybyeData: formattedItem,
      paymentsData: paymentsData,
    });

    setModalVisible(true);
  };

  //   const handleNavigatePayLaybye = (item) => {
  //     const formattedItem = {
  //       ...item,
  //       date: new Date(item.date).toISOString(),
  //       finalPaymentDate: new Date(item.finalPaymentDate).toISOString(),
  //     };
  //     navigation.navigate("Payments", {
  //       laybyeData: formattedItem,
  //       paymentsData: paymentsData,
  //     });
  //   };
  const handleSignOut = () => {
    NProgress.start(); // ✅ End progress bar

    localStorage.removeItem("token");
    window.location.href = "/"; // or navigate to login using React Router
    NProgress.done(); // ✅ End progress bar
  };
  // Filter laybyes based on the search term
  const filteredLaybyes = laybyes
    .map((item) => {
      let totalPaid = parseFloat(item.deposit) || 0;

      const paymentsForLaybye = paymentsData.filter(
        (payment) =>
          payment.laybyeId === item.id && payment.refunded !== "REFUNDED"
      );

      paymentsForLaybye.forEach((payment) => {
        totalPaid +=
          payment.type === "Deposit"
            ? parseFloat(payment.deposit)
            : parseFloat(payment.amount);
      });

      const balance = parseFloat(item.totalBill) - totalPaid;

      return {
        ...item,
        totalPaid,
        balance,
      };
    })
    .filter((item) => {
      const nameMatch = item.customerName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const statusMatch =
        filterStatus === "all"
          ? true
          : filterStatus === "paid"
          ? item.balance === 0
          : item.balance > 0;

      return nameMatch && statusMatch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="mainContainerlaybyes">
      {showDropdown && (
        <div className="dropdownMenu">
          <button className="signOutButton" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      )}
      <div className="toolBarlaybyes">
        {isSidebarOpen ? (
          <FaTimes className="sidebar-icon" onClick={toggleSidebar} />
        ) : (
          <FaBars className="sidebar-icon" onClick={toggleSidebar} />
        )}
        <span className="toolBarTitle">Laybyes</span>
      </div>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="buttonsContainerLaybyes">
        <div className="buttonContainerStoreslaybyes">
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

        {/* <div className="buttonContainerExportlaybyes">
          <button
            className="inputButtonExportlaybyes"
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

      <div className="laybyesContainerLaybyes">
        {/* Search Input */}
        <div className="searchBar">
          <input
            type="text"
            placeholder="Search Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="searchInput"
          />
          {searchTerm && (
            <button className="clearButton" onClick={() => setSearchTerm("")}>
              ×
            </button>
          )}
          <div className="filterDropdownlaybye">
            <select
              className="filterSelect"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Laybyes</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid Up</option>
            </select>
          </div>
        </div>
        <div className="laybyeSubContainer">
          {filteredLaybyes.map((item) => {
            let totalPaid = item.deposit;
            const paymentsForLaybye = paymentsData.filter(
              (payment) =>
                payment.laybyeId === item.id && payment.refunded !== "REFUNDED"
            );

            paymentsForLaybye.forEach((payment) => {
              totalPaid +=
                payment.type === "Deposit" ? payment.deposit : payment.amount;
            });

            const balance = parseFloat(item.totalBill) - totalPaid;

            const latePayment = calculateLatePayment(
              parseFloat(item.totalBill),
              totalPaid,
              balance,
              item.finalPaymentDate
            );

            return (
              <LaybyeListItem
                key={item.id}
                itemName={item.customerName}
                date={new Date(item.date).toLocaleString()}
                nextPaymentDate={
                  item.finalPaymentDate
                    ? new Date(item.finalPaymentDate).toLocaleDateString()
                    : "N/A"
                }
                totalBill={parseFloat(item.totalBill)}
                totalPaid={totalPaid}
                balance={balance}
                latePayment={latePayment}
                paymentStatus={balance > 0 ? "Unpaid" : "Paid"}
                onClick={() => handleNavigatePayLaybye(item)}
              />
            );
          })}
        </div>{" "}
      </div>
      {modalVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <PaymentsScreen
              laybyeData={selectedLaybyeData?.laybyeData}
              paymentsData={selectedLaybyeData?.paymentsData}
              onClose={() => setModalVisible(false)}
            />
            <button
              className="close-payment"
              onClick={() => setModalVisible(false)}
            >
              X
            </button>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default LaybyeScreen;
