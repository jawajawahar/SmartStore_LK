import {
  FaBox,
  FaClipboardList,
  FaMoneyBillWave,
  FaTriangleExclamation,
  FaUsers,
  FaPlus,
  FaCartShopping,
} from "react-icons/fa6";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Fetch Dashboard Analytics
  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await API.get("/analytics/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDashboard(response.data);
    } catch (error) {
      console.log("Error fetching dashboard metrics:", error);
    }
  };

  // Fetch Low Stock Count
  const fetchLowStockCount = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await API.get("/analytics/low-stock", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLowStockCount(response.data.length);
    } catch (error) {
      console.log("Error fetching low stock count:", error);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchLowStockCount();
  }, []);

  if (!dashboard) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-slate-400 font-medium animate-pulse">Loading dashboard metrics...</div>
        </div>
      </DashboardLayout>
    );
  }

  // KPI Cards
  const cards = [
    {
      title: "Revenue",
      value: `Rs. ${Number(dashboard.totalRevenue).toLocaleString()}`,
      icon: <FaMoneyBillWave />,
      iconBg: "bg-emerald-500/10 text-emerald-400",
    },
    {
      title: "Sales",
      value: dashboard.totalSales,
      icon: <FaCartShopping />,
      iconBg: "bg-indigo-500/10 text-indigo-400",
    },
    {
      title: "Pending Amount",
      value: `Rs. ${Number(dashboard.pendingAmount).toLocaleString()}`,
      icon: <FaClipboardList />,
      iconBg: "bg-amber-500/10 text-amber-400",
    },
    {
      title: "Products",
      value: dashboard.totalProducts,
      icon: <FaBox />,
      iconBg: "bg-purple-500/10 text-purple-400",
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            SmartStore LK Business Command Center
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/60 transition-colors duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{card.title}</p>
                <h2 className="text-2xl font-bold text-white mt-2.5 tracking-tight">
                  {card.value}
                </h2>
              </div>

              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center text-base ${card.iconBg}`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Quick Actions
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Fast business operations triggers
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickAction
                to="/pos"
                icon={<FaCartShopping />}
                label="New Sale"
              />
              <QuickAction
                to="/products"
                icon={<FaPlus />}
                label="Add Product"
              />
              <QuickAction
                to="/customers"
                icon={<FaUsers />}
                label="Add Customer"
              />
              <QuickAction to="/suppliers" icon={<FaBox />} label="Suppliers" />
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Recent Transactions
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Latest billing ledger activities
              </p>
            </div>

            <div className="space-y-3">
              {dashboard.recentTransactions && dashboard.recentTransactions.length > 0 ? (
                dashboard.recentTransactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="bg-[#111827]/40 border border-slate-800/40 hover:border-slate-800 rounded-xl px-5 py-3.5 flex items-center justify-between transition-colors duration-150"
                  >
                    <div>
                      <h3 className="text-slate-200 text-sm font-semibold">
                        {transaction.title}
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {transaction.personName}
                      </p>
                    </div>

                    <div
                      className={`text-sm font-bold ${transaction.flow === "income"
                        ? "text-emerald-400"
                        : "text-rose-400"
                        }`}
                    >
                      {transaction.flow === "income" ? "+" : "-"}
                      Rs. {Number(transaction.amount).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-sm text-center py-4">No recent transactions.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Business Health */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-5 tracking-tight">
              Business Health
            </h2>

            <div className="space-y-3">
              <InfoCard title="Active Customers" value={dashboard.totalCustomers} />
              <InfoCard
                title="Expenses Ledger"
                value={`Rs. ${Number(dashboard.totalExpenses || 0).toLocaleString()}`}
              />
              <InfoCard
                title="Supplier Payables"
                value={`Rs. ${Number(dashboard.totalPayables || 0).toLocaleString()}`}
              />
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center text-sm">
                <FaTriangleExclamation />
              </div>

              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Alerts</h2>
                <p className="text-slate-500 text-xs mt-0.5">Requires store attention</p>
              </div>
            </div>

            <div className="space-y-3">
              {lowStockCount > 0 && (
                <Link to="/products" className="block">
                  <div className="bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3.5 flex items-center justify-between transition-all cursor-pointer">
                    <div>
                      <h3 className="text-slate-200 text-xs font-semibold">Low Stock Products</h3>
                      <p className="text-slate-500 text-[10px] mt-0.5 font-medium">Reorder needed</p>
                    </div>
                    <div className="text-amber-400 font-bold text-sm">{lowStockCount} items</div>
                  </div>
                </Link>
              )}
              <AlertCard
                title="Pending Debts Collection"
                value={`Rs. ${Number(dashboard.pendingAmount || 0).toLocaleString()}`}
              />
              <AlertCard
                title="Supplier Payables"
                value={`Rs. ${Number(dashboard.totalPayables || 0).toLocaleString()}`}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Quick Action Item Component
const QuickAction = ({ to, icon, label }) => {
  return (
    <Link to={to} className="block">
      <div className="bg-[#111827]/40 hover:bg-[#111827] border border-slate-800/60 hover:border-indigo-500/30 rounded-xl p-4.5 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-sm mb-3">
          {icon}
        </div>
        <p className="text-slate-300 font-semibold text-xs text-center">{label}</p>
      </div>
    </Link>
  );
};

// Info Card Component
const InfoCard = ({ title, value }) => {
  return (
    <div className="bg-[#111827]/40 border border-slate-800/40 rounded-xl px-4 py-3 flex items-center justify-between">
      <p className="text-slate-400 text-xs font-medium">{title}</p>
      <h3 className="text-sm font-bold text-white">{value}</h3>
    </div>
  );
};

// Alert Card Component
const AlertCard = ({ title, value }) => {
  return (
    <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl px-4 py-3.5 flex items-center justify-between">
      <div>
        <h3 className="text-slate-200 text-xs font-semibold">{title}</h3>
        <p className="text-slate-500 text-[10px] mt-0.5 font-medium">Requires action</p>
      </div>
      <div className="text-rose-400 font-bold text-sm">{value}</div>
    </div>
  );
};

export default Dashboard;
