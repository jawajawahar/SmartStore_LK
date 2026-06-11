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

function App() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={<Login />} />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Products */}
      <Route
        path="/products"
        element={
          <ProtectedRoute>
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
          <ProtectedRoute>
            <Debts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <Suppliers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supplier-payables"
        element={
          <ProtectedRoute>
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
          <ProtectedRoute>
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
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
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
          <ProtectedRoute>
            <AIReports />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
