import {
  FaArrowTrendUp,
  FaBox,
  FaChartPie,
  FaClipboardList,
  FaMoneyBillWave,
} from "react-icons/fa6";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";

const COLORS = ["#6366f1", "#f43f5e"];

const Analytics = () => {
  const [dashboard, setDashboard] = useState({
    topProducts: [],
    salesOverview: [],
  });

  // Fetch Analytics
  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await API.get("/analytics/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDashboard(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnalytics();
  }, []);

  // Profit
  const profit = (dashboard.totalPaid || 0) - (dashboard.totalExpenses || 0);

  // Pie Data
  const financeData = [
    {
      name: "Income",
      value: dashboard.totalPaid || 0,
    },
    {
      name: "Expenses",
      value: dashboard.totalExpenses || 0,
    },
  ];

  // KPI Cards
  const cards = [
    {
      title: "Total Revenue",
      value: `Rs. ${Number(dashboard.totalRevenue || 0).toLocaleString()}`,
      icon: <FaMoneyBillWave />,
      iconBg: "bg-emerald-500/10 text-emerald-400",
    },
    {
      title: "Net Profit",
      value: `Rs. ${Number(profit || 0).toLocaleString()}`,
      icon: <FaArrowTrendUp />,
      iconBg: "bg-indigo-500/10 text-indigo-400",
    },
    {
      title: "Total Expenses",
      value: `Rs. ${Number(dashboard.totalExpenses || 0).toLocaleString()}`,
      icon: <FaChartPie />,
      iconBg: "bg-rose-500/10 text-rose-400",
    },
    {
      title: "Pending Debts",
      value: `Rs. ${Number(dashboard.pendingAmount || 0).toLocaleString()}`,
      icon: <FaClipboardList />,
      iconBg: "bg-amber-500/10 text-amber-400",
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">
          SmartStore LK Business Intelligence Center
        </p>
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-white tracking-tight">Revenue Trend</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Daily store revenue analytics
            </p>
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.salesOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(243, 244, 246, 0.05)" />

                <XAxis dataKey="date" stroke="#4b5563" fontSize={11} tickLine={false} />

                <YAxis stroke="#4b5563" fontSize={11} tickLine={false} />

                <Tooltip 
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1f2937",
                    borderRadius: "12px",
                    color: "#f3f4f6",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)"
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Finance Breakdown */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Finance Breakdown
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">Income vs expenses</p>
          </div>

          <div className="h-[320px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={financeData} 
                  dataKey="value" 
                  outerRadius={90} 
                  innerRadius={50}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {financeData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="#0b0f19" strokeWidth={2} />
                  ))}
                </Pie>

                <Tooltip 
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1f2937",
                    borderRadius: "12px",
                    color: "#f3f4f6",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Best Products */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6">
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-sm">
              <FaBox />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Best Selling Products
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">High velocity store inventory</p>
            </div>
          </div>

          <div className="space-y-3">
            {dashboard.topProducts && dashboard.topProducts.length > 0 ? (
              dashboard.topProducts.map((product, index) => (
                <div
                  key={index}
                  className="bg-[#111827]/40 border border-slate-800/40 rounded-xl px-5 py-3.5 flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-slate-200 text-sm font-semibold">{product.name}</h3>
                    <p className="text-slate-500 text-[10px] mt-0.5 uppercase tracking-wider font-semibold">Store Stock Item</p>
                  </div>

                  <div className="text-lg font-bold text-indigo-400">
                    {product.totalSold} <span className="text-slate-500 text-xs font-normal">sold</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-sm text-center py-4">No data available.</div>
            )}
          </div>
        </div>

        {/* Financial Health */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-5 tracking-tight">
            Financial Health
          </h2>

          <div className="space-y-3">
            <HealthCard
              title="Net Balance"
              value={`Rs. ${Number(profit || 0).toLocaleString()}`}
              color="text-emerald-400"
            />
            <HealthCard
              title="Pending Collection"
              value={`Rs. ${Number(dashboard.pendingAmount || 0).toLocaleString()}`}
              color="text-amber-400"
            />
            <HealthCard
              title="Supplier Payables"
              value={`Rs. ${Number(dashboard.totalPayables || 0).toLocaleString()}`}
              color="text-rose-400"
            />
            <HealthCard
              title="Registered Customers"
              value={dashboard.totalCustomers || 0}
              color="text-indigo-400"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Health Card Component
const HealthCard = ({ title, value, color }) => {
  return (
    <div className="bg-[#111827]/40 border border-slate-800/40 rounded-xl px-5 py-3.5 flex items-center justify-between">
      <p className="text-slate-400 text-xs font-semibold">{title}</p>
      <h3 className={`text-sm font-bold ${color}`}>{value}</h3>
    </div>
  );
};

export default Analytics;

