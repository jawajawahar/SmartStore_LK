const AuditLog = require("../models/AuditLog");

/**
 * Creates and saves an AuditLog entry.
 * @param {Object} params
 * @param {Object} params.req - The Express request object containing user information and request headers.
 * @param {string} params.action - The type of action performed ("create" | "update" | "delete" | "login" | "logout" | "status_change").
 * @param {string} params.entity - The entity target ("Product" | "Sale" | "Return" | "Transaction" | "User" etc.).
 * @param {string} [params.entityId] - The ID of the affected document.
 * @param {Object} [params.changes] - The key-value delta of changes (e.g. { old: { stock: 10 }, new: { stock: 15 } }).
 * @param {string} [params.description] - Human-readable description of what transpired.
 */
const logAudit = async ({ req, action, entity, entityId, changes, description }) => {
  try {
    const user = req.user;
    if (!user) {
      console.warn("Audit Log Warning: No authenticated user in request context.");
      return;
    }

    // Capture IP Address (handle standard proxy headers)
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    const auditEntry = new AuditLog({
      user: user.id || user._id,
      userName: user.name,
      userRole: user.role,
      action,
      entity,
      entityId: entityId || null,
      changes: changes || null,
      description: description || "",
      ipAddress,
      userAgent,
    });

    await auditEntry.save();
  } catch (err) {
    console.error("Audit log saving failed:", err);
  }
};

module.exports = { logAudit };
