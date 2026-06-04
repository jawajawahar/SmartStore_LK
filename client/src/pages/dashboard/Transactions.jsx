import { useEffect, useState } from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTransactions(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
  }, []);

  // Filter Transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.personName?.toLowerCase().includes(search.toLowerCase()) ||
      transaction.title?.toLowerCase().includes(search.toLowerCase());

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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Transactions</h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          Financial transaction center, earnings logs, and store disbursements
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Income */}
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Income</p>
              <h2 className="text-2xl font-bold mt-2 tracking-tight text-white">
                Rs. {totalIncome.toLocaleString()}
              </h2>
            </div>

            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm">
              <FaArrowDown />
            </div>
          </div>
        </div>

        {/* Expense */}
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Expenses</p>
              <h2 className="text-2xl font-bold mt-2 tracking-tight text-white">
                Rs. {totalExpense.toLocaleString()}
              </h2>
            </div>

            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center text-sm">
              <FaArrowUp />
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-6 shadow-sm">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Net Balance</p>
            <h2 className="text-2xl font-bold mt-2 tracking-tight text-white">
              Rs. {(totalIncome - totalExpense).toLocaleString()}
            </h2>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <input
          type="text"
          placeholder="Filter transactions logs by name or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[#0b0f19] border border-slate-800 text-slate-200 placeholder-slate-500 px-4 py-2.5 rounded-xl outline-none focus:border-slate-700 text-sm transition-colors"
        />

        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[#0b0f19] border border-slate-800 text-slate-200 px-4 py-2.5 rounded-xl outline-none text-sm cursor-pointer focus:border-slate-700 transition-colors"
        >
          <option value="all">All Cashflow</option>
          <option value="income">Income Only</option>
          <option value="expense">Expenses Only</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#111827]/60 border-b border-slate-800">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Person</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Description</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Amount</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Flow</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Payment</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-850">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction._id}
                    className="hover:bg-slate-800/25 transition-colors"
                  >
                    {/* Type */}
                    <td className="px-5 py-3.5 text-sm">
                      <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md text-xs font-semibold">
                        {transaction.type}
                      </span>
                    </td>

                    {/* Person */}
                    <td className="px-5 py-3.5 font-semibold text-slate-200 text-sm">{transaction.personName}</td>

                    {/* Description */}
                    <td className="px-5 py-3.5 text-slate-450 text-slate-400 text-sm">
                      {transaction.description}
                    </td>

                    {/* Amount */}
                    <td
                      className={`px-5 py-3.5 font-bold text-sm ${
                        transaction.flow === "income"
                          ? "text-emerald-450 text-emerald-400"
                          : "text-rose-450 text-rose-400"
                      }`}
                    >
                      {transaction.flow === "income" ? "+" : "-"}
                      Rs. {Number(transaction.amount).toLocaleString()}
                    </td>

                    {/* Flow */}
                    <td className="px-5 py-3.5 text-sm">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                          transaction.flow === "income"
                            ? "bg-emerald-500/10 text-emerald-450 text-emerald-400 border-emerald-500/25"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/25"
                        }`}
                      >
                        {transaction.flow}
                      </span>
                    </td>

                    {/* Payment */}
                    <td className="px-5 py-3.5 uppercase text-slate-400 font-semibold text-xs">{transaction.paymentMethod}</td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-500 text-sm">No transaction entries found matching query.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;

