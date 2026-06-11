const Supplier = require("../models/Supplier");
const SupplierPayable = require("../models/SupplierPayable");

const reconcileSupplierBalances = async () => {
  try {
    console.log("Starting supplier balance reconciliation...");
    const suppliers = await Supplier.find();
    let fixedCount = 0;

    for (const supplier of suppliers) {
      // Find all payables for this supplier
      const payables = await SupplierPayable.find({ supplier: supplier._id });
      const totalRemainingPayable = payables.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);

      if (supplier.payableAmount !== totalRemainingPayable) {
        console.log(`[Reconciler] Mismatch for supplier "${supplier.name}" (${supplier._id}):`);
        console.log(`  Current payableAmount: Rs. ${supplier.payableAmount}`);
        console.log(`  Sum of payables remainingAmount: Rs. ${totalRemainingPayable}`);

        if (supplier.payableAmount > totalRemainingPayable) {
          // Outstanding balance exists with no transaction record.
          // Create a pending SupplierPayable record for the difference.
          const diff = supplier.payableAmount - totalRemainingPayable;
          const newPayable = new SupplierPayable({
            supplier: supplier._id,
            description: "Opening balance / Imported outstanding amount (Reconciled)",
            totalAmount: diff,
            paidAmount: 0,
            remainingAmount: diff,
            status: "pending",
          });
          await newPayable.save();
          console.log(`  -> Auto-created SupplierPayable transaction for difference: Rs. ${diff}`);
        } else {
          // If supplier's payableAmount is less, correct the supplier's payableAmount to match.
          supplier.payableAmount = totalRemainingPayable;
          await supplier.save();
          console.log(`  -> Corrected supplier's payableAmount to match payables total: Rs. ${totalRemainingPayable}`);
        }
        fixedCount++;
      }
    }
    console.log(`Supplier balance reconciliation completed. Inspected ${suppliers.length} supplier(s), repaired ${fixedCount}.`);
  } catch (error) {
    console.error("Error during supplier balance reconciliation:", error);
  }
};

module.exports = { reconcileSupplierBalances };
