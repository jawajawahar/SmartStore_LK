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

      {/* ────── Centered Pop-up Modal ────── */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-2xl bg-bg-card rounded-2xl shadow-2xl border border-border-color/60 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border-color/50 bg-bg-main/30">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm ${getActionColor(selectedLog.action)}`}>
                    {getActionIcon(selectedLog.action)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-main">Audit Event Details</h2>
                    <p className="text-sm font-mono text-text-secondary mt-0.5">
                      Log ID: #{selectedLog._id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-10 h-10 rounded-full bg-bg-main hover:bg-rose-500/10 border border-border-color hover:border-rose-500/30 flex items-center justify-center text-text-secondary hover:text-rose-500 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Status Row */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action.replace("_", " ")}
                  </span>
                  <div className="px-4 py-2 rounded-lg bg-bg-main border border-border-color/50 text-sm font-medium text-text-main">
                    Target: <span className="font-bold">{selectedLog.entity}</span>
                  </div>
                  {selectedLog.entityId && (
                    <div className="px-4 py-2 rounded-lg bg-bg-main border border-border-color/50 text-sm font-mono text-text-secondary">
                      ID: {selectedLog.entityId.toString().slice(-6).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Event Description */}
                <div className="bg-bg-main rounded-xl p-5 border border-border-color/50">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-base text-text-main leading-relaxed">
                    {selectedLog.description}
                  </p>
                </div>

                {/* Two Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-bg-main rounded-xl p-5 border border-border-color/50">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Performed By</h3>
                    <p className="text-lg font-bold text-text-main">
                      {selectedLog.userName}
                    </p>
                    <p className="text-sm font-semibold text-indigo-500 mt-1 uppercase">
                      {selectedLog.userRole}
                    </p>
                  </div>

                  <div className="bg-bg-main rounded-xl p-5 border border-border-color/50">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Date & Time</h3>
                    <p className="text-lg font-bold text-text-main">
                      {new Date(selectedLog.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-sm font-medium text-text-secondary mt-1">
                      {new Date(selectedLog.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
                    </p>
                  </div>
                </div>

                {/* Structured Changes */}
                {selectedLog.changes && (
                  <div className="pt-2">
                    {renderChanges(selectedLog.changes)}
                  </div>
                )}

                {/* System Info */}
                <div className="bg-bg-main rounded-xl p-5 border border-border-color/50">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">System Context</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 border-b border-border-color/40 pb-4">
                      <span className="text-sm font-semibold text-text-secondary w-32 shrink-0">IP Address</span>
                      <span className="text-sm font-mono text-text-main">{selectedLog.ipAddress || "Unknown"}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                      <span className="text-sm font-semibold text-text-secondary w-32 shrink-0">Device / Browser</span>
                      <span className="text-sm font-mono text-text-main break-all">{selectedLog.userAgent || "Not captured"}</span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default AuditLogs;
