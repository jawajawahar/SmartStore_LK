import { useEffect, useState } from "react";
import { FaShieldAlt, FaTimes, FaUser, FaClock, FaDesktop, FaGlobe, FaSearch, FaFilter, FaInfoCircle } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import Pagination from "../../components/Pagination";

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/audit-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuditLogs(response.data);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const getActionColor = (action) => {
    switch (action) {
      case "create": return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15";
      case "delete": return "bg-rose-500/10 text-rose-500 border border-rose-500/15";
      case "update": return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/15";
      case "status_change": return "bg-amber-500/10 text-amber-500 border border-amber-500/15";
      case "login": return "bg-cyan-500/10 text-cyan-500 border border-cyan-500/15";
      default: return "bg-slate-500/10 text-slate-500 border border-slate-500/10";
    }
  };

  const getActionDot = (action) => {
    switch (action) {
      case "create": return "bg-emerald-500";
      case "delete": return "bg-rose-500";
      case "update": return "bg-indigo-500";
      case "status_change": return "bg-amber-500";
      case "login": return "bg-cyan-500";
      default: return "bg-slate-500";
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "create": return "➕";
      case "delete": return "🗑️";
      case "update": return "✏️";
      case "status_change": return "🔄";
      case "login": return "🔐";
      default: return "📋";
    }
  };

  // Extract unique values for filters
  const uniqueActions = [...new Set(auditLogs.map(l => l.action))];
  const uniqueEntities = [...new Set(auditLogs.map(l => l.entity))];
  const uniqueUsers = [...new Set(auditLogs.map(l => l.userName))];

  // Apply filters
  const filteredLogs = auditLogs.filter(log => {
    const matchSearch = searchQuery === "" ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchAction = filterAction === "all" || log.action === filterAction;
    const matchEntity = filterEntity === "all" || log.entity === filterEntity;
    const matchUser = filterUser === "all" || log.userName === filterUser;
    return matchSearch && matchAction && matchEntity && matchUser;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterAction, filterEntity, filterUser]);

  // Truncate description for table view
  const truncate = (str, len = 60) => {
    if (!str) return "—";
    return str.length > len ? str.substring(0, len) + "..." : str;
  };

  // Parse structured changes for detail view
  const renderChanges = (changes) => {
    if (!changes) return null;

    if (changes.items && Array.isArray(changes.items)) {
      // Sale checkout — show itemized breakdown
      return (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Itemized Breakdown</h4>
          <div className="bg-bg-main/50 rounded-xl border border-border-color/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-color/50 text-text-secondary">
                  <th className="py-2 px-3 text-left font-semibold">Item</th>
                  <th className="py-2 px-3 text-center font-semibold">Qty</th>
                  <th className="py-2 px-3 text-right font-semibold">Price</th>
                  <th className="py-2 px-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/30">
                {changes.items.map((item, i) => (
                  <tr key={i} className="text-text-main">
                    <td className="py-2 px-3 font-semibold">{item.name}</td>
                    <td className="py-2 px-3 text-center">{item.qty}</td>
                    <td className="py-2 px-3 text-right">Rs.{Number(item.price).toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-500">Rs.{Number(item.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-2">
            {changes.totalAmount != null && (
              <div className="bg-bg-main/50 rounded-lg p-3 border border-border-color/30">
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Subtotal</p>
                <p className="text-sm font-bold text-text-main mt-0.5">Rs.{Number(changes.totalAmount).toLocaleString()}</p>
              </div>
            )}
            {changes.discountAmount > 0 && (
              <div className="bg-bg-main/50 rounded-lg p-3 border border-border-color/30">
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Discount</p>
                <p className="text-sm font-bold text-rose-500 mt-0.5">-Rs.{Number(changes.discountAmount).toLocaleString()}</p>
              </div>
            )}
            {changes.taxAmount > 0 && (
              <div className="bg-bg-main/50 rounded-lg p-3 border border-border-color/30">
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Tax</p>
                <p className="text-sm font-bold text-text-main mt-0.5">Rs.{Number(changes.taxAmount).toLocaleString()}</p>
              </div>
            )}
            {changes.netAmount != null && (
              <div className="bg-bg-main/50 rounded-lg p-3 border border-border-color/30">
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Net Amount</p>
                <p className="text-sm font-bold text-text-main mt-0.5">Rs.{Number(changes.netAmount).toLocaleString()}</p>
              </div>
            )}
            {changes.paidAmount != null && (
              <div className="bg-bg-main/50 rounded-lg p-3 border border-border-color/30">
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Paid</p>
                <p className="text-sm font-bold text-emerald-500 mt-0.5">Rs.{Number(changes.paidAmount).toLocaleString()}</p>
              </div>
            )}
            {changes.remainingAmount > 0 && (
              <div className="bg-rose-500/5 rounded-lg p-3 border border-rose-500/15">
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Outstanding</p>
                <p className="text-sm font-bold text-rose-500 mt-0.5">Rs.{Number(changes.remainingAmount).toLocaleString()}</p>
              </div>
            )}
            {changes.paymentMethod && (
              <div className="bg-bg-main/50 rounded-lg p-3 border border-border-color/30">
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Payment Method</p>
                <p className="text-sm font-bold text-text-main mt-0.5 capitalize">{changes.paymentMethod}</p>
              </div>
            )}
            {changes.customer && (
              <div className="bg-bg-main/50 rounded-lg p-3 border border-border-color/30">
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Customer</p>
                <p className="text-sm font-bold text-text-main mt-0.5">{changes.customer}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Generic changes — key-value pairs
    if (typeof changes === "object") {
      const entries = Object.entries(changes).filter(([, v]) => v != null && v !== "");
      if (entries.length === 0) return null;

      return (
        <div>
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Change Data</h4>
          <div className="bg-bg-main/50 rounded-xl border border-border-color/50 divide-y divide-border-color/30">
            {entries.map(([key, value]) => (
              <div key={key} className="flex items-start justify-between px-3 py-2 text-xs gap-4">
                <span className="text-text-secondary font-mono shrink-0">{key}</span>
                <span className="text-text-main font-semibold text-right break-all">
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-main">Action Audit Logs</h1>
        <p className="text-text-secondary text-sm mt-1">
          Trace all system modifications, stock adjustments, logins, invoice returns, and manual deletions
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-bg-card border border-border-color rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/40 text-xs" />
            <input
              type="text"
              placeholder="Search logs by user, entity, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-bg-main border border-border-color rounded-xl text-xs text-text-main placeholder-text-secondary/40 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1.5">
            <FaFilter className="text-text-secondary/40 text-[10px]" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-bg-main border border-border-color rounded-lg px-2.5 py-2 text-xs text-text-main outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(a => (
                <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1).replace("_", " ")}</option>
              ))}
            </select>
          </div>

          {/* Entity Filter */}
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="bg-bg-main border border-border-color rounded-lg px-2.5 py-2 text-xs text-text-main outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="all">All Targets</option>
            {uniqueEntities.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>

          {/* User Filter */}
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="bg-bg-main border border-border-color rounded-lg px-2.5 py-2 text-xs text-text-main outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="all">All Users</option>
            {uniqueUsers.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          {/* Refresh */}
          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 shadow-md shadow-indigo-600/10 ml-auto"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Active filter count */}
        {(searchQuery || filterAction !== "all" || filterEntity !== "all" || filterUser !== "all") && (
          <div className="flex items-center gap-2 mt-3 text-[11px]">
            <span className="text-text-secondary">Showing {filteredLogs.length} of {auditLogs.length} events (Page {currentPage} of {totalPages || 1})</span>
            <button
              onClick={() => { setSearchQuery(""); setFilterAction("all"); setFilterEntity("all"); setFilterUser("all"); }}
              className="text-indigo-500 hover:text-indigo-400 font-bold cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Results count when no filters */}
        {!(searchQuery || filterAction !== "all" || filterEntity !== "all" || filterUser !== "all") && auditLogs.length > ITEMS_PER_PAGE && (
          <div className="flex items-center gap-2 mt-3 text-[11px]">
            <span className="text-text-secondary">{auditLogs.length} total events · Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, auditLogs.length)}</span>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-bg-card border border-border-color rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-8 h-8 bg-border-color/20 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-border-color/20 rounded w-3/4" />
                  <div className="h-3 bg-border-color/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16">
            <FaShieldAlt className="text-4xl text-text-secondary/20 mx-auto mb-3" />
            <p className="text-text-secondary text-sm">No audit log entries match your filters.</p>
            <p className="text-text-secondary/60 text-xs mt-1">Try adjusting your search criteria or clear the filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-color/40">
            {paginatedLogs.map((log) => (
              <div
                key={log._id}
                onClick={() => setSelectedLog(log)}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-indigo-500/[0.03] cursor-pointer transition-all group"
              >
                {/* Action Dot */}
                <div className="mt-1 shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${getActionDot(log.action)} ring-4 ring-bg-card`} />
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-text-main">{log.userName}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getActionColor(log.action)}`}>
                      {log.action.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-text-secondary font-semibold bg-bg-main px-1.5 py-0.5 rounded border border-border-color/40">
                      {log.entity}
                    </span>
                    {log.entityId && (
                      <span className="text-[9px] text-text-secondary/60 font-mono">#{log.entityId.toString().slice(-6).toUpperCase()}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1 leading-relaxed truncate">
                    {truncate(log.description, 120)}
                  </p>
                </div>

                {/* Timestamp + Arrow */}
                <div className="shrink-0 text-right">
                  <div className="text-[10px] text-text-secondary font-semibold">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-[9px] text-text-secondary/60">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                {/* Click Hint */}
                <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FaInfoCircle className="text-indigo-500/40 text-sm" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredLogs.length > ITEMS_PER_PAGE && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* ────── Detail Slide-Over Panel ────── */}
      <AnimatePresence>
        {selectedLog && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-bg-card border-l border-border-color shadow-2xl z-50 flex flex-col"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between p-5 border-b border-border-color shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${getActionColor(selectedLog.action)}`}>
                    {getActionIcon(selectedLog.action)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-text-main">Event Details</h2>
                    <p className="text-[10px] text-text-secondary font-mono mt-0.5">
                      #{selectedLog._id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-8 h-8 rounded-lg bg-bg-main border border-border-color flex items-center justify-center text-text-secondary hover:text-text-main hover:border-rose-500/30 cursor-pointer transition-all"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>

              {/* Panel Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Action Badge */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action.replace("_", " ")}
                  </span>
                  <span className="text-xs font-semibold text-text-main bg-bg-main px-2.5 py-1 rounded-lg border border-border-color/40">
                    {selectedLog.entity}
                  </span>
                  {selectedLog.entityId && (
                    <span className="text-[10px] text-text-secondary font-mono bg-bg-main px-2 py-1 rounded-lg border border-border-color/40">
                      #{selectedLog.entityId.toString().slice(-6).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* User Info Card */}
                <div className="bg-bg-main/60 rounded-xl border border-border-color/50 p-4">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FaUser className="text-[10px]" /> Performed By
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold text-sm">
                      {selectedLog.userName ? selectedLog.userName.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-main">{selectedLog.userName}</p>
                      <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mt-0.5">{selectedLog.userRole}</p>
                    </div>
                  </div>
                </div>

                {/* Timestamp Card */}
                <div className="bg-bg-main/60 rounded-xl border border-border-color/50 p-4">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FaClock className="text-[10px]" /> Timestamp
                  </h4>
                  <p className="text-sm font-semibold text-text-main">
                    {new Date(selectedLog.createdAt).toLocaleDateString("en-US", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric"
                    })}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {new Date(selectedLog.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
                    })}
                  </p>
                </div>

                {/* Description Card */}
                <div className="bg-bg-main/60 rounded-xl border border-border-color/50 p-4">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Full Description</h4>
                  <p className="text-xs text-text-main leading-relaxed whitespace-pre-wrap">
                    {selectedLog.description || "No description provided."}
                  </p>
                </div>

                {/* Structured Changes */}
                {selectedLog.changes && renderChanges(selectedLog.changes)}

                {/* Client Info Card */}
                <div className="bg-bg-main/60 rounded-xl border border-border-color/50 p-4">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Client Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <FaGlobe className="text-text-secondary/50 mt-0.5 text-[10px] shrink-0" />
                      <div>
                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">IP Address</p>
                        <p className="text-xs text-text-main font-mono mt-0.5">{selectedLog.ipAddress || "Unknown"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <FaDesktop className="text-text-secondary/50 mt-0.5 text-[10px] shrink-0" />
                      <div>
                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">User Agent</p>
                        <p className="text-xs text-text-main font-mono mt-0.5 break-all leading-relaxed">{selectedLog.userAgent || "Not captured"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default AuditLogs;
