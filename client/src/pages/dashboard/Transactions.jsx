import { useEffect, useState } from "react";
import { FaArrowDown, FaArrowUp, FaSearch, FaFilter } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Fetch Transactions
  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter Transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.personName?.toLowerCase().includes(search.toLowerCase()) ||
      transaction.title?.toLowerCase().includes(search.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "all" ? true : transaction.flow === filter;
    return matchesSearch && matchesFilter;
  });

  // Totals
  const totalIncome = transactions
    .filter((t) => t.flow === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.flow === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const paymentMethodLabel = (method) => {
    const map = {
      cash: "Cash",
      card: "Card",
      bank_transfer: "Bank Transfer",
      partial: "Partial",
      credit: "Credit",
    };
    return map[method] || method;
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-main">Transactions</h1>
        <p className="text-text-secondary text-sm mt-1 font-medium">
          Financial transaction center — earnings logs and store disbursements
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Income */}
        <div className="border border-emerald-500/15 bg-emerald-500/5 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Total Income</p>
              <h2 className="text-2xl font-extrabold mt-2 tracking-tight text-text-main">
                Rs. {totalIncome.toLocaleString()}
              </h2>
              <p className="text-[10px] text-emerald-500 font-semibold mt-1">
                {transactions.filter(t => t.flow === "income").length} inflow entries
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <FaArrowDown className="text-sm" />
            </div>
          </div>
        </div>

        {/* Expense */}
        <div className="border border-rose-500/15 bg-rose-500/5 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Total Expenses</p>
              <h2 className="text-2xl font-extrabold mt-2 tracking-tight text-text-main">
                Rs. {totalExpense.toLocaleString()}
              </h2>
              <p className="text-[10px] text-rose-500 font-semibold mt-1">
                {transactions.filter(t => t.flow === "expense").length} outflow entries
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <FaArrowUp className="text-sm" />
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className={`border rounded-xl p-6 shadow-sm ${
          netBalance >= 0
            ? "border-indigo-500/15 bg-indigo-500/5"
            : "border-rose-500/15 bg-rose-500/5"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Net Balance</p>
              <h2 className={`text-2xl font-extrabold mt-2 tracking-tight ${netBalance >= 0 ? "text-indigo-500" : "text-rose-500"}`}>
                Rs. {netBalance.toLocaleString()}
              </h2>
              <p className="text-[10px] text-text-secondary font-semibold mt-1">
                {transactions.length} total transactions
              </p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              netBalance >= 0 ? "bg-indigo-500/10 text-indigo-500" : "bg-rose-500/10 text-rose-500"
            }`}>
              {netBalance >= 0 ? <FaArrowDown className="text-sm" /> : <FaArrowUp className="text-sm" />}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-[10px]" />
          <input
            type="text"
            placeholder="Filter by name, title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-border-color bg-bg-card text-text-main placeholder:text-text-secondary/50 pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all"
          />
        </div>

        <div className="relative">
          <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-[10px]" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-border-color bg-bg-card text-text-main pl-9 pr-8 py-2.5 rounded-xl outline-none text-sm cursor-pointer focus:border-indigo-500 transition-all appearance-none"
          >
            <option value="all">All Cashflow</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="border border-border-color bg-bg-card rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-main border-b border-border-color">
              <tr>
                {["Type", "Person", "Description", "Amount", "Flow", "Payment", "Date"].map((th) => (
                  <th key={th} className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    {th}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border-color">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-bg-main/50 transition-colors">
                    {/* Type */}
                    <td className="px-5 py-3.5">
                      <span className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase">
                        {transaction.type}
                      </span>
                    </td>

                    {/* Person */}
                    <td className="px-5 py-3.5 font-semibold text-text-main text-sm">{transaction.personName || "—"}</td>

                    {/* Description */}
                    <td className="px-5 py-3.5 text-text-secondary text-sm max-w-[200px] truncate">
                      {transaction.description || "—"}
                    </td>

                    {/* Amount */}
                    <td className={`px-5 py-3.5 font-bold text-sm ${
                      transaction.flow === "income" ? "text-emerald-500" : "text-rose-500"
                    }`}>
                      {transaction.flow === "income" ? "+" : "−"}Rs. {Number(transaction.amount).toLocaleString()}
                    </td>

                    {/* Flow */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                          transaction.flow === "income"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        }`}
                      >
                        {transaction.flow === "income"
                          ? <FaArrowDown className="text-[8px]" />
                          : <FaArrowUp className="text-[8px]" />
                        }
                        {transaction.flow}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="px-5 py-3.5">
                      <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
                        {paymentMethodLabel(transaction.paymentMethod)}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-text-secondary text-xs whitespace-nowrap">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-text-secondary text-sm">
                    No transaction entries found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer with count */}
        {filteredTransactions.length > 0 && (
          <div className="px-5 py-3 border-t border-border-color bg-bg-main flex justify-between items-center">
            <p className="text-[10px] text-text-secondary font-semibold">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
