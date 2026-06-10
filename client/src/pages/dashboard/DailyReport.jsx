import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { FaPrint, FaArrowUp, FaArrowDown, FaCoins, FaFileInvoiceDollar } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";

const DailyReport = () => {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const reportPrintRef = useRef();

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await API.get(`/analytics/daily-report?date=${reportDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReportData(response.data);
    } catch (error) {
      console.error("Error fetching daily report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyReport();
  }, [reportDate]);

  const handlePrint = useReactToPrint({
    contentRef: reportPrintRef,
    documentTitle: `Daily-Reconciliation-Report-${reportDate}`,
  });

  return (
    <DashboardLayout>
      {/* Header & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">Daily Cash Report</h1>
          <p className="text-text-secondary text-sm mt-1">
            End-of-day register reconciliation, cash drawer balance, and sales breakdowns
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="border border-border-color bg-bg-card text-text-main px-4 py-2 rounded-xl outline-none text-xs font-bold focus:border-indigo-500 transition-all"
          />
          <button
            onClick={() => handlePrint()}
            disabled={!reportData}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <FaPrint /> Print Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-text-secondary text-sm">Generating reconciliation report...</div>
      ) : reportData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Print Template Wrapper */}
          <div ref={reportPrintRef} className="lg:col-span-2 space-y-6 p-1 print:p-8 print:bg-white print:text-slate-950">

            {/* Print Only Header */}
            <div className="hidden print:block text-center border-b pb-5 mb-6">
              <h1 className="text-3xl font-black uppercase text-slate-900">SmartStore LK</h1>
              <p className="text-xs text-slate-500 font-semibold tracking-wider">DAILY REGISTER RECONCILIATION REPORT</p>
              <p className="text-sm font-bold mt-2">Report Date: {reportData.date}</p>
            </div>

            {/* Main KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

              {/* Cash Balance */}
              <div className="border border-border-color rounded-xl p-5 shadow-sm bg-bg-card print:border-slate-300 print:bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Closing Cash Balance</p>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <FaCoins className="text-emerald-500 text-xs" />
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-emerald-500 print:text-emerald-700 mt-1">
                  Rs. {reportData.closingCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-text-secondary mt-1 block">In-drawer cash estimate</span>
              </div>

              {/* Gross Revenue */}
              <div className="border border-border-color rounded-xl p-5 shadow-sm bg-bg-card print:border-slate-300 print:bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Gross Sales</p>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <FaFileInvoiceDollar className="text-indigo-500 text-xs" />
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-indigo-500 print:text-indigo-700 mt-1">
                  Rs. {reportData.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-text-secondary mt-1 block">{reportData.totalSalesCount} invoice(s) generated</span>
              </div>

              {/* Total Expenses */}
              <div className="border border-border-color rounded-xl p-5 shadow-sm bg-bg-card print:border-slate-300 print:bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Daily Expenses</p>
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <FaArrowUp className="text-rose-500 text-xs" />
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-rose-500 mt-1">
                  Rs. {reportData.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-text-secondary mt-1 block">Supplier payables + manual costs</span>
              </div>
            </div>

            {/* Reconciliation Breakdown */}
            <div className="border border-border-color rounded-xl p-6 bg-bg-card print:border-slate-300">
              <h2 className="text-md font-bold text-text-main mb-4 tracking-tight border-b border-border-color pb-3">
                Register Cash Reconciliation Summary
              </h2>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Opening Register Cash</span>
                  <span className="font-semibold text-text-main">Rs. {reportData.openingCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center text-emerald-500 print:text-emerald-700 font-bold border-b border-dashed border-border-color pb-2.5">
                  <span>(+) Total Cash Inflow (Sales + Debt Collections)</span>
                  <span>+ Rs. {reportData.cashReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center text-rose-500 font-bold border-b border-dashed border-border-color pb-2.5">
                  <span>(-) Total Cash Outflow (Expenses + Supplier + Refunds)</span>
                  <span>- Rs. {reportData.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-base font-extrabold pt-2 text-text-main">
                  <span>Net Register Cash Flow</span>
                  <span className={reportData.netCashFlow >= 0 ? "text-emerald-500 print:text-emerald-700" : "text-rose-500"}>
                    Rs. {reportData.netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-lg font-black border-t border-border-color pt-3 text-indigo-500 print:text-indigo-900">
                  <span>Estimated Closing Cash Drawer Balance</span>
                  <span>Rs. {reportData.closingCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Income and Expense Detailed Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Daily Inflow Details */}
              <div className="border border-border-color rounded-xl p-5 bg-bg-card print:border-slate-300">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 text-text-secondary">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Inflow Details
                </h4>
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Cash Received from Sales</span>
                    <span className="font-bold text-text-main">Rs. {(reportData.cashReceived - reportData.debtCollected).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Debts Collected from Customers</span>
                    <span className="font-bold text-emerald-500 print:text-emerald-700">Rs. {reportData.debtCollected.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-border-color pt-2 font-bold text-text-main">
                    <span>Total Cash Inflow</span>
                    <span>Rs. {reportData.cashReceived.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Daily Outflow Details */}
              <div className="border border-border-color rounded-xl p-5 bg-bg-card print:border-slate-300">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 text-text-secondary">
                  <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                  Outflow Details
                </h4>
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Manual Operations Costs</span>
                    <span className="font-bold text-text-main">Rs. {reportData.manualExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Supplier Account Payments</span>
                    <span className="font-bold text-rose-500 print:text-rose-700">Rs. {reportData.supplierPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Refunds Issued for Returns</span>
                    <span className="font-bold text-rose-500 print:text-rose-700">Rs. {reportData.totalRefunds.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-border-color pt-2 font-bold text-text-main">
                    <span>Total Cash Outflow</span>
                    <span>Rs. {reportData.totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Payment & Operational Breakdown */}
          <div className="lg:col-span-1 space-y-6">

            {/* Sales vs Credit Allocation */}
            <div className="border border-border-color rounded-xl p-5 bg-bg-card">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-text-secondary">
                Sales Credit Allocation
              </h3>

              <div className="space-y-5 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Received Cash (Liquidity)</span>
                    <span className="font-bold text-text-main">
                      {reportData.grossRevenue > 0 ? ((reportData.cashReceived / reportData.grossRevenue) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-border-color overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${reportData.grossRevenue > 0 ? (reportData.cashReceived / reportData.grossRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Credit Extended (Customer Debt)</span>
                    <span className="font-bold text-text-main">
                      {reportData.grossRevenue > 0 ? ((reportData.creditExtended / reportData.grossRevenue) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-border-color overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-rose-500 transition-all"
                      style={{ width: `${reportData.grossRevenue > 0 ? (reportData.creditExtended / reportData.grossRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods Breakdown */}
            <div className="border border-border-color rounded-xl p-5 bg-bg-card">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-text-secondary">
                Payment Channel Summary
              </h3>
              <div className="space-y-4 text-xs">
                {[
                  { label: "Cash Drawer Receipts", value: reportData.paymentMethods.cash, color: "emerald" },
                  { label: "Card Processor", value: reportData.paymentMethods.card, color: "indigo" },
                  { label: "Direct Bank Transfer", value: reportData.paymentMethods.bank_transfer, color: "violet" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full bg-${color}-500`}></span>
                      <span className="text-text-secondary">{label}</span>
                    </div>
                    <span className="font-bold text-text-main">Rs. {value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Summary box */}
            <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-xl p-5 text-xs space-y-3">
              <h3 className="font-bold text-indigo-500 uppercase tracking-wider text-[10px]">Quick Summary</h3>
              <div className="flex justify-between text-text-secondary">
                <span>Total Invoices</span>
                <span className="font-bold text-text-main">{reportData.totalSalesCount}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Net Profit Estimate</span>
                <span className={`font-bold ${reportData.netCashFlow >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  Rs. {reportData.netCashFlow.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary border-t border-border-color pt-3">
                <span>Closing Balance</span>
                <span className="font-black text-indigo-500">
                  Rs. {reportData.closingCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-text-secondary text-sm">
          No report data available for selected date.
        </div>
      )}
    </DashboardLayout>
  );
};

export default DailyReport;
