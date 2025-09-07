import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Css/CreateProductScreen.css";

const CreateProductScreen = () => {
  const navigate = useNavigate();
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("Each");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [sku, setSku] = useState("");
  const [lowStockNotification, setlowStockNotification] = useState("0");
  const [stock, setStock] = useState("0");
  const [trackStock, settrackStock] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [editType, setEditType] = useState("");
  const [errors, setErrors] = useState({});
  const [productId, setProductId] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("No Category");
  const [category, setCategory] = useState({});
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserEmail(decoded.email);
        setUserId(decoded.userId.toString());
      } catch (error) {
        toast.error("Invalid authentication token.");
      }
    }

    generateSKU();
    generateProductId();
    fetchCategories();
  }, []);

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
        const errorMessage = await response.text();
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

  const generateInventoryId = () => {
    return generateRandomString(16);
  };

  const generateProductId = () => {
    const id = generateRandomString(16);
    setProductId(id);
  };

  const generateRandomString = (length) => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  const generateSKU = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const email = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/productRouter/products?email=${encodeURIComponent(
          email
        )}`
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error("Failed to fetch products for SKU generation.");
        return;
      }

      const responseData = await response.json();
      const productList = responseData.data || [];

      // Find the highest SKU
      const highestSKU = productList.reduce((max, product) => {
        const sku = parseInt(product.sku, 10);
        return !isNaN(sku) && sku > max ? sku : max;
      }, 9999);

      // Increment the highest SKU by 1
      const nextSKU = highestSKU + 1;
      setSku(nextSKU.toString());
    } catch (error) {
      console.error("Error generating SKU:", error);
      // Fallback to random SKU if API call fails
      const randomSKU = Math.floor(Math.random() * 10000) + 10000;
      setSku(randomSKU.toString());
    }
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

  const handleStockToggle = () => {
    settrackStock((prev) => !prev);
    if (!trackStock) {
      setEditType("Create");
    } else {
      setEditType("");
    }
  };

  const handleProductType = (type) => {
    setProductType(type);
  };

  const saveProduct = async () => {
    try {
      if (!validateInputs()) {
        return;
      }

      setLoading(true);
      const currentDate = new Date();
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication token is missing.");
        setLoading(false);
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId.toString();

      // Construct product data
      const productData = {
        productName: productName.toUpperCase(),
        category: categoryName === "No Category" ? "" : categoryName,
        categoryId: category.categoryId || "",
        productType: productType,
        sku: sku,
        lowStockNotification: Number(lowStockNotification) || 0,
        trackStock: trackStock,
        editType: editType,
        stock: trackStock ? parseFloat(stock) : 0,
        userId: userId,
        productId: productId,
        price: Number(price),
        roleOfEditor: "Owner", // You might want to get this from your auth context
        createdBy: "Web User", // You might want to get this from your auth context
        EditorId: userId,
        cost: Number(cost),
        currentDate: currentDate.toISOString(),
        appCreated: "adminApp",
        adminSynced: false,
      };

      // Check internet connection
      if (!navigator.onLine) {
        toast.error(
          "No internet connection. Please check your connection and try again."
        );
        setLoading(false);
        return;
      }

      // Construct inventory update data
      const inventoryUpdateData = {
        productName: productData.productName,
        inventoryId: generateInventoryId(),
        productId: productData.productId,
        roleOfEditor: "Owner", // You might want to get this from your auth context
        createdBy: "Web User", // You might want to get this from your auth context
        EditorId: userId,
        userId: userId,
        currentDate: productData.currentDate,
        stockBefore: 0,
        stockAfter: productData.stock,
        typeOfEdit: "Create",
        synchronized: false,
        editedBy: "",
      };

      // First send inventory update
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
          throw new Error("Failed to send inventory updates");
        }
      } catch (error) {
        console.error("Error sending inventory updates:", error);
        // Continue with product creation even if inventory update fails
      }

      // Then send product data
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
            body: JSON.stringify(productData),
          }
        );

        if (responseProduct.ok) {
          toast.success("Product created successfully!");
          // Reset form
          setProductName("");
          setProductType("Each");
          setPrice("");
          setCost("");
          setSku("");
          setlowStockNotification("0");
          setStock("0");
          settrackStock(false);
          setCategoryName("No Category");
          setCategory({});
          setEditType("");
          setProductId("");
          setErrors({});

          // Navigate back to product list
          setTimeout(() => {
            navigate("/products");
          }, 1500);
        } else {
          throw new Error("Failed to save product");
        }
      } catch (error) {
        toast.error("Error saving product. Please try again.");
        console.error("Error sending product data:", error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error("Error updating product:", error);
    } finally {
      setLoading(false);
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

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = "Valid price is required";
    }

    if (!cost || isNaN(Number(cost)) || Number(cost) < 0) {
      newErrors.cost = "Valid cost is required";
    }

    if (trackStock && (!stock || isNaN(Number(stock)) || Number(stock) < 0)) {
      newErrors.stock = "Valid stock quantity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handlelowStockNotification = (e) => {
    const text = e.target.value;
    if (/^\d*\.?\d*$/.test(text)) {
      if (text.startsWith(".")) {
        setlowStockNotification("0" + text);
      } else if (
        text.startsWith("0") &&
        text.length > 1 &&
        !text.startsWith("0.")
      ) {
        toast.error("Leading zeros are not allowed.");
        setlowStockNotification("");
      } else {
        setlowStockNotification(text);
      }
    } else {
      toast.error("Please enter a valid number.");
      setlowStockNotification("");
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
          <h1 className="headerTitle">Create Product</h1>
        </div>
        <p className="headerSubtitle">Add new products to your inventory</p>
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
                placeholder="Enter Product Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                maxLength={40}
                onFocus={() => setShowDropdown(false)}
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
                {categoryName || "Select Category"}
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
                    {/* Add "No Category" option at the top */}
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
                  onFocus={() => setShowDropdown(false)}
                />
              </div>
              {errors.price && <p className="errorText">{errors.price}</p>}
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
                  onFocus={() => setShowDropdown(false)}
                />
              </div>
              {errors.cost && <p className="errorText">{errors.cost}</p>}
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
                  placeholder="SKU"
                  onChange={(e) => setSku(e.target.value)}
                  onFocus={() => setShowDropdown(false)}
                  readOnly // SKU is auto-generated
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
                  onChange={handlelowStockNotification}
                  placeholder="Low Stock Notification"
                  type="text"
                  onFocus={() => setShowDropdown(false)}
                />
              </div>
            </div>
          </div>

          {/* Stock Toggle */}
          <div className="switchContainer">
            <div className="switchWrapper">
              <label className="switchLabel">Track Stock</label>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={trackStock}
                  onChange={handleStockToggle}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          {/* Stock Input (Conditional) */}
          {trackStock && (
            <div className="inputContainer">
              <label className="inputLabel">Current Stock</label>
              <div className="inputWrapper">
                <input
                  className="input"
                  value={stock}
                  onChange={handleChangeText}
                  placeholder="Enter stock quantity"
                  type="text"
                  onFocus={() => setShowDropdown(false)}
                />
              </div>
              {errors.stock && <p className="errorText">{errors.stock}</p>}
            </div>
          )}

          {/* Save Button */}
          <div className="buttonContainer">
            <button
              className="saveButton"
              onClick={saveProduct}
              disabled={loading}
            >
              <span className="saveButtonText">SAVE PRODUCT</span>
              <span className="saveIcon">💾</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Modal */}
      {loading && (
        <div className="modalBackground">
          <div className="modalContent">
            <div className="loader"></div>
            <p className="modalText">Saving Product...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProductScreen;
