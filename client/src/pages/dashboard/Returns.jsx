import { useEffect, useState } from "react";
import { FaTrash, FaUndo, FaSearch, FaShoppingBag, FaBoxOpen, FaHandHoldingUsd } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { toast } from "react-toastify";

const Returns = () => {
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
      toast.error("Failed to load returns registry");
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
      toast.warning("Please select at least one item and quantity to return");
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

      toast.success("Return processed successfully & product restocked!");
      setSelectedSale(null);
      setReturnItems({});
      setReason("");
      setRefundAmount(0);
      fetchReturns();
      fetchSales(); // Refresh stock details & sales list
    } catch (error) {
      console.error("Error creating return:", error);
      toast.error(error.response?.data?.message || "Failed to process return");
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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-main">Returns & Refunds</h1>
        <p className="text-text-secondary text-sm mt-1">
          Process customer returns, restock inventory items, and issue cash refunds
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* Step 1: Find Sale & Process Return Form */}
        <div className="xl:col-span-2 border border-border-color rounded-xl p-6 bg-bg-card shadow-sm">
          <h2 className="text-lg font-bold text-text-main mb-4 tracking-tight flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-black">1</span>
            Select Original Invoice / Sale
          </h2>

          {/* Search bar */}
          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary">
              <FaSearch className="text-xs" />
            </span>
            <input
              type="text"
              placeholder="Search by Invoice ID or Customer Name..."
              value={searchSale}
              onChange={(e) => setSearchSale(e.target.value)}
              className="w-full border border-border-color pl-10 pr-4 py-2.5 rounded-xl outline-none text-xs bg-bg-main text-text-main focus:border-indigo-500 placeholder:text-text-secondary/40"
            />
            
            {/* Search results dropdown */}
            {searchSale && filteredSales.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 border border-border-color rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto bg-bg-card text-text-main">
                {filteredSales.map((sale) => (
                  <button
                    key={sale._id}
                    onClick={() => {
                      handleSelectSale(sale);
                      setSearchSale("");
                    }}
                    className="w-full text-left px-4 py-3 text-xs flex justify-between items-center transition-all hover:bg-bg-main border-b border-border-color/60 cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-indigo-500">Sale ID: {sale._id.slice(-6).toUpperCase()}</span>
                      <span className="mx-2 text-text-secondary">|</span>
                      <span className="font-bold text-text-main">{sale.customer?.name || "Walk-in Customer"}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-500">Rs. {sale.totalAmount.toLocaleString()}</span>
                      <span className="text-[9px] text-text-secondary block mt-0.5">{new Date(sale.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchSale && filteredSales.length === 0 && (
              <div className="absolute left-0 right-0 mt-2 p-4 border border-border-color text-center text-xs text-text-secondary z-20 bg-bg-card rounded-xl">
                No matching sales found
              </div>
            )}
          </div>

          {/* Return items form (displays when a sale is selected) */}
          {selectedSale ? (
            <form onSubmit={handleSubmitReturn} className="space-y-6">
              <div className="p-4 border border-border-color rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-bg-main/40">
                <div>
                  <h3 className="text-xs font-bold text-text-main">
                    Selected Sale: #{selectedSale._id.slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-[10px] text-text-secondary mt-1 font-semibold">
                    Customer: <span className="text-text-main font-bold">{selectedSale.customer?.name || "Walk-in Customer"}</span> | Date: {new Date(selectedSale.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="text-right">
                    <span className="text-[9px] text-text-secondary block uppercase font-bold">Total Paid</span>
                    <span className="text-xs font-extrabold text-emerald-500">Rs. {selectedSale.paidAmount.toLocaleString()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSale(null)}
                    className="text-[10px] text-rose-500 hover:text-white font-bold px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500 uppercase tracking-wide cursor-pointer transition-all"
                  >
                    Deselect
                  </button>
                </div>
              </div>

              {/* Items grid */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Select Items to Return</h4>
                {selectedSale.items.map((item) => (
                  <div key={item.product} className="p-4 border border-border-color rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-bg-main/20">
                    <div className="flex-1">
                      <h5 className="font-bold text-xs text-text-main">{item.name}</h5>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-text-secondary font-semibold">
                        <span>Sold: {item.quantity} units</span>
                        <span>•</span>
                        <span>Price: Rs. {item.price.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Qty to return input */}
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-text-secondary font-bold uppercase">Return Qty:</label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={returnItems[item.product] || 0}
                          onChange={(e) => handleQtyChange(item.product, e.target.value, item.price, item.quantity)}
                          className="w-20 border border-border-color px-3 py-1.5 rounded-lg outline-none text-xs text-center font-bold bg-bg-card text-text-main focus:border-indigo-500"
                        />
                      </div>
                      
                      <div className="text-right w-24">
                        <span className="text-[9px] text-text-secondary block font-semibold">Total return</span>
                        <span className="text-xs font-black text-indigo-500">
                          Rs. {((returnItems[item.product] || 0) * item.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Refund Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border-color/60">
                <div>
                  <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Reason for Return</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="E.g., defective product, customer changed mind..."
                    required
                    rows="3"
                    className="w-full border border-border-color px-4 py-2.5 rounded-xl outline-none text-sm bg-bg-main text-text-main focus:border-indigo-500 placeholder:text-text-secondary/40"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Refund Amount (Rs.)</label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      placeholder="0.00"
                      required
                      className="w-full border border-border-color px-4 py-2.5 rounded-xl outline-none text-sm font-bold bg-bg-main text-text-main focus:border-indigo-500"
                    />
                    <p className="text-[10px] text-text-secondary mt-1 font-semibold">
                      Suggested refund amount is calculated based on returned items. You can edit this.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800/40 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-rose-600/15 cursor-pointer"
                  >
                    <FaUndo className="text-xs" /> {loading ? "Processing..." : "Process Return & Restock"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-10 border border-dashed rounded-xl border-border-color text-center text-text-secondary text-xs font-semibold bg-bg-main/10">
              Search and select an active sale above to list its items and start returns.
            </div>
          )}
        </div>

        {/* Return History list */}
        <div className="xl:col-span-1">
          <div className="border border-border-color rounded-xl p-6 h-fit bg-bg-card shadow-sm">
            <h2 className="text-lg font-bold text-text-main mb-4 tracking-tight flex items-center gap-2">
              <FaUndo className="text-sm text-indigo-500 animate-pulse" />
              Returns Registry
            </h2>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {historyLoading ? (
                <div className="text-center py-6 text-text-secondary text-xs">Loading return records...</div>
              ) : returns.length > 0 ? (
                returns.map((ret) => (
                  <div key={ret._id} className="p-4 border border-border-color rounded-xl space-y-3 text-xs bg-bg-main/40">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-indigo-500">ID: {ret._id.slice(-6).toUpperCase()}</span>
                      <span className="text-text-secondary text-[10px]">{new Date(ret.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div>
                      <p className="text-[9px] text-text-secondary uppercase font-bold">Original Sale</p>
                      <p className="font-bold text-text-main text-[11px] mt-0.5">{ret.originalSale ? `#${ret.originalSale._id.slice(-6).toUpperCase()}` : "N/A"}</p>
                    </div>

                    <div>
                      <p className="text-[9px] text-text-secondary uppercase font-bold">Returned Items</p>
                      <ul className="list-disc list-inside mt-0.5 text-text-main font-semibold space-y-0.5">
                        {ret.items.map((item, idx) => (
                          <li key={idx}>
                            {item.name} x {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[9px] text-text-secondary uppercase font-bold">Refund Cash Amount</p>
                      <p className="font-black text-rose-500 mt-0.5">Rs. {ret.refundAmount.toLocaleString()}</p>
                    </div>

                    {ret.reason && (
                      <div className="p-2.5 rounded-lg bg-bg-card border border-border-color text-text-secondary">
                        <span className="font-bold text-[8px] uppercase block mb-0.5">REASON:</span>
                        {ret.reason}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-text-secondary text-xs font-semibold">No return records registered.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Returns;
