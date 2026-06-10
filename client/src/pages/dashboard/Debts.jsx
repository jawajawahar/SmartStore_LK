import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { toast } from "react-toastify";

const Debts = () => {
  const [customers, setCustomers] = useState([]);
  const [debts, setDebts] = useState([]);

  const [formData, setFormData] = useState({
    customer: "",
    description: "",
    totalAmount: "",
    paidAmount: "",
  });

  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedDebt, setSelectedDebt] = useState(null);

  // Fetch Customers
  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await API.get("/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCustomers(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch Debts
  const fetchDebts = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await API.get("/debts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDebts(response.data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load debts ledger");
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchDebts();
  }, []);

  // Handle Input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Add Debt
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      await API.post("/debts", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Debt record logged successfully");

      setFormData({
        customer: "",
        description: "",
        totalAmount: "",
        paidAmount: "",
      });

      fetchDebts();
    } catch (error) {
      console.log(error);
      toast.error("Failed to Log Debt Entry");
    }
  };

  // Pay Debt
  const handlePayment = async () => {
    try {
      const token = localStorage.getItem("token");

      await API.put(
        `/debts/${selectedDebt._id}/pay`,
        {
          amount: paymentAmount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Payment recorded successfully");
      setSelectedDebt(null);
      setPaymentAmount("");
      fetchDebts();
    } catch (error) {
      console.log(error);
      toast.error("Payment settlement failed");
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-main font-sans">
          Borrow & Debt Management
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Track customer outstanding balances, payment schedules, and logs
        </p>
      </div>

      {/* Add Debt Form */}
      <div className="bg-bg-card border border-border-color rounded-xl p-6 mb-8 shadow-sm">
        <h2 className="text-lg font-bold text-text-main mb-5 tracking-tight font-sans">Add Borrow Record</h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5"
        >
          {/* Customer */}
          <div>
            <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Customer</label>
            <select
              name="customer"
              value={formData.customer}
              onChange={handleChange}
              required
              className="w-full bg-bg-main border border-border-color text-text-main px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm cursor-pointer"
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />

          {/* Total */}
          <Input
            label="Total Amount (Rs.)"
            name="totalAmount"
            type="number"
            value={formData.totalAmount}
            onChange={handleChange}
          />

          {/* Paid */}
          <Input
            label="Paid Amount (Rs.)"
            name="paidAmount"
            type="number"
            value={formData.paidAmount}
            onChange={handleChange}
          />

          {/* Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer active:scale-[0.99] shadow-lg shadow-indigo-600/10"
            >
              Log Debt Entry
            </button>
          </div>
        </form>
      </div>

      {/* Debt Table */}
      <div className="bg-bg-card border border-border-color rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-main/60 border-b border-border-color">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Customer</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Description</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Total</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Paid</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Remaining</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-color/60">
              {debts.length > 0 ? (
                debts.map((debt) => (
                  <tr
                    key={debt._id}
                    className="hover:bg-bg-main/30 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-bold text-text-main text-xs">{debt.customer?.name || "Deleted Customer"}</td>
                    <td className="px-5 py-3.5 text-text-secondary text-xs">{debt.description}</td>
                    <td className="px-5 py-3.5 text-text-main text-xs">Rs. {Number(debt.totalAmount).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-emerald-500 font-bold text-xs">Rs. {Number(debt.paidAmount).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-rose-505 text-rose-500 font-extrabold text-xs">
                      Rs. {Number(debt.remainingAmount).toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-xs">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase ${
                          debt.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        }`}
                      >
                        {debt.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-xs">
                      {debt.status !== "paid" ? (
                        <button
                          onClick={() => setSelectedDebt(debt)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg font-bold uppercase text-[10px] cursor-pointer transition-colors active:scale-[0.97] shadow-sm hover:shadow"
                        >
                          Clear Part
                        </button>
                      ) : (
                        <span className="text-text-secondary font-semibold">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-text-secondary text-xs">No borrow records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedDebt && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-border-color rounded-2xl p-6 w-full max-w-sm shadow-2xl relative text-text-main">
            <h2 className="text-lg font-bold text-text-main mb-4 tracking-tight">Record Debt Payment</h2>

            <div className="mb-5 bg-bg-main border border-border-color rounded-xl p-4 flex justify-between items-center text-xs">
              <span className="text-text-secondary font-medium">Remaining balance:</span>
              <span className="text-rose-500 font-extrabold text-base">
                Rs. {Number(selectedDebt.remainingAmount).toLocaleString()}
              </span>
            </div>

            <div className="mb-6">
              <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Payment Amount (Rs.)</label>
              <input
                type="number"
                placeholder="Enter paid amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full bg-bg-main border border-border-color text-text-main placeholder-text-secondary/40 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all text-xs"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePayment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer active:scale-[0.98] shadow-sm"
              >
                Confirm Payment
              </button>

              <button
                onClick={() => setSelectedDebt(null)}
                className="flex-1 bg-bg-main hover:bg-border-color text-text-secondary py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer active:scale-[0.98]"
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
const Input = ({ label, name, type = "text", value, onChange }) => {
  return (
    <div>
      <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full bg-bg-main border border-border-color text-text-main placeholder-text-secondary/40 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm"
      />
    </div>
  );
};

export default Debts;
