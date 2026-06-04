import React from "react";

const PrintableInvoice = React.forwardRef(({ invoice }, ref) => {
  return (
    <div ref={ref} className="bg-white text-black p-8 w-full font-mono text-xs">
      {/* Header */}
      <div className="text-center border-b border-dashed border-slate-400 pb-5">
        <h1 className="text-2xl font-bold uppercase tracking-tight">SmartStore LK</h1>
        <p className="text-[10px] text-gray-600 mt-1 uppercase font-semibold">Grocery & Cosmetic Supermarket</p>
        <p className="text-[9px] text-gray-500 mt-0.5">Colombo, Sri Lanka</p>
        <p className="text-[9px] text-gray-500 mt-4">
          Date/Time: {new Date(invoice.sale.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Customer details */}
      <div className="my-5 py-3 border-b border-slate-100 space-y-1.5">
        <div className="flex justify-between">
          <span className="text-gray-500 uppercase font-semibold text-[10px]">Customer:</span>
          <span className="font-bold text-slate-900 uppercase">
            {invoice.sale.customer?.name || "Walk-in Customer"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 uppercase font-semibold text-[10px]">Payment Method:</span>
          <span className="font-bold text-slate-900 uppercase">
            {invoice.sale.paymentMethod}
          </span>
        </div>
      </div>

      {/* Purchased Items Table */}
      <div className="my-6">
        <div className="flex justify-between border-b border-black pb-1.5 uppercase font-bold text-[9px] text-gray-600">
          <span className="w-1/2">Item Name</span>
          <span className="w-1/6 text-center">Qty</span>
          <span className="w-1/3 text-right">Total (Rs.)</span>
        </div>

        <div className="divide-y divide-slate-100 mt-1">
          {invoice.sale.items.map((item, index) => (
            <div key={index} className="py-2 flex justify-between items-center">
              <div className="w-1/2">
                <p className="font-bold text-slate-900 leading-tight">{item.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Rs. {Number(item.price).toLocaleString()} / {item.unit}</p>
              </div>
              <span className="w-1/6 text-center text-slate-800">
                {item.quantity}
              </span>
              <span className="w-1/3 text-right font-bold text-slate-900">
                Rs. {Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary calculations */}
      <div className="border-t border-dashed border-slate-400 pt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500 uppercase font-semibold text-[9px]">Subtotal</span>
          <span className="font-bold text-slate-900">
            Rs. {Number(invoice.sale.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-emerald-700 uppercase font-semibold text-[9px]">Paid Amount</span>
          <span className="font-bold text-emerald-800">
            Rs. {Number(invoice.sale.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-rose-700 uppercase font-semibold text-[9px]">Remaining Due</span>
          <span className="font-bold text-rose-800">
            Rs. {Number(invoice.sale.remainingAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Payment history transactions */}
      {invoice.transactions && invoice.transactions.length > 0 && (
        <div className="mt-8 pt-4 border-t border-slate-100">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-3">Payment Receipts Ledger</h2>

          <div className="divide-y divide-slate-100">
            {invoice.transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="py-2 flex justify-between items-center text-[10px]"
              >
                <div>
                  <p className="font-semibold text-slate-900">{transaction.title}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-slate-950">Rs. {Number(transaction.amount).toLocaleString()}</p>
                  <p className="text-[9px] uppercase text-gray-500">{transaction.paymentMethod}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer message */}
      <div className="mt-10 border-t border-dashed border-slate-400 pt-5 text-center">
        <h3 className="text-xs font-bold uppercase tracking-wider">Thank You ❤️</h3>
        <p className="text-[10px] text-gray-600 mt-1">SmartStore LK POS platform receipt</p>
      </div>
    </div>
  );
});

export default PrintableInvoice;

