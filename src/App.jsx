import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import WelcomeScreen from "./screens/WelcomeScreen";
import LoginScreen from "./screens/LoginScreen";

import FiscalisationScreen from "./screens/FiscalisationScreen";
import LoginScreenFiscal from "./screens/LoginScreenFiscal";
import SalesSummery from "./screens/SalesSummery";
import ReceiptsScreen from "./screens/ReceiptsScreen";
import TopSellingProducts from "./screens/TopSellingProducts";
import ProductListScreen from "./screens/ProductListScreen";
import InventoryHistoryScreen from "./screens/InventoryHistoryScreen";
import ProductValueScreen from "./screens/ProductsValueScreen";
import ShiftScreen from "./screens/ShiftScreen";
import LaybyeScreen from "./screens/LaybyeScreen";
import PaymentsScreen from "./screens/PaymentsScreen";
import CreateProductScreen from "./screens/CreateProductScreen";
import EditProductScreen from "./screens/EditProductScreen";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/login" element={<LoginScreenFiscal />} />
          <Route path="/loginBackOffice" element={<LoginScreen />} />
          <Route path="/salesSummery" element={<SalesSummery />} />
          <Route path="/receipts" element={<FiscalisationScreen />} />
          <Route path="/receiptsScreen" element={<ReceiptsScreen />} />
          <Route path="/soldItems" element={<TopSellingProducts />} />
          <Route path="/products" element={<ProductListScreen />} />
          <Route path="/create-products" element={<CreateProductScreen />} />
          <Route path="/edit-products" element={<EditProductScreen />} />
          <Route path="/inventory" element={<InventoryHistoryScreen />} />
          <Route path="/inventory-value" element={<ProductValueScreen />} />
          <Route path="/shifts" element={<ShiftScreen />} />
          <Route path="/laybye" element={<LaybyeScreen />} />
          <Route path="/payments" element={<PaymentsScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
