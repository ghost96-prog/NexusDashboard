import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Css/EditProductScreen.css";

const EditProductScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedProduct = location.state || {};

  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("Each");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [sku, setSku] = useState("");
  const [lowStockNotification, setLowStockNotification] = useState("");
  const [stock, setStock] = useState("0");
  const [addStock, setAddStock] = useState(false);
  const [trackStock, setTrackStock] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [category, setCategory] = useState({});
  const [categoryName, setCategoryName] = useState("No Category");
  const [editType, setEditType] = useState("");
  const [errors, setErrors] = useState({});
  const [productId, setProductId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [showAdditionalStockInput, setShowAdditionalStockInput] =
    useState(true);
  const [additionalStock, setAdditionalStock] = useState("");
  const [categories, setCategories] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  
  // New states for category creation
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserEmail(decoded.email);
        setUserId(decoded.userId.toString());
        setUserRole(decoded.role || "Owner");
      } catch (error) {
        toast.error("Invalid authentication token.");
      }
    }

    fetchCategories();

    if (selectedProduct) {
      setProductName(selectedProduct.productName || "");
      setProductType(selectedProduct.productType || "Each");
      setPrice(selectedProduct.price ? selectedProduct.price.toFixed(2) : "");
      setCost(selectedProduct.cost ? selectedProduct.cost.toFixed(2) : "");
      setSku(selectedProduct.sku || "");
      setLowStockNotification(selectedProduct.lowStockNotification || "");
      setStock(selectedProduct.stock || "0");
      setTrackStock(selectedProduct.trackStock || true);
      setCategoryName(selectedProduct.category || "No Category");
      setCategoryId(selectedProduct.categoryId || "");
      setEditType("");
      setProductId(selectedProduct.productId || "");
    }
  }, [selectedProduct]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const email = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/categoryRouter/categories?email=${encodeURIComponent(
          email
        )}`
      );

      if (!response.ok) {
        toast.error("Failed to fetch categories.");
        return;
      }

      const data = await response.json();
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

  const generateCategoryId = () => {
    const currentDate = new Date();

    const day = String(currentDate.getDate()).padStart(2, "0");
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const year = currentDate.getFullYear();
    const hours = String(currentDate.getHours() % 12 || 12).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");
    const seconds = String(currentDate.getSeconds()).padStart(2, "0");
    const ampm = currentDate.getHours() >= 12 ? "PM" : "AM";

    const timestamp = new Date().getTime().toString(16);
    const randomString = generateRandomString(16);

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${ampm}-${timestamp}${randomString}`;
  };

  const generateRandomString = (length) => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    if (newCategoryName.length > 16) {
      toast.error("Category name must be 16 characters or less");
      return;
    }

    try {
      setCreatingCategory(true);
      
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        setCreatingCategory(false);
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const newCategory = {
        categoryId: generateCategoryId(),
        categoryName: newCategoryName.toUpperCase(),
        currentDate: new Date().toISOString(),
        items: 0,
      };

      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
        setCreatingCategory(false);
        return;
      }

      const response = await fetch(
        `https://nexuspos.onrender.com/api/categoryRouter/category-updates?email=${encodeURIComponent(
          userEmail
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newCategory),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Category created successfully!");
        
        setShowCategoryModal(false);
        setNewCategoryName("");
        
        await fetchCategories();
        
        setCategoryName(newCategoryName.toUpperCase());
        setCategory(newCategory);
      } else {
        toast.error("Failed to create category");
        console.error("Error adding category to server:", data.error);
      }
    } catch (error) {
      toast.error("Error creating category");
      console.error("Error adding category:", error);
    } finally {
      setCreatingCategory(false);
    }
  };

  const generateInventoryId = () => {
    const timestamp = new Date().getTime().toString(36);
    const randomString = Math.random().toString(36).substr(2, 5);
    const inventoryId = `${timestamp}${randomString}`;
    return inventoryId.toUpperCase();
  };

  const handleAdditionalStockToggle = () => {
    setShowAdditionalStockInput((prev) => !prev);
    setEditType("Add");
    setAddStock(false);
  };

  const handleTrackStockToggle = () => {
    setTrackStock((prev) => !prev);
    if (!trackStock) {
      setTrackStock(true);
    }
  };

  const handleOverrideStockToggle = () => {
    setAddStock((prev) => !prev);
    setEditType("Override");
    setShowAdditionalStockInput(false);
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    let numericValue = value.replace(/[^0-9]/g, "");

    if (numericValue.length > 1 && numericValue[0] === "0") {
      numericValue = numericValue.slice(1).replace(/^0+/, "");
    }

    if (numericValue.length === 1) {
      numericValue = "0" + numericValue;
    }

    const formattedValue = `${
      numericValue.slice(0, -2) || "0"
    }.${numericValue.slice(-2)}`;
    setPrice(String(formattedValue));
  };

  const handleCostChange = (e) => {
    const value = e.target.value;
    let numericValue = value.replace(/[^0-9]/g, "");

    if (numericValue.length > 1 && numericValue[0] === "0") {
      numericValue = numericValue.slice(1).replace(/^0+/, "");
    }

    if (numericValue.length === 1) {
      numericValue = "0" + numericValue;
    }

    const formattedValue = `${
      numericValue.slice(0, -2) || "0"
    }.${numericValue.slice(-2)}`;
    setCost(String(formattedValue));
  };

  const handleProductType = (type) => {
    setProductType(type);
  };

  const handleLowStockNotification = (e) => {
    const text = e.target.value;
    if (/^\d*\.?\d*$/.test(text)) {
      if (text.startsWith(".")) {
        setLowStockNotification("0" + text);
      } else if (
        text.startsWith("0") &&
        text.length > 1 &&
        !text.startsWith("0.")
      ) {
        toast.error("Leading zeros are not allowed.");
        setLowStockNotification("");
      } else {
        setLowStockNotification(text);
      }
    } else {
      toast.error("Please enter a valid number.");
      setLowStockNotification("");
    }
  };

  const handleChangeText = (e) => {
    const text = e.target.value;
    if (/^\d*\.?\d*$/.test(text)) {
      if (text.startsWith(".")) {
        setStock("0" + text);
      } else if (
        text.startsWith("0") &&
        text.length > 1 &&
        !text.startsWith("0.")
      ) {
        toast.error("Leading zeros are not allowed.");
        setStock("");
      } else {
        setStock(text);
      }
    } else {
      toast.error("Please enter a valid number.");
      setStock("");
    }
  };

  const handleAddText = (e) => {
    const text = e.target.value;
    if (/^\d*\.?\d*$/.test(text)) {
      if (text.startsWith(".")) {
        setAdditionalStock("0" + text);
      } else if (
        text.startsWith("0") &&
        text.length > 1 &&
        !text.startsWith("0.")
      ) {
        toast.error("Leading zeros are not allowed.");
        setAdditionalStock("");
      } else {
        setAdditionalStock(text);
      }
    } else {
      toast.error("Please enter a valid number.");
      setAdditionalStock("");
    }
  };

  const validateInputs = () => {
    const newErrors = {};

    if (!productName.trim()) {
      newErrors.productName = "Product name is required";
    }

    if (!sku.trim()) {
      newErrors.sku = "SKU is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveProduct = async () => {
    try {
      setLoading(true);
      if (isSaving) return;
      setIsSaving(true);

      if (!validateInputs()) {
        setIsSaving(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        setLoading(false);
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId.toString();

      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
        setLoading(false);
        return;
      }

      const currentDate = new Date();
      const updatedProductData = {
        productName: productName.toUpperCase(),
        category: categoryName || (category.categoryName || "").toUpperCase(),
        categoryId: categoryId || category.categoryId || "",
        productType: productType,
        sku: sku,
        userId: userId,
        lowStockNotification: Number(lowStockNotification),
        trackStock: trackStock,
        editType: editType,
        stock: parseFloat(stock),
        productId: productId,
        price: Number(price),
        cost: Number(cost),
        currentDate: currentDate.toISOString(),
      };

      const response = await fetch(
        `https://nexuspos.onrender.com/api/productRouter/products?email=${encodeURIComponent(
          userEmail
        )}`
      );

      if (!response.ok) {
        toast.error("Failed to fetch product data from the server");
        setLoading(false);
        return;
      }

      const responseData = await response.json();
      const existingProductData = responseData.data || [];

      const selectedIndex = existingProductData.findIndex(
        (item) => item.productId === selectedProduct.productId
      );

      if (selectedIndex === -1) {
        toast.error("Selected product not found");
        setLoading(false);
        return;
      }

      const stockBeforeUpdate = parseFloat(
        existingProductData[selectedIndex].stock !== null
          ? existingProductData[selectedIndex].stock
          : 0
      );

      let stockChange = 0;
      if (editType === "Override") {
        stockChange = parseFloat(stock) - stockBeforeUpdate;
      } else if (showAdditionalStockInput && additionalStock !== "") {
        stockChange = parseFloat(additionalStock);
      }

      const stockAfterUpdate = stockBeforeUpdate + stockChange;
      updatedProductData.stock = stockAfterUpdate;

      const inventoryId = generateInventoryId();
      const inventoryUpdateData = {
        productName: updatedProductData.productName,
        inventoryId: inventoryId,
        productId: updatedProductData.productId,
        roleOfEditor: "Owner",
        createdBy: "Web User",
        userId: userId,
        EditorId: userId,
        currentDate: updatedProductData.currentDate,
        stockBefore: stockBeforeUpdate,
        stockAfter: stockAfterUpdate,
        typeOfEdit: editType === "Override" ? "Override" : "Add",
        synchronized: false,
        editedBy: "adminApp",
      };

      try {
        const responseInventory = await fetch(
          `https://nexuspos.onrender.com/api/inventoryRouter/inventory-updates?email=${encodeURIComponent(
            userEmail
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(inventoryUpdateData),
          }
        );

        if (!responseInventory.ok) {
          console.error("Failed to send inventory updates");
        }
      } catch (error) {
        console.error("Error sending inventory updates:", error);
      }

      try {
        const responseProduct = await fetch(
          `https://nexuspos.onrender.com/api/productRouter/product-updates?email=${encodeURIComponent(
            userEmail
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedProductData),
          }
        );

        if (responseProduct.ok) {
          toast.success("Product updated successfully!");
          setIsSaving(false);
          setTimeout(() => {
            navigate("/products");
          }, 1500);
        } else {
          toast.error("Failed to update product");
        }
      } catch (error) {
        console.error("Error sending product data:", error);
        toast.error("Error updating product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="safeAreacontainer">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="header">
        <div className="headerContent">
          <button className="backButton" onClick={() => navigate("/products")}>
            <span className="backIcon">←</span>
          </button>
          <h1 className="headerTitle">Edit Product</h1>
        </div>
        <p className="headerSubtitle">Update product details</p>
      </div>

      <div className="scrollContainer">
        <div className="formContainer">
          {/* Product Name Input */}
          <div className="inputContainer">
            <label className="inputLabel">Product Name</label>
            <div className="inputWrapper">
              <span className="inputIcon">🏷️</span>
              <input
                className="input"
                placeholder="Product Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                maxLength={40}
              />
            </div>
            {errors.productName && (
              <p className="errorText">{errors.productName}</p>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="inputContainer">
            <label className="inputLabel">Category</label>
            <div
              className="dropdownTrigger"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span className="inputIcon">📁</span>
              <span className="dropdownTriggerText">
                {categoryName || category.categoryName || "Select Category"}
              </span>
              <span className="dropdownIcon">{showDropdown ? "↑" : "↓"}</span>
            </div>

            {showDropdown && (
              <div
                className="dropdownModalBackdrop"
                onClick={() => setShowDropdown(false)}
              >
                <div
                  className="dropdownModalContainer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="dropdownModalHeader">
                    <h3 className="dropdownModalHeaderText">Select Category</h3>
                    <button
                      onClick={() => setShowDropdown(false)}
                      className="closeButton"
                    >
                      ×
                    </button>
                  </div>

                  <div className="dropdownModalScroll">
                    {/* Add New Category Button */}
                    <div 
                      className="addNewCategoryItem"
                      onClick={() => {
                        setShowDropdown(false);
                        setShowCategoryModal(true);
                      }}
                    >
                      <span className="addCategoryIcon">+</span>
                      <span className="addNewCategoryText">Add New Category</span>
                    </div>

                    {/* "No Category" option */}
                    <div
                      className={`dropdownModalItemp ${
                        !categoryName &&
                        !category?.categoryName &&
                        "dropdownModalItemSelected"
                      }`}
                      onClick={() => {
                        setCategoryName("No Category");
                        setCategory(null);
                        setShowDropdown(false);
                      }}
                    >
                      <span className="itemIcon">📁</span>
                      <span
                        className={`dropdownModalItemText ${
                          !categoryName &&
                          !category?.categoryName &&
                          "dropdownModalItemTextSelected"
                        }`}
                      >
                        No Category
                      </span>
                    </div>

                    {/* Existing categories list */}
                    {categories
                      .sort((a, b) =>
                        a.categoryName.localeCompare(b.categoryName)
                      )
                      .map((cat) => (
                        <div
                          key={cat.categoryId}
                          className={`dropdownModalItemp ${
                            (categoryName === cat.categoryName ||
                              category?.categoryName === cat.categoryName) &&
                            "dropdownModalItemSelected"
                          }`}
                          onClick={() => {
                            setCategoryName(cat.categoryName);
                            setCategory(cat);
                            setShowDropdown(false);
                          }}
                        >
                          <span className="itemIcon">📂</span>
                          <span
                            className={`dropdownModalItemText ${
                              (categoryName === cat.categoryName ||
                                category?.categoryName === cat.categoryName) &&
                              "dropdownModalItemTextSelected"
                            }`}
                          >
                            {cat.categoryName}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sold By Radio Buttons */}
          <div className="inputContainer">
            <label className="inputLabel">Sold By</label>
            <div className="radioGroup">
              <button
                className={`radioButton ${
                  productType === "Each" ? "radioButtonSelected" : ""
                }`}
                onClick={() => handleProductType("Each")}
              >
                <span
                  className={`radioButtonText ${
                    productType === "Each" ? "radioButtonTextSelected" : ""
                  }`}
                >
                  Each
                </span>
              </button>
              <button
                className={`radioButton ${
                  productType === "Weight" ? "radioButtonSelected" : ""
                }`}
                onClick={() => handleProductType("Weight")}
              >
                <span
                  className={`radioButtonText ${
                    productType === "Weight" ? "radioButtonTextSelected" : ""
                  }`}
                >
                  Weight
                </span>
              </button>
            </div>
          </div>

          {/* Price and Cost Row */}
          <div className="rowContainer">
            <div className="rowInputContainer">
              <label className="inputLabel">Price</label>
              <div className="inputWrapper">
                <span className="currencySymbol">$</span>
                <input
                  className="input"
                  value={price}
                  onChange={handlePriceChange}
                  placeholder="0.00"
                  type="text"
                />
              </div>
            </div>

            <div className="rowInputContainer">
              <label className="inputLabel">Cost</label>
              <div className="inputWrapper">
                <span className="currencySymbol">$</span>
                <input
                  className="input"
                  value={cost}
                  onChange={handleCostChange}
                  placeholder="0.00"
                  type="text"
                />
              </div>
            </div>
          </div>

          {/* SKU and Low Stock Row */}
          <div className="rowContainer">
            <div className="rowInputContainer">
              <label className="inputLabel">SKU</label>
              <div className="inputWrapper">
                <input
                  className="input"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU"
                />
              </div>
              {errors.sku && <p className="errorText">{errors.sku}</p>}
            </div>

            <div className="rowInputContainer">
              <label className="inputLabel">Low Stock Alert</label>
              <div className="inputWrapper">
                <input
                  className="input"
                  value={lowStockNotification}
                  onChange={handleLowStockNotification}
                  placeholder="Quantity"
                  type="text"
                />
              </div>
            </div>
          </div>

          {/* Stock Management */}
          <div className="switchContainer">
            <div className="switchWrapper">
              <label className="switchLabel">Track Stock</label>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={trackStock}
                  onChange={handleTrackStockToggle}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          {trackStock && (
            <>
              <div className="currentStockText">
                Current Stock:{" "}
                {productType === "Weight"
                  ? Number(selectedProduct.stock || 0).toFixed(2)
                  : selectedProduct.stock || 0}
              </div>

              <div className="stockControlsContainer">
                <div className="stockControl">
                  <label className="switchLabel">Override Stock</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={addStock}
                      onChange={handleOverrideStockToggle}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="stockControl">
                  <label className="switchLabel">Add Stock</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={showAdditionalStockInput}
                      onChange={handleAdditionalStockToggle}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>

              {addStock && !showAdditionalStockInput && (
                <div className="inputContainer">
                  <label className="inputLabel">New Stock Quantity</label>
                  <div className="inputWrapper">
                    <input
                      className="input"
                      value={stock}
                      onChange={handleChangeText}
                      placeholder="Enter new stock quantity"
                      type="text"
                    />
                  </div>
                </div>
              )}

              {showAdditionalStockInput && !addStock && (
                <div className="inputContainer">
                  <label className="inputLabel">Additional Stock</label>
                  <div className="inputWrapper">
                    <input
                      className="input"
                      value={additionalStock}
                      onChange={handleAddText}
                      placeholder="Enter additional stock"
                      type="text"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Save Button */}
          <div className="buttonContainer">
            <button
              className="saveButton"
              onClick={saveProduct}
              disabled={isSaving}
            >
              <span className="saveButtonText">UPDATE PRODUCT</span>
              <span className="saveIcon">💾</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="create-product-category-modal-backdrop">
          <div className="create-product-category-modal-container">
            <div className="create-product-category-modal-header">
              <h3 className="create-product-category-modal-title">
                Create New Category
              </h3>
            </div>
            <div className="create-product-category-modal-body">
              <input
                type="text"
                className="create-product-category-modal-input"
                placeholder="Enter Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                maxLength={16}
                autoFocus
              />
              <p className="create-product-category-modal-helper-text">
                Maximum 16 characters
              </p>
              <div className="create-product-category-modal-buttons">
                <button
                  className="create-product-category-modal-button-cancel"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setNewCategoryName("");
                  }}
                  disabled={creatingCategory}
                >
                  Cancel
                </button>
                <button
                  className="create-product-category-modal-button-save"
                  onClick={handleAddCategory}
                  disabled={creatingCategory || !newCategoryName.trim()}
                >
                  {creatingCategory ? "Creating..." : "Save Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal for Product Update */}
      {loading && (
        <div className="modalBackground">
          <div className="modalContent">
            <div className="loader"></div>
            <p className="modalText">Updating Product...</p>
          </div>
        </div>
      )}

      {/* Category Creation Loading Modal */}
      {creatingCategory && (
        <div className="create-product-category-creating-modal">
          <div className="create-product-category-creating-content">
            <div className="create-product-category-creating-loader"></div>
            <p className="create-product-category-creating-text">
              Creating Category...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProductScreen;