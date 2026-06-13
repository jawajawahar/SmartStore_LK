import {
  FaBox,
  FaClipboardList,
  FaMoneyBillWave,
  FaTriangleExclamation,
  FaUsers,
  FaPlus,
  FaCartShopping,
  FaWhatsapp,
  FaEnvelope,
} from "react-icons/fa6";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);

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

  // Fetch Low Stock Products
  const fetchLowStockCount = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await API.get("/analytics/low-stock", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLowStockProducts(response.data);
    } catch (error) {
      console.log("Error fetching low stock products:", error);
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
          <div className="text-text-secondary font-medium animate-pulse">Loading dashboard metrics...</div>
        </div>
      </DashboardLayout>
    );
  }

  const formatWhatsAppLink = (product) => {
    if (!product.supplier || !product.supplier.phone) return "#";
    const phone = product.supplier.phone.replace(/[^0-9]/g, ""); // clean non-digits
    const company = product.supplier.company || product.supplier.name;
    const message = `Hi ${company}, we need a restock of ${product.name} (SKU: ${product.sku || "N/A"}). Current stock: ${product.stock} ${product.unit || "pcs"} (Safety Threshold: ${product.minStockLevel || 5} ${product.unit || "pcs"}). Please arrange for a batch delivery. Thank you!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // KPI Cards
  const cards = [
    {
      title: "Revenue",
      value: `Rs. ${Number(dashboard.totalRevenue).toLocaleString()}`,
      icon: <FaMoneyBillWave />,
      iconBg: "bg-emerald-500/10 text-emerald-500",
    },
    {
      title: "Sales",
      value: dashboard.totalSales,
      icon: <FaCartShopping />,
      iconBg: "bg-indigo-500/10 text-indigo-500",
    },
    {
      title: "Pending Amount",
      value: `Rs. ${Number(dashboard.pendingAmount).toLocaleString()}`,
      icon: <FaClipboardList />,
      iconBg: "bg-amber-500/10 text-amber-500",
    },
    {
      title: "Products",
      value: dashboard.totalProducts,
      icon: <FaBox />,
      iconBg: "bg-purple-500/10 text-purple-500",
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">
            SmartStore LK Business Command Center
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-bg-card border border-border-color rounded-xl p-5 hover:border-indigo-500/30 transition-all duration-200 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">{card.title}</p>
                <h2 className="text-2xl font-extrabold text-text-main mt-2.5 tracking-tight">
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
          <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-text-main tracking-tight">
                Quick Actions
              </h2>
              <p className="text-text-secondary text-xs mt-0.5">
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
          <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-text-main tracking-tight">
                Recent Transactions
              </h2>
              <p className="text-text-secondary text-xs mt-0.5">
                Latest billing ledger activities
              </p>
            </div>

            <div className="space-y-3">
              {dashboard.recentTransactions && dashboard.recentTransactions.length > 0 ? (
                dashboard.recentTransactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="bg-bg-main/30 border border-border-color/60 hover:border-border-color rounded-xl px-5 py-3.5 flex items-center justify-between transition-colors duration-150"
                  >
                    <div>
                      <h3 className="text-text-main text-sm font-semibold">
                        {transaction.title}
                      </h3>
                      <p className="text-text-secondary text-xs mt-0.5 font-medium">
                        {transaction.personName}
                      </p>
                    </div>

                    <div
                      className={`text-sm font-bold ${transaction.flow === "income"
                        ? "text-emerald-500"
                        : "text-rose-500"
                        }`}
                    >
                      {transaction.flow === "income" ? "+" : "-"}
                      Rs. {Number(transaction.amount).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-text-secondary text-sm text-center py-4">No recent transactions.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Business Health */}
          <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-text-main mb-5 tracking-tight">
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
          <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center text-sm">
                <FaTriangleExclamation />
              </div>

              <div>
                <h2 className="text-lg font-bold text-text-main tracking-tight">Alerts</h2>
                <p className="text-text-secondary text-xs mt-0.5">Requires store attention</p>
              </div>
            </div>

            <div className="space-y-3">
              {lowStockProducts.length > 0 && (
                <div className="space-y-3 mb-4">
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-text-main text-xs font-semibold">Low Stock Products</h3>
                      <p className="text-text-secondary text-[10px] mt-0.5 font-medium">Reorder needed</p>
                    </div>
                    <div className="text-amber-550 text-amber-500 font-bold text-sm">{lowStockProducts.length} items</div>
                  </div>

                  {/* Scrollable Low Stock Products List */}
                  <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                    {lowStockProducts.map((product) => (
                      <div
                        key={product._id}
                        className="bg-bg-main/40 border border-border-color/60 hover:border-amber-500/20 rounded-xl p-3 flex flex-col gap-2 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-text-main text-xs font-bold tracking-tight">
                              {product.name}
                            </h4>
                            <p className="text-text-secondary text-[10px] font-medium mt-0.5">
                              SKU: {product.sku || "N/A"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-500">
                              {product.stock} / {product.minStockLevel} {product.unit || "pcs"}
                            </span>
                          </div>
                        </div>

                        {/* Supplier Info & Email Alert status */}
                        <div className="flex flex-col gap-1 text-[10px] text-text-secondary font-medium">
                          {product.supplier ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-text-main font-semibold">Supplier:</span>{" "}
                              {product.supplier.company || product.supplier.name}
                            </div>
                          ) : (
                            <div className="text-rose-500 font-semibold flex items-center gap-1">
                              <span>No supplier linked</span>
                            </div>
                          )}

                          {product.lastRestockAlertSent ? (
                            <div className="flex items-center gap-1.5 text-emerald-500/90 font-semibold">
                              <FaEnvelope className="text-[9px]" />
                              <span>Email alert: {new Date(product.lastRestockAlertSent).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-text-secondary/70">
                              <FaEnvelope className="text-[9px]" />
                              <span>No email sent yet</span>
                            </div>
                          )}
                        </div>

                        {/* WhatsApp order trigger */}
                        {product.supplier && product.supplier.phone && (
                          <a
                            href={formatWhatsAppLink(product)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold tracking-wide uppercase transition-all duration-200 border border-emerald-500/10 hover:border-emerald-500/30"
                          >
                            <FaWhatsapp className="text-xs" />
                            Reorder via WhatsApp
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
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
      <div className="bg-bg-main/30 hover:bg-bg-main border border-border-color/60 hover:border-indigo-500/20 rounded-xl p-4.5 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-sm mb-3">
          {icon}
        </div>
        <p className="text-text-main font-semibold text-xs text-center">{label}</p>
      </div>
    </Link>
  );
};

// Info Card Component
const InfoCard = ({ title, value }) => {
  return (
    <div className="bg-bg-main/30 border border-border-color/60 rounded-xl px-4 py-3 flex items-center justify-between">
      <p className="text-text-secondary text-xs font-semibold">{title}</p>
      <h3 className="text-sm font-bold text-text-main">{value}</h3>
    </div>
  );
};

// Alert Card Component
const AlertCard = ({ title, value }) => {
  return (
    <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl px-4 py-3.5 flex items-center justify-between">
      <div>
        <h3 className="text-text-main text-xs font-semibold">{title}</h3>
        <p className="text-text-secondary text-[10px] mt-0.5 font-medium">Requires action</p>
      </div>
      <div className="text-rose-550 text-rose-500 font-bold text-sm">{value}</div>
    </div>
  );
};

export default Dashboard;
