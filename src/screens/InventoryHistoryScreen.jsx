import React, { useState, useEffect, useRef, useMemo } from "react";
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
import "../Css/InventoryHistoryScreen.css";
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
import InventoryListItem from "../components/InventoryListItem";
import { FaFileCsv, FaFilePdf } from "react-icons/fa6";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable"; // ← import the function directly
import RemainingTimeFooter from "../components/RemainingTimeFooter";
const InventoryHistoryScreen = () => {
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
  const [selectedType, setSelectedType] = useState("All Items");
  const [selectedTypes, setSelectedTypes] = useState([]);

  const [showDropdown, setShowDropdown] = useState(false);
  const [email, setEmail] = useState(null);
  const [inventoryUpdates, setInventoryUpdates] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // State to control dropdown visibility

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

  console.log("====================================");
  console.log(email);
  console.log("====================================");
  useEffect(() => {
    if (selectedStores.length > 0) {
      onRefreshInventory(selectedOption, selectedStartDate, selectedEndDate);
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
      fetchProducts();
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
  const fetchInventoryUpdates = async (timeframe, startDate, endDate) => {
    try {
      const token = localStorage.getItem("token"); // Or sessionStorage if that's where you store it

      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId;

      console.log("====================================");
      console.log(timeframe, startDate, endDate);
      console.log("====================================");
      // Format the startDate and endDate as strings in ISO format
      const formattedStartDate = startDate;
      const formattedEndDate = endDate;
      const response = await fetch(
        `https://nexuspos.onrender.com/api/inventoryRouter/${timeframe}?startDate=${formattedStartDate}&endDate=${formattedEndDate}&email=${encodeURIComponent(
          userEmail
        )}`
      );

      if (!response.ok) {
        const errorMessage = await response.text(); // or response.json() if you return JSON errors
        toast.error(`Error: ${"User not found or invalid email."}`);
      }

      const responseData = await response.json();
      console.log(`Inventory for ${timeframe}: ${startDate}:${endDate}`);

      // Ensure the API response contains an array of inventory updates
      if (!Array.isArray(responseData.data)) {
        console.error("Invalid API response. Expected array:", responseData);
        throw new Error("Invalid API response");
      }

      // Filter inventory updates based on userId
      const filteredUpdates = responseData.data.filter(
        (update) => update.userId === userId
      );

      // Process in chunks
      const CHUNK_SIZE = 400; // Adjust this based on your preferred chunk size
      const loadChunks = async (chunkIndex = 0) => {
        const start = chunkIndex * CHUNK_SIZE;
        const end = start + CHUNK_SIZE;
        const chunk = filteredUpdates.slice(start, end);

        if (chunk.length > 0) {
          // Avoid duplicate data by ensuring only unique updates are appended
          setInventoryUpdates((prevUpdates) => {
            const uniqueUpdates = [
              ...prevUpdates,
              ...chunk.filter(
                (newUpdate) =>
                  !prevUpdates.some(
                    (existingUpdate) => existingUpdate.id === newUpdate.id
                  )
              ),
            ];
            return uniqueUpdates;
          });

          // Load the next chunk after a short delay to avoid blocking the UI
          setTimeout(() => loadChunks(chunkIndex + 1), 50);
        }
      };

      // Start loading chunks
      setInventoryUpdates([]); // Clear existing data before appending
      loadChunks();

      setLoading(false);
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching receipts.");
      }
      console.error("Error fetching receipts:", error);
    }
  };
  const fetchProducts = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token"); // Or sessionStorage if that's where you store it

      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/productRouter/products?email=${encodeURIComponent(
          userEmail
        )}`
      );
      if (!response.ok) {
        const errorMessage = await response.text(); // or response.json() if you return JSON errors
        toast.error(`Error: ${"User not found or invalid email."}`);
      }
      const responseData = await response.json();

      const filteredProducts = responseData.data.filter(
        (product) => product.userId === userId
      );

      filteredProducts.sort((a, b) =>
        a.productName.localeCompare(b.productName)
      );

      // Clear previous products and set new ones
      setProducts([]);

      // Process products in chunks
      const CHUNK_SIZE = 800;
      const loadChunks = (chunkIndex = 0) => {
        const start = chunkIndex * CHUNK_SIZE;
        const end = start + CHUNK_SIZE;
        const chunk = filteredProducts.slice(start, end);

        if (chunk.length > 0) {
          setProducts((prevProducts) => {
            const uniqueProducts = [
              ...prevProducts,
              ...chunk.filter(
                (newProduct) =>
                  !prevProducts.some(
                    (existingProduct) =>
                      existingProduct.productId === newProduct.productId
                  )
              ),
            ];
            return uniqueProducts;
          });

          setTimeout(() => loadChunks(chunkIndex + 1), 50);
        } else {
          setLoading(false);
        }
      };

      loadChunks();

      // Update `filteredItems` only if no filters are applied
      // if (!isFilteringActive) {
      //   setFilteredItems(filteredProducts);
      // }
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching receipts.");
      }
      console.error("Error fetching receipts:", error);
    }
  };
  const onRefreshInventory = async (
    selectedOptionDate,
    selectedStartRange,
    selectedEndRange
  ) => {
    NProgress.start(); // 🔵 Start progress bar

    setIsRefreshing(true);
    await fetchInventoryUpdates(
      selectedOptionDate,
      selectedStartRange,
      selectedEndRange
    )
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
      !event.target.closest(".buttonContainerStoresInventory")
    ) {
      setIsStoreDropdownOpen(false);
      console.log("Selected Stores:", selectedStores);

      if (selectedStores.length === 0) {
        setInventoryUpdates([]);
      } else {
        // onRefreshInventory(selectedOption, selectedStartDate, selectedEndDate);
      }
    }

    if (
      isExportDropdownOpen &&
      !event.target.closest(".buttonContainerExportInventory")
    ) {
      setIsExportDropdownOpen(false);
      console.log("Selected Export Option:");
    }

    if (isDropdownVisible && !event.target.closest(".filterDropdown")) {
      setIsDropdownVisible(false);
      console.log("Selected Dropdown filter Option:");
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
    onRefreshInventory(selectedOption, startDate, endDate);
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
    onRefreshInventory(selectedOption, newStartDate, newEndDate);
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
      onRefreshInventory(selectedOption, newStartDate, newEndDate);
    }
  };

  function handleItemClick(item) {
    setModalReceipt(item);
  }
  const handleToggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };
  const toggleFilterType = (type) => {
    setSelectedTypes((prevSelected) => {
      if (prevSelected.includes(type)) {
        return prevSelected.filter((item) => item !== type); // Remove the type if it is already selected
      } else {
        return [...prevSelected, type]; // Add the type if it is not selected
      }
    });
  };
  const handleSignOut = () => {
    NProgress.start(); // ✅ End progress bar

    localStorage.removeItem("token");
    window.location.href = "/"; // or navigate to login using React Router
    NProgress.done(); // ✅ End progress bar
  };
  const storeName =
    selectedStores && selectedStores.length > 0
      ? selectedStores[0].storeName
      : "Store";
  const filteredInventory = useMemo(() => {
    return inventoryUpdates
      .filter((inventory) => {
        const productName = inventory.productName?.toLowerCase() || "";
        const searchQuery = searchTerm.toLowerCase();

        const matchesSearch = productName.includes(searchQuery);
        const matchesType =
          selectedTypes.length === 0 ||
          selectedTypes.includes(inventory.typeOfEdit);

        return matchesSearch && matchesType;
      })
      .sort((a, b) => new Date(b.currentDate) - new Date(a.currentDate));
  }, [inventoryUpdates, searchTerm, selectedTypes]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Inventory History", 14, 20);

    // Subtitle with date range and store name
    doc.setFontSize(12);
    doc.text(`Store: ${storeName}`, 14, 30);
    doc.text(
      `Date Range: ${format(selectedStartDate, "MMM d, yyyy")} - ${format(
        selectedEndDate,
        "MMM d, yyyy"
      )}`,
      14,
      36
    );

    // Table
    autoTable(doc, {
      startY: 45,
      head: [
        [
          "Date",
          "Product",
          "Price",
          "Cost",
          "Editor",
          "Type of Edit",
          "Stock Before",
          "Diff",
          "Stock After",
        ],
      ],
      body: filteredInventory.map((item) => {
        const isWeight =
          item.productType === "Weight" || item.productType === "";
        const stockBefore = isWeight
          ? parseFloat(item.stockBefore).toFixed(2)
          : parseFloat(item.stockBefore);
        const stockAfter = isWeight
          ? parseFloat(item.stockAfter).toFixed(2)
          : parseFloat(item.stockAfter);
        const rawDifference = stockAfter - stockBefore;
        const difference = isWeight ? rawDifference.toFixed(2) : rawDifference;
        const diffLabel =
          rawDifference > 0 ? `+${difference}` : `${difference}`;

        // Get price and cost from products array
        const product = products.find((p) => p.productId === item.productId);
        const price = product?.price ?? "N/A";
        const cost = product?.cost ?? "N/A";

        if (!product) {
          console.log("No product found for item:", item);
        }

        return [
          format(new Date(item.currentDate), "MMM d, yyyy - hh:mm:ss a"),
          item.productName || item.itemName,
          Number(price).toFixed(2),
          Number(cost).toFixed(2),
          `${item.createdBy} (${item.roleOfEditor})`,
          item.typeOfEdit || "N/A",
          stockBefore,
          diffLabel,
          stockAfter,
        ];
      }),
    });

    doc.save("inventory-history.pdf");
  };
  const handleDownloadCSV = () => {
    const header = [
      "Inventory History",
      `Store: ${storeName}`,
      `"Date Range: ${format(selectedStartDate, "MMM d, yyyy")} - ${format(
        selectedEndDate,
        "MMM d, yyyy"
      )}"`,
      "",
      "Date,Product,Price,Cost,Editor,Type of Edit,Stock Before,Difference,Stock After",
    ];

    const rows = filteredInventory.map((item) => {
      const isWeight = item.productType === "Weight" || item.productType === "";
      const stockBefore = isWeight
        ? parseFloat(item.stockBefore).toFixed(2)
        : parseFloat(item.stockBefore);
      const stockAfter = isWeight
        ? parseFloat(item.stockAfter).toFixed(2)
        : parseFloat(item.stockAfter);
      const rawDifference = stockAfter - stockBefore;
      const difference = isWeight ? rawDifference.toFixed(2) : rawDifference;
      const diffLabel = rawDifference > 0 ? `+${difference}` : `${difference}`;

      const formattedDate = format(
        new Date(item.currentDate),
        "MMM d, yyyy - hh:mm:ss a"
      );

      // Get price and cost from products array
      const product = products.find((p) => p.productId === item.productId);
      const price = product?.price || "N/A";
      const cost = product?.cost || "N/A";

      return [
        `"${formattedDate}"`,
        item.productName || item.itemName,
        Number(price).toFixed(2),
        Number(cost).toFixed(2),
        `${item.createdBy} (${item.roleOfEditor})`,
        item.typeOfEdit || "N/A",
        stockBefore,
        diffLabel,
        stockAfter,
      ].join(",");
    });

    const csvContent = [...header, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mainContainerInventory">
      {showDropdown && (
        <div className="dropdownMenu">
          <button className="signOutButton" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      )}
      <div className="toolBarInventory">
        {isSidebarOpen ? (
          <FaTimes className="sidebar-icon" onClick={toggleSidebar} />
        ) : (
          <FaBars className="sidebar-icon" onClick={toggleSidebar} />
        )}
        <span className="toolBarTitle">Inventory</span>
      </div>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="buttonsContainerInventory">
        <div className="buttonContainerDateInventory">
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
          <div
            ref={dateRangePickerRef}
            className="datePickerContainerInventory"
          >
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
        <div className="buttonContainerStoresInventory">
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

        <div className="buttonContainerExportInventory">
          <button
            className="inputButtonExportInventory"
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
                  handleDownloadPDF();
                  setIsExportDropdownOpen(false);

                  console.log("PDF");
                }}
              >
                <span className="storeName">
                  Download PDF{" "}
                  <FaFilePdf color="red" style={{ marginRight: 8 }} />
                </span>{" "}
              </div>
              <div
                className="dropdownItem"
                onClick={() => {
                  handleDownloadCSV();

                  setIsExportDropdownOpen(false);
                  console.log("PDF");
                }}
              >
                <span className="storeName">
                  Download PDF{" "}
                  <FaFileCsv color="green" style={{ marginRight: 8 }} />
                </span>{" "}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="InventoryContainerInventory">
        {/* Search Input */}
        <div className="searchBarInventory">
          <div className="searchInputWrapper">
            <input
              type="text"
              placeholder="Search Product..."
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
          {/* Filter Dropdown */}
          <div className="filterContainer">
            {/* Button to toggle the visibility of the filter dropdown */}
            <button onClick={() => setIsDropdownVisible(!isDropdownVisible)}>
              {isDropdownVisible ? "Hide Filters" : "Show Filters"}
            </button>

            {/* Dropdown container */}
            <div
              className={`filterDropdown ${isDropdownVisible ? "show" : ""}`}
            >
              <label>
                <input
                  type="checkbox"
                  value="Sale"
                  checked={selectedTypes.includes("Sale")}
                  onChange={(e) => toggleFilterType(e.target.value)}
                />
                Sale
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Add"
                  checked={selectedTypes.includes("Add")}
                  onChange={(e) => toggleFilterType(e.target.value)}
                />
                Add
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Refund"
                  checked={selectedTypes.includes("Refund")}
                  onChange={(e) => toggleFilterType(e.target.value)}
                />
                Refund
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Create"
                  checked={selectedTypes.includes("Create")}
                  onChange={(e) => toggleFilterType(e.target.value)}
                />
                Create
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Override"
                  checked={selectedTypes.includes("Override")}
                  onChange={(e) => toggleFilterType(e.target.value)}
                />
                Override
              </label>
            </div>
          </div>
        </div>
        <div className="InventorySubContainer">
          <div className="inventoryHeader">
            <div className="headerItem">Date</div>
            <div className="headerItem">Product Name</div>
            <div className="headerItem">Edited By</div>
            <div className="headerItem">Type of Edit</div>
            <div className="headerItem">Stock Before</div>
            <div className="headerItem">Adjustment</div>
            <div className="headerItem">Stock After</div>
          </div>
          {filteredInventory.map((item, index) => {
            const matchedStore = stores.find(
              (store) => store.storeId === item.storeId
            );
            const formattedStockBefore =
              item.productType === "Weight" || item.productType === ""
                ? parseFloat(item.stockBefore).toFixed(2)
                : parseFloat(item.stockBefore);
            const formattedStockAfter =
              item.productType === "Weight" || item.productType === ""
                ? parseFloat(item.stockAfter).toFixed(2)
                : parseFloat(item.stockAfter);
            const difference = formattedStockAfter - formattedStockBefore;
            const differenceColor = difference < 0 ? "red" : "green";

            return (
              <InventoryListItem
                key={index}
                itemName={item.productName}
                date={item.currentDate}
                storeName={matchedStore?.storeName || "Unknown Store"}
                stockBefore={formattedStockBefore}
                stockAfter={formattedStockAfter}
                difference={difference}
                productType={item.productType}
                createdBy={item.createdBy}
                roleofeditor={item.roleOfEditor}
                typeofedit={item.typeOfEdit}
                differenceColor={differenceColor}
                totalSales={Number(item.totalAmountUsd * item.rate).toFixed(2)}
                onClick={() => handleItemClick(item)}
              />
            );
          })}
        </div>
      </div>
      <RemainingTimeFooter />

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default InventoryHistoryScreen;
