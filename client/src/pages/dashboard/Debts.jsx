import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";

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
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

      alert("Debt Added Successfully");

      setFormData({
        customer: "",
        description: "",
        totalAmount: "",
        paidAmount: "",
      });

      fetchDebts();
    } catch (error) {
      console.log(error);
      alert("Failed to Add Debt");
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

      alert("Payment Added");
      setSelectedDebt(null);
      setPaymentAmount("");
      fetchDebts();
    } catch (error) {
      console.log(error);
      alert("Payment Failed");
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">
          Borrow & Debt Management
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Track customer outstanding balances, payment schedules, and logs
        </p>
      </div>

      {/* Add Debt Form */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-5 tracking-tight font-sans">Add Borrow Record</h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5"
        >
          {/* Customer */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Customer</label>
            <select
              name="customer"
              value={formData.customer}
              onChange={handleChange}
              required
              className="w-full bg-[#111827] border border-slate-800 text-slate-105 text-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm cursor-pointer"
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
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#111827]/60 border-b border-slate-800">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Customer</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Description</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Total</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Paid</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Remaining</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-850">
              {debts.length > 0 ? (
                debts.map((debt) => (
                  <tr
                    key={debt._id}
                    className="hover:bg-slate-800/25 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-200 text-sm">{debt.customer?.name}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-sm">{debt.description}</td>
                    <td className="px-5 py-3.5 text-slate-350 text-sm">Rs. {Number(debt.totalAmount).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-emerald-400 font-medium text-sm">Rs. {Number(debt.paidAmount).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-rose-400 font-bold text-sm">
                      Rs. {Number(debt.remainingAmount).toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                          debt.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {debt.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-sm">
                      {debt.status !== "paid" ? (
                        <button
                          onClick={() => setSelectedDebt(debt)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors active:scale-[0.97]"
                        >
                          Clear Part
                        </button>
                      ) : (
                        <span className="text-slate-500 text-xs font-semibold">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-500 text-sm">No borrow records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedDebt && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl relative">
            <h2 className="text-lg font-bold text-white mb-4 tracking-tight">Record Debt Payment</h2>

            <div className="mb-5 bg-[#111827]/60 border border-slate-800/80 rounded-xl p-4 flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Remaining balance:</span>
              <span className="text-rose-400 font-bold text-base">
                Rs. {Number(selectedDebt.remainingAmount).toLocaleString()}
              </span>
            </div>

            <div className="mb-6">
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Payment Amount (Rs.)</label>
              <input
                type="number"
                placeholder="Enter paid amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full bg-[#111827] border border-slate-800 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePayment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer active:scale-[0.98]"
              >
                Confirm Payment
              </button>

              <button
                onClick={() => setSelectedDebt(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer active:scale-[0.98]"
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
      <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full bg-[#111827] border border-slate-800 text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm"
      />
    </div>
  );
};

export default Debts;

