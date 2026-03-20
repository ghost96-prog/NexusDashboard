import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaStore,
  FaDownload,
  FaChartLine,
  FaBox,
  FaShoppingCart,
  FaFilter,
  FaSearch,
  FaTimes,
  FaBars,
  FaFileAlt,
} from "react-icons/fa";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
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
import "../Css/TopSellingProducts.css";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { IoCalendar } from "react-icons/io5";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFileCsv, FaFilePdf } from "react-icons/fa6";
import RemainingTimeFooter from "../components/RemainingTimeFooter";

const StatCard = React.memo(({ title, value, icon, color, isCurrency = true, subValue }) => (
  <div className="topselling-stat-card">
    <div className="topselling-stat-icon-container" style={{ backgroundColor: color + '20', color: color }}>
      <div className="topselling-stat-icon-circle">
        {icon}
      </div>
    </div>
    <div className="topselling-stat-content">
      <div className="topselling-stat-title">{title}</div>
      <div className="topselling-stat-value">
        {isCurrency ? '$' : ''}{value.toLocaleString(undefined, {
          minimumFractionDigits: isCurrency ? 2 : 0,
          maximumFractionDigits: isCurrency ? 2 : 0,
        })}
      </div>
      {subValue && <div className="topselling-stat-subvalue">{subValue}</div>}
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

const TopSellingProducts = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [stores, setStoreData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedStartDate, setSelectedStartDate] = useState(startOfToday());
  const [selectedEndDate, setSelectedEndDate] = useState(endOfToday());
  const [selectedOption, setSelectedOption] = useState("today");
  const [selectedRange, setSelectedRange] = useState("Today");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dateRangePickerRef = useRef(null);
  const [productSummary, setProductSummary] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState(null);
  const [filterTopSellingBySales, setFilterTopSelling] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);

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
    if (selectedStores.length > 0 && selectedCategories.length > 0 && email) {
      onRefresh(selectedOption, selectedStartDate, selectedEndDate);
    }
  }, [selectedStores, selectedCategories, selectedOption, selectedStartDate, selectedEndDate, filterTopSellingBySales, email]);

  useEffect(() => {
    if (stores.length > 0) {
      setSelectedStores(stores);
    }
  }, [stores]);

  useEffect(() => {
    if (email) {
      fetchStores();
      fetchCategories();
    }
  }, [email]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(!isSidebarOpen);
  }, [isSidebarOpen]);

  const fetchStores = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/storeRouter/stores?email=${encodeURIComponent(userEmail)}`
      );

      if (!response.ok) {
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
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/categoryRouter/categories?email=${encodeURIComponent(userEmail)}`
      );
      
      const data = await response.json();
      if (!response.ok) {
        toast.error(`Error fetching categories`);
        return;
      }
      
      if (data.success) {
        setCategories(data.data);
        // Select ALL categories including "No Category" by default
        const allCategories = [
          ...data.data,
          { categoryName: "NO CATEGORY", categoryId: "no-category" }
        ];
        setSelectedCategories(allCategories);
      } else {
        console.error("Error fetching categories:", data.error);
      }
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching categories.");
      }
      console.error("Error fetching categories:", error);
    }
  }, []);

  const fetchAllReceiptsData = useCallback(async (timeframe, startDate, endDate) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/dashboardRouter/${timeframe}?startDate=${startDate}&endDate=${endDate}&email=${encodeURIComponent(userEmail)}`
      );
      const responseData = await response.json();

      if (!response.ok) {
        toast.error(`Error fetching data`);
        return;
      }

      const { soldProducts } = responseData;
      
      // Convert soldProducts to array
      let productsArray = Object.values(soldProducts || {});
      
      // Filter by stores
      if (selectedStores.length > 0 && selectedStores.length < stores.length) {
        const storeIds = selectedStores.map(store => store.storeId);
        productsArray = productsArray.filter(product => storeIds.includes(product.storeId));
      }
      
      // Filter by categories
      if (selectedCategories.length > 0 && selectedCategories.length < categories.length + 1) {
        const hasNoCategorySelected = selectedCategories.some(cat => 
          cat.categoryName && cat.categoryName.toUpperCase() === "NO CATEGORY"
        );
        const selectedCategoryNames = selectedCategories
          .filter(cat => cat.categoryName && cat.categoryName.toUpperCase() !== "NO CATEGORY")
          .map(cat => cat.categoryName);
        
        productsArray = productsArray.filter(product => {
          const hasRegularCategory = product.category && 
                                     product.category.trim() !== "" && 
                                     product.category.toUpperCase() !== "NO CATEGORY";
          
          if (hasNoCategorySelected) {
            if (selectedCategoryNames.length > 0) {
              const matchesRegularCategory = selectedCategoryNames.some(catName => 
                catName.toUpperCase() === product.category?.toUpperCase()
              );
              const isNoCategoryProduct = !product.category || 
                                          product.category.trim() === "" || 
                                          product.category.toUpperCase() === "NO CATEGORY";
              return matchesRegularCategory || isNoCategoryProduct;
            } else {
              const isNoCategoryProduct = !product.category || 
                                          product.category.trim() === "" || 
                                          product.category.toUpperCase() === "NO CATEGORY";
              return isNoCategoryProduct;
            }
          } else {
            if (selectedCategoryNames.length > 0) {
              const matchesRegularCategory = selectedCategoryNames.some(catName => 
                catName.toUpperCase() === product.category?.toUpperCase()
              );
              const isNoCategoryProduct = !product.category || 
                                          product.category.trim() === "" || 
                                          product.category.toUpperCase() === "NO CATEGORY";
              return matchesRegularCategory && !isNoCategoryProduct;
            }
          }
          return true;
        });
      }

      let sortedProductSummary;
      if (filterTopSellingBySales) {
        sortedProductSummary = [...productsArray].sort(
          (a, b) => (b.totalPrice || 0) - (a.totalPrice || 0)
        );
      } else {
        sortedProductSummary = [...productsArray].sort(
          (a, b) => (b.quantity || 0) - (a.quantity || 0)
        );
      }

      // Calculate totals
      const salesTotal = sortedProductSummary.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const costTotal = sortedProductSummary.reduce((sum, item) => sum + (item.totalCost || 0), 0);
      const profitTotal = sortedProductSummary.reduce((sum, item) => sum + (item.profit || 0), 0);
      const quantityTotal = sortedProductSummary.reduce((sum, item) => sum + (item.quantity || 0), 0);

      setTotalSales(salesTotal);
      setTotalCost(costTotal);
      setTotalProfit(profitTotal);
      setTotalQuantity(quantityTotal);
      setProductSummary(sortedProductSummary);

    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching products.");
      }
      console.error("Error fetching products:", error);
    }
  }, [filterTopSellingBySales, selectedStores, selectedCategories, stores, categories]);

  const onRefresh = useCallback(async (selectedOption, selectedStartRange, selectedEndRange) => {
    NProgress.start();
    setIsRefreshing(true);
    await fetchAllReceiptsData(selectedOption, selectedStartRange, selectedEndRange);
    NProgress.done();
    setIsRefreshing(false);
  }, [fetchAllReceiptsData]);

  const handleStoreSelect = useCallback((store) => {
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
  }, [selectedStores, stores]);

  const handleCategorySelect = useCallback((category) => {
    if (category === "All Categories") {
      const totalCategoriesCount = categories.length + 1;
      if (selectedCategories.length === totalCategoriesCount) {
        setSelectedCategories([]);
      } else {
        const allCategories = [
          ...categories,
          { categoryName: "NO CATEGORY", categoryId: "no-category" }
        ];
        setSelectedCategories(allCategories);
      }
      return;
    }

    if (category.categoryName === "NO CATEGORY" || category.categoryName === "No Category") {
      const exists = selectedCategories.some(s => 
        s.categoryName && s.categoryName.toUpperCase() === "NO CATEGORY"
      );
      const updatedCategories = exists
        ? selectedCategories.filter(s => s.categoryName && s.categoryName.toUpperCase() !== "NO CATEGORY")
        : [...selectedCategories, { categoryName: "NO CATEGORY", categoryId: "no-category" }];
      setSelectedCategories(updatedCategories);
      return;
    }

    const exists = selectedCategories.some(
      (s) => s.categoryId === category.categoryId
    );
    const updatedCategories = exists
      ? selectedCategories.filter((s) => s.categoryId !== category.categoryId)
      : [...selectedCategories, category];
    setSelectedCategories(updatedCategories);
  }, [selectedCategories, categories]);

  const handleClickOutside = useCallback((event) => {
    if (isStoreDropdownOpen && !event.target.closest(".topselling-store-selector")) {
      setIsStoreDropdownOpen(false);
    }

    if (isCategoryDropdownOpen && !event.target.closest(".topselling-category-selector")) {
      setIsCategoryDropdownOpen(false);
    }

    if (isExportDropdownOpen && !event.target.closest(".topselling-export-button")) {
      setIsExportDropdownOpen(false);
    }
  }, [isStoreDropdownOpen, isCategoryDropdownOpen, isExportDropdownOpen]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateRangePickerRef.current && !dateRangePickerRef.current.contains(event.target)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDateRangeChange = useCallback((ranges) => {
    const { startDate, endDate } = ranges.selection;
    setSelectedStartDate(startDate);
    setSelectedEndDate(endDate);
    setSelectedOption("customPeriod");
    setSelectedRange("Custom");
    onRefresh("customPeriod", startDate, endDate);
  }, [onRefresh]);

  const handleBackClick = useCallback(() => {
    let newStartDate, newEndDate;
    newStartDate = subDays(selectedStartDate, 1);
    newEndDate = subDays(selectedEndDate, 1);
    setSelectedStartDate(newStartDate);
    setSelectedEndDate(newEndDate);
    onRefresh(selectedOption, newStartDate, newEndDate);
  }, [selectedStartDate, selectedEndDate, selectedOption, onRefresh]);

  const handleForwardClick = useCallback(() => {
    let newStartDate, newEndDate;
    newStartDate = addDays(selectedStartDate, 1);
    newEndDate = addDays(selectedEndDate, 1);
    if (newEndDate <= new Date()) {
      setSelectedStartDate(newStartDate);
      setSelectedEndDate(newEndDate);
      onRefresh(selectedOption, newStartDate, newEndDate);
    }
  }, [selectedStartDate, selectedEndDate, selectedOption, onRefresh]);

  const handlePDFExport = useCallback(() => {
    const doc = new jsPDF();
    const date = new Date().toLocaleString();
    doc.text("Top Selling Products", 14, 20);
    doc.text(`Generated on: ${date}`, 14, 28);
    
    const storeNames = selectedStores.length === 0 ? "All Stores" : selectedStores.map(s => s.storeName).join(", ");
    doc.text(`Stores: ${storeNames}`, 14, 36);
    
    const categoryNames = selectedCategories.length === 0 ? "All Categories" : selectedCategories.map(c => c.categoryName).join(", ");
    doc.text(`Categories: ${categoryNames}`, 14, 44);

    const tableData = productSummary.map((item) => [
      item.productName,
      item.quantity || 0,
      `$${Number(item.totalPrice || 0).toFixed(2)}`,
      `$${Number(item.totalCost || 0).toFixed(2)}`,
      `$${Number(item.profit || 0).toFixed(2)}`,
    ]);

    tableData.push([
      "TOTAL",
      totalQuantity,
      `$${totalSales.toFixed(2)}`,
      `$${totalCost.toFixed(2)}`,
      `$${totalProfit.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 52,
      head: [["Product Name", "QTY", "Total Sales", "Total Cost", "Profit"]],
      body: tableData,
    });

    doc.save("TopSellingProducts.pdf");
  }, [productSummary, totalQuantity, totalSales, totalCost, totalProfit, selectedStores, selectedCategories]);

  const handleCSVExport = useCallback(() => {
    const date = new Date().toLocaleString();
    const storeNames = selectedStores.length === 0 ? "All Stores" : selectedStores.map(s => s.storeName).join(", ");
    const categoryNames = selectedCategories.length === 0 ? "All Categories" : selectedCategories.map(c => c.categoryName).join(", ");

    let csv = "TOP SELLING PRODUCTS\n\n";
    csv += `Generated on:,${date}\n`;
    csv += `Stores:,${storeNames}\n`;
    csv += `Categories:,${categoryNames}\n\n`;
    csv += "Product Name,Quantity,Total Sales,Total Cost,Profit\n";
    
    productSummary.forEach((item) => {
      csv += `${item.productName},${item.quantity || 0},${Number(item.totalPrice || 0).toFixed(2)},${Number(item.totalCost || 0).toFixed(2)},${Number(item.profit || 0).toFixed(2)}\n`;
    });

    csv += `TOTAL,${totalQuantity},${totalSales.toFixed(2)},${totalCost.toFixed(2)},${totalProfit.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "TopSellingProducts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [productSummary, totalQuantity, totalSales, totalCost, totalProfit, selectedStores, selectedCategories]);

  const filteredProducts = useMemo(() => 
    productSummary.filter((product) =>
      product.productName && product.productName.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [productSummary, searchTerm]
  );

  const tableRows = useMemo(() => 
    filteredProducts.map((item, index) => {
      const totalPrice = item.totalPrice || 0;
      const totalCost = item.totalCost || 0;
      const profit = item.profit || 0;
      const quantity = item.quantity || 0;
      const profitMargin = totalPrice > 0 ? (profit / totalPrice) * 100 : 0;
      
      return (
        <tr key={index} className="topselling-table-row">
          <td className="topselling-table-cell">{item.productName || 'Unknown Product'}</td>
          <td className="topselling-table-cell">{quantity}</td>
          <td className="topselling-table-cell">${totalPrice.toFixed(2)}</td>
          <td className="topselling-table-cell">${totalCost.toFixed(2)}</td>
          <td className="topselling-table-cell topselling-profit">${profit.toFixed(2)}</td>
          <td className="topselling-table-cell">
            <div className="topselling-margin-container">
              <span className="topselling-margin-value">{profitMargin.toFixed(1)}%</span>
              <div className="topselling-margin-bar">
                <div 
                  className="topselling-margin-fill"
                  style={{ 
                    width: `${Math.min(profitMargin, 100)}%`,
                    backgroundColor: profitMargin >= 0 ? '#10b981' : '#ef4444'
                  }}
                />
              </div>
            </div>
          </td>
        </tr>
      );
    }),
    [filteredProducts]
  );

  const profitMargin = useMemo(() => 
    totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0,
    [totalSales, totalProfit]
  );

  return (
    <div className="topselling-container">
      <div className="sales-summery-sidebar-toggle-wrapper">
        <button 
          className="sales-summery-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: isSidebarOpen ? '280px' : '80px' }}
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`topselling-content ${isSidebarOpen ? "topselling-content-shifted" : "topselling-content-collapsed"}`}>
        {/* Toolbar */}
        <div className="topselling-toolbar">
          <div className="topselling-toolbar-content">
            <h1 className="topselling-toolbar-title">Top Selling Products</h1>
            <div className="topselling-toolbar-subtitle">Analysis of best performing products</div>
          </div>
          <div className="topselling-toolbar-actions">
            <button 
              className="topselling-refresh-btn"
              onClick={() => onRefresh(selectedOption, selectedStartDate, selectedEndDate)}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="topselling-control-panel">
          <div className="topselling-date-controls">
            <div className="topselling-date-navigation">
              <button className="topselling-nav-btn" onClick={handleBackClick}>
                <IoIosArrowBack />
              </button>
              <button className="topselling-date-range-btn" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
                <IoCalendar />
                <span>
                  {selectedStartDate.toLocaleDateString()} - {selectedEndDate.toLocaleDateString()}
                </span>
              </button>
              <button className="topselling-nav-btn" onClick={handleForwardClick}>
                <IoIosArrowForward />
              </button>
            </div>
            
            {isDatePickerOpen && (
              <div ref={dateRangePickerRef} className="topselling-datepicker-modal">
                <DateRangePicker
                  ranges={[{
                    startDate: selectedStartDate,
                    endDate: selectedEndDate,
                    key: "selection",
                  }]}
                  onChange={handleDateRangeChange}
                  moveRangeOnFirstSelection={true}
                  months={2}
                  direction="horizontal"
                  locale={enUS}
                />
              </div>
            )}
          </div>
          
          <div className="topselling-filter-controls">
            {/* Store Selector */}
            <div className="topselling-store-selector">
              <button 
                className="topselling-filter-btn"
                onClick={() => {
                  setIsStoreDropdownOpen(!isStoreDropdownOpen);
                  setIsCategoryDropdownOpen(false);
                  setIsExportDropdownOpen(false);
                }}
              >
                <FaStore />
                <span>
                  {selectedStores.length === 0 ? "Select Store"
                    : selectedStores.length === 1 ? selectedStores[0].storeName
                    : selectedStores.length === stores.length ? "All Stores"
                    : `${selectedStores.length} stores`}
                </span>
              </button>
              
              {isStoreDropdownOpen && (
                <div className="topselling-dropdown">
                  <div className="topselling-dropdown-header">
                    <span>Select Stores</span>
                    <button className="topselling-dropdown-select-all" onClick={() => handleStoreSelect("All Stores")}>
                      {selectedStores.length === stores.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="topselling-dropdown-content">
                    {stores.map((store) => (
                      <div className="topselling-dropdown-item" key={store.storeId} onClick={() => handleStoreSelect(store)}>
                        <div className="topselling-checkbox">
                          <input type="checkbox" checked={selectedStores.some((s) => s.storeId === store.storeId)} readOnly />
                          <div className="topselling-checkbox-custom" />
                        </div>
                        <span className="topselling-store-name">{store.storeName}</span>
                        <span className="topselling-store-location">{store.location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Category Selector */}
            <div className="topselling-category-selector">
              <button 
                className="topselling-filter-btn"
                onClick={() => {
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                  setIsStoreDropdownOpen(false);
                  setIsExportDropdownOpen(false);
                }}
              >
                <FaFileAlt />
                <span>
                  {selectedCategories.length === 0 ? "Select Category"
                    : selectedCategories.length === 1 ? selectedCategories[0].categoryName
                    : selectedCategories.length === categories.length + 1 ? "All Categories"
                    : `${selectedCategories.length} categories`}
                </span>
              </button>
              
              {isCategoryDropdownOpen && (
                <div className="topselling-dropdown">
                  <div className="topselling-dropdown-header">
                    <span>Select Categories</span>
                    <button className="topselling-dropdown-select-all" onClick={() => handleCategorySelect("All Categories")}>
                      {selectedCategories.length === categories.length + 1 ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="topselling-dropdown-content">
                    <div className="topselling-dropdown-item" onClick={() => {
                      const allCategories = [...categories, { categoryName: "NO CATEGORY", categoryId: "no-category" }];
                      setSelectedCategories(allCategories);
                      setIsCategoryDropdownOpen(false);
                    }}>
                      <div className="topselling-checkbox">
                        <input type="checkbox" checked={selectedCategories.length === categories.length + 1} readOnly />
                        <div className="topselling-checkbox-custom" />
                      </div>
                      <span className="topselling-category-name" style={{ fontWeight: '600', color: '#3b82f6' }}>All Items</span>
                    </div>
                    
                    <div className="topselling-dropdown-item" onClick={() => handleCategorySelect({ categoryName: "NO CATEGORY", categoryId: "no-category" })}>
                      <div className="topselling-checkbox">
                        <input type="checkbox" checked={selectedCategories.some(s => s.categoryName === "NO CATEGORY" || s.categoryName === "No Category")} readOnly />
                        <div className="topselling-checkbox-custom" />
                      </div>
                      <span className="topselling-category-name">NO CATEGORY</span>
                    </div>
                    
                    {categories.map((category) => (
                      <div className="topselling-dropdown-item" key={category.categoryId} onClick={() => handleCategorySelect(category)}>
                        <div className="topselling-checkbox">
                          <input type="checkbox" checked={selectedCategories.some(s => s.categoryId === category.categoryId)} readOnly />
                          <div className="topselling-checkbox-custom" />
                        </div>
                        <span className="topselling-category-name">{category.categoryName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="topselling-export-button">
              <button 
                className="topselling-filter-btn"
                onClick={() => {
                  setIsExportDropdownOpen(!isExportDropdownOpen);
                  setIsStoreDropdownOpen(false);
                  setIsCategoryDropdownOpen(false);
                }}
              >
                <FaDownload />
                <span>Export</span>
              </button>
              
              {isExportDropdownOpen && (
                <div className="topselling-dropdown">
                  <div className="topselling-dropdown-item" onClick={handlePDFExport}>
                    <FaFilePdf color="#ef4444" />
                    <span>Download PDF</span>
                  </div>
                  <div className="topselling-dropdown-item" onClick={handleCSVExport}>
                    <FaFileCsv color="#10b981" />
                    <span>Download CSV</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="topselling-stats-grid">
          <StatCard title="Total Products" value={filteredProducts.length} icon={<FaBox />} color="#6366f1" isCurrency={false} />
          <StatCard title="Total Quantity" value={totalQuantity} icon={<FaShoppingCart />} color="#8b5cf6" isCurrency={false} />
          <StatCard title="Total Sales" value={totalSales} icon={<FaChartLine />} color="#10b981" />
          <StatCard title="Total Profit" value={totalProfit} icon={<FaChartLine />} color="#8b5cf6" subValue={`${profitMargin}% margin`} />
        </div>

        {/* Search and Filter Bar */}
        <div className="topselling-search-filter">
          <div className="topselling-search-container">
            <FaSearch className="topselling-search-icon" />
            <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="topselling-search-input" />
            {searchTerm && (
              <button className="topselling-clear-search" onClick={() => setSearchTerm("")}>×</button>
            )}
          </div>
          
          <div className="topselling-filter-container">
            <FaFilter className="topselling-filter-icon" />
            <select value={filterTopSellingBySales ? "sales" : "quantity"} onChange={(e) => setFilterTopSelling(e.target.value === "sales")} className="topselling-filter-select">
              <option value="sales">Sort by Sales</option>
              <option value="quantity">Sort by Quantity</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="topselling-table-container">
          <div className="topselling-table-header">
            <h3>Product Performance</h3>
            <div className="topselling-table-actions">
              <span className="topselling-table-count">Showing {filteredProducts.length} products</span>
            </div>
          </div>
          
          <div className="topselling-table-wrapper">
            <table className="topselling-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Total Sales</th>
                  <th>Total Cost</th>
                  <th>Profit</th>
                  <th>Profit Margin</th>
                </tr>
              </thead>
              <tbody>
                {tableRows}
                <tr className="topselling-table-row topselling-total-row">
                  <td className="topselling-table-cell topselling-total">TOTAL</td>
                  <td className="topselling-table-cell topselling-total">{totalQuantity}</td>
                  <td className="topselling-table-cell topselling-total">${totalSales.toFixed(2)}</td>
                  <td className="topselling-table-cell topselling-total">${totalCost.toFixed(2)}</td>
                  <td className="topselling-table-cell topselling-total topselling-profit">${totalProfit.toFixed(2)}</td>
                  <td className="topselling-table-cell topselling-total">{profitMargin}%</td>
                </tr>
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

export default TopSellingProducts;