import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  FaEye,
  FaPrint,
  FaTimes,
  FaMoneyBillWave,
  FaClock,
  FaBoxOpen,
} from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import PrintableInvoice from "../../components/PrintableInvoice";
import API from "../../services/api";

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const printRef = useRef();

  // Fetch Sales
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
      console.log(error);
    }
  };

  // Print
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "SmartStore-Invoice",
  });

  // Fetch Invoice Details
  const fetchInvoiceDetails = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const response = await API.get(`/invoices/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSelectedInvoice(response.data);
      setShowModal(true);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSales();
  }, []);

  // Search Filter
  const filteredSales = sales.filter((sale) => {
    const customer = sale.customer?.name || "Walk-in Customer";

    return customer.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Sales History</h1>
          <p className="text-slate-500 text-sm mt-1">
            Store billing logs, client invoices history, and payments timeline
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Filter invoice by customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#0b0f19] border border-slate-800 text-slate-200 placeholder-slate-500 px-5 py-2.5 rounded-xl outline-none w-full lg:w-[280px] text-sm focus:border-slate-700 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#111827]/60 border-b border-slate-800">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Invoice ID</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Customer</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Total</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Paid</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Remaining</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Payment</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-850">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale, index) => (
                  <tr
                    key={sale._id}
                    className="hover:bg-slate-800/25 transition-colors"
                  >
                    {/* Invoice */}
                    <td className="px-5 py-3.5 font-bold text-indigo-400 text-sm">
                      INV-{index + 1}
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-3.5 font-semibold text-slate-200 text-sm">
                      {sale.customer?.name || "Walk-in Customer"}
                    </td>

                    {/* Total */}
                    <td className="px-5 py-3.5 text-slate-300 text-sm font-medium">Rs. {Number(sale.totalAmount).toLocaleString()}</td>

                    {/* Paid */}
                    <td className="px-5 py-3.5 text-emerald-400 font-semibold text-sm">
                      Rs. {Number(sale.paidAmount).toLocaleString()}
                    </td>

                    {/* Remaining */}
                    <td className="px-5 py-3.5 text-rose-400 font-semibold text-sm">
                      Rs. {Number(sale.remainingAmount).toLocaleString()}
                    </td>

                    {/* Payment */}
                    <td className="px-5 py-3.5 text-xs">
                      <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        {sale.paymentMethod}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-sm">
                      <button
                        onClick={() => fetchInvoiceDetails(sale._id)}
                        className="w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-650 hover:bg-indigo-600 text-indigo-400 hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer"
                      >
                        <FaEye className="text-xs" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-slate-500 text-sm">No invoice registry matched searches.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative">
            {/* Scroll */}
            <div className="overflow-y-auto p-6 font-sans">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Invoice Details Lifecycle
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Logged transactions history and items list
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5">
                  {/* Print */}
                  <button
                    onClick={() => handlePrint()}
                    className="w-9 h-9 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <FaPrint className="text-sm" />
                  </button>

                  {/* Close */}
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {/* Customer */}
                <div className="bg-[#111827]/40 border border-slate-800/60 rounded-xl p-4.5">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs">
                      <FaMoneyBillWave />
                    </div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Customer</p>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 line-clamp-1">
                    {selectedInvoice.sale.customer?.name || "Walk-in Customer"}
                  </h3>
                </div>

                {/* Total */}
                <div className="bg-[#111827]/40 border border-slate-800/60 rounded-xl p-4.5">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs">
                      <FaMoneyBillWave />
                    </div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Amount</p>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Rs. {Number(selectedInvoice.sale.totalAmount).toLocaleString()}
                  </h3>
                </div>

                {/* Remaining */}
                <div className="bg-[#111827]/40 border border-slate-800/60 rounded-xl p-4.5">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 text-xs">
                      <FaClock />
                    </div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Remaining Balance</p>
                  </div>
                  <h3 className="text-base font-bold text-rose-400">
                    Rs. {Number(selectedInvoice.sale.remainingAmount).toLocaleString()}
                  </h3>
                </div>
              </div>

              {/* Products Grid */}
              <div className="bg-[#111827]/20 border border-slate-800/80 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 text-xs">
                    <FaBoxOpen />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">Purchased Items ({selectedInvoice.sale.items.length})</h3>
                </div>

                <div className="space-y-3">
                  {selectedInvoice.sale.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-[#111827]/50 border border-slate-800/40 rounded-xl p-4"
                    >
                      <div>
                        <h4 className="text-slate-200 font-semibold text-sm">{item.name}</h4>
                        <p className="text-slate-500 text-xs mt-0.5">
                          Quantity: {item.quantity}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-slate-550 text-slate-500 text-[10px]">Price</p>
                        <h4 className="font-bold text-indigo-400 text-sm">Rs. {Number(item.price).toLocaleString()}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Timeline */}
              <div className="bg-[#111827]/20 border border-slate-800/80 rounded-xl p-5">
                <h3 className="text-base font-bold text-white tracking-tight mb-4">Payment Transactions History</h3>

                <div className="space-y-3">
                  {selectedInvoice.transactions && selectedInvoice.transactions.length > 0 ? (
                    selectedInvoice.transactions.map((transaction) => (
                      <div
                        key={transaction._id}
                        className="bg-[#111827]/50 border border-slate-800/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div>
                          <h4 className="text-slate-200 font-semibold text-sm">
                            {transaction.title}
                          </h4>
                          <p className="text-slate-500 text-xs mt-1">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <h4 className="text-base font-bold text-emerald-450 text-emerald-400">
                            + Rs. {Number(transaction.amount).toLocaleString()}
                          </h4>
                          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-0.5">
                            Method: {transaction.paymentMethod}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-xs py-2">No transaction timeline entries.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Invoice */}
      <div className="hidden">
        {selectedInvoice && (
          <PrintableInvoice ref={printRef} invoice={selectedInvoice} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default SalesHistory;

