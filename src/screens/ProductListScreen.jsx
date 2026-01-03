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
import "../Css/ProductListScreen.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useNavigate } from "react-router-dom";
import RemainingTimeFooter from "../components/RemainingTimeFooter";
import SubscriptionModal from "../components/SubscriptionModal";
import { FaFileCsv, FaFilePdf } from "react-icons/fa6";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ProductListScreen = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [stores, setStoreData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState(null);
  const [products, setProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]); // Add this state
  const [categories, setCategories] = useState([]);
  const [selectStockOption, setSelectStockOption] = useState("All Items");
  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const [isSubscribedAdmin, setIsSubscribedAdmin] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Add a flag to track if we have initial data
  const [hasInitialData, setHasInitialData] = useState(false);

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
      fetchAdminSubscriptionStatus();
      fetchStores();
      fetchCategories();
    }
  }, [email]);

  useEffect(() => {
    if (selectedStores.length > 0) {
      onRefresh();
    }
  }, [selectedStores]);

  // Update displayProducts whenever filters change OR when products update
  useEffect(() => {
    if (products.length > 0) {
      const filtered = applyFilters(products);
      setDisplayProducts(filtered);
      setHasInitialData(true);
    }
  }, [products, selectedStores, selectedCategories, selectStockOption, searchTerm]);

  const fetchAdminSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/adminSubscriptionRouter/status?email=${encodeURIComponent(
          userEmail
        )}`
      );

      if (response.ok) {
        const data = await response.json();
        setIsSubscribedAdmin(data.isSubscribedAdmin);
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    }
  };

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
      
      // Select all stores by default
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

  const fetchProducts = async () => {
    try {
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
        setIsRefreshing(false);
        return;
      }
      
      const responseData = await response.json();
      const filteredProducts = responseData.data.filter(
        (product) => product.userId === userId
      );

      filteredProducts.sort((a, b) =>
        a.productName.localeCompare(b.productName)
      );

      // Only update products state - displayProducts will update via useEffect
      setProducts(filteredProducts);
      setIsRefreshing(false);
    } catch (error) {
      setIsRefreshing(false);
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching products.");
      }
      console.error("Error fetching products:", error);
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

      const response = await fetch(
        `https://nexuspos.onrender.com/api/categoryRouter/categories?email=${encodeURIComponent(
          userEmail
        )}`
      );
      
      const data = await response.json();
      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error(`Error: ${"User not found or invalid email."}`);
        return;
      }
      
      if (data.success) {
        setCategories(data.data);
        // Select all categories by default
        setSelectedCategories(data.data);
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
    try {
      await fetchProducts();
    } catch (error) {
      console.error(error);
    } finally {
      NProgress.done();
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

  const applyFilters = (productsList) => {
    return productsList
      .filter(item => {
        // Filter by store
        if (selectedStores.length > 0 && selectedStores.length < stores.length) {
          const storeIds = selectedStores.map(store => store.storeId);
          if (!storeIds.includes(item.storeId)) return false;
        }

        // Filter by category
        if (selectedCategories.length > 0 && selectedCategories.length < categories.length) {
          const categoryIds = selectedCategories.map(cat => cat.categoryId);
          if (!categoryIds.includes(item.categoryId)) return false;
        }

        // Filter by stock level
        if (selectStockOption === "Low Stock") {
          const stock = Number(item.stock || 0);
          const lowStockLevel = Number(item.lowStockNotification || 0);
          if (stock > lowStockLevel || stock <= 0) return false;
        } else if (selectStockOption === "Out of Stock") {
          const stock = Number(item.stock || 0);
          if (stock > 0) return false;
        }

        // Filter by search term
        if (searchTerm.trim() !== "") {
          const lowerSearch = searchTerm.toLowerCase();
          return item.productName?.toLowerCase().includes(lowerSearch);
        }

        return true;
      })
      .sort((a, b) => a.productName.localeCompare(b.productName));
  };

  const handleClickOutside = (event) => {
    if (
      isStoreDropdownOpen &&
      !event.target.closest(".product-list-store-selector")
    ) {
      setIsStoreDropdownOpen(false);
    }

    if (
      isCategoryDropdownOpen &&
      !event.target.closest(".product-list-category-selector")
    ) {
      setIsCategoryDropdownOpen(false);
    }

    if (
      isStockDropdownOpen &&
      !event.target.closest(".product-list-stock-selector")
    ) {
      setIsStockDropdownOpen(false);
    }

    if (
      isExportDropdownOpen &&
      !event.target.closest(".product-list-export-button")
    ) {
      setIsExportDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  const handleItemClick = (item) => {
    if (!isSubscribedAdmin) {
      setShowSubscriptionModal(true);
      return;
    }
    navigate("/edit-products", { state: item });
  };

  const handleCreateProduct = () => {
    if (!isSubscribedAdmin) {
      setShowSubscriptionModal(true);
      return;
    }
    navigate("/create-products");
  };

  const getStockStatus = (stock, lowStockNotification) => {
    const stockNum = Number(stock || 0);
    const lowStockNum = Number(lowStockNotification || 0);
    
    if (stockNum <= 0) return { text: "Out of Stock", class: "product-list-stock-out" };
    if (stockNum <= lowStockNum) return { text: "Low Stock", class: "product-list-stock-low" };
    return { text: "In Stock", class: "product-list-stock-normal" };
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateTime = new Date().toLocaleString();

    doc.text(`Product List`, 14, 10);
    doc.text(`Exported on: ${dateTime}`, 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Product Name", "Category", "Price", "Cost", "Stock", "Status"]],
      body: displayProducts.map((p) => [
        p.productName,
        p.category || "No Category",
        `$${Number(p.price).toFixed(2)}`,
        `$${Number(p.cost).toFixed(2)}`,
        p.productType === "Weight" ? Number(p.stock).toFixed(2) : p.stock,
        getStockStatus(p.stock, p.lowStockNotification).text
      ]),
    });

    doc.save(`products_${dateTime.replace(/[/:]/g, '-')}.pdf`);
    setIsExportDropdownOpen(false);
  };

  const exportToCSV = () => {
    const headers = ["Product Name", "Category", "Price", "Cost", "Stock", "Status"];
    const rows = displayProducts.map((p) => [
      `"${p.productName}"`,
      `"${p.category || "No Category"}"`,
      `"$${Number(p.price).toFixed(2)}"`,
      `"$${Number(p.cost).toFixed(2)}"`,
      `"${p.productType === "Weight" ? Number(p.stock).toFixed(2) : p.stock}"`,
      `"${getStockStatus(p.stock, p.lowStockNotification).text}"`
    ]);

    const dateTime = new Date().toLocaleString();
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        [`Product List`, `Exported on: ${dateTime}`],
        headers,
        ...rows,
      ]
        .map((e) => e.join(","))
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `products_${dateTime.replace(/[/:]/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDropdownOpen(false);
  };

  return (
    <div className="product-list-container">
      <div className="product-list-sidebar-toggle-wrapper">
        <button 
          className="product-list-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: isSidebarOpen ? '280px' : '80px' }}
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`product-list-content ${isSidebarOpen ? "product-list-content-shifted" : "product-list-content-collapsed"}`}>
        {/* Toolbar */}
        <div className="product-list-toolbar">
          <div className="product-list-toolbar-content">
            <h1 className="product-list-toolbar-title">Products</h1>
            <div className="product-list-toolbar-subtitle">
              Manage and track your product inventory
            </div>
          </div>
          <div className="product-list-toolbar-actions">
            <button 
              className="product-list-refresh-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <IoReload />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="product-list-control-panel">
          <div className="product-list-filter-controls">
            <div className="product-list-store-selector">
              <button 
                className="product-list-filter-btn"
                onClick={() => {
                  setIsStoreDropdownOpen(!isStoreDropdownOpen);
                  setIsCategoryDropdownOpen(false);
                  setIsStockDropdownOpen(false);
                  setIsExportDropdownOpen(false);
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
                <div className="product-list-dropdown">
                  <div className="product-list-dropdown-header">
                    <span>Select Stores</span>
                    <button 
                      className="product-list-dropdown-select-all"
                      onClick={() => handleStoreSelect("All Stores")}
                    >
                      {selectedStores.length === stores.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="product-list-dropdown-content">
                    {stores.map((store) => (
                      <div
                        className="product-list-dropdown-item"
                        key={store.storeId}
                        onClick={() => handleStoreSelect(store)}
                      >
                        <div className="product-list-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedStores.some((s) => s.storeId === store.storeId)}
                            readOnly
                          />
                          <div className="product-list-checkbox-custom"></div>
                        </div>
                        <span className="product-list-store-name">{store.storeName}</span>
                        <span className="product-list-store-location">{store.location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="product-list-category-selector">
              <button 
                className="product-list-filter-btn"
                onClick={() => {
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                  setIsStoreDropdownOpen(false);
                  setIsStockDropdownOpen(false);
                  setIsExportDropdownOpen(false);
                }}
              >
                <FaFileAlt />
                <span>
                  {selectedCategories.length === 0
                    ? "Select Category"
                    : selectedCategories.length === 1
                    ? selectedCategories[0].categoryName
                    : selectedCategories.length === categories.length
                    ? "All Categories"
                    : `${selectedCategories.length} categories`}
                </span>
              </button>
              
              {isCategoryDropdownOpen && (
                <div className="product-list-dropdown">
                  <div className="product-list-dropdown-header">
                    <span>Select Categories</span>
                    <button 
                      className="product-list-dropdown-select-all"
                      onClick={() => handleCategorySelect("All Categories")}
                    >
                      {selectedCategories.length === categories.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="product-list-dropdown-content">
                    {categories.map((category) => (
                      <div
                        className="product-list-dropdown-item"
                        key={category.categoryId}
                        onClick={() => handleCategorySelect(category)}
                      >
                        <div className="product-list-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedCategories.some(
                              (s) => s.categoryId === category.categoryId
                            )}
                            readOnly
                          />
                          <div className="product-list-checkbox-custom"></div>
                        </div>
                        <span className="product-list-category-name">{category.categoryName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="product-list-stock-selector">
              <button 
                className="product-list-filter-btn"
                onClick={() => {
                  setIsStockDropdownOpen(!isStockDropdownOpen);
                  setIsStoreDropdownOpen(false);
                  setIsCategoryDropdownOpen(false);
                  setIsExportDropdownOpen(false);
                }}
              >
                <FaFilter />
                <span>{selectStockOption}</span>
              </button>
              
              {isStockDropdownOpen && (
                <div className="product-list-dropdown">
                  <div className="product-list-dropdown-content">
                    <div
                      className="product-list-dropdown-item"
                      onClick={() => {
                        setSelectStockOption("All Items");
                        setIsStockDropdownOpen(false);
                      }}
                    >
                      <span className="product-list-store-name">All Items</span>
                    </div>
                    <div
                      className="product-list-dropdown-item"
                      onClick={() => {
                        setSelectStockOption("Low Stock");
                        setIsStockDropdownOpen(false);
                      }}
                    >
                      <span className="product-list-store-name">Low Stock</span>
                    </div>
                    <div
                      className="product-list-dropdown-item"
                      onClick={() => {
                        setSelectStockOption("Out of Stock");
                        setIsStockDropdownOpen(false);
                      }}
                    >
                      <span className="product-list-store-name">Out Of Stock</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="product-list-export-button">
              <button 
                className="product-list-filter-btn"
                onClick={() => {
                  setIsExportDropdownOpen(!isExportDropdownOpen);
                  setIsStoreDropdownOpen(false);
                  setIsCategoryDropdownOpen(false);
                  setIsStockDropdownOpen(false);
                }}
              >
                <FaDownload />
                <span>Export</span>
              </button>
              
              {isExportDropdownOpen && (
                <div className="product-list-export-dropdown">
                  <div 
                    className="product-list-export-item"
                    onClick={exportToPDF}
                  >
                    <FaFilePdf color="#ef4444" />
                    <span>Download PDF</span>
                  </div>
                  <div 
                    className="product-list-export-item"
                    onClick={exportToCSV}
                  >
                    <FaFileCsv color="#10b981" />
                    <span>Download CSV</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search and Create Button */}
        <div className="product-list-search-filter">
            
          <button 
            className="product-list-create-btn"
            onClick={handleCreateProduct}
          >
            <FaPlus />
            Create Product
          </button>
          <div className="product-list-search-container">
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="product-list-search-input"
              style={{ paddingLeft: '40px' }}
            />
            {searchTerm && (
              <button 
                className="product-list-search-clear"
                onClick={() => setSearchTerm("")}
              >
                <FaTimesIcon />
              </button>
            )}
          </div>
        
        </div>

        {/* Table Container - Show loading or existing data */}
        <div className="product-list-table-container">
          <div className="product-list-table-header">
            <h3>Product Details</h3>
            <span className="product-list-table-count">
              {isRefreshing ? 'Refreshing...' : 
               hasInitialData ? `Showing ${displayProducts.length} of ${products.length} products` : 
               'Loading products...'}
            </span>
          </div>
          
          <div className="product-list-table-wrapper">
            <table className="product-list-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Cost</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayProducts.length > 0 ? (
                  displayProducts.map((item, index) => {
                    const stockStatus = getStockStatus(item.stock, item.lowStockNotification);
                    const displayStock = item.productType === "Weight" 
                      ? Number(item.stock).toFixed(2)
                      : item.stock;
                    
                    return (
                      <tr 
                        key={`${item.productId}-${index}`} 
                        className="product-list-table-row"
                        onClick={() => handleItemClick(item)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="product-list-table-cell">
                          <span style={{ fontWeight: '500' }}>
                            {item.productName}
                          </span>
                        </td>
                        <td className="product-list-table-cell">
                          {item.category || "No Category"}
                        </td>
                        <td className="product-list-table-cell">
                          ${Number(item.price).toFixed(2)}
                        </td>
                        <td className="product-list-table-cell">
                          ${Number(item.cost).toFixed(2)}
                        </td>
                        <td className="product-list-table-cell">
                          {displayStock}
                        </td>
                        <td className="product-list-table-cell">
                          <span className={`product-list-stock-status ${stockStatus.class}`}>
                            {stockStatus.text}
                          </span>
                        </td>
                     
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="product-list-empty-state">
                      <FaBox className="product-list-empty-icon" />
                      <h3 className="product-list-empty-title">
                        {isRefreshing ? 'Refreshing products...' : 
                         hasInitialData ? 'No Products Found' : 
                         'Loading products...'}
                      </h3>
                      <p className="product-list-empty-description">
                        {searchTerm ? `No products found for "${searchTerm}"` : 
                         hasInitialData ? "No products available for the selected filters" :
                         "Please wait while we load your products..."}
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
      
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default ProductListScreen;