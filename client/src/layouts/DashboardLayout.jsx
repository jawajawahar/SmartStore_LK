import { useState, useEffect } from "react";
import {
  FaBox,
  FaChartBar,
  FaClipboardList,
  FaHome,
  FaSignOutAlt,
  FaTruck,
  FaUsers,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaHistory,
  FaExchangeAlt,
  FaMoon,
  FaSun,
  FaUndo,
  FaReceipt,
  FaCoins,
  FaChevronLeft,
  FaChevronRight,
  FaRobot,
  FaCog,
} from "react-icons/fa";

import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Collapsible Sidebar State
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sidebar_collapsed") === "true"
  );

  const toggleSidebar = () => {
    const nextCollapsed = !collapsed;
    setCollapsed(nextCollapsed);
    localStorage.setItem("sidebar_collapsed", String(nextCollapsed));
  };

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex font-sans bg-bg-main text-text-main transition-colors duration-300">
      {/* Sidebar */}
      <div
        className={`p-5 flex flex-col justify-between shrink-0 border-r border-border-color bg-bg-card transition-all duration-300 relative ${
          collapsed ? "w-[88px]" : "w-[280px]"
        }`}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center text-[10px] shadow-md border border-indigo-500/20 cursor-pointer transition-colors z-20"
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        <div className="overflow-hidden">
          {/* Logo */}
          <div className={`mb-8 px-2 flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
            <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-indigo-600/30 shrink-0">
              S
            </span>

            {!collapsed && (
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl font-bold tracking-tight flex items-center gap-1.5 text-text-main"
              >
                SmartStore
                <span className="text-indigo-500 text-xs font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded">
                  LK
                </span>
              </motion.h1>
            )}
          </div>

          {/* Menu */}
          <div className="space-y-1.5 overflow-y-auto max-h-[72vh] pr-1">
            {/* Group 1: General */}
            {!collapsed && (
              <p className="text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest px-4 pt-2 pb-1 select-none">
                General
              </p>
            )}
            {user?.role !== "cashier" && (
              <SidebarItem
                icon={<FaHome />}
                text="Dashboard"
                to="/dashboard"
                active={location.pathname === "/dashboard"}
                collapsed={collapsed}
              />
            )}
            <SidebarItem
              icon={<FaClipboardList />}
              text="POS Billing"
              to="/pos"
              active={location.pathname === "/pos"}
              collapsed={collapsed}
            />

            {/* Group 2: Registry */}
            {(!collapsed && (user?.role !== "cashier" || location.pathname === "/customers")) && (
              <p className="text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest px-4 pt-3 pb-1 select-none">
                Registry
              </p>
            )}
            {user?.role !== "cashier" && (
              <SidebarItem
                icon={<FaBox />}
                text="Products"
                to="/products"
                active={location.pathname === "/products"}
                collapsed={collapsed}
              />
            )}
            <SidebarItem
              icon={<FaUsers />}
              text="Customers"
              to="/customers"
              active={location.pathname === "/customers"}
              collapsed={collapsed}
            />
            {user?.role !== "cashier" && (
              <SidebarItem
                icon={<FaTruck />}
                text="Suppliers"
                to="/suppliers"
                active={location.pathname === "/suppliers"}
                collapsed={collapsed}
              />
            )}

            {/* Group 3: Financials */}
            {user?.role !== "cashier" && (
              <>
                {!collapsed && (
                  <p className="text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest px-4 pt-3 pb-1 select-none">
                    Financials
                  </p>
                )}
                <SidebarItem
                  icon={<FaExchangeAlt />}
                  text="Transactions"
                  to="/transactions"
                  active={location.pathname === "/transactions"}
                  collapsed={collapsed}
                />
                <SidebarItem
                  icon={<FaCoins />}
                  text="Expenses"
                  to="/expenses"
                  active={location.pathname === "/expenses"}
                  collapsed={collapsed}
                />
                <SidebarItem
                  icon={<FaMoneyBillWave />}
                  text="Debts"
                  to="/debts"
                  active={location.pathname === "/debts"}
                  collapsed={collapsed}
                />
                <SidebarItem
                  icon={<FaFileInvoiceDollar />}
                  text="Supplier Payables"
                  to="/supplier-payables"
                  active={location.pathname === "/supplier-payables"}
                  collapsed={collapsed}
                />
              </>
            )}

            {/* Group 4: Sales & History */}
            {!collapsed && (
              <p className="text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest px-4 pt-3 pb-1 select-none">
                Sales & History
              </p>
            )}
            <SidebarItem
              icon={<FaHistory />}
              text="Sales History"
              to="/sales-history"
              active={location.pathname === "/sales-history"}
              collapsed={collapsed}
            />
            <SidebarItem
              icon={<FaUndo />}
              text="Returns"
              to="/returns"
              active={location.pathname === "/returns"}
              collapsed={collapsed}
            />

            {/* Group 5: Reports & Config */}
            {(!collapsed && (user?.role !== "cashier" || location.pathname === "/settings")) && (
              <p className="text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest px-4 pt-3 pb-1 select-none">
                Reports & Config
              </p>
            )}
            {user?.role !== "cashier" && (
              <SidebarItem
                icon={<FaChartBar />}
                text="Analytics"
                to="/analytics"
                active={location.pathname === "/analytics"}
                collapsed={collapsed}
              />
            )}
            {user?.role !== "cashier" && (
              <SidebarItem
                icon={<FaRobot />}
                text="AI Reports"
                to="/daily-report"
                active={location.pathname === "/daily-report"}
                collapsed={collapsed}
              />
            )}
            <SidebarItem
              icon={<FaCog />}
              text="Settings"
              to="/settings"
              active={location.pathname === "/settings"}
              collapsed={collapsed}
            />
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-4 border-t border-border-color">
          {/* User Card + Theme Toggle */}
          <div
            className={`rounded-xl p-3 mb-2.5 border border-border-color bg-bg-main/50 flex flex-col gap-3 transition-all ${
              collapsed ? "items-center" : ""
            }`}
          >
            {!collapsed && (
              <div className="flex items-center justify-between w-full">
                <div className="truncate pr-2">
                  <p className="font-semibold text-xs text-text-main truncate">
                    {user?.name || "System Admin"}
                  </p>
                  <p className="text-[10px] text-indigo-500 font-bold tracking-wider uppercase mt-0.5">
                    {user?.role || "Administrator"}
                  </p>
                </div>

                {/* Theme Toggle inside full view */}
                <button
                  onClick={toggleTheme}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer bg-bg-card hover:bg-bg-main text-text-secondary hover:text-indigo-500 border border-border-color"
                >
                  {theme === "dark" ? <FaSun className="text-yellow-400 text-xs" /> : <FaMoon className="text-xs" />}
                </button>
              </div>
            )}

            {collapsed && (
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer bg-bg-card hover:bg-bg-main text-text-secondary hover:text-indigo-500 border border-border-color"
              >
                {theme === "dark" ? <FaSun className="text-yellow-400 text-sm" /> : <FaMoon className="text-sm" />}
              </button>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`w-full bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/25 text-rose-500 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-semibold cursor-pointer ${
              collapsed ? "px-0" : "px-4"
            }`}
            title="Logout"
          >
            <FaSignOutAlt className="text-xs shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto h-screen bg-bg-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="max-w-7xl mx-auto h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, text, to, active, collapsed }) => {
  return (
    <Link to={to} className="block relative">
      {/* Visual Indicator on active item */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-indigo-600 rounded-r-md z-10" />
      )}

      <button
        className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
          collapsed ? "justify-center py-3 px-0" : "gap-3 px-4 py-2.5"
        } ${
          active
            ? "bg-indigo-600/10 text-indigo-500 border border-indigo-500/20"
            : "text-text-secondary hover:bg-bg-main hover:text-text-main border border-transparent"
        }`}
        title={collapsed ? text : ""}
      >
        <span className="text-sm shrink-0">{icon}</span>
        {!collapsed && <span>{text}</span>}
      </button>
    </Link>
  );
};

export default DashboardLayout;