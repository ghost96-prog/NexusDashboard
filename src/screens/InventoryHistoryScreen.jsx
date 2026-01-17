import React, { useState, useEffect, useRef, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaBars,
  FaTimes,
  FaStore,
  FaDownload,
  FaSearch,
  FaTimes as FaTimesIcon,
  FaFilter,
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt
} from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import { DateRangePicker, defaultStaticRanges } from "react-date-range";
import {
  startOfToday,
  endOfToday,
  subDays,
  addDays,
  subWeeks,
  addWeeks,
  subMonths,
  addMonths,
  subYears,
  addYears,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import "../Css/InventoryHistoryScreen.css";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { FaFileCsv, FaFilePdf } from "react-icons/fa6";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import RemainingTimeFooter from "../components/RemainingTimeFooter";

const InventoryHistoryScreen = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState([]);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [stores, setStoreData] = useState([]);
  const [selectedStartDate, setSelectedStartDate] = useState(startOfToday());
  const [selectedEndDate, setSelectedEndDate] = useState(endOfToday());
  const [selectedOption, setSelectedOption] = useState("today");
  const [selectedRange, setSelectedRange] = useState("Today");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dateRangePickerRef = useRef(null);
  const [inventoryUpdates, setInventoryUpdates] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [email, setEmail] = useState(null);
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
    if (selectedStores.length > 0) {
      onRefreshInventory(selectedOption, selectedStartDate, selectedEndDate);
    }
  }, [selectedStores, selectedOption, selectedStartDate, selectedEndDate]);

  useEffect(() => {
    setSelectedStores(stores);
  }, [selectedOption, stores]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    if (email) {
      fetchStores();
      fetchProducts();
    }
  }, [email]);
// Add this useEffect hook after your other useEffect hooks
useEffect(() => {
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .datePickerContainerInventory .rdrMonths {
        display: flex !important;
        flex-wrap: nowrap !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
        scroll-snap-type: x mandatory !important;
      }
      
      .datePickerContainerInventory .rdrMonth {
        min-width: 100% !important;
        scroll-snap-align: start !important;
        flex-shrink: 0 !important;
      }
      
      .datePickerContainerInventory {
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: 95vw !important;
        max-width: 400px !important;
        max-height: 85vh !important;
        overflow: auto !important;
        z-index: 9999 !important;
        background: white !important;
        border-radius: 12px !important;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;
        padding: 16px !important;
      }
      
      /* Hide default navigation arrows if they exist */
      .datePickerContainerInventory .rdrNextPrevButton {
        z-index: 2 !important;
      }
      
      /* Ensure date picker wrapper takes full width */
      .datePickerContainerInventory .rdrDateRangePickerWrapper {
        width: 100% !important;
      }
      
      /* Style for better mobile experience */
      .datePickerContainerInventory .rdrCalendarWrapper {
        width: 100% !important;
      }
      
      /* Prevent horizontal scroll on body when date picker is open */
      body.date-picker-open {
        overflow: hidden !important;
      }
    }
    
    @media (max-width: 480px) {
      .datePickerContainerInventory {
        width: 98vw !important;
        padding: 12px !important;
      }
      
      .datePickerContainerInventory .rdrMonth {
        min-width: 95vw !important;
      }
      
      /* Adjust font sizes for very small screens */
      .datePickerContainerInventory .rdrDay,
      .datePickerContainerInventory .rdrWeekDay {
        font-size: 12px !important;
      }
    }
  `;
  
  document.head.appendChild(style);
  
  return () => {
    document.head.removeChild(style);
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

  const fetchInventoryUpdates = async (timeframe, startDate, endDate) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId;

      const formattedStartDate = startDate;
      const formattedEndDate = endDate;
      
      const response = await fetch(
        `https://nexuspos.onrender.com/api/inventoryRouter/${timeframe}?startDate=${formattedStartDate}&endDate=${formattedEndDate}&email=${encodeURIComponent(
          userEmail
        )}`
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error(`Error: ${"User not found or invalid email."}`);
        return;
      }

      const responseData = await response.json();

      if (!Array.isArray(responseData.data)) {
        console.error("Invalid API response. Expected array:", responseData);
        throw new Error("Invalid API response");
      }

      const filteredUpdates = responseData.data.filter(
        (update) => update.userId === userId
      );

      const CHUNK_SIZE = 400;
      const loadChunks = async (chunkIndex = 0) => {
        const start = chunkIndex * CHUNK_SIZE;
        const end = start + CHUNK_SIZE;
        const chunk = filteredUpdates.slice(start, end);

        if (chunk.length > 0) {
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

          setTimeout(() => loadChunks(chunkIndex + 1), 50);
        }
      };

      setInventoryUpdates([]);
      loadChunks();
      setLoading(false);
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching inventory updates.");
      }
      console.error("Error fetching receipts:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
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
        const errorMessage = await response.text();
        toast.error(`Error: ${"User not found or invalid email."}`);
        return;
      }
      
      const responseData = await response.json();

      const filteredProducts = responseData.data.filter(
        (product) => product.userId === userId
      );

      filteredProducts.sort((a, b) =>
        a.productName.localeCompare(b.productName)
      );

      setProducts([]);

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
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching products.");
      }
      console.error("Error fetching products:", error);
    }
  };

  const onRefreshInventory = async (
    selectedOptionDate,
    selectedStartRange,
    selectedEndRange
  ) => {
    NProgress.start();
    setIsRefreshing(true);
    
    try {
      await fetchInventoryUpdates(
        selectedOptionDate,
        selectedStartRange,
        selectedEndRange
      );
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
      !event.target.closest(".inventory-history-store-selector")
    ) {
      setIsStoreDropdownOpen(false);
    }

    if (
      isExportDropdownOpen &&
      !event.target.closest(".inventory-history-export-selector")
    ) {
      setIsExportDropdownOpen(false);
    }

    if (
      isFilterDropdownOpen &&
      !event.target.closest(".inventory-history-filter-selector")
    ) {
      setIsFilterDropdownOpen(false);
    }

    if (isDatePickerOpen && !event.target.closest(".datePickerContainerInventory")) {
      setIsDatePickerOpen(false);
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
        startDate: new Date(new Date().getFullYear(), 0, 1),
        endDate: new Date(new Date().getFullYear(), 11, 31),
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

    if (selectedEndDate <= new Date()) {
      setSelectedStartDate(newStartDate);
      setSelectedEndDate(newEndDate);
      onRefreshInventory(selectedOption, newStartDate, newEndDate);
    }
  };

  const handleFilterSelect = (type) => {
    if (type === "All Types") {
      if (selectedTypes.length === 6) { // 6 filter types
        setSelectedTypes([]);
      } else {
        setSelectedTypes(['Sale', 'Add', 'Refund', 'Create', 'Override', 'Stock Count']);
      }
    } else {
      const exists = selectedTypes.includes(type);
      const updatedTypes = exists
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes, type];
      setSelectedTypes(updatedTypes);
    }
  };

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

  const getEditTypeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'sale':
        return 'inventory-history-edit-sale';
      case 'add':
        return 'inventory-history-edit-add';
      case 'refund':
        return 'inventory-history-edit-refund';
      case 'create':
        return 'inventory-history-edit-create';
      case 'override':
        return 'inventory-history-edit-override';
      case 'stock count':
        return 'inventory-history-edit-count';
      default:
        return '';
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const storeName = selectedStores && selectedStores.length > 0
      ? selectedStores[0].storeName
      : "Store";

    doc.setFontSize(18);
    doc.text("Inventory History", 14, 20);

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

        const product = products.find((p) => p.productId === item.productId);
        const price = product?.price ?? "N/A";
        const cost = product?.cost ?? "N/A";

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
    const storeName = selectedStores && selectedStores.length > 0
      ? selectedStores[0].storeName
      : "Store";

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

      const product = products.find((p) => p.productId === item.productId);
      const price = product?.price || 0;
      const cost = product?.cost || 0;

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
    <div className="inventory-history-container">
      <div className="inventory-history-sidebar-toggle-wrapper">
        <button 
          className="inventory-history-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: isSidebarOpen ? '280px' : '80px' }}
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`inventory-history-content ${isSidebarOpen ? "inventory-history-content-shifted" : "inventory-history-content-collapsed"}`}>
        {/* Toolbar */}
        <div className="inventory-history-toolbar">
          <div className="inventory-history-toolbar-content">
            <h1 className="inventory-history-toolbar-title">Inventory History</h1>
            <div className="inventory-history-toolbar-subtitle">
              Track inventory changes and adjustments
            </div>
          </div>
          <div className="inventory-history-toolbar-actions">
            <button 
              className="inventory-history-refresh-btn"
              onClick={() => onRefreshInventory(selectedOption, selectedStartDate, selectedEndDate)}
              disabled={isRefreshing}
            >
              <IoReload />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="inventory-history-control-panel">
          <div className="inventory-history-filter-controls">
          
            <div className="inventory-history-date-selector">
                            <div className="inventory-history-date-nav">

               <button 
                  className="inventory-history-date-nav-btn"
                  onClick={handleBackClick}
                >
                  <FaArrowLeft />
                </button>
                </div>
              <button 
                className="inventory-history-date-btn"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              >
                <FaCalendarAlt />
                <span>
                  {selectedStartDate && selectedEndDate
                    ? `${format(selectedStartDate, "MMM d, yyyy")} - ${format(selectedEndDate, "MMM d, yyyy")}`
                    : "Select Date Range"}
                </span>
              </button>
              <div className="inventory-history-date-nav">
               
                <button 
                  className="inventory-history-date-nav-btn"
                  onClick={handleForwardClick}
                >
                  <FaArrowRight />
                </button>
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
            </div>
  <div className="inventory-history-store-selector">
              <button 
                className="inventory-history-filter-btn"
                onClick={() => {
                  setIsStoreDropdownOpen(!isStoreDropdownOpen);
                  setIsExportDropdownOpen(false);
                  setIsFilterDropdownOpen(false);
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
                <div className="inventory-history-dropdown">
                  <div className="inventory-history-dropdown-header">
                    <span>Select Stores</span>
                    <button 
                      className="inventory-history-dropdown-select-all"
                      onClick={() => handleStoreSelect("All Stores")}
                    >
                      {selectedStores.length === stores.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="inventory-history-dropdown-content">
                    {stores.map((store) => (
                      <div
                        className="inventory-history-dropdown-item"
                        key={store.storeId}
                        onClick={() => handleStoreSelect(store)}
                      >
                        <div className="inventory-history-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedStores.some((s) => s.storeId === store.storeId)}
                            readOnly
                          />
                          <div className="inventory-history-checkbox-custom"></div>
                        </div>
                        <span className="inventory-history-store-name">{store.storeName}</span>
                        <span className="inventory-history-store-location">{store.location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="inventory-history-filter-selector">
              <button 
                className="inventory-history-filter-btn"
                onClick={() => {
                  setIsFilterDropdownOpen(!isFilterDropdownOpen);
                  setIsStoreDropdownOpen(false);
                  setIsExportDropdownOpen(false);
                }}
              >
                <FaFilter />
                <span>
                  {selectedTypes.length === 0
                    ? "Filter by Type"
                    : selectedTypes.length === 6
                    ? "All Types"
                    : `${selectedTypes.length} types`}
                </span>
              </button>
              
              {isFilterDropdownOpen && (
                <div className="inventory-history-dropdown">
                  <div className="inventory-history-dropdown-header">
                    <span>Filter by Edit Type</span>
                    <button 
                      className="inventory-history-dropdown-select-all"
                      onClick={() => handleFilterSelect("All Types")}
                    >
                      {selectedTypes.length === 6 ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="inventory-history-dropdown-content">
                    {['Sale', 'Add', 'Refund', 'Create', 'Override', 'Stock Count','Goods Received', 'Stock Transfer Out'].map((type) => (
                      <div
                        className="inventory-history-dropdown-item"
                        key={type}
                        onClick={() => handleFilterSelect(type)}
                      >
                        <div className="inventory-history-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(type)}
                            readOnly
                          />
                          <div className="inventory-history-checkbox-custom"></div>
                        </div>
                        <span className="inventory-history-filter-name">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="inventory-history-export-selector">
              <button 
                className="inventory-history-filter-btn"
                onClick={() => {
                  setIsExportDropdownOpen(!isExportDropdownOpen);
                  setIsStoreDropdownOpen(false);
                  setIsFilterDropdownOpen(false);
                }}
              >
                <FaDownload />
                <span>Export</span>
              </button>
              
              {isExportDropdownOpen && (
                <div className="inventory-history-export-dropdown">
                  <div 
                    className="inventory-history-export-item"
                    onClick={handleDownloadPDF}
                  >
                    <FaFilePdf color="#ef4444" />
                    <span>Download PDF</span>
                  </div>
                  <div 
                    className="inventory-history-export-item"
                    onClick={handleDownloadCSV}
                  >
                    <FaFileCsv color="#10b981" />
                    <span>Download CSV</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="inventory-history-search-filter">
          <div className="inventory-history-search-container">
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="inventory-history-search-input"
              style={{ paddingLeft: '40px' }}
            />
            {searchTerm && (
              <button 
                className="inventory-history-search-clear"
                onClick={() => setSearchTerm("")}
              >
                <FaTimesIcon />
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="inventory-history-table-container">
          <div className="inventory-history-table-header">
            <h3>Inventory History Details</h3>
            <span className="inventory-history-table-count">
              {isRefreshing ? 'Refreshing...' : 
               filteredInventory.length > 0 ? `Showing ${filteredInventory.length} records` : 
               loading ? 'Loading...' : 'No records found'}
            </span>
          </div>
          
          <div className="inventory-history-table-wrapper">
            <table className="inventory-history-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Product Name</th>
                  <th>Edited By</th>
                  <th>Type of Edit</th>
                  <th>Stock Before</th>
                  <th>Adjustment</th>
                  <th>Stock After</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item, index) => {
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
                    
                    return (
                      <tr 
                        key={`${item.id || item.productId}-${index}`} 
                        className="inventory-history-table-row"
                      >
                        <td className="inventory-history-table-cell">
                          {format(new Date(item.currentDate), "MMM d, yyyy - hh:mm a")}
                        </td>
                        <td className="inventory-history-table-cell">
                          <span style={{ fontWeight: '500' }}>
                            {item.productName || item.itemName}
                          </span>
                         
                        </td>
                        <td className="inventory-history-table-cell">
                          {item.createdBy}
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {item.roleOfEditor}
                          </div>
                        </td>
                        <td className="inventory-history-table-cell">
                          <span className={`inventory-history-edit-badge ${getEditTypeClass(item.typeOfEdit)}`}>
                            {item.typeOfEdit || 'N/A'}
                          </span>
                        </td>
                        <td className="inventory-history-table-cell">
                          {formattedStockBefore}
                        </td>
                        <td className="inventory-history-table-cell">
                          <span className={`inventory-history-adjustment ${
                            difference >= 0 ? 'inventory-history-adjustment-positive' : 'inventory-history-adjustment-negative'
                          }`}>
                            {difference >= 0 ? `+${difference.toFixed(2)}` : `${difference.toFixed(2)}`}
                          </span>
                        </td>
                        <td className="inventory-history-table-cell">
                          {formattedStockAfter}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="inventory-history-empty-state">
                      <div className="inventory-history-empty-icon">
                        <FaTimes />
                      </div>
                      <h3 className="inventory-history-empty-title">
                        {loading ? 'Loading inventory history...' : 
                         searchTerm ? `No results for "${searchTerm}"` : 
                         'No Inventory Records Found'}
                      </h3>
                      <p className="inventory-history-empty-description">
                        {searchTerm ? 'Try adjusting your search or filters' :
                         'No inventory changes found for the selected period and filters'}
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
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default InventoryHistoryScreen;