import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import PendingOrders from "./components/PendingOrders";
import SalesReport from "./components/SalesReport";
import InventoryManagement from "./components/InventoryManagement";
import AddItems from "./components/AddItems";
import Summary from "./components/Summary";
import Register from "./components/Register";
import BuyerDashboard from "./components/BuyerDashboard";
import TableManagement from "./components/Tables";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/pending-orders" element={<PendingOrders />} />
        <Route path="/sales-report" element={<SalesReport />} />
        <Route path="/inventory" element={<InventoryManagement />} />
        <Route path="/add-items" element={<AddItems />} />
        <Route path="/buyer" element={<BuyerDashboard />}/>
        <Route path="/summary" element={<Summary />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tables" element={<TableManagement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;