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
import "../Css/ProductListScreen.css";
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
import { FaFileCsv, FaFilePdf } from "react-icons/fa6";

const ProductListScreen = () => {
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
        `https://nexuspos.onrender.com/api/productRouter/products/initial?email=${encodeURIComponent(
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
        toast.error("An error occurred while fetching receipts.");
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
        onRefresh();
      }
    }

    if (
      isExportDropdownOpen &&
      !event.target.closest(".buttonContainerExportProducts")
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

  const exportToPDF = (products, selectedStore) => {
    const doc = new jsPDF();

    // Date and Time formatting
    const dateTime = new Date().toLocaleString();

    // Set the title with store name
    doc.text(`Product List for: ${selectedStore.storeName}`, 14, 10);
    doc.text(`Exported on: ${dateTime}`, 14, 20);

    autoTable(doc, {
      startY: 30, // Adjust starting Y position
      head: [["Product Name", "Category", "Price", "Cost", "Stock"]],
      body: products.map((p) => [
        p.productName,
        p.category || "No Category",
        Number(p.price).toFixed(2),
        Number(p.cost).toFixed(2),
        p.productType === "Weight"
          ? Number(p.stock).toFixed(2)
          : String(p.stock),
      ]),
    });

    doc.save(`products_for_${selectedStore.storeName}_${dateTime}.pdf`);
  };

  const exportToCSV = (products, selectedStore) => {
    const headers = ["Product Name", "Category", "Price", "Cost", "Stock"];
    const rows = products.map((p) => [
      `"${p.productName}"`,
      `"${p.category || "No Category"}"`,
      `"${Number(p.price).toFixed(2)}"`,
      `"${Number(p.cost).toFixed(2)}"`,
      `"${p.productType === "Weight" ? Number(p.stock).toFixed(2) : p.stock}"`,
    ]);

    // Date and Time formatting
    const dateTime = new Date().toLocaleString();

    // Create the CSV content
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        [
          `Product List for: ${selectedStore.storeName}`,
          `Exported on: ${dateTime}`,
        ],
        headers,
        ...rows,
      ]
        .map((e) => e.join(","))
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `products_for_${selectedStore.storeName}_${dateTime}.csv`
    );
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
        <span className="toolBarTitle">Products</span>
      </div>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="buttonsContainerReceipts">
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
            <FaStore className="icon" color="grey" />
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
            <FaDownload className="icon" color="grey" />
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
        <div className="buttonContainerExportProducts">
          <button
            className="inputButtonExportProducts"
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
                  exportToPDF(filteredItems, selectedStores[0]); // Pass selected store
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
                  exportToCSV(filteredItems, selectedStores[0]); // Pass selected store
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

      <div className="productsContainerProducts">
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
            <div className="headerItem">Category</div>
            <div className="headerItem">Price </div>
            <div className="headerItem">Cost </div>
            <div className="headerItem">QTY</div>
          </div>
          {filteredItems.map((item, index) => {
            return (
              <ProductsListItem
                key={index}
                itemName={item.productName}
                category={item.category}
                price={Number(item.price).toFixed(2)}
                cost={Number(item.cost).toFixed(2)}
                stock={
                  item.productType === "Weight"
                    ? Number(item.stock).toFixed(2)
                    : item.stock
                }
                onClick={() => handleItemClick(item)}
              />
            );
          })}
        </div>
      </div>
      {modalProduct &&
        (() => {
          // Compute the matching store before returning JSX
          const matchedStore = filteredItems.find(
            (product) => product.storeId === modalProduct.storeId
          );
          return (
            <ReceiptModal
              receipt={modalProduct}
              store={matchedStore}
              email={email}
              onClose={() => setModalProduct(null)}
            />
          );
        })()}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ProductListScreen;
