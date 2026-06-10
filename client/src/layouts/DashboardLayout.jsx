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
} from "react-icons/fa";

import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { theme, toggleTheme } = useTheme();

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div
      className={`min-h-screen flex font-sans transition-all duration-300 ${theme === "dark"
          ? "bg-[#070a13] text-slate-100"
          : "bg-slate-100 text-slate-900"
        }`}
    >
      {/* Sidebar */}
      <div
        className={`w-[280px] p-5 flex flex-col justify-between shrink-0 border-r transition-all duration-300 ${theme === "dark"
            ? "bg-[#0b0f19] border-slate-800/80"
            : "bg-white border-slate-200"
          }`}
      >
        <div>
          {/* Logo */}
          <div className="mb-8 px-2">
            <h1
              className={`text-2xl font-bold tracking-tight flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-slate-900"
                }`}
            >
              <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-indigo-600/30">
                S
              </span>

              SmartStore

              <span className="text-indigo-400 text-sm font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md">
                LK
              </span>
            </h1>

            <p className="text-slate-500 text-xs mt-1.5 font-medium tracking-wide uppercase">
              POS Platform
            </p>
          </div>

          {/* Menu */}
          <div className="space-y-1">
            <SidebarItem
              icon={<FaHome />}
              text="Dashboard"
              to="/dashboard"
              active={location.pathname === "/dashboard"}
              theme={theme}
            />

            <SidebarItem
              icon={<FaBox />}
              text="Products"
              to="/products"
              active={location.pathname === "/products"}
              theme={theme}
            />

            <SidebarItem
              icon={<FaUsers />}
              text="Customers"
              to="/customers"
              active={location.pathname === "/customers"}
              theme={theme}
            />

            <SidebarItem
              icon={<FaMoneyBillWave />}
              text="Debts"
              to="/debts"
              active={location.pathname === "/debts"}
              theme={theme}
            />

            <SidebarItem
              icon={<FaTruck />}
              text="Suppliers"
              to="/suppliers"
              active={location.pathname === "/suppliers"}
              theme={theme}
            />

            <SidebarItem
              icon={<FaClipboardList />}
              text="POS Billing"
              to="/pos"
              active={location.pathname === "/pos"}
              theme={theme}
            />

            <SidebarItem
              icon={<FaFileInvoiceDollar />}
              text="Supplier Payables"
              to="/supplier-payables"
              active={location.pathname === "/supplier-payables"}
              theme={theme}
            />

            <SidebarItem
              icon={<FaChartBar />}
              text="Analytics"
              to="/analytics"
              active={location.pathname === "/analytics"}
              theme={theme}
            />

            <SidebarItem
              icon={<FaHistory />}
              text="Sales History"
              to="/sales-history"
              active={location.pathname === "/sales-history"}
              theme={theme}
            />

            <SidebarItem
              icon={<FaExchangeAlt />}
              text="Transactions"
              to="/transactions"
              active={location.pathname === "/transactions"}
              theme={theme}
            />

            <SidebarItem
              icon={<FaCoins />}
              text="Expenses"
              to="/expenses"
              active={location.pathname === "/expenses"}
              theme={theme}
            />

            <SidebarItem
              icon={<FaUndo />}
              text="Returns"
              to="/returns"
              active={location.pathname === "/returns"}
              theme={theme}
            />

            <SidebarItem
              icon={<FaReceipt />}
              text="Daily Report"
              to="/daily-report"
              active={location.pathname === "/daily-report"}
              theme={theme}
            />
          </div>
        </div>

        {/* Bottom */}
        <div
          className={`pt-4 border-t ${theme === "dark"
              ? "border-slate-800/80"
              : "border-slate-200"
            }`}
        >
          {/* User Card + Theme Toggle */}
          <div
            className={`rounded-xl p-4 mb-3 border flex items-center justify-between transition-all ${theme === "dark"
                ? "bg-[#111827] border-slate-800/60"
                : "bg-slate-50 border-slate-200"
              }`}
          >
            <div>
              <p
                className={`font-semibold text-sm ${theme === "dark"
                    ? "text-slate-200"
                    : "text-slate-900"
                  }`}
              >
                {user?.name}
              </p>

              <p className="text-indigo-500 text-xs font-medium mt-0.5 tracking-wider uppercase">
                {user?.role}
              </p>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer ${theme === "dark"
                  ? "bg-slate-800 text-yellow-400 hover:bg-slate-700"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
            >
              {theme === "dark" ? <FaSun /> : <FaMoon />}
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full bg-slate-800/10 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-slate-500 hover:text-rose-500 py-2.5 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 text-sm font-medium cursor-pointer"
          >
            <FaSignOutAlt className="text-xs" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto h-screen">
        <div className="max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
};

const SidebarItem = ({
  icon,
  text,
  to,
  active,
  theme,
}) => {
  return (
    <Link to={to} className="block">
      <button
        className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${active
            ? "bg-indigo-600/10 text-indigo-500 border border-indigo-500/20"
            : theme === "dark"
              ? "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
          }`}
      >
        <span className="text-base shrink-0">{icon}</span>
        <span>{text}</span>
      </button>
    </Link>
  );
};

export default DashboardLayout;