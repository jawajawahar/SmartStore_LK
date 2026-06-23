import { useEffect, useState } from "react";
import { FaFileInvoice } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/purchase-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error("Failed to load purchase orders:", error);
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-main">Purchase Orders</h1>
        <p className="text-text-secondary text-sm mt-1">
          Trace automated low-stock reorder loops, email delivery status, and supplier confirmation arrivals
        </p>
      </div>

      {/* Content Card */}
      <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center">
              <FaFileInvoice className="text-indigo-500 text-sm" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-main">Automated Purchase Orders (POs)</h2>
              <p className="text-text-secondary text-[11px] mt-0.5">
                {purchaseOrders.length} order{purchaseOrders.length !== 1 ? "s" : ""} total
              </p>
            </div>
          </div>
          <button
            onClick={fetchPurchaseOrders}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 shadow-md shadow-indigo-600/10"
          >
            {loading ? "Refreshing..." : "Refresh Orders"}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 py-6">
            <div className="h-6 bg-border-color/20 animate-pulse rounded" />
            <div className="h-20 bg-border-color/10 animate-pulse rounded" />
            <div className="h-20 bg-border-color/10 animate-pulse rounded" />
            <div className="h-20 bg-border-color/10 animate-pulse rounded" />
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div className="text-center py-16">
            <FaFileInvoice className="text-4xl text-text-secondary/20 mx-auto mb-3" />
            <p className="text-text-secondary text-sm">No purchase orders dispatched yet.</p>
            <p className="text-text-secondary/60 text-xs mt-1">Orders are automatically created when products fall below their minimum stock level.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-color text-text-secondary font-semibold">
                  <th className="py-3 pr-4 uppercase tracking-wider">PO Ref</th>
                  <th className="py-3 pr-4 uppercase tracking-wider">Product Name</th>
                  <th className="py-3 pr-4 uppercase tracking-wider">Qty Order</th>
                  <th className="py-3 pr-4 uppercase tracking-wider">Total Price</th>
                  <th className="py-3 pr-4 uppercase tracking-wider">Supplier</th>
                  <th className="py-3 pr-4 uppercase tracking-wider">Status</th>
                  <th className="py-3 pr-4 uppercase tracking-wider text-center">PDF Doc</th>
                  <th className="py-3 uppercase tracking-wider text-right">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/50">
                {purchaseOrders
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map((po) => {
                  let statusColor = "bg-slate-500/10 text-slate-500 border border-slate-500/10";
                  if (po.status === "completed") statusColor = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15";
                  if (po.status === "shipped") statusColor = "bg-blue-500/10 text-blue-500 border border-blue-500/15";
                  if (po.status === "pending") statusColor = "bg-indigo-500/10 text-indigo-500 border border-indigo-500/15";

                  return (
                    <tr key={po._id} className="hover:bg-bg-main/40 transition-colors">
                      <td className="py-3.5 pr-4 font-semibold text-text-main font-mono">
                        #PO-{po._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold text-text-main">{po.productName}</div>
                        <div className="text-[10px] text-text-secondary mt-0.5 tracking-wider font-mono">SKU: {po.sku || "N/A"}</div>
                      </td>
                      <td className="py-3.5 pr-4 text-text-main font-semibold">
                        {po.quantity} pcs
                      </td>
                      <td className="py-3.5 pr-4 text-emerald-500 font-bold">
                        Rs. {po.totalPrice.toLocaleString()}
                      </td>
                      <td className="py-3.5 pr-4 text-text-secondary">
                        <div className="font-semibold text-text-main">{po.supplier?.name || "—"}</div>
                        <div className="text-[10px] mt-0.5">{po.supplier?.email || ""}</div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusColor}`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-center">
                        {po.pdfPath ? (
                          <a
                            href={`http://localhost:5000${po.pdfPath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 bg-indigo-500/15 text-indigo-500 hover:bg-indigo-600 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                          >
                            View PO PDF
                          </a>
                        ) : (
                          <span className="text-text-secondary/50">—</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right text-text-secondary">
                        <div>{new Date(po.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] mt-0.5 text-text-secondary/70">{new Date(po.createdAt).toLocaleTimeString()}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {purchaseOrders.length > ITEMS_PER_PAGE && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(purchaseOrders.length / ITEMS_PER_PAGE)}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default PurchaseOrders;
