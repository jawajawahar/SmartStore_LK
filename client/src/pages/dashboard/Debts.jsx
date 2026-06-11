import { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";

const Debts = () => {
  const [customers, setCustomers] = useState([]);
  const [debts, setDebts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Add or Edit Debt
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      if (editingId) {
        // UPDATE
        await API.put(`/debts/${editingId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success("Debt record updated successfully");
      } else {
        // ADD
        await API.post("/debts", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success("Debt record logged successfully");
      }

      setFormData({
        customer: "",
        description: "",
        totalAmount: "",
        paidAmount: "",
      });

      setEditingId(null);
      fetchDebts();
    } catch (error) {
      console.log(error);
      toast.error(editingId ? "Failed to Update Debt Entry" : "Failed to Log Debt Entry");
    }
  };

  // Pre-fill form for editing
  const handleEdit = (debt) => {
    setEditingId(debt._id);
    setFormData({
      customer: debt.customer?._id || "",
      description: debt.description,
      totalAmount: debt.totalAmount,
      paidAmount: debt.paidAmount,
    });
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Delete Debt
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const confirmDelete = window.confirm("Are you sure you want to delete this debt record?");
      if (!confirmDelete) return;

      await API.delete(`/debts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Debt record deleted successfully");
      fetchDebts();
      if (editingId === id) {
        setEditingId(null);
        setFormData({ customer: "", description: "", totalAmount: "", paidAmount: "" });
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete debt record");
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDebts = debts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(debts.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [debts.length]);

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
        <h2 className="text-lg font-bold text-text-main mb-5 tracking-tight font-sans">
          {editingId ? "Edit Debt Record" : "Add Borrow Record"}
        </h2>

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
                  {customer.name} {customer.currentDebt > 0 ? `(Debt: Rs. ${Number(customer.currentDebt).toLocaleString()})` : ""}
                </option>
              ))}
            </select>
            {formData.customer && (
              (() => {
                const selectedCust = customers.find(c => c._id === formData.customer);
                if (selectedCust && selectedCust.currentDebt > 0) {
                  return (
                    <p className="text-[10px] text-rose-500 font-bold mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>
                      Current Debt: Rs. {Number(selectedCust.currentDebt).toLocaleString()}
                    </p>
                  );
                }
                return (
                  <p className="text-[10px] text-emerald-500 font-bold mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    No outstanding debt (Settled)
                  </p>
                );
              })()
            )}
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
          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer active:scale-[0.99] shadow-lg shadow-indigo-600/10"
            >
              {editingId ? "Update Debt Entry" : "Log Debt Entry"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ customer: "", description: "", totalAmount: "", paidAmount: "" });
                }}
                className="px-4 py-2.5 border border-border-color hover:bg-bg-main text-text-secondary rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}
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
              {currentDebts.length > 0 ? (
                currentDebts.map((debt) => (
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
                      <div className="flex items-center gap-2">
                        {debt.status !== "paid" && (
                          <button
                            onClick={() => setSelectedDebt(debt)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold uppercase text-[9px] cursor-pointer transition-all active:scale-[0.97] shadow-sm hover:shadow"
                            title="Clear Part"
                          >
                            Clear Part
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(debt)}
                          className="w-7 h-7 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 text-indigo-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                          title="Edit Debt"
                        >
                          <FaEdit className="text-[10px]" />
                        </button>
                        <button
                          onClick={() => handleDelete(debt._id)}
                          className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                          title="Delete Debt"
                        >
                          <FaTrash className="text-[10px]" />
                        </button>
                      </div>
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
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
