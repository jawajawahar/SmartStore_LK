import { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  FaRobot,
  FaChartLine,
  FaChartBar,
  FaUsers,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaBoxes,
  FaExclamationTriangle,
  FaTimesCircle,
  FaDollarSign,
  FaBalanceScale,
  FaWater,
  FaReceipt,
  FaTag,
  FaTasks,
  FaWarehouse,
  FaHistory,
  FaUndoAlt,
  FaPrint,
  FaPaperPlane,
  FaSpinner,
  FaMagic,
  FaInfoCircle,
  FaChevronDown,
  FaChevronUp,
  FaKey,
  FaLightbulb,
  FaCommentDots,
} from "react-icons/fa";

import { MdTrendingUp } from "react-icons/md";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";

// ─── Report Type Definitions ─────────────────────────────────────────────────
const REPORT_CATEGORIES = [
  {
    id: "sales",
    label: "Sales Reports",
    icon: <FaChartLine />,
    color: "indigo",
    reports: [
      { id: "daily-sales", label: "Daily Sales Report", icon: <FaCalendarDay />, prompt: "Generate a detailed Daily Sales Report for the selected period." },
      { id: "weekly-sales", label: "Weekly Sales Report", icon: <FaCalendarWeek />, prompt: "Generate a Weekly Sales Report summarizing sales performance week by week." },
      { id: "monthly-sales", label: "Monthly Sales Report", icon: <FaCalendarAlt />, prompt: "Generate a Monthly Sales Report with key sales KPIs and month-over-month insights." },
      { id: "product-wise", label: "Product-wise Sales", icon: <FaBoxes />, prompt: "Generate a Product-wise Sales Report showing which products performed best and worst." },
      { id: "category-wise", label: "Category-wise Sales", icon: <FaTag />, prompt: "Generate a Category-wise Sales Report breaking down revenue by product category." },
      { id: "sales-trend", label: "Sales Trend Report", icon: <MdTrendingUp />, prompt: "Generate a Sales Trend Report analyzing patterns, peaks, and growth over the period." },
      { id: "payment-method", label: "Sales by Payment Method", icon: <FaDollarSign />, prompt: "Generate a Sales by Payment Method Report showing cash, card, bank transfer, and credit breakdown." },
    ],
  },
  {
    id: "financial",
    label: "Financial Reports",
    icon: <FaDollarSign />,
    color: "emerald",
    reports: [
      { id: "profit-loss", label: "Profit & Loss Statement", icon: <FaBalanceScale />, prompt: "Generate a detailed Profit and Loss (Income Statement) report covering all revenue and expense items." },
      { id: "cash-flow", label: "Cash Flow Statement", icon: <FaWater />, prompt: "Generate a Cash Flow Statement analyzing cash inflows and outflows for the period." },
      { id: "expense-report", label: "Expense Report", icon: <FaReceipt />, prompt: "Generate a detailed Expense Report breaking down all operational costs by category." },
      { id: "revenue-report", label: "Revenue Report", icon: <FaChartBar />, prompt: "Generate a Revenue Report showing total revenue, net revenue, and revenue sources." },
      { id: "debt-report", label: "Outstanding Debt Report", icon: <FaUsers />, prompt: "Generate an Outstanding Customer Debt Report showing total credit extended and collection status." },
      { id: "supplier-payables", label: "Supplier Payables Report", icon: <FaTasks />, prompt: "Generate a Supplier Payables Report showing outstanding amounts owed to suppliers." },
      { id: "budget-actual", label: "Business Health Summary", icon: <FaChartLine />, prompt: "Generate a Business Health Summary including profit margins, debt ratios, and financial health indicators." },
    ],
  },
  {
    id: "inventory",
    label: "Inventory Reports",
    icon: <FaWarehouse />,
    color: "violet",
    reports: [
      { id: "current-stock", label: "Current Stock Report", icon: <FaWarehouse />, prompt: "Generate a Current Stock Report showing all products with their current quantities and values." },
      { id: "low-stock", label: "Low Stock Alert Report", icon: <FaExclamationTriangle />, prompt: "Generate a Low Stock Alert Report identifying all products at or below their minimum stock threshold." },
      { id: "out-of-stock", label: "Out-of-Stock Report", icon: <FaTimesCircle />, prompt: "Generate an Out-of-Stock Report listing all products with zero inventory that need restocking." },
      { id: "inventory-valuation", label: "Inventory Valuation", icon: <FaDollarSign />, prompt: "Generate an Inventory Valuation Report showing cost value, retail value, and potential profit from current stock." },
      { id: "stock-movement", label: "Stock Movement Report", icon: <FaHistory />, prompt: "Generate a Stock Movement Report showing sales volume per product and return activity." },
      { id: "returns-report", label: "Returns & Refunds Report", icon: <FaUndoAlt />, prompt: "Generate a Returns and Refunds Report summarizing all product returns and refund amounts." },
    ],
  },
];

const CHAT_SUGGESTIONS = [
  { text: "What is our net profit margin for this period?", category: "financial" },
  { text: "Which products are currently low on stock?", category: "inventory" },
  { text: "Show me our top 5 products by revenue.", category: "sales" },
  { text: "How much customer debt is currently outstanding?", category: "debts" },
  { text: "Break down our sales by payment method.", category: "sales" },
  { text: "What are our top operational expenses?", category: "financial" },
];

// ─── Markdown Renderer ────────────────────────────────────────────────────────
const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-xl font-black text-text-main mb-4 mt-6 pb-2 border-b border-border-color">{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-base font-bold text-text-main mb-3 mt-5">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2 mt-4">{line.slice(4)}</h3>);
    } else if (line.startsWith("---")) {
      elements.push(<hr key={i} className="border-border-color my-4" />);
    } else if (line.startsWith("| ")) {
      // Table parsing
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 3) {
        const headers = tableLines[0].split("|").filter((c) => c.trim()).map((c) => c.trim());
        const rows = tableLines.slice(2).map((row) =>
          row.split("|").filter((c) => c.trim()).map((c) => c.trim())
        );
        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-4 rounded-xl border border-border-color">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-bg-main">
                  {headers.map((h, j) => (
                    <th key={j} className="px-4 py-2.5 text-left font-bold text-text-secondary uppercase tracking-wider border-b border-border-color">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? "bg-bg-card" : "bg-bg-main/50"}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2.5 text-text-main border-b border-border-color/40">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    } else if (line.match(/^[-*] /)) {
      const listItems = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-2 space-y-1.5 ml-4">
          {listItems.map((item, j) => (
            <li key={j} className="text-xs text-text-secondary flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: applyInlineMarkdown(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (line.match(/^\d+\. /)) {
      const listItems = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        listItems.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-2 space-y-1.5 ml-4 list-decimal list-inside text-xs text-text-secondary">
          {listItems.map((item, j) => (
            <li key={j} className="text-xs text-text-secondary leading-relaxed">
              <span dangerouslySetInnerHTML={{ __html: applyInlineMarkdown(item) }} />
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-indigo-500 pl-4 py-1 my-3 text-xs text-text-secondary italic bg-indigo-500/5 rounded-r-lg">
          {line.slice(2)}
        </blockquote>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-xs text-text-secondary leading-relaxed mb-1"
          dangerouslySetInnerHTML={{ __html: applyInlineMarkdown(line) }}
        />
      );
    }
    i++;
  }
  return elements;
};

const applyInlineMarkdown = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-text-main'>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em class='italic'>$1</em>")
    .replace(/`(.*?)`/g, "<code class='bg-bg-main px-1.5 py-0.5 rounded text-indigo-400 font-mono text-[10px]'>$1</code>")
    .replace(/(Rs\.|ரூ\.)\s*([\d,.]+)/g, "<span class='font-bold text-emerald-500'>$1 $2</span>");
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AIReports = () => {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().setDate(1)).toISOString().split("T")[0];

  const [activeTab, setActiveTab] = useState("reports"); // "reports" | "chat"
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);
  const [selectedReport, setSelectedReport] = useState(null);
  const [customPrompt, setCustomPrompt] = useState("");
  
  // Reports states
  const [generatedReport, setGeneratedReport] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [expandedCategory, setExpandedCategory] = useState("sales");
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [language, setLanguage] = useState("en");

  // Chat states
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hi! I am your SmartStore LK Business Analyst. Ask me any individual questions about your store's sales, profit margins, outstanding debts, inventory stock values, or supplier payables for the selected period.",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [businessData, setBusinessData] = useState(null);

  const reportRef = useRef();
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === "chat" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // Reset business data when date range changes
  useEffect(() => {
    setBusinessData(null);
  }, [fromDate, toDate]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (selectedReport) {
      generateReport(selectedReport, null, lang);
    } else if (customPrompt) {
      generateReport(null, customPrompt, lang);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: reportTitle || "AI-Business-Report",
  });

  // Quick date presets
  const setPreset = (preset) => {
    const now = new Date();
    if (preset === "today") {
      setFromDate(today);
      setToDate(today);
    } else if (preset === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      setFromDate(start.toISOString().split("T")[0]);
      setToDate(today);
    } else if (preset === "month") {
      setFromDate(firstOfMonth);
      setToDate(today);
    } else if (preset === "year") {
      setFromDate(`${now.getFullYear()}-01-01`);
      setToDate(today);
    } else if (preset === "last30") {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      setFromDate(start.toISOString().split("T")[0]);
      setToDate(today);
    }
  };

  // Fetch Report Data helper
  const fetchReportData = async () => {
    const token = localStorage.getItem("token");
    const response = await API.get(
      `/analytics/report-data?from=${fromDate}&to=${toDate}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  };

  const generateReport = async (reportType, promptOverride, langOverride) => {
    const activeLang = langOverride || language;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "") {
      setApiKeyMissing(true);
      return;
    }
    setApiKeyMissing(false);
    setIsGenerating(true);
    setGeneratedReport("");
    setError("");

    try {
      // Fetch or use cached business data
      let data = businessData;
      if (!data) {
        data = await fetchReportData();
        setBusinessData(data);
      }

      const prompt = promptOverride || reportType?.prompt || "Generate a comprehensive business summary report.";
      const title = reportType?.label || "Custom Business Report";
      setReportTitle(activeLang === "ta" ? `${title} (தமிழ்)` : title);

      // Build the system context with the real data
      const systemContext = `
You are a professional business analyst AI for SmartStore LK, a retail POS & inventory management system.
Your task is to generate a professional, well-structured business report in Markdown format.

Use the following REAL business data for the period from ${data.period.from} to ${data.period.to}:

## SALES DATA
- Total Sales Transactions: ${data.sales.totalSalesCount}
- Gross Revenue: Rs. ${data.sales.grossRevenue.toLocaleString()}
- Total Paid: Rs. ${data.sales.totalPaid.toLocaleString()}
- Credit Extended: Rs. ${data.sales.totalCredit.toLocaleString()}
- Total Discounts Given: Rs. ${data.sales.totalDiscount.toLocaleString()}
- Total Tax Collected: Rs. ${data.sales.totalTax.toLocaleString()}
- Payment Methods: Cash Rs. ${data.sales.paymentMethodBreakdown.cash.toLocaleString()}, Card Rs. ${data.sales.paymentMethodBreakdown.card.toLocaleString()}, Bank Transfer Rs. ${data.sales.paymentMethodBreakdown.bank_transfer.toLocaleString()}, Credit Rs. ${data.sales.paymentMethodBreakdown.credit.toLocaleString()}
- Top Products by Revenue: ${data.sales.productSales.slice(0, 10).map(p => `${p.name} (Qty: ${p.qty}, Revenue: Rs. ${p.revenue.toLocaleString()})`).join("; ")}
- Daily Sales Trend: ${data.sales.dailySalesTrend.map(d => `${d.date}: Rs. ${d.revenue.toLocaleString()} (${d.count} sales)`).join(", ")}

## FINANCIAL DATA
- Total Income (all transactions): Rs. ${data.financial.totalIncome.toLocaleString()}
- Total Expenses: Rs. ${data.financial.totalExpenses.toLocaleString()}
- Net Profit: Rs. ${data.financial.netProfit.toLocaleString()}
- Profit Margin: ${data.financial.profitMargin}%
- Expense Breakdown: ${Object.entries(data.financial.expenseCategoryBreakdown).map(([k, v]) => `${k}: Rs. ${v.toLocaleString()}`).join(", ")}

## INVENTORY DATA
- Total Products: ${data.inventory.totalProducts}
- Total Stock Value (at cost): Rs. ${data.inventory.totalStockValue.toLocaleString()}
- Total Retail Value: Rs. ${data.inventory.totalRetailValue.toLocaleString()}
- Potential Profit from Stock: Rs. ${data.inventory.potentialProfit.toLocaleString()}
- Low Stock Items: ${data.inventory.lowStockProducts.length} products
- Out of Stock Items: ${data.inventory.outOfStockProducts.length} products
- Low Stock Products: ${data.inventory.lowStockProducts.map(p => `${p.name} (Stock: ${p.stock}, Min: ${p.minStockLevel})`).join("; ")}
- Out of Stock Products: ${data.inventory.outOfStockProducts.map(p => p.name).join(", ")}
- Category Breakdown: ${data.inventory.categoryBreakdown.map(c => `${c.category}: ${c.items} items, Rs. ${c.stockValue.toLocaleString()}`).join("; ")}

## RETURNS & REFUNDS
- Total Returns: ${data.returns.totalReturns}
- Total Refund Amount: Rs. ${data.returns.totalRefundAmount.toLocaleString()}

## CUSTOMER DEBTS (OUTSTANDING)
- Total Outstanding Customer Debt: Rs. ${data.debts.totalOutstandingDebt.toLocaleString()}
- Customers with Outstanding Debt: ${data.debts.totalDebtCustomers}

## SUPPLIER DATA
- Total Suppliers: ${data.suppliers.totalSuppliers}
- Total Outstanding Supplier Payables: Rs. ${data.suppliers.totalOutstandingPayable.toLocaleString()}

---

USER REQUEST: ${prompt}

INSTRUCTIONS:
- Write a professional, detailed report in Markdown format
- Language constraint: Write the entire report in ${activeLang === 'ta' ? 'Tamil (தமிழ்)' : 'English'}. Translate all headings, sections, explanations, analysis, recommendations, and labels to ${activeLang === 'ta' ? 'Tamil (தமிழ்)' : 'English'}.
- Start with a clear title (# heading) and period
- Use tables where appropriate for financial data
- Include key insights, recommendations, and action items at the end
- Use Rs. or ரூ. currency format throughout
- Be specific with numbers from the data provided
- Use ## for main sections, ### for subsections
- Provide actionable business insights based on the data
- The report should be comprehensive but well-organized
      `.trim();

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

      const result = await model.generateContentStream(systemContext);

      let fullText = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        setGeneratedReport(fullText);
      }
    } catch (err) {
      console.error("AI Report generation error:", err);
      const msg = err.message || "";
      if (
        msg.includes("API_KEY") ||
        msg.includes("API key") ||
        msg.includes("api key") ||
        msg.includes("PERMISSION_DENIED") ||
        msg.includes("invalid")
      ) {
        setApiKeyMissing(true);
        setError(`API key error: ${msg}`);
      } else if (
        msg.includes("429") ||
        msg.toLowerCase().includes("quota") ||
        msg.toLowerCase().includes("limit")
      ) {
        setError("Rate limit exceeded (API Error 429). Please wait 20-30 seconds and try generating the report again.");
      } else {
        setError(`Failed to generate report: ${msg || "Unknown error."}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Conversational Chat Submission
  const handleChatSubmit = async (e, customText = "") => {
    if (e) e.preventDefault();
    const promptToSend = customText || chatInput;
    if (!promptToSend.trim() || isChatTyping) return;

    // Add user message to history
    const userMsg = {
      sender: "user",
      text: promptToSend,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatTyping(true);

    // Append a placeholder for the upcoming streamed response
    setMessages((prev) => [
      ...prev,
      { sender: "ai", text: "", timestamp: new Date(), streaming: true },
    ]);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "") {
      setApiKeyMissing(true);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          sender: "ai",
          text: "API Key Missing. Please register VITE_GEMINI_API_KEY in client/.env.",
          timestamp: new Date(),
          error: true,
        };
        return next;
      });
      setIsChatTyping(false);
      return;
    }
    setApiKeyMissing(false);

    try {
      // Fetch or use cached business data
      let data = businessData;
      if (!data) {
        data = await fetchReportData();
        setBusinessData(data);
      }

      // Build chat prompt
      const systemContext = `
You are a friendly, highly intelligent business analyst assistant for SmartStore LK.
The user is asking an individual question about their store's performance. Respond in a concise, conversational, and direct manner. Keep the tone helpful, professional, and clear.

Use this REAL business data for the period from ${fromDate} to ${toDate} to answer the question:

${JSON.stringify(data, null, 2)}

Ensure you are specific and reference real figures from the data (in Rs. / ரூ. format) when appropriate. Format lists, bullet points, or mini-tables in markdown ONLY when it directly aids readability. Keep the overall reply conversational and brief.

User Question: ${promptToSend}
`;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

      const result = await model.generateContentStream(systemContext);

      let fullText = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            sender: "ai",
            text: fullText,
            timestamp: new Date(),
            streaming: true,
          };
          return next;
        });
      }

      // Finalize message state
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          sender: "ai",
          text: fullText,
          timestamp: new Date(),
          streaming: false,
        };
        return next;
      });

    } catch (err) {
      console.error(err);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          sender: "ai",
          text: `Failed to answer: ${err.message || "Unknown error."}`,
          timestamp: new Date(),
          error: true,
        };
        return next;
      });
    } finally {
      setIsChatTyping(false);
    }
  };

  const handleReportClick = (report) => {
    setSelectedReport(report);
    setCustomPrompt("");
    generateReport(report);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    setSelectedReport(null);
    generateReport(null, customPrompt);
  };

  const colorMap = {
    indigo: {
      bg: "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 hover:border-indigo-500/40",
      activeBg: "bg-indigo-600 border-indigo-600",
      icon: "text-indigo-500",
      activeIcon: "text-white",
      label: "text-indigo-500",
      header: "bg-indigo-500/10 border-indigo-500/20",
      headerText: "text-indigo-500",
    },
    emerald: {
      bg: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 hover:border-emerald-500/40",
      activeBg: "bg-emerald-600 border-emerald-600",
      icon: "text-emerald-500",
      activeIcon: "text-white",
      label: "text-emerald-500",
      header: "bg-emerald-500/10 border-emerald-500/20",
      headerText: "text-emerald-500",
    },
    violet: {
      bg: "bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20 hover:border-violet-500/40",
      activeBg: "bg-violet-600 border-violet-600",
      icon: "text-violet-500",
      activeIcon: "text-white",
      label: "text-violet-500",
      header: "bg-violet-500/10 border-violet-500/20",
      headerText: "text-violet-500",
    },
  };

  return (
    <DashboardLayout>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <FaRobot className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-main flex items-center gap-2">
              AI Report & Q&A Agent
              <span className="flex items-center gap-1 text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Live
              </span>
            </h1>
            <p className="text-text-secondary text-xs mt-0.5">
              Compile full analytical business reports or chat live with your personal analyst
            </p>
          </div>
        </div>

        {activeTab === "reports" && generatedReport && (
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
          >
            <FaPrint />
            Print Report
          </button>
        )}
      </div>

      {/* ── API Key Warning ───────────────────────────────────────────────── */}
      {apiKeyMissing && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
          <FaKey className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-500">Gemini API Key Required</p>
            <p className="text-xs text-text-secondary mt-1">
              To use AI capabilities, add your Gemini API key to{" "}
              <code className="bg-bg-main px-1 py-0.5 rounded text-indigo-400 font-mono">client/.env</code>:{" "}
              <code className="bg-bg-main px-1 py-0.5 rounded text-indigo-400 font-mono">VITE_GEMINI_API_KEY=your_key</code>
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-indigo-500 hover:text-indigo-400 underline underline-offset-2"
            >
              Get free API key from Google AI Studio →
            </a>
          </div>
        </div>
      )}

      {/* ── Tabs Navigation ────────────────────────────────────────────────── */}
      <div className="flex border-b border-border-color mb-6 gap-6">
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "reports"
              ? "border-indigo-500 text-indigo-500"
              : "border-transparent text-text-secondary hover:text-text-main"
          }`}
        >
          <FaChartBar className="text-[10px]" />
          Reports Builder
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "chat"
              ? "border-indigo-500 text-indigo-500"
              : "border-transparent text-text-secondary hover:text-text-main"
          }`}
        >
          <FaCommentDots className="text-[10px]" />
          AI Business Q&A Chat
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-full items-start">
        {/* ── LEFT PANEL: Global Controls + Tab-Specific controls ──────────── */}
        <div className="xl:col-span-2 space-y-5">
          {/* Global: Date Range Selector */}
          <div className="bg-bg-card border border-border-color rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Analysis Period</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-text-secondary mb-1 block">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full border border-border-color bg-bg-main text-text-main px-3 py-2 rounded-xl outline-none text-xs font-semibold focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-secondary mb-1 block">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full border border-border-color bg-bg-main text-text-main px-3 py-2 rounded-xl outline-none text-xs font-semibold focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Today", key: "today" },
                { label: "This Week", key: "week" },
                { label: "This Month", key: "month" },
                { label: "Last 30 Days", key: "last30" },
                { label: "This Year", key: "year" },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPreset(p.key)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-border-color text-text-secondary hover:border-indigo-500/50 hover:text-indigo-500 hover:bg-indigo-500/5 transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* REPORTS TAB LEFT CONTROLS */}
          {activeTab === "reports" && (
            <>
              {/* Language Selector */}
              <div className="bg-bg-card border border-border-color rounded-2xl p-4 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Report Language</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("en")}
                    disabled={isGenerating}
                    className={`flex-1 text-xs font-bold py-2.5 rounded-xl border transition-all cursor-pointer text-center ${
                      language === "en"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "border-border-color text-text-secondary hover:border-indigo-500/50 hover:text-indigo-500 hover:bg-indigo-500/5 bg-bg-main"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("ta")}
                    disabled={isGenerating}
                    className={`flex-1 text-xs font-bold py-2.5 rounded-xl border transition-all cursor-pointer text-center ${
                      language === "ta"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "border-border-color text-text-secondary hover:border-indigo-500/50 hover:text-indigo-500 hover:bg-indigo-500/5 bg-bg-main"
                    }`}
                  >
                    தமிழ் (Tamil)
                  </button>
                </div>
              </div>

              {/* Accordion Categories */}
              <div className="space-y-3">
                {REPORT_CATEGORIES.map((cat) => {
                  const colors = colorMap[cat.color];
                  const isExpanded = expandedCategory === cat.id;
                  return (
                    <div key={cat.id} className="bg-bg-card border border-border-color rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-all ${colors.header} border-b border-transparent`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`text-sm ${colors.headerText}`}>{cat.icon}</span>
                          <span className={`text-xs font-bold ${colors.headerText}`}>{cat.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colors.header} ${colors.headerText} font-bold`}>
                            {cat.reports.length}
                          </span>
                        </div>
                        <span className={`text-xs ${colors.headerText}`}>
                          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="p-3 grid grid-cols-1 gap-2">
                          {cat.reports.map((report) => {
                            const isActive = selectedReport?.id === report.id;
                            return (
                              <button
                                key={report.id}
                                onClick={() => handleReportClick(report)}
                                disabled={isGenerating}
                                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold disabled:opacity-50 ${
                                  isActive
                                    ? `${colors.activeBg} text-white`
                                    : `${colors.bg} text-text-secondary hover:text-text-main`
                                }`}
                              >
                                <span className={`text-sm ${isActive ? colors.activeIcon : colors.icon}`}>
                                  {report.icon}
                                </span>
                                {report.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* One-off prompt */}
              <div className="bg-bg-card border border-border-color rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                  Custom Report Focus
                </p>
                <form onSubmit={handleCustomSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe specific custom report focus..."
                    className="flex-1 border border-border-color bg-bg-main text-text-main px-3 py-2 rounded-xl outline-none text-xs focus:border-indigo-500 transition-all placeholder:text-text-secondary/50"
                    disabled={isGenerating}
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !customPrompt.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    {isGenerating ? <FaSpinner className="animate-spin text-sm" /> : <FaPaperPlane className="text-sm" />}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* CHAT TAB LEFT CONTROLS (Suggestions) */}
          {activeTab === "chat" && (
            <div className="bg-bg-card border border-border-color rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <FaLightbulb className="text-indigo-500 text-[10px]" />
                Suggested Questions
              </p>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                Click any prompt below to query the active range ({fromDate} to {toDate}) instantly:
              </p>
              <div className="grid grid-cols-1 gap-2 pt-1">
                {CHAT_SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={(e) => handleChatSubmit(e, suggestion.text)}
                    disabled={isChatTyping}
                    className="text-left px-3.5 py-2.5 rounded-xl border border-border-color/80 bg-bg-main/30 hover:bg-indigo-600/5 hover:border-indigo-500/20 text-xs font-semibold text-text-secondary hover:text-indigo-500 transition-all duration-150 disabled:opacity-50 cursor-pointer"
                  >
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Tab Contents ────────────────────────────────────── */}
        <div className="xl:col-span-3 h-[680px]">
          {/* TAB 1: REPORTS BUILDER */}
          {activeTab === "reports" && (
            <div className="bg-bg-card border border-border-color rounded-2xl h-full overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-color">
                <div className="flex items-center gap-2">
                  <FaMagic className="text-indigo-500 text-xs" />
                  <span className="text-xs font-bold text-text-main">
                    {reportTitle || "Report Output"}
                  </span>
                  {isGenerating && (
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold animate-pulse">
                      Generating...
                    </span>
                  )}
                </div>
                {generatedReport && !isGenerating && (
                  <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    ✓ Complete
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {!generatedReport && !isGenerating && !error && (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center">
                      <FaRobot className="text-4xl text-indigo-500/60" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-text-main">Report Builder</p>
                      <p className="text-xs text-text-secondary mt-1 max-w-xs">
                        Select a report template from the left categories to build a full PDF-ready business analysis report.
                      </p>
                    </div>
                  </div>
                )}

                {isGenerating && !generatedReport && (
                  <div className="h-full flex flex-col items-center justify-center gap-3 py-16">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                      <FaSpinner className="text-indigo-500 text-xl animate-spin" />
                    </div>
                    <p className="text-sm font-bold text-text-main">Fetching ledger data...</p>
                    <p className="text-xs text-text-secondary">Structuring data and compiling layout</p>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
                    <FaInfoCircle className="text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-rose-500">{error}</p>
                  </div>
                )}

                {generatedReport && (
                  <div ref={reportRef} className="print:p-8 print:bg-white print:text-slate-950">
                    {/* Print Header */}
                    <div className="hidden print:block text-center border-b pb-4 mb-6">
                      <h1 className="text-2xl font-black uppercase text-slate-900">SmartStore LK</h1>
                      <p className="text-xs text-slate-500 font-semibold tracking-wider mt-1">AI-GENERATED BUSINESS REPORT</p>
                      <p className="text-sm font-bold mt-1">Period: {fromDate} to {toDate}</p>
                    </div>

                    <div className="prose prose-sm max-w-none">
                      {renderMarkdown(generatedReport)}
                    </div>

                    {isGenerating && (
                      <div className="flex items-center gap-2 mt-4 text-xs text-text-secondary">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="animate-pulse">AI is still writing...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE Q&A CHAT */}
          {activeTab === "chat" && (
            <div className="bg-bg-card border border-border-color rounded-2xl h-full flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-color bg-bg-main/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600/10 text-indigo-500 flex items-center justify-center">
                    <FaCommentDots className="text-[10px]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text-main">Analyst Assistant Chat</h3>
                    <p className="text-[9px] text-text-secondary mt-0.5 font-medium">
                      Answering questions for period: <span className="text-indigo-500 font-semibold">{fromDate}</span> to <span className="text-indigo-500 font-semibold">{toDate}</span>
                    </p>
                  </div>
                </div>
                {isChatTyping && (
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    Typing...
                  </span>
                )}
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((msg, index) => {
                  const isAi = msg.sender === "ai";
                  return (
                    <div
                      key={index}
                      className={`flex gap-3 max-w-[85%] ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${
                        isAi 
                          ? "bg-indigo-600/10 text-indigo-500 border border-indigo-500/10" 
                          : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
                      }`}>
                        {isAi ? <FaRobot className="text-[10px]" /> : "U"}
                      </div>

                      {/* Bubble */}
                      <div className={`rounded-2xl p-4 text-xs ${
                        isAi
                          ? "bg-bg-main border border-border-color text-text-main rounded-tl-none"
                          : "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10"
                      }`}>
                        {msg.streaming && !msg.text ? (
                          <div className="flex items-center gap-1.5 py-1">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                          </div>
                        ) : isAi ? (
                          <div className="prose prose-sm max-w-none prose-invert">
                            {renderMarkdown(msg.text)}
                          </div>
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                        )}
                        <p className={`text-[8px] mt-2 text-right opacity-40 font-medium ${isAi ? "text-text-secondary" : "text-white"}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat input bar */}
              <form onSubmit={(e) => handleChatSubmit(e)} className="p-4 border-t border-border-color bg-bg-main/30 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question about sales, stock levels, profit margins..."
                  disabled={isChatTyping}
                  className="flex-1 bg-bg-card border border-border-color text-text-main px-4 py-2.5 rounded-xl outline-none text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all placeholder:text-text-secondary/40 shadow-xs"
                />
                <button
                  type="submit"
                  disabled={isChatTyping || !chatInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-[0.97] cursor-pointer shadow-md shadow-indigo-600/10 shrink-0"
                >
                  {isChatTyping ? (
                    <FaSpinner className="animate-spin text-xs" />
                  ) : (
                    <FaPaperPlane className="text-xs" />
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIReports;
