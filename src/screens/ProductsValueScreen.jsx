import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaBars,
  FaTimes,
  FaStore,
  FaArrowDown,
  FaArrowUp,
  FaDownload,
  FaChartLine,
  FaBox,
  FaDollarSign,
  FaPercentage,
  FaTags,
  FaSearch,
  FaFilter,
  FaFileAlt,
  FaFire,
  FaExclamationTriangle,
  FaCheckCircle
} from "react-icons/fa";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaFileCsv, FaFilePdf } from "react-icons/fa6";
import RemainingTimeFooter from "../components/RemainingTimeFooter";
import "../Css/ProductValueScreen.css";

// StatCard component moved outside to prevent re-renders
const StatCard = React.memo(({ title, value, icon, percentage, isPositive, subValue, color, isCurrency = true }) => (
  <div className="product-value-stat-card">
    <div className="product-value-stat-icon-container" style={{ backgroundColor: color + '20', color: color }}>
      <div className="product-value-stat-icon-circle">
        {icon}
      </div>
    </div>
    <div className="product-value-stat-content">
      <div className="product-value-stat-title">{title}</div>
      <div className="product-value-stat-value">
        {isCurrency ? '$' : ''}{value}
      </div>
      <div className="product-value-stat-change-container">
        {percentage && percentage !== "-" && (
          <div className={`product-value-stat-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <FaArrowUp /> : <FaArrowDown />}
            <span>{percentage}</span>
          </div>
        )}
      </div>
      {subValue && <div className="product-value-stat-subvalue">{subValue}</div>}
    </div>
  </div>
));

const ProductValueScreen = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);
  const [stores, setStoreData] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectStockOption, setSelectStockOption] = useState("All Items");
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();
  const searchTimeoutRef = useRef(null);

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
    if (email) {
      fetchStores();
      fetchCategories();
    }
  }, [email]);

  useEffect(() => {
    setSelectedStores(stores);
    setSelectedCategories(categories);
  }, [stores, categories]);

  useEffect(() => {
    if (selectedStores.length > 0) {
      onRefresh();
    }
  }, [selectedStores]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      applyFilters();
    }, 300); // 300ms debounce delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, selectedStores, selectedCategories, selectStockOption, products]);

  const applyFilters = useCallback(() => {
    let updatedList = [...products];

    const isAllStoresSelected =
      selectedStores.length === stores.length ||
      selectedStores.some((store) => store.storeName === "All Stores");

    if (!isAllStoresSelected && selectedStores.length > 0) {
      const storeIds = selectedStores.map((store) => String(store.storeId));
      updatedList = updatedList.filter((product) =>
        storeIds.includes(String(product.storeId))
      );
    }

    const isAllCategoriesSelected =
      selectedCategories.length === categories.length ||
      selectedCategories.some((cat) => cat.categoryName === "All Categories");

    if (!isAllCategoriesSelected && selectedCategories.length > 0) {
      const selectedCategoryIds = selectedCategories.map((cat) =>
        String(cat.categoryId)
      );
      updatedList = updatedList.filter((product) => {
        const productCategoryId = String(product.categoryId || "No Category");
        return selectedCategoryIds.includes(productCategoryId);
      });
    }

    if (selectStockOption === "Low Stock") {
      updatedList = updatedList.filter(
        (product) =>
          Number(product.stock) > 0 &&
          Number(product.stock) <= Number(product.lowStockNotification || 0)
      );
    } else if (selectStockOption === "Out of Stock") {
      updatedList = updatedList.filter(
        (product) => Number(product.stock) <= 0
      );
    }

    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      updatedList = updatedList.filter((product) =>
        product.productName?.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredItems(updatedList);
  }, [products, selectedStores, selectedCategories, selectStockOption, searchTerm, stores, categories]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching stores.");
      }
      console.error("Error fetching stores:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);

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
          setIsRefreshing(false);
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
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchCategories = async () => {
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
        `https://nexuspos.onrender.com/api/categoryRouter/categories?email=${encodeURIComponent(
          userEmail
        )}`
      );
      
      const data = await response.json();
      if (!response.ok) {
        toast.error(`Error: ${"User not found or invalid email."}`);
        return;
      }
      
      if (data.success) {
        setCategories(data.data);
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
  };

  const onRefresh = async () => {
    NProgress.start();
    setIsRefreshing(true);
    try {
      await fetchProducts();
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

  const handleCategorySelect = (category) => {
    if (category === "All Categories") {
      if (selectedCategories.length === categories.length) {
        setSelectedCategories([]);
      } else {
        setSelectedCategories([...categories]);
      }
    } else {
      const exists = selectedCategories.some(
        (s) => s.categoryId === category.categoryId
      );
      const updatedCategories = exists
        ? selectedCategories.filter((s) => s.categoryId !== category.categoryId)
        : [...selectedCategories, category];
      setSelectedCategories(updatedCategories);
    }
  };

  const handleClickOutside = (event) => {
    if (
      isStoreDropdownOpen &&
      !event.target.closest(".product-value-store-selector")
    ) {
      setIsStoreDropdownOpen(false);
    }

    if (
      isExportDropdownOpen &&
      !event.target.closest(".product-value-export-button")
    ) {
      setIsExportDropdownOpen(false);
    }

    if (
      isCategoryDropdownOpen &&
      !event.target.closest(".product-value-category-selector")
    ) {
      setIsCategoryDropdownOpen(false);
    }

    if (
      isStockDropdownOpen &&
      !event.target.closest(".product-value-stock-selector")
    ) {
      setIsStockDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  const calculateValues = useCallback((item) => {
    if (parseFloat(item.stock) === 0) {
      return { retailValue: 0, costValue: 0, potentialValue: 0, margin: 0 };
    }

    const retailValue = item.price * item.stock;
    const costValue = item.cost * item.stock;
    const potentialValue = retailValue - costValue;
    const margin = retailValue > 0 ? (potentialValue / retailValue) * 100 : 0;

    return { retailValue, costValue, potentialValue, margin };
  }, []);

  const getMarginLevel = useCallback((margin) => {
    if (margin >= 50) return { level: "high", icon: <FaFire />, color: "#10b981", bgColor: "rgba(16, 185, 129, 0.1)" };
    if (margin >= 25) return { level: "moderate", icon: <FaCheckCircle />, color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" };
    return { level: "low", icon: <FaExclamationTriangle />, color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.1)" };
  }, []);

  const calculateSums = useMemo(() => {
    let totalRetailValue = 0;
    let totalCostValue = 0;
    let totalPotentialValue = 0;

    filteredItems.forEach((item) => {
      const { retailValue, costValue, potentialValue } = calculateValues(item);
      totalRetailValue += retailValue;
      totalCostValue += costValue;
      totalPotentialValue += potentialValue;
    });

    const totalMargin = totalRetailValue > 0 ? (totalPotentialValue / totalRetailValue) * 100 : 0;

    return {
      totalRetailValue,
      totalCostValue,
      totalPotentialValue,
      totalMargin,
    };
  }, [filteredItems, calculateValues]);

  const formatNumberShort = useCallback((number) => {
    if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}m`;
    if (number >= 100_000) return `${(number / 1_000).toFixed(0)}k`;
    
    return number.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const exportToPDF = (items) => {
    const doc = new jsPDF();
    const now = new Date();
    const formattedDate = now.toLocaleString("en-US");
    const storeName = selectedStores.length === 1 ? selectedStores[0].storeName : "Multiple Stores";
    const { totalRetailValue, totalCostValue, totalPotentialValue, totalMargin } = calculateSums;

    doc.setFontSize(16);
    doc.text("Inventory Total Value", 14, 20);
    doc.setFontSize(11);
    doc.text(`Store: ${storeName}`, 14, 28);
    doc.text(`Generated: ${formattedDate}`, 14, 34);

    const head = [
      ["Product Name", "QTY", "Retail Value", "Cost Value", "Total Profit", "Profit Margin"]
    ];
    
    const body = items.map((item) => {
      const { retailValue, costValue, potentialValue, margin } = calculateValues(item);
      return [
        item.productName,
        item.productType === "Weight" ? parseFloat(item.stock).toFixed(2) : item.stock,
        `$${retailValue.toFixed(2)}`,
        `$${costValue.toFixed(2)}`,
        `$${potentialValue.toFixed(2)}`,
        `${margin.toFixed(2)}%`,
      ];
    });

    const totalRow = [
      "TOTAL",
      "",
      `$${totalRetailValue.toFixed(2)}`,
      `$${totalCostValue.toFixed(2)}`,
      `$${totalPotentialValue.toFixed(2)}`,
      `${totalMargin.toFixed(2)}%`,
    ];
    body.push(totalRow);

    window.jspdf.jsPDF.autoTable(doc, {
      head,
      body,
      startY: 40,
      theme: "striped",
      headStyles: { fillColor: [22, 160, 133] },
      willDrawCell: function (data) {
        const isTotalsRow = data.row.index === body.length - 1;
        if (isTotalsRow) {
          data.cell.styles.fillColor = [46, 204, 113];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    doc.save(`Inventory_Total_Value_${storeName}.pdf`);
  };

  const exportToCSV = (items) => {
    const now = new Date();
    const formattedDate = now.toLocaleString("en-US");
    const storeName = selectedStores.length === 1 ? selectedStores[0].storeName : "Multiple Stores";
    const { totalRetailValue, totalCostValue, totalPotentialValue, totalMargin } = calculateSums;

    let csvContent = `Inventory Total Value\n`;
    csvContent += `Store:,${storeName}\nGenerated:,${formattedDate}\n\n`;
    csvContent += "Product Name,QTY,Retail Value,Cost Value,Total Profit,Profit Margin\n";

    items.forEach((item) => {
      const { retailValue, costValue, potentialValue, margin } = calculateValues(item);
      const quantity = item.productType === "Weight" ? parseFloat(item.stock).toFixed(2) : item.stock;

      csvContent += `${item.productName},${quantity},$${retailValue.toFixed(2)},$${costValue.toFixed(2)},$${potentialValue.toFixed(2)},${margin.toFixed(2)}%\n`;
    });

    csvContent += `TOTAL,,$${totalRetailValue.toFixed(2)},$${totalCostValue.toFixed(2)},$${totalPotentialValue.toFixed(2)},${totalMargin.toFixed(2)}%\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Inventory_Total_Value_${storeName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { totalRetailValue, totalCostValue, totalPotentialValue, totalMargin } = calculateSums;

  return (
    <div className="product-value-container">
      <div className="product-value-sidebar-toggle-wrapper">
        <button 
          className="product-value-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: isSidebarOpen ? '280px' : '80px' }}
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`product-value-content ${isSidebarOpen ? "product-value-content-shifted" : "product-value-content-collapsed"}`}>
        <div className="product-value-toolbar">
          <div className="product-value-toolbar-content">
            <h1 className="product-value-toolbar-title">Inventory Value Dashboard</h1>
            <div className="product-value-toolbar-subtitle">
              Comprehensive overview of your inventory value and profit margins
            </div>
          </div>
          <div className="product-value-toolbar-actions">
            <button 
              className="product-value-refresh-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="product-value-control-panel">
          <div className="product-value-search-control">
            <div className="product-value-search-wrapper">
              <FaSearch className="product-value-search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="product-value-search-input"
              />
              {searchTerm && (
                <button 
                  className="product-value-search-clear"
                  onClick={() => setSearchTerm("")}
                >
                  ×
                </button>
              )}
            </div>
          </div>
          
          <div className="product-value-filter-controls">
            <div className="product-value-store-selector">
              <button 
                className="product-value-filter-btn"
                onClick={() => {
                  setIsStoreDropdownOpen(!isStoreDropdownOpen);
                  setIsCategoryDropdownOpen(false);
                  setIsExportDropdownOpen(false);
                  setIsStockDropdownOpen(false);
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
                <div className="product-value-dropdown">
                  <div className="product-value-dropdown-header">
                    <span>Select Stores</span>
                    <button 
                      className="product-value-dropdown-select-all"
                      onClick={() => handleStoreSelect("All Stores")}
                    >
                      {selectedStores.length === stores.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="product-value-dropdown-content">
                    {stores.map((store) => (
                      <div
                        className="product-value-dropdown-item"
                        key={store.storeId}
                        onClick={() => handleStoreSelect(store)}
                      >
                        <div className="product-value-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedStores.some((s) => s.storeId === store.storeId)}
                            readOnly
                          />
                          <div className="product-value-checkbox-custom"></div>
                        </div>
                        <span className="product-value-store-name">{store.storeName}</span>
                        <span className="product-value-store-location">{store.location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
        
          </div>
        </div>

        <div className="product-value-stats-grid">
          <StatCard
            title="Retail Value"
            value={formatNumberShort(totalRetailValue)}
            icon={<FaDollarSign />}
            percentage="-"
            isPositive={true}
            color="#6366f1"
          />
          
          <StatCard
            title="Cost Value"
            value={formatNumberShort(totalCostValue)}
            icon={<FaBox />}
            percentage="-"
            isPositive={false}
            color="#ef4444"
          />
          
          <StatCard
            title="Total Profit"
            value={formatNumberShort(totalPotentialValue)}
            icon={<FaChartLine />}
            percentage="-"
            isPositive={totalPotentialValue >= 0}
            color="#10b981"
          />
          
          <StatCard
            title="Profit Margin"
            value={`${totalMargin.toFixed(2)}%`}
            icon={<FaPercentage />}
            percentage="-"
            isPositive={totalMargin >= 0}
            color="#8b5cf6"
          />
        </div>

        <div className="product-value-table-container">
          <div className="product-value-table-header">
            <h3>Inventory Value Details</h3>
            <div className="product-value-table-actions">
              <span className="product-value-table-count">
                Showing {filteredItems.length} products
              </span>
            </div>
          </div>
          
          <div className="product-value-table-wrapper">
            <table className="product-value-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>QTY</th>
                  <th>Retail Value</th>
                  <th>Cost Value</th>
                  <th>Total Profit</th>
                  <th>Profit Margin</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => {
                  const { retailValue, costValue, potentialValue, margin } = calculateValues(item);
                  const marginLevel = getMarginLevel(margin);
                  
                  return (
                    <tr key={index} className="product-value-table-row">
                      <td className="product-value-table-cell">{item.productName}</td>
                      <td className="product-value-table-cell">
                        {item.productType === "Weight" ? parseFloat(item.stock).toFixed(2) : item.stock}
                      </td>
                      <td className="product-value-table-cell product-value-bold">${retailValue.toFixed(2)}</td>
                      <td className="product-value-table-cell product-value-bold">${costValue.toFixed(2)}</td>
                      <td className="product-value-table-cell product-value-profit product-value-bold">
                        ${potentialValue.toFixed(2)}
                      </td>
                      <td className="product-value-table-cell">
                        <div className="product-value-margin-badge" style={{ 
                          color: marginLevel.color, 
                          backgroundColor: marginLevel.bgColor 
                        }}>
                          <span className="product-value-margin-icon">{marginLevel.icon}</span>
                          <span className="product-value-margin-text">{margin.toFixed(2)}%</span>
                          <span className="product-value-margin-label">{marginLevel.level}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {filteredItems.length > 0 && (
                  <tr className="product-value-table-row product-value-total-row">
                    <td className="product-value-table-cell product-value-total-bold">TOTAL</td>
                    <td className="product-value-table-cell product-value-total-bold"></td>
                    <td className="product-value-table-cell product-value-total-bold">
                      ${totalRetailValue.toFixed(2)}
                    </td>
                    <td className="product-value-table-cell product-value-total-bold">
                      ${totalCostValue.toFixed(2)}
                    </td>
                    <td className="product-value-table-cell product-value-total-bold product-value-profit">
                      ${totalPotentialValue.toFixed(2)}
                    </td>
                    <td className="product-value-table-cell product-value-total-bold">
                      <div className="product-value-margin-badge product-value-total-margin" style={{ 
                        color: getMarginLevel(totalMargin).color, 
                        backgroundColor: getMarginLevel(totalMargin).bgColor 
                      }}>
                        <span className="product-value-margin-icon">{getMarginLevel(totalMargin).icon}</span>
                        <span className="product-value-margin-text">{totalMargin.toFixed(2)}%</span>
                        <span className="product-value-margin-label">{getMarginLevel(totalMargin).level}</span>
                      </div>
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

export default ProductValueScreen;