import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { FaCalendarAlt, FaPrint, FaDollarSign, FaArrowUp, FaArrowDown, FaFileInvoiceDollar, FaCoins } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const DailyReport = () => {
  const { theme } = useTheme();
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const reportPrintRef = useRef();

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await API.get(`/analytics/daily-report?date=${reportDate}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReportData(response.data);
    } catch (error) {
      console.error("Error fetching daily report:", error);
      alert("Failed to load daily report details");
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

  const isDark = theme === "dark";

  return (
    <DashboardLayout>
      {/* Header & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Daily Cash Report</h1>
          <p className="text-slate-500 text-sm mt-1">
            End-of-day register reconciliation, cash drawer balance, and sales breakdowns
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className={`border px-4 py-2 rounded-xl outline-none text-xs font-bold transition-all ${
                isDark ? "bg-[#0b0f19] border-slate-800 text-slate-200 focus:border-slate-700" : "bg-white border-slate-250 text-slate-900 focus:border-slate-350"
              }`}
            />
          </div>

          <button
            onClick={() => handlePrint()}
            disabled={!reportData}
            className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <FaPrint /> Print Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm">Generating reconciliation report...</div>
      ) : reportData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Print Template Wrapper (We will print this component) */}
          <div ref={reportPrintRef} className={`lg:col-span-2 space-y-6 p-1 print:p-8 print:bg-white print:text-slate-950`}>
            
            {/* Print Only Header */}
            <div className="hidden print:block text-center border-b pb-5 mb-6">
              <h1 className="text-3xl font-black uppercase text-slate-900">SmartStore LK</h1>
              <p className="text-xs text-slate-500 font-semibold tracking-wider">DAILY REGISTER RECONCILIATION REPORT</p>
              <p className="text-sm font-bold mt-2">Report Date: {reportData.date}</p>
            </div>

            {/* Main Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Cash Balance */}
              <div className={`border rounded-xl p-5 shadow-sm transition-all ${
                isDark ? "bg-[#0b0f19] border-emerald-500/10" : "bg-white border-slate-200"
              } print:border-slate-300 print:bg-slate-50`}>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Closing Cash Balance</p>
                <h3 className="text-xl font-extrabold text-emerald-400 print:text-emerald-700 mt-2">
                  Rs. {reportData.closingCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-slate-500 mt-1 block">In-drawer cash estimate</span>
              </div>

              {/* Gross Revenue */}
              <div className={`border rounded-xl p-5 shadow-sm transition-all ${
                isDark ? "bg-[#0b0f19] border-indigo-500/10" : "bg-white border-slate-200"
              } print:border-slate-300 print:bg-slate-50`}>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Gross Sales (Total)</p>
                <h3 className="text-xl font-extrabold text-indigo-400 print:text-indigo-700 mt-2">
                  Rs. {reportData.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-slate-500 mt-1 block">{reportData.totalSalesCount} invoice(s) generated</span>
              </div>

              {/* Total Expenses */}
              <div className={`border rounded-xl p-5 shadow-sm transition-all ${
                isDark ? "bg-[#0b0f19] border-rose-500/10" : "bg-white border-slate-200"
              } print:border-slate-300 print:bg-slate-50`}>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Daily Expenses Paid</p>
                <h3 className="text-xl font-extrabold text-rose-500 mt-2">
                  Rs. {reportData.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-slate-500 mt-1 block">Supplier payables + manual costs</span>
              </div>
            </div>

            {/* Reconciliation Breakdown */}
            <div className={`border rounded-xl p-6 transition-all ${
              isDark ? "bg-[#0b0f19] border-slate-800" : "bg-white border-slate-200"
            } print:border-slate-300`}>
              <h2 className={`text-md font-bold mb-4 tracking-tight border-b pb-2 ${isDark ? "text-white border-slate-800" : "text-slate-900 border-slate-250"}`}>
                Register Cash Reconciliation Summary
              </h2>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Opening Register Cash</span>
                  <span className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-850"}`}>Rs. {reportData.openingCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between items-center text-emerald-400 print:text-emerald-700 font-bold border-b border-dashed border-slate-800 pb-2.5">
                  <span>(+) Total Cash Inflow (Sales + Debt Collections)</span>
                  <span>+ Rs. {reportData.cashReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center text-rose-500 font-bold border-b border-dashed border-slate-800 pb-2.5">
                  <span>(-) Total Cash Outflow (Expenses + Supplier + Refunds)</span>
                  <span>- Rs. {reportData.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-base font-extrabold pt-2">
                  <span>Net Register Cash Flow</span>
                  <span className={reportData.netCashFlow >= 0 ? "text-emerald-400 print:text-emerald-700" : "text-rose-500"}>
                    Rs. {reportData.netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-lg font-black border-t border-slate-800 pt-3 text-indigo-400 print:text-indigo-900">
                  <span>Estimated Closing Cash Drawer Balance</span>
                  <span>Rs. {reportData.closingCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Income and Expense Detailed Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Daily Inflow Details */}
              <div className={`border rounded-xl p-5 ${
                isDark ? "bg-[#0b0f19] border-slate-800" : "bg-white border-slate-200"
              } print:border-slate-300`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Inflow Details
                </h4>
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cash Received from Sales</span>
                    <span className="font-bold">Rs. {(reportData.cashReceived - reportData.debtCollected).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Debts Collected from Customers</span>
                    <span className="font-bold text-emerald-400 print:text-emerald-700">Rs. {reportData.debtCollected.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/40 pt-2 font-bold">
                    <span>Total Cash Inflow</span>
                    <span>Rs. {reportData.cashReceived.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Daily Outflow Details */}
              <div className={`border rounded-xl p-5 ${
                isDark ? "bg-[#0b0f19] border-slate-800" : "bg-white border-slate-200"
              } print:border-slate-300`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                  Outflow Details
                </h4>
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Manual Operations Costs</span>
                    <span className="font-bold">Rs. {reportData.manualExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Supplier Account Payments</span>
                    <span className="font-bold text-rose-400 print:text-rose-700">Rs. {reportData.supplierPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Refunds Issued for Returns</span>
                    <span className="font-bold text-rose-400 print:text-rose-700">Rs. {reportData.totalRefunds.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/40 pt-2 font-bold">
                    <span>Total Cash Outflow</span>
                    <span>Rs. {reportData.totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Operational Breakdown sidebar column */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Sales vs Credit breakdown */}
            <div className={`border rounded-xl p-5 ${isDark ? "bg-[#0b0f19] border-slate-800" : "bg-white border-slate-200"}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Sales Credit Allocation
              </h3>
              
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Received Cash (Liquidity)</span>
                    <span className="font-bold text-slate-200">
                      {reportData.grossRevenue > 0 ? ((reportData.cashReceived / reportData.grossRevenue) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                    <div 
                      className="h-1.5 rounded-full bg-emerald-500 transition-all" 
                      style={{ width: `${reportData.grossRevenue > 0 ? (reportData.cashReceived / reportData.grossRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Credit Extended (Customer Debt)</span>
                    <span className="font-bold text-slate-200">
                      {reportData.grossRevenue > 0 ? ((reportData.creditExtended / reportData.grossRevenue) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                    <div 
                      className="h-1.5 rounded-full bg-rose-500 transition-all" 
                      style={{ width: `${reportData.grossRevenue > 0 ? (reportData.creditExtended / reportData.grossRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods breakdown */}
            <div className={`border rounded-xl p-5 ${isDark ? "bg-[#0b0f19] border-slate-800" : "bg-white border-slate-200"}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Payment Channel Summary
              </h3>
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cash Drawer Receipts</span>
                  <span className="font-bold">Rs. {reportData.paymentMethods.cash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Card Processor</span>
                  <span className="font-bold">Rs. {reportData.paymentMethods.card.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Direct Bank Transfer</span>
                  <span className="font-bold">Rs. {reportData.paymentMethods.bank_transfer.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
};

export default DailyReport;
