import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect Cashiers to their primary interface (POS Billing)
    if (user.role === "cashier") {
      return <Navigate to="/pos" />;
    }
    // Redirect others to the Admin/Manager dashboard
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;
