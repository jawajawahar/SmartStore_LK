import { useEffect, useState } from "react";
import { FaPlus, FaTimes, FaCheckCircle } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { toast } from "react-toastify";

const SupplierPayables = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [payables, setPayables] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    supplier: "",
    description: "",
    totalAmount: "",
    paidAmount: "",
  });

  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedPayable, setSelectedPayable] = useState(null);
  const [payLoading, setPayLoading] = useState(false);

  // Fetch Suppliers
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/suppliers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch Payables
  const fetchPayables = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/supplier-payables", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayables(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchPayables();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add Payable
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await API.post("/supplier-payables", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Supplier purchase logged successfully");
      setFormData({ supplier: "", description: "", totalAmount: "", paidAmount: "" });
      setShowForm(false);
      fetchPayables();
    } catch (error) {
      console.error(error);
      toast.error("Failed to log supplier purchase");
    }
  };

  // Pay Supplier
  const handlePayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.warning("Enter a valid payment amount");
      return;
    }
    setPayLoading(true);
    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/supplier-payables/${selectedPayable._id}/pay`,
        { amount: paymentAmount },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Payment recorded successfully");
      setSelectedPayable(null);
      setPaymentAmount("");
      fetchPayables();
    } catch (error) {
      console.error(error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setPayLoading(false);
    }
  };

  // Summary stats
  const totalOwed = payables.reduce((a, p) => a + Number(p.remainingAmount || 0), 0);
  const totalPaid = payables.reduce((a, p) => a + Number(p.paidAmount || 0), 0);
  const pending = payables.filter(p => p.status !== "paid").length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">Supplier Payables</h1>
          <p className="text-text-secondary text-sm mt-1">
            Track supplier purchases, payment history, and outstanding balances
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/15 cursor-pointer active:scale-[0.98]"
        >
          <FaPlus className="text-xs" />
          Log Purchase
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="border border-rose-500/15 bg-rose-500/5 rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1">Total Outstanding</p>
          <p className="text-2xl font-extrabold text-text-main">Rs. {totalOwed.toLocaleString()}</p>
          <p className="text-xs text-text-secondary mt-1">{pending} payable(s) pending settlement</p>
        </div>
        <div className="border border-emerald-500/15 bg-emerald-500/5 rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1">Total Paid to Date</p>
          <p className="text-2xl font-extrabold text-text-main">Rs. {totalPaid.toLocaleString()}</p>
          <p className="text-xs text-text-secondary mt-1">{payables.filter(p => p.status === "paid").length} fully settled</p>
        </div>
        <div className="border border-indigo-500/15 bg-indigo-500/5 rounded-xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-1">Total Transactions</p>
          <p className="text-2xl font-extrabold text-text-main">{payables.length}</p>
          <p className="text-xs text-text-secondary mt-1">Across {suppliers.length} supplier(s)</p>
        </div>
      </div>

      {/* Add Payable Form */}
      {showForm && (
        <div className="border border-border-color bg-bg-card rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-text-main tracking-tight">Add Supplier Purchase</h2>
            <button onClick={() => setShowForm(false)} className="text-text-secondary hover:text-text-main cursor-pointer transition-colors">
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
            {/* Supplier */}
            <div>
              <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Supplier</label>
              <select
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                required
                className="w-full border border-border-color bg-bg-main text-text-main px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 text-sm cursor-pointer transition-all"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <FormInput label="Description" name="description" value={formData.description} onChange={handleChange} />
            <FormInput label="Total Amount (Rs.)" name="totalAmount" type="number" value={formData.totalAmount} onChange={handleChange} />
            <FormInput label="Paid Amount (Rs.)" name="paidAmount" type="number" value={formData.paidAmount} onChange={handleChange} />

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer active:scale-[0.98]"
              >
                Log Purchase
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payable Table */}
      <div className="border border-border-color bg-bg-card rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-main border-b border-border-color">
              <tr>
                {["Supplier", "Description", "Total", "Paid", "Remaining", "Status", "Action"].map((th) => (
                  <th key={th} className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    {th}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border-color">
              {payables.length > 0 ? (
                payables.map((payable) => (
                  <tr key={payable._id} className="hover:bg-bg-main/50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-text-main text-sm">{payable.supplier?.name}</td>
                    <td className="px-5 py-3.5 text-text-secondary text-sm max-w-[160px] truncate">{payable.description}</td>
                    <td className="px-5 py-3.5 text-text-main text-sm font-medium">Rs. {Number(payable.totalAmount).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-emerald-500 font-medium text-sm">Rs. {Number(payable.paidAmount).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-rose-500 font-bold text-sm">
                      Rs. {Number(payable.remainingAmount).toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                          payable.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}
                      >
                        {payable.status === "paid" ? <FaCheckCircle className="text-[8px]" /> : null}
                        {payable.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5">
                      {payable.status !== "paid" ? (
                        <button
                          onClick={() => setSelectedPayable(payable)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-[0.97]"
                        >
                          Pay Vendor
                        </button>
                      ) : (
                        <span className="text-text-secondary text-xs font-semibold">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-text-secondary text-sm">
                    No payables transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPayable && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="border border-border-color bg-bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            {/* Close button */}
            <button
              onClick={() => { setSelectedPayable(null); setPaymentAmount(""); }}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-main transition-colors cursor-pointer"
            >
              <FaTimes />
            </button>

            <h2 className="text-lg font-bold text-text-main mb-1 tracking-tight">Pay Supplier Vendor</h2>
            <p className="text-text-secondary text-xs mb-5">{selectedPayable.supplier?.name} — {selectedPayable.description}</p>

            <div className="mb-5 border border-border-color bg-bg-main rounded-xl p-4 flex justify-between items-center text-sm">
              <span className="text-text-secondary font-medium">Remaining Balance</span>
              <span className="text-rose-500 font-bold text-base">
                Rs. {Number(selectedPayable.remainingAmount).toLocaleString()}
              </span>
            </div>

            <div className="mb-6">
              <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Payment Amount (Rs.)</label>
              <input
                type="number"
                placeholder="Enter amount to pay"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                max={selectedPayable.remainingAmount}
                className="w-full border border-border-color bg-bg-main text-text-main placeholder:text-text-secondary/40 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePayment}
                disabled={payLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer active:scale-[0.98]"
              >
                {payLoading ? "Processing..." : "Confirm Payment"}
              </button>

              <button
                onClick={() => { setSelectedPayable(null); setPaymentAmount(""); }}
                className="flex-1 border border-border-color bg-bg-main hover:bg-bg-card text-text-main py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

// Reusable Input
const FormInput = ({ label, name, type = "text", value, onChange }) => (
  <div>
    <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required
      className="w-full border border-border-color bg-bg-main text-text-main placeholder:text-text-secondary/40 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm"
    />
  </div>
);

export default SupplierPayables;
