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
  FaCat,
  FaFileAlt,
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
import "../Css/ProductValueScreen.css";
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
import ProductsListItem from "../components/ProductsListItem";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable"; // ← import the function directly
import { FaChevronDown, FaFile, FaFileCsv, FaFilePdf } from "react-icons/fa6";
import ProductsValueListItem from "../components/ProductValueListItem";
import RemainingTimeFooter from "../components/RemainingTimeFooter";

const ProductValueScreen = () => {
  // const stores = ["Store 1", "Store 2", "Store 3"];

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
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
  const [isLowStock, setIsLowStockDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dateRangePickerRef = useRef(null);
  const location = useLocation();
  const [receipts, setReceipts] = useState([]);
  const [modalProduct, setModalProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [email, setEmail] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);

  const [categories, setCategories] = useState([]);
  const [selectStockOption, setSelectStockOption] = useState("All Items");
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
    if (selectedStores.length > 0) {
      onRefresh();
    }
  }, [selectedStores]);

  useEffect(() => {
    setSelectedStores(stores);
    setSelectedCategories(categories);
  }, [selectedOption, stores, categories]);
  useEffect(() => {
    console.log("Selected Option:", selectedOption);
  }, [selectedOption]);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  useEffect(() => {
    if (email) {
      fetchStores();
      fetchCategories();
    }
  }, [email]);
  // Update filteredItems whenever filters change
  useEffect(() => {
    const applyFilters = () => {
      let updatedList = [...products];

      // 1. Filter by Store
      const isAllStoresSelected =
        selectedStores.length === stores.length ||
        selectedStores.some((store) => store.storeName === "All Stores");

      if (!isAllStoresSelected && selectedStores.length > 0) {
        const storeIds = selectedStores.map((store) => String(store.storeId));
        updatedList = updatedList.filter((product) =>
          storeIds.includes(String(product.storeId))
        );
      }

      // 2. Filter by Category
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

      // 3. Filter by Stock Level
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

      // 4. Filter by Search
      if (searchTerm.trim() !== "") {
        const lowerSearch = searchTerm.toLowerCase();
        updatedList = updatedList.filter((product) =>
          product.productName?.toLowerCase().includes(lowerSearch)
        );
      }

      setFilteredItems(updatedList);
    };

    applyFilters();
  }, [
    products,
    selectedStores,
    selectedCategories,
    selectStockOption,
    searchTerm,
    stores,
    categories,
  ]);

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
        toast.error("An error occurred while fetching products.");
      }
      console.error("Error fetching receipts:", error);
    }
  };

  const fetchCategories = async () => {
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
        `https://nexuspos.onrender.com/api/categoryRouter/categories?email=${encodeURIComponent(
          userEmail
        )}`
      );
      const data = await response.json();
      if (!response.ok) {
        const errorMessage = await response.text(); // or response.json() if you return JSON errors
        toast.error(`Error: ${"User not found or invalid email."}`);
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
      console.error("Error fetching receipts:", error);
    }
  };
  const onRefresh = async () => {
    NProgress.start(); // 🔵 Start progress bar
    try {
      await fetchProducts();
    } catch (error) {
      console.error(error);
    } finally {
      NProgress.done(); // ✅ Always stop progress bar
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
    console.log("====================================");
    console.log("cattttttttttt", category);
    console.log("====================================");
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
      !event.target.closest(".buttonContainerStoresProducts")
    ) {
      setIsStoreDropdownOpen(false);
      console.log("Selected Stores:", selectedStores);

      if (selectedStores.length === 0) {
        setProducts([]);
      } else {
        // onRefresh();
      }
    }

    if (
      isExportDropdownOpen &&
      !event.target.closest(".buttonContainerExportValue")
    ) {
      setIsExportDropdownOpen(false);
      console.log("Selected Export Option:");
    }
    if (isLowStock && !event.target.closest(".buttonContainerLowStock")) {
      setIsLowStockDropdownOpen(false);
      // if (selectedStores.length === 0) {
      //   setProducts([]);
      // } else {
      //   onRefresh();
      // }
    }
    if (
      isCategoryDropdownOpen &&
      !event.target.closest(".buttonContainerFilterByCategory")
    ) {
      setIsCategoryDropdownOpen(false);
      console.log("Selected Category Option:");
      // if (selectedCategories.length === 0) {
      //   setProducts([]);
      // } else {
      //   onRefresh();
      // }
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
    console.log("====================================");
    console.log(item);
    console.log("====================================");
    // setModalProduct(item);
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

  const calculateValues = (item) => {
    if (parseFloat(item.stock) === 0) {
      return { retailValue: 0, costValue: 0, potentialValue: 0, margin: 0 };
    }

    const retailValue = item.price * item.stock;
    const costValue = item.cost * item.stock;
    const potentialValue = retailValue - costValue;
    const margin = (potentialValue / retailValue) * 100;

    return { retailValue, costValue, potentialValue, margin };
  };

  const calculateSums = () => {
    let totalRetailValue = 0;
    let totalCostValue = 0;
    let totalPotentialValue = 0;

    filteredItems.forEach((item) => {
      const { retailValue, costValue, potentialValue } = calculateValues(item);
      totalRetailValue += retailValue;
      totalCostValue += costValue;
      totalPotentialValue += potentialValue;
    });

    const totalMargin =
      totalRetailValue !== 0
        ? (totalPotentialValue / totalRetailValue) * 100
        : 0;

    return {
      totalRetailValue,
      totalCostValue,
      totalPotentialValue,
      totalMargin,
    };
  };

  const formatNumberShort = (number) => {
    if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(1)}m`;
    if (number >= 100_000) return `$${(number / 1_000).toFixed(0)}k`;

    return `$${number.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };
  const { totalRetailValue, totalCostValue, totalPotentialValue, totalMargin } =
    calculateSums();
  const exportToPDF = (items, storeName) => {
    const doc = new jsPDF();
    const now = new Date();
    const formattedDate = now.toLocaleString("en-US");

    const {
      totalRetailValue,
      totalCostValue,
      totalPotentialValue,
      totalMargin,
    } = calculateSums();

    // Header
    doc.setFontSize(16);
    doc.text("Inventory Total Value", 14, 20);
    doc.setFontSize(11);
    doc.text(`Store: ${storeName}`, 14, 28);
    doc.text(`Generated: ${formattedDate}`, 14, 34);

    // Table headers and body
    const head = [
      [
        "Product Name",
        "QTY",
        "Retail Value",
        "Cost Value",
        "Toal Profit",
        "Profit Margin",
      ],
    ];
    const body = items.map((item) => {
      const { retailValue, costValue, potentialValue, margin } =
        calculateValues(item);
      return [
        item.productName,
        item.productType === "Weight"
          ? parseFloat(item.stock).toFixed(2)
          : item.stock,
        `$${retailValue.toFixed(2)}`,
        `$${costValue.toFixed(2)}`,
        `$${potentialValue.toFixed(2)}`,
        `${margin.toFixed(2)}%`,
      ];
    });

    // Add totals row
    const totalRow = [
      "TOTAL",
      "",
      `$${totalRetailValue.toFixed(2)}`,
      `$${totalCostValue.toFixed(2)}`,
      `$${totalPotentialValue.toFixed(2)}`,
      `${totalMargin.toFixed(2)}%`,
    ];
    body.push(totalRow);

    autoTable(doc, {
      head,
      body,
      startY: 40,
      theme: "striped",
      headStyles: { fillColor: [22, 160, 133] }, // Teal headers
      willDrawCell: function (data) {
        const isTotalsRow = data.row.index === body.length - 1;
        if (isTotalsRow) {
          data.cell.styles.fillColor = [46, 204, 113]; // Green background
          data.cell.styles.textColor = [255, 255, 255]; // White text
          data.cell.styles.fontStyle = "bold"; // Bold text
        }
      },
    });

    doc.save(`Inventory_Total_Value_${storeName}.pdf`);
  };

  const exportToCSV = (items, storeName) => {
    const now = new Date();
    const formattedDate = now.toLocaleString("en-US");
    const {
      totalRetailValue,
      totalCostValue,
      totalPotentialValue,
      totalMargin,
    } = calculateSums();

    let csvContent = `Inventory Total Value\n`;
    csvContent += `Store:,${storeName}\nGenerated:,${formattedDate}\n\n`;
    csvContent += "Product Name,QTY,Retail Value,Cost Value,Profit Margin\n";

    items.forEach((item) => {
      const { retailValue, costValue, potentialValue, margin } =
        calculateValues(item);
      const quantity =
        item.productType === "Weight"
          ? parseFloat(item.stock).toFixed(2)
          : item.stock;

      csvContent += `${item.productName},${quantity},${retailValue.toFixed(
        2
      )},${costValue.toFixed(2)},${potentialValue.toFixed(2)},${margin.toFixed(
        2
      )}%\n`;
    });

    // Add totals row
    csvContent += `TOTAL,,${totalRetailValue.toFixed(
      2
    )},${totalCostValue.toFixed(2)},${totalPotentialValue.toFixed(
      2
    )},${totalMargin.toFixed(2)}%\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Inventory_Total_Value_${storeName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <span className="toolBarTitle">Inventory Total Value</span>
      </div>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="buttonsContainerValue">
        {/* <div className="addProductsButtonContainer">
          <button
            className="addProductsButton"
            onClick={() => {
              console.log("add product");
            }}
          >
            +
          </button>
        </div> */}
        <div className="buttonContainerStoresProducts">
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

        <div className="buttonContainerFilterByCategory">
          <button
            className="inputButtonStore"
            onClick={() => {
              setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
              setIsStoreDropdownOpen(false);
              setIsExportDropdownOpen(false);
            }}
          >
            {selectedCategories.length === 0
              ? "Select Category"
              : selectedCategories.length === 1
              ? selectedCategories[0].categoryName
              : selectedCategories.length === categories.length
              ? "All Categories"
              : selectedCategories.map((s) => s.categoryName).join(", ")}{" "}
            <FaFileAlt className="icon" color="grey" />
          </button>
          {isCategoryDropdownOpen && (
            <div className="dropdown">
              <div
                className="dropdownItem"
                onClick={() => handleCategorySelect("All Categories")}
              >
                <div className="checkboxContainer">
                  <input
                    className="inputCheckBox"
                    type="checkbox"
                    checked={selectedCategories.length === categories.length}
                    readOnly
                  />
                </div>
                <span className="storeName">All Categories</span>
              </div>
              {categories.map((category) => (
                <div
                  className="dropdownItem"
                  key={category.categoryId}
                  onClick={() => handleCategorySelect(category)}
                >
                  <div className="checkboxContainer">
                    <input
                      className="inputCheckBox"
                      type="checkbox"
                      checked={selectedCategories.some(
                        (s) => s.categoryId === category.categoryId
                      )}
                      readOnly
                    />
                  </div>
                  <span className="storeName">{category.categoryName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="buttonContainerLowStock">
          <button
            className="inputButtonLowStock"
            onClick={() => {
              setIsLowStockDropdownOpen(!isLowStock);
              setIsExportDropdownOpen(false);
              setIsEmployeeDropdownOpen(false);
              setIsStoreDropdownOpen(false);
            }}
          >
            {selectStockOption === "" ? "All Items" : selectStockOption}{" "}
            <FaChevronDown className="icon" color="grey" />
          </button>
          {isLowStock && (
            <div className="dropdown">
              <div
                className="dropdownItem"
                onClick={() => {
                  setSelectStockOption("All Items"); // Set the selected category
                  setIsLowStockDropdownOpen(false);

                  console.log("alllll");
                }}
              >
                <span className="storeName">All Stock</span>
              </div>
              <div
                className="dropdownItem"
                onClick={() => {
                  setSelectStockOption("Low Stock"); // Set the selected category
                  setIsLowStockDropdownOpen(false);

                  console.log("low");
                }}
              >
                <span className="storeName">Low Stock</span>
              </div>
              <div
                className="dropdownItem"
                onClick={() => {
                  setSelectStockOption("Out of Stock"); // Set the selected category

                  setIsLowStockDropdownOpen(false);
                  console.log("out");
                }}
              >
                <span className="storeName">Out Of Stock</span>
              </div>
            </div>
          )}
        </div>
        <div className="buttonContainerExportValue">
          <button
            className="inputButtonExportValue"
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
                  exportToPDF(filteredItems, selectedStores[0].storeName); // Pass selected store
                }}
              >
                <span className="storeName">
                  Download PDF{" "}
                  <FaFilePdf color="red" style={{ marginRight: 8 }} />
                </span>
              </div>
              <div
                className="dropdownItem"
                onClick={() => {
                  setIsExportDropdownOpen(false);
                  exportToCSV(filteredItems, selectedStores[0].storeName); // Pass selected store
                }}
              >
                <span className="storeName">
                  Download CSV{" "}
                  <FaFileCsv color="green" style={{ marginRight: 8 }} />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="valueContainerSummery">
        <div className="valueSubContainer">
          <h1>Retail Value</h1>
          <span className="amount">{formatNumberShort(totalRetailValue)}</span>
        </div>
        <div className="valueSubContainer">
          <h1>Cost Value</h1>
          <span className="amount">{formatNumberShort(totalCostValue)}</span>
        </div>
        <div className="valueSubContainer">
          <h1>Total Profit</h1>
          <span className="amount">
            {formatNumberShort(totalPotentialValue)}
          </span>
        </div>
        <div className="valueSubContainer">
          <h1>Profit Margin</h1>
          <span className="amount">{totalMargin.toFixed(2)}%</span>
        </div>
      </div>

      <div className="productsContainerProductsValue">
        {/* Search Input */}
        <div className="searchBar">
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
        <div className="productsSubContainer">
          <div className="productsHeader">
            <div className="headerItem">Product Name</div>
            <div className="headerItem">QTY</div>
            <div className="headerItem">Retail Value</div>
            <div className="headerItem">Cost Value</div>
            <div className="headerItem">Profit Margin</div>
          </div>

          {filteredItems.map((item, index) => {
            const { retailValue, costValue, margin } = calculateValues(item);
            return (
              <ProductsValueListItem
                key={index}
                itemName={item.productName}
                quantity={
                  item.productType === "Weight"
                    ? parseFloat(item.stock).toFixed(2)
                    : item.stock
                }
                retailValue={retailValue.toFixed(2)}
                costValue={costValue.toFixed(2)}
                margin={`${margin.toFixed(2)}%`}
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

export default ProductValueScreen;
