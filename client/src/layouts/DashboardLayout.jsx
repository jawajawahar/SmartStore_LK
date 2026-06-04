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
} from "react-icons/fa";

import { useNavigate, useLocation, Link } from "react-router-dom";

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex text-slate-100 font-sans">
      {/* Sidebar */}
      <div className="w-[280px] bg-[#0b0f19] border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="mb-8 px-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-black shadow-lg shadow-indigo-600/30">
                S
              </span>
              SmartStore <span className="text-indigo-400 text-sm font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md">LK</span>
            </h1>
            <p className="text-slate-500 text-xs mt-1.5 font-medium tracking-wide uppercase">POS Platform</p>
          </div>

          {/* Menu */}
          <div className="space-y-1">
            <SidebarItem
              icon={<FaHome />}
              text="Dashboard"
              to="/dashboard"
              active={location.pathname === "/dashboard"}
            />
            <SidebarItem 
              icon={<FaBox />} 
              text="Products" 
              to="/products" 
              active={location.pathname === "/products"}
            />
            <SidebarItem 
              icon={<FaUsers />} 
              text="Customers" 
              to="/customers" 
              active={location.pathname === "/customers"}
            />
            <SidebarItem 
              icon={<FaMoneyBillWave />} 
              text="Debts" 
              to="/debts" 
              active={location.pathname === "/debts"}
            />
            <SidebarItem 
              icon={<FaTruck />} 
              text="Suppliers" 
              to="/suppliers" 
              active={location.pathname === "/suppliers"}
            />
            <SidebarItem
              icon={<FaClipboardList />}
              text="POS Billing"
              to="/pos"
              active={location.pathname === "/pos"}
            />
            <SidebarItem
              icon={<FaFileInvoiceDollar />}
              text="Supplier Payables"
              to="/supplier-payables"
              active={location.pathname === "/supplier-payables"}
            />
            <SidebarItem
              icon={<FaChartBar />}
              text="Analytics"
              to="/analytics"
              active={location.pathname === "/analytics"}
            />
            <SidebarItem
              icon={<FaHistory />}
              text="Sales History"
              to="/sales-history"
              active={location.pathname === "/sales-history"}
            />
            <SidebarItem
              icon={<FaExchangeAlt />}
              text="Transactions"
              to="/transactions"
              active={location.pathname === "/transactions"}
            />
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-4 border-t border-slate-800/80">
          {/* User Profile Card */}
          <div className="bg-[#111827] border border-slate-800/60 rounded-xl p-4 mb-3">
            <p className="font-semibold text-sm text-slate-200">{user?.name}</p>
            <p className="text-indigo-400 text-xs font-medium mt-0.5 tracking-wider uppercase">{user?.role}</p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full bg-slate-800/20 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-slate-400 hover:text-rose-400 py-2.5 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 text-sm font-medium cursor-pointer"
          >
            <FaSignOutAlt className="text-xs" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, text, to, active }) => {
  return (
    <Link to={to} className="block">
      <button 
        className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
          active 
            ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
            : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"
        }`}
      >
        <span className="text-base shrink-0">{icon}</span>
        <span>{text}</span>
      </button>
    </Link>
  );
};

export default DashboardLayout;

