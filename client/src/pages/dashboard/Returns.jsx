import { useEffect, useState } from "react";
import { FaTrash, FaUndo, FaSearch, FaShoppingBag, FaBoxOpen, FaHandHoldingUsd } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const Returns = () => {
  const { theme } = useTheme();
  const [returns, setReturns] = useState([]);
  const [sales, setSales] = useState([]);
  const [searchSale, setSearchSale] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState({}); // { product_id: quantity_to_return }
  const [reason, setReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch Returns History
  const fetchReturns = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/returns", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReturns(response.data);
    } catch (error) {
      console.error("Error fetching returns:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch Sales for search
  const fetchSales = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/sales", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSales(response.data);
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  };

  useEffect(() => {
    fetchReturns();
    fetchSales();
  }, []);

  // Select Sale to return items from
  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    setReason("");
    // Initialize return quantities to 0
    const initialQty = {};
    sale.items.forEach(item => {
      initialQty[item.product] = 0;
    });
    setReturnItems(initialQty);
    setRefundAmount(0);
  };

  // Handle quantity change
  const handleQtyChange = (productId, qty, price, maxQty) => {
    const parsedQty = Math.max(0, Math.min(maxQty, Number(qty)));
    const updatedReturnItems = {
      ...returnItems,
      [productId]: parsedQty
    };
    setReturnItems(updatedReturnItems);

    // Recalculate refund amount (auto-suggest total return value)
    let totalRefund = 0;
    selectedSale.items.forEach(item => {
      const returnQty = updatedReturnItems[item.product] || 0;
      totalRefund += returnQty * item.price;
    });
    setRefundAmount(totalRefund);
  };

  // Submit Return
  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!selectedSale) return;

    // Filter out items with 0 return quantity
    const itemsToReturn = selectedSale.items
      .filter(item => (returnItems[item.product] || 0) > 0)
      .map(item => ({
        product: item.product,
        name: item.name,
        quantity: returnItems[item.product],
        price: item.price,
        total: returnItems[item.product] * item.price
      }));

    if (itemsToReturn.length === 0) {
      alert("Please select at least one item and quantity to return");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const returnData = {
        originalSaleId: selectedSale._id,
        items: itemsToReturn,
        reason,
        refundAmount: Number(refundAmount)
      };

      await API.post("/returns", returnData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Return Processed Successfully & Stock Restocked!");
      setSelectedSale(null);
      setReturnItems({});
      setReason("");
      setRefundAmount(0);
      fetchReturns();
      fetchSales(); // Refresh stock details & sales list
    } catch (error) {
      console.error("Error creating return:", error);
      alert(error.response?.data?.message || "Failed to process return");
    } finally {
      setLoading(false);
    }
  };

  // Filter Sales list based on search (ID, Customer name or total)
  const filteredSales = sales.filter((sale) => {
    const custName = sale.customer?.name || "Walk-in Customer";
    const idMatches = sale._id.toLowerCase().includes(searchSale.toLowerCase());
    const custMatches = custName.toLowerCase().includes(searchSale.toLowerCase());
    return (idMatches || custMatches) && searchSale !== "";
  });

  const isDark = theme === "dark";

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Returns & Refunds</h1>
        <p className="text-slate-500 text-sm mt-1">
          Process customer returns, restock inventory items, and issue cash refunds
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* Step 1: Find Sale & Process Return Form */}
        <div className={`xl:col-span-2 border rounded-xl p-6 transition-all ${isDark ? "bg-[#0b0f19] border-slate-800" : "bg-white border-slate-200"}`}>
          <h2 className={`text-lg font-bold mb-4 tracking-tight flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            <span className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs">1</span>
            Select Original Invoice / Sale
          </h2>

          {/* Search bar */}
          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <FaSearch className="text-sm" />
            </span>
            <input
              type="text"
              placeholder="Search by Invoice ID or Customer Name..."
              value={searchSale}
              onChange={(e) => setSearchSale(e.target.value)}
              className={`w-full border pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm ${
                isDark ? "bg-[#111827] border-slate-800 text-slate-200 focus:border-slate-700" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-350"
              }`}
            />
            
            {/* Search results dropdown */}
            {searchSale && filteredSales.length > 0 && (
              <div className={`absolute left-0 right-0 mt-2 border rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto ${
                isDark ? "bg-[#111827] border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-900"
              }`}>
                {filteredSales.map((sale) => (
                  <button
                    key={sale._id}
                    onClick={() => {
                      handleSelectSale(sale);
                      setSearchSale("");
                    }}
                    className={`w-full text-left px-4 py-3 text-xs flex justify-between items-center transition-all ${
                      isDark ? "hover:bg-slate-800/40 border-b border-slate-800/60" : "hover:bg-slate-50 border-b border-slate-100"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-indigo-400">Sale ID: {sale._id.slice(-6).toUpperCase()}</span>
                      <span className="mx-2 text-slate-500">|</span>
                      <span className="font-semibold">{sale.customer?.name || "Walk-in Customer"}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400">Rs. {sale.totalAmount.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 block">{new Date(sale.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchSale && filteredSales.length === 0 && (
              <div className={`absolute left-0 right-0 mt-2 p-4 border rounded-xl text-center text-xs text-slate-500 z-20 ${
                isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200"
              }`}>
                No matching sales found
              </div>
            )}
          </div>

          {/* Return items form (displays when a sale is selected) */}
          {selectedSale ? (
            <form onSubmit={handleSubmitReturn} className="space-y-6">
              <div className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                isDark ? "bg-[#111827]/40 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? "text-slate-250" : "text-slate-800"}`}>
                    Selected Sale: #{selectedSale._id.slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Customer: <span className="font-semibold text-slate-400">{selectedSale.customer?.name || "Walk-in Customer"}</span> | Date: {new Date(selectedSale.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Paid</span>
                    <span className="text-sm font-bold text-emerald-400">Rs. {selectedSale.paidAmount.toLocaleString()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSale(null)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-1 rounded border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>
              </div>

              {/* Items grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Select Items to Return</h4>
                {selectedSale.items.map((item) => (
                  <div key={item.product} className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all ${
                    isDark ? "bg-[#111827]/10 border-slate-800/60" : "bg-white border-slate-200"
                  }`}>
                    <div className="flex-1">
                      <h5 className={`font-semibold text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.name}</h5>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>Sold: {item.quantity} units</span>
                        <span>•</span>
                        <span>Price: Rs. {item.price.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Qty to return input */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">Return Qty:</label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={returnItems[item.product] || 0}
                          onChange={(e) => handleQtyChange(item.product, e.target.value, item.price, item.quantity)}
                          className={`w-20 border px-3 py-1.5 rounded-lg outline-none text-xs text-center font-bold ${
                            isDark ? "bg-[#111827] border-slate-800 text-white focus:border-slate-700" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-350"
                          }`}
                        />
                      </div>
                      
                      <div className="text-right w-24">
                        <span className="text-[10px] text-slate-500 block">Total return</span>
                        <span className={`text-xs font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                          Rs. {((returnItems[item.product] || 0) * item.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Refund Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/60">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Reason for Return</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="E.g., defective product, customer changed mind..."
                    required
                    rows="3"
                    className={`w-full border px-4 py-2.5 rounded-xl outline-none text-sm transition-all ${
                      isDark ? "bg-[#111827] border-slate-800 text-slate-100 focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                    }`}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Refund Amount (Rs.)</label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      placeholder="0.00"
                      required
                      className={`w-full border px-4 py-2.5 rounded-xl outline-none text-sm font-bold transition-all ${
                        isDark ? "bg-[#111827] border-slate-800 text-slate-100 focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                      }`}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Suggested refund amount is calculated based on returned items. You can edit this.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800/40 text-white py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-rose-600/10 cursor-pointer"
                  >
                    <FaUndo className="text-xs" /> {loading ? "Processing..." : "Process Return & Restock"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className={`p-8 border border-dashed rounded-xl text-center text-slate-500 text-sm ${
              isDark ? "border-slate-800" : "border-slate-200"
            }`}>
              Search and select a sale above to list its items and start returns.
            </div>
          )}
        </div>

        {/* Return History list */}
        <div className="xl:col-span-1">
          <div className={`border rounded-xl p-6 h-fit transition-all ${isDark ? "bg-[#0b0f19] border-slate-800" : "bg-white border-slate-200"}`}>
            <h2 className={`text-lg font-bold mb-4 tracking-tight flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              <FaUndo className="text-sm text-indigo-400" />
              Returns Registry
            </h2>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {historyLoading ? (
                <div className="text-center py-6 text-slate-500 text-xs">Loading return records...</div>
              ) : returns.length > 0 ? (
                returns.map((ret) => (
                  <div key={ret._id} className={`p-4 border rounded-xl space-y-3 text-xs ${
                    isDark ? "bg-[#111827]/40 border-slate-800/60" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-indigo-400">ID: {ret._id.slice(-6).toUpperCase()}</span>
                      <span className="text-slate-500">{new Date(ret.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Original Sale</p>
                      <p className="font-semibold text-slate-350">{ret.originalSale ? `#${ret.originalSale._id.slice(-6).toUpperCase()}` : "N/A"}</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Returned Items</p>
                      <ul className="list-disc list-inside mt-0.5 text-slate-400 space-y-0.5">
                        {ret.items.map((item, idx) => (
                          <li key={idx}>
                            {item.name} x {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Refund Cash Amount</p>
                      <p className="font-bold text-rose-500">Rs. {ret.refundAmount.toLocaleString()}</p>
                    </div>

                    {ret.reason && (
                      <div className={`p-2 rounded mt-1 ${isDark ? "bg-[#111827] text-slate-400" : "bg-white border text-slate-600"}`}>
                        <span className="font-semibold text-[10px] block text-slate-500">REASON:</span>
                        {ret.reason}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-550 text-slate-500 text-xs">No return records registered.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Returns;
