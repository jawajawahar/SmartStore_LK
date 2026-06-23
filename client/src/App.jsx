import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Products from "./pages/dashboard/Products";
import Customers from "./pages/dashboard/Customers";
import Debts from "./pages/dashboard/Debts";
import Suppliers from "./pages/dashboard/Suppliers";
import ProtectedRoute from "./routes/ProtectedRoute";
import SupplierPayables from "./pages/dashboard/SupplierPayables";
import POS from "./pages/dashboard/POS";
import Analytics from "./pages/dashboard/Analytics";
import SalesHistory from "./pages/dashboard/SalesHistory";
import Transactions from "./pages/dashboard/Transactions";
import Expenses from "./pages/dashboard/Expenses";
import Returns from "./pages/dashboard/Returns";
import AIReports from "./pages/dashboard/AIReports";
import Settings from "./pages/dashboard/Settings";
import PurchaseOrders from "./pages/dashboard/PurchaseOrders";
import AuditLogs from "./pages/dashboard/AuditLogs";

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("smartstore_theme_color");
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={<Login />} />


      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Products */}
      <Route
        path="/products"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <Products />
          </ProtectedRoute>
        }
      />

      {/* Customers */}
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/debts"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <Debts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/suppliers"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <Suppliers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supplier-payables"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <SupplierPayables />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pos"
        element={
          <ProtectedRoute>
            <POS />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales-history"
        element={
          <ProtectedRoute>
            <SalesHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <Transactions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <Expenses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/returns"
        element={
          <ProtectedRoute>
            <Returns />
          </ProtectedRoute>
        }
      />

      <Route
        path="/daily-report"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <AIReports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchase-orders"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <PurchaseOrders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
