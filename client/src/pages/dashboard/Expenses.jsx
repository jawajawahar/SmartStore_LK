import { useEffect, useState } from "react";
import { FaTrash, FaPlus, FaMoneyBillWave, FaArrowDown, FaCalendarAlt, FaFilter } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { toast } from "react-toastify";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    category: "misc",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "cash",
  });

  const categories = [
    { value: "rent", label: "Rent" },
    { value: "utilities", label: "Utilities" },
    { value: "salaries", label: "Salaries" },
    { value: "transport", label: "Transport" },
    { value: "marketing", label: "Marketing" },
    { value: "supplies", label: "Supplies" },
    { value: "misc", label: "Miscellaneous" },
  ];

  // Fetch Expenses
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/expenses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Create Expense
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.warning("Please enter a valid expense amount");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await API.post("/expenses", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Expense recorded successfully");
      setFormData({
        category: "misc",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "cash",
      });
      fetchExpenses();
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error(error.response?.data?.message || "Failed to record expense");
    }
  };

  // Delete Expense
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense? This will also remove the associated transaction log.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await API.delete(`/expenses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Expense deleted successfully");
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  // Filtering logic
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.description?.toLowerCase().includes(search.toLowerCase()) || 
                          exp.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" ? true : exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate totals
  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate this month's total
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpense = expenses
    .filter((exp) => {
      const d = new Date(exp.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  // Get category breakdown
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">Store Expenses</h1>
          <p className="text-text-secondary text-sm mt-1">
            Track salaries, rent, utilities, and daily operations costs
          </p>
        </div>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="border border-rose-500/10 rounded-xl p-6 shadow-sm bg-bg-card">
          <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Total Lifetime Expenses</p>
          <h2 className="text-2xl font-extrabold mt-2 tracking-tight text-rose-500">
            Rs. {totalExpense.toLocaleString()}
          </h2>
        </div>

        <div className="border border-indigo-500/10 rounded-xl p-6 shadow-sm bg-bg-card">
          <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">This Month's Expenses</p>
          <h2 className="text-2xl font-extrabold mt-2 tracking-tight text-indigo-500">
            Rs. {monthlyExpense.toLocaleString()}
          </h2>
        </div>

        <div className="border border-border-color rounded-xl p-6 shadow-sm bg-bg-card">
          <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Most Active Category</p>
          <h2 className="text-xl font-bold mt-2 tracking-tight text-text-main">
            {Object.keys(categoryTotals).length > 0
              ? categories.find(c => c.value === Object.entries(categoryTotals).sort((a,b) => b[1]-a[1])[0][0])?.label || "None"
              : "N/A"}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form Container */}
        <div className="xl:col-span-1 border border-border-color rounded-xl p-6 h-fit bg-bg-card shadow-sm">
          <h2 className="text-lg font-bold mb-5 tracking-tight text-text-main">Record Store Expense</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-border-color px-4 py-2.5 rounded-xl outline-none text-sm bg-bg-main text-text-main focus:border-indigo-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Amount (Rs.)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                required
                className="w-full border border-border-color px-4 py-2.5 rounded-xl outline-none text-sm bg-bg-main text-text-main focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full border border-border-color px-4 py-2.5 rounded-xl outline-none text-sm bg-bg-main text-text-main focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Payment Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full border border-border-color px-4 py-2.5 rounded-xl outline-none text-sm bg-bg-main text-text-main focus:border-indigo-500 cursor-pointer"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What was this expense for?"
                rows="3"
                className="w-full border border-border-color px-4 py-2.5 rounded-xl outline-none text-sm bg-bg-main text-text-main focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              <FaPlus className="text-xs" /> Record Expense
            </button>
          </form>
        </div>

        {/* Expenses List & Category Progress */}
        <div className="xl:col-span-2 space-y-6">
          {/* Category Breakdown list */}
          <div className="border border-border-color rounded-xl p-6 bg-bg-card shadow-sm">
            <h3 className="text-md font-bold mb-4 text-text-main">Category Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((c) => {
                const amt = categoryTotals[c.value] || 0;
                const percentage = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
                return (
                  <div key={c.value} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-text-secondary">{c.label}</span>
                      <span className="text-text-main">Rs. {amt.toLocaleString()} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-bg-main border border-border-color/40">
                      <div 
                        className="h-1.5 rounded-full bg-indigo-600 transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table list */}
          <div className="border border-border-color rounded-xl overflow-hidden bg-bg-card shadow-sm">
            {/* Filters */}
            <div className="p-4 border-b border-border-color flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border border-border-color px-4 py-2 rounded-xl outline-none text-xs bg-bg-main text-text-main placeholder-text-secondary/40 focus:border-indigo-500"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-border-color px-4 py-2 rounded-xl outline-none text-xs bg-bg-main text-text-main focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-main/60 border-b border-border-color">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary">Category</th>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary">Description</th>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary">Method</th>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary">Amount</th>
                    <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-secondary">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border-color/60">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-text-secondary text-xs">Loading expenses...</td>
                    </tr>
                  ) : filteredExpenses.length > 0 ? (
                    filteredExpenses.map((exp) => (
                      <tr key={exp._id} className="hover:bg-bg-main/30 transition-colors">
                        <td className="px-5 py-3 text-text-secondary text-xs">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 font-bold text-text-main text-xs">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                            exp.category === "rent" ? "bg-red-500/10 text-red-500" :
                            exp.category === "utilities" ? "bg-amber-500/10 text-amber-550 text-amber-500" :
                            exp.category === "salaries" ? "bg-emerald-500/10 text-emerald-500" :
                            exp.category === "transport" ? "bg-blue-500/10 text-blue-500" :
                            exp.category === "marketing" ? "bg-purple-500/10 text-purple-500" :
                            exp.category === "supplies" ? "bg-cyan-500/10 text-cyan-500" :
                            "bg-slate-500/10 text-text-secondary"
                          }`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-text-secondary font-medium">
                          {exp.description || "—"}
                        </td>
                        <td className="px-5 py-3 text-text-secondary text-xs uppercase font-semibold">
                          {exp.paymentMethod}
                        </td>
                        <td className="px-5 py-3 text-rose-500 font-extrabold text-xs">
                          Rs. {exp.amount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDelete(exp._id)}
                            className="text-text-secondary hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-text-secondary text-xs">No expenses found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Expenses;
