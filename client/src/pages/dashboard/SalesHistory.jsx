import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  FaEye,
  FaPrint,
  FaTimes,
  FaMoneyBillWave,
  FaClock,
  FaBoxOpen,
  FaQrcode,
} from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import PrintableInvoice from "../../components/PrintableInvoice";
import API from "../../services/api";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import QRCodeCanvas from "../../components/QRCodeCanvas";
import ProductPassportModal from "../../components/ProductPassportModal";

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Product Passport States
  const [passportProduct, setPassportProduct] = useState(null);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const itemsPerPage = 10;

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
      toast.error("Failed to load invoice history logs");
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
      toast.error("Failed to load invoice details");
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Search Filter
  const filteredSales = sales.filter((sale) => {
    const customer = sale.customer?.name || "Walk-in Customer";
    return customer.toLowerCase().includes(search.toLowerCase());
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const getSalesHistoryInvoiceQrText = () => {
    if (!selectedInvoice) return "";
    const invoiceNo = selectedInvoice.sale._id ? selectedInvoice.sale._id.toString().slice(-6).toUpperCase() : "TEMP";
    const dateStr = new Date(selectedInvoice.sale.createdAt).toLocaleString();
    const customerName = selectedInvoice.sale.customer?.name || "Walk-in Customer";
    
    const itemsText = selectedInvoice.sale.items
      .map((item, index) => 
        `${index + 1}. ${item.name} - ${item.quantity} x Rs. ${Number(item.price).toLocaleString()} = Rs. ${Number(item.total).toLocaleString()}`
      )
      .join("\n");

    return `SmartStore LK Receipt
Invoice: #INV-${invoiceNo}
Date: ${dateStr}
Customer: ${customerName}
--------------------------
${itemsText}
--------------------------
Total Paid: Rs. ${Number(selectedInvoice.sale.paidAmount).toLocaleString()}
Remaining: Rs. ${Number(selectedInvoice.sale.remainingAmount).toLocaleString()}
Method: ${selectedInvoice.sale.paymentMethod}
Status: Verified Purchase`;
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main font-sans">Sales History</h1>
          <p className="text-text-secondary text-sm mt-1">
            Store billing logs, client invoices history, and payments timeline
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Filter invoices by customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-bg-card border border-border-color text-text-main placeholder-text-secondary/40 px-5 py-2.5 rounded-xl outline-none w-full lg:w-[280px] text-xs focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-bg-card border border-border-color rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-main/60 border-b border-border-color">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Invoice ID</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Customer</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Total</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Paid</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Remaining</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Payment</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Cashier</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-color/60">
              {currentSales.length > 0 ? (
                currentSales.map((sale, index) => {
                  const actualIndex = indexOfFirstItem + index;
                  return (
                    <tr
                      key={sale._id}
                      className="hover:bg-bg-main/30 transition-colors"
                    >
                      {/* Invoice */}
                      <td className="px-5 py-3.5 font-bold text-indigo-555 text-indigo-550 text-indigo-500 text-xs">
                        INV-{actualIndex + 1}
                      </td>

                    {/* Customer */}
                    <td className="px-5 py-3.5 font-bold text-text-main text-xs animate-none">
                      {sale.customer?.name || "Walk-in Customer"}
                    </td>

                    {/* Total */}
                    <td className="px-5 py-3.5 text-text-main text-xs font-semibold">Rs. {Number(sale.totalAmount).toLocaleString()}</td>

                    {/* Paid */}
                    <td className="px-5 py-3.5 text-emerald-500 font-bold text-xs">
                      Rs. {Number(sale.paidAmount).toLocaleString()}
                    </td>

                    {/* Remaining */}
                    <td className="px-5 py-3.5 text-rose-505 text-rose-500 font-bold text-xs">
                      Rs. {Number(sale.remainingAmount).toLocaleString()}
                    </td>

                    {/* Payment */}
                    <td className="px-5 py-3.5 text-xs">
                      <span className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-[9px]">
                        {sale.paymentMethod}
                      </span>
                    </td>

                    {/* Cashier */}
                    <td className="px-5 py-3.5 text-text-secondary text-xs font-semibold">
                      {sale.user?.name || "System"}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-text-secondary text-xs font-medium">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-xs">
                      <button
                        onClick={() => fetchInvoiceDetails(sale._id)}
                        className="w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-650 hover:bg-indigo-600 text-indigo-500 hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer"
                      >
                        <FaEye className="text-xs" />
                      </button>
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-text-secondary text-xs">No invoice records matched search query.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Invoice Modal */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-border-color rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative text-text-main">
            {/* Scroll */}
            <div className="overflow-y-auto p-6 font-sans">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-border-color/60">
                <div>
                  <h2 className="text-xl font-bold text-text-main tracking-tight">
                    Invoice Details Lifecycle
                  </h2>
                  <p className="text-text-secondary text-xs mt-0.5">
                    Logged transactions history and items list
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5">
                  {/* Print */}
                  <button
                    onClick={() => handlePrint()}
                    className="w-9 h-9 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-500 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs border border-emerald-500/20"
                  >
                    <FaPrint className="text-sm" />
                  </button>

                  {/* Close */}
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-9 h-9 rounded-lg bg-bg-main hover:bg-border-color text-text-secondary hover:text-text-main flex items-center justify-center transition-all cursor-pointer border border-border-color"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {/* Customer */}
                <div className="bg-bg-main/40 border border-border-color/60 rounded-xl p-4.5">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-xs">
                      <FaMoneyBillWave />
                    </div>
                    <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Customer</p>
                  </div>
                  <h3 className="text-xs font-bold text-text-main line-clamp-1">
                    {selectedInvoice.sale.customer?.name || "Walk-in Customer"}
                  </h3>
                </div>

                {/* Total */}
                <div className="bg-bg-main/40 border border-border-color/60 rounded-xl p-4.5">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs">
                      <FaMoneyBillWave />
                    </div>
                    <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Total Amount</p>
                  </div>
                  <h3 className="text-sm font-extrabold text-text-main">
                    Rs. {Number(selectedInvoice.sale.totalAmount).toLocaleString()}
                  </h3>
                </div>

                {/* Remaining */}
                <div className="bg-bg-main/40 border border-border-color/60 rounded-xl p-4.5">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 text-xs">
                      <FaClock />
                    </div>
                    <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Remaining Balance</p>
                  </div>
                  <h3 className="text-sm font-extrabold text-rose-500">
                    Rs. {Number(selectedInvoice.sale.remainingAmount).toLocaleString()}
                  </h3>
                </div>
              </div>

              {/* Products Grid */}
              <div className="bg-bg-main/20 border border-border-color/85 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 text-xs">
                    <FaBoxOpen />
                  </div>
                  <h3 className="text-sm font-bold text-text-main tracking-tight">Purchased Items ({selectedInvoice.sale.items.length})</h3>
                </div>

                <div className="space-y-3">
                  {selectedInvoice.sale.items.map((item, index) => {
                    const skuCode = item.product?.sku || item.product?.barcode || "N/A";
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-bg-main/50 border border-border-color/40 rounded-xl p-4 text-xs font-semibold"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            title="Generate Product Passport QR"
                            onClick={() => {
                              const invoiceNo = selectedInvoice.sale._id ? selectedInvoice.sale._id.toString().slice(-6).toUpperCase() : "TEMP";
                              setPassportProduct({
                                name: item.name,
                                sku: skuCode,
                                price: item.price,
                                quantity: item.quantity,
                                unit: item.unit || "pcs",
                                invoiceNo: invoiceNo,
                                date: selectedInvoice.sale.createdAt,
                                customerName: selectedInvoice.sale.customer?.name || "Walk-in Customer",
                              });
                              setShowPassportModal(true);
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-2 rounded-lg border border-indigo-100/50 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                          >
                            <FaQrcode className="text-[11px]" />
                          </button>
                          <div className="truncate">
                            <h4 className="text-text-main font-bold text-xs truncate" title={item.name}>{item.name}</h4>
                            <p className="text-text-secondary text-[10px] mt-0.5 font-medium">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-text-secondary text-[9px] font-bold uppercase">Price</p>
                          <h4 className="font-extrabold text-indigo-500 text-xs">Rs. {Number(item.price).toLocaleString()}</h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Timeline */}
              <div className="bg-bg-main/20 border border-border-color/85 rounded-xl p-5">
                <h3 className="text-sm font-bold text-text-main tracking-tight mb-4">Payment Transactions History</h3>

                <div className="space-y-3">
                  {selectedInvoice.transactions && selectedInvoice.transactions.length > 0 ? (
                    selectedInvoice.transactions.map((transaction) => (
                      <div
                        key={transaction._id}
                        className="bg-bg-main/50 border border-border-color/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                      >
                        <div>
                          <h4 className="text-text-main font-bold text-xs">
                            {transaction.title}
                          </h4>
                          <p className="text-text-secondary text-[10px] mt-1 font-medium">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <h4 className="text-sm font-extrabold text-emerald-500">
                            + Rs. {Number(transaction.amount).toLocaleString()}
                          </h4>
                          <p className="text-text-secondary text-[9px] uppercase font-bold tracking-wider mt-0.5">
                            Method: {transaction.paymentMethod}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-text-secondary text-xs py-2">No transaction timeline entries.</div>
                  )}
                </div>
              </div>

              {/* QR Code Verification Section */}
              <div className="bg-bg-main/20 border border-border-color/85 rounded-xl p-5 mt-6 flex flex-col items-center justify-center text-center">
                <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Scan to Verify Invoice Receipt</p>
                <QRCodeCanvas text={getSalesHistoryInvoiceQrText()} size={120} showDownload={true} filename={`invoice-${selectedInvoice.sale._id}`} />
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

      <ProductPassportModal
        isOpen={showPassportModal}
        onClose={() => {
          setShowPassportModal(false);
          setPassportProduct(null);
        }}
        productData={passportProduct}
      />
    </DashboardLayout>
  );
};

export default SalesHistory;
