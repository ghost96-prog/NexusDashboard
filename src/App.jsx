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
import InventoryCountsScreen from "./screens/InventoryCountsScreen";
import CreateCountScreen from "./screens/CreateCountScreen";
import CountStockScreen from "./screens/countStockScreen";
import InventoryCountDetailsScreen from "./screens/InventoryCountDetailsScreen";
import CashManagementScreen from "./screens/CashManagementScreen";

// Import GRV screens
import GoodsReceivedScreen from "./screens/GoodsReceivedScreen";
import CreateGoodsReceivedScreen from "./screens/CreateGoodsReceivedScreen";
import ProcessGoodsReceivedScreen from "./screens/ProcessGoodsReceivedScreen";
import GoodsReceivedDetailsScreen from "./screens/GoodsReceivedDetailsScreen";

// Import new Category and Discount screens
import CategoriesScreen from "./screens/CategoriesScreen";
import DiscountsScreen from "./screens/DiscountsScreen";
import StockTransferScreen from "./screens/StockTransferScreen";
import CreateStockTransferScreen from "./screens/CreateStockTransferScreen";
import ProcessStockTransferScreen from "./screens/ProcessStockTransferScreen";
import StockTransferDetailsScreen from "./screens/StockTransferDetailsScreen";

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
          <Route path="/payin_payout" element={<CashManagementScreen />} />
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
          <Route path="/counts" element={<InventoryCountsScreen />} />
          <Route path="/create-counts" element={<CreateCountScreen />} />
          <Route path="/count-stock" element={<CountStockScreen />} />
          <Route path="/inventory-count/:id" element={<InventoryCountDetailsScreen />} />
          
          {/* GRV Routes */}
          <Route path="/goods-received" element={<GoodsReceivedScreen />} />
          <Route path="/create-grv" element={<CreateGoodsReceivedScreen />} />
          <Route path="/process-grv" element={<ProcessGoodsReceivedScreen />} />
          <Route path="/grv-details/:grvId" element={<GoodsReceivedDetailsScreen />} />
              {/* Stock Transfer Routes */}
          <Route path="/stock-transfers" element={<StockTransferScreen />} />
          <Route path="/create-stock-transfer" element={<CreateStockTransferScreen />} />
          <Route path="/process-stock-transfer" element={<ProcessStockTransferScreen />} />
          <Route path="/stock-transfer-details/:transferId" element={<StockTransferDetailsScreen />} />
          {/* New Category and Discount Routes */}
          <Route path="/categories" element={<CategoriesScreen />} />
          <Route path="/discounts" element={<DiscountsScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;