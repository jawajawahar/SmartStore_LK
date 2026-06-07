import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";

const POS = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  const [invoiceData, setInvoiceData] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // Fetch Products
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await API.get("/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProducts(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch Customers
  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await API.get("/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCustomers(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
    fetchCustomers();
  }, []);

  // Add To Cart
  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.product === product._id);

    if (existingItem) {
      setCart(
        cart.map((item) => {
          if (item.product === product._id) {
            // FIXED PRODUCTS
            if (item.productType !== "weighted") {
              const qty = item.quantity + 1;

              return {
                ...item,
                quantity: qty,
                total: qty * item.price,
              };
            }

            return item;
          }

          return item;
        }),
      );
    } else {
      setCart([
        ...cart,
        {
          product: product._id,
          name: product.name,
          quantity: product.productType === "weighted" ? 0 : 1,
          price: product.sellingPrice,
          total: product.productType === "weighted" ? 0 : product.sellingPrice,
          productType: product.productType,
          unit: product.unit || "pcs",
        },
      ]);
    }
  };

  // Increase Quantity
  const increaseQty = (id) => {
    setCart(
      cart.map((item) =>
        item.product === id
          ? {
            ...item,
            quantity: item.quantity + 1,
            total: (item.quantity + 1) * item.price,
          }
          : item,
      ),
    );
  };

  // Decrease Quantity
  const decreaseQty = (id) => {
    setCart(
      cart
        .map((item) =>
          item.product === id
            ? {
              ...item,
              quantity: item.quantity - 1,
              total: (item.quantity - 1) * item.price,
            }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  // Update Weight
  const updateWeight = (id, value) => {
    setCart(
      cart.map((item) => {
        if (item.product === id) {
          const qty = parseFloat(value) || 0;

          return {
            ...item,
            quantity: qty,
            total: qty * item.price,
          };
        }

        return item;
      }),
    );
  };

  // Remove Item
  const removeItem = (id) => {
    setCart(cart.filter((item) => item.product !== id));
  };

  // Total
  const totalAmount = cart.reduce((acc, item) => acc + item.total, 0);

  // Payment Method
  const getPaymentMethod = () => {
    if (Number(paidAmount) === 0) {
      return "credit";
    }

    if (Number(paidAmount) < totalAmount) {
      return "partial";
    }

    return "cash";
  };

  // Checkout
  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem("token");

      const saleData = {
        customer: selectedCustomer || null,
        items: cart,
        totalAmount,
        paidAmount: Number(paidAmount),
        paymentMethod: getPaymentMethod(),
      };

      await API.post("/sales", saleData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Invoice Data
      setInvoiceData({
        ...saleData,
        remaining: totalAmount - Number(paidAmount),
        customerName:
          customers.find((c) => c._id === selectedCustomer)?.name ||
          "Walk-in Customer",
        date: new Date(),
      });

      setShowInvoice(true);
      alert("Sale Completed Successfully");
      setCart([]);
      setSelectedCustomer("");
      setPaidAmount("");
      fetchProducts();
    } catch (error) {
      console.log(error);
      alert("Checkout Failed");
    }
  };

  // Search Filter
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">POS Billing</h1>
        <p className="text-slate-500 text-sm mt-1">SmartStore LK billing desk workstation</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Products Column */}
        <div className="xl:col-span-2">
          {/* Search */}
          <div className="relative mb-5">
            <input
              type="text"
              placeholder="Search products by SKU or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0b0f19] border border-slate-800 text-slate-200 placeholder-slate-500 px-5 py-3 rounded-xl outline-none focus:border-slate-700 transition-colors text-sm"
            />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-4.5 flex flex-col justify-between hover:border-indigo-500/40 transition-all duration-200 shadow-sm"
                >
                  <div>
                    <div className="relative mb-3.5">
                      <img
                        src={`http://localhost:5000/${product.image}`}
                        alt={product.name}
                        className="w-full h-36 object-cover rounded-lg bg-slate-900 border border-slate-800/40"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=120&auto=format&fit=crop";
                        }}
                      />
                      {product.stock <= 5 && (
                        <span className="absolute top-2 right-2 bg-rose-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                          Low Stock
                        </span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-slate-200 font-semibold text-sm line-clamp-1">{product.name}</h2>
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shrink-0 ${product.productType === "weighted"
                            ? "bg-amber-500/5 text-amber-400 border-amber-500/10"
                            : "bg-indigo-500/5 text-indigo-400 border-indigo-500/10"
                          }`}
                      >
                        {product.productType}
                      </span>
                    </div>

                    <p className="text-slate-500 text-xs mt-1 font-medium">
                      Available: {product.stock} {product.unit}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-indigo-400 font-bold text-base">
                      Rs. {Number(product.sellingPrice).toLocaleString()} /<span className="text-xs font-normal text-slate-500">{product.unit}</span>
                    </p>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-2 rounded-lg mt-3.5 text-xs font-semibold cursor-pointer transition-colors active:scale-[0.98] disabled:scale-100 disabled:pointer-events-none"
                    >
                      {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-slate-500 text-sm bg-[#0b0f19] border border-slate-800 rounded-xl">
                No items match search parameters.
              </div>
            )}
          </div>
        </div>

        {/* Cart Column */}
        <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-5 shadow-sm h-fit sticky top-5">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800/50">
            <h2 className="text-base font-bold text-white tracking-tight">Active Cart</h2>
            <span className="text-xs text-slate-500 font-semibold bg-slate-800/50 px-2 py-0.5 rounded-md">
              {cart.reduce((acc, item) => acc + (item.productType === "weighted" ? 1 : item.quantity), 0)} items
            </span>
          </div>

          {/* Customer Dropdown */}
          <div className="mb-4">
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full bg-[#111827] border border-slate-800 text-slate-200 px-4 py-2.5 rounded-xl outline-none text-sm cursor-pointer focus:border-indigo-500 transition-colors"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items Area */}
          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div
                  key={item.product}
                  className="bg-[#111827]/40 border border-slate-800/60 rounded-xl p-3.5"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-200 text-sm leading-snug line-clamp-1">{item.name}</h3>
                      <p className="text-slate-500 text-xs mt-0.5 font-medium">
                        Rs. {Number(item.price).toLocaleString()} / {item.unit}
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(item.product)}
                      className="text-slate-500 hover:text-rose-400 font-bold transition-colors cursor-pointer text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Fixed Qty adjustment */}
                  {item.productType !== "weighted" ? (
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                        <button
                          onClick={() => decreaseQty(item.product)}
                          className="bg-slate-850 hover:bg-slate-800 w-7 h-7 rounded-md text-slate-300 font-bold flex items-center justify-center cursor-pointer transition-colors active:scale-95 text-xs"
                        >
                          -
                        </button>
                        <span className="text-slate-200 font-bold text-xs px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => increaseQty(item.product)}
                          className="bg-slate-850 hover:bg-slate-800 w-7 h-7 rounded-md text-slate-300 font-bold flex items-center justify-center cursor-pointer transition-colors active:scale-95 text-xs"
                        >
                          +
                        </button>
                      </div>

                      <div className="font-bold text-indigo-400 text-sm">
                        Rs. {Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ) : (
                    /* Weighted product adjustments */
                    <div className="mt-4">
                      <label className="text-slate-500 text-[10px] uppercase font-bold block mb-1.5 tracking-wider">
                        Enter Weight ({item.unit})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateWeight(item.product, e.target.value)
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-sm outline-none focus:border-indigo-500 transition-colors"
                      />

                      {/* Subtotal block */}
                      <div className="mt-2.5 flex justify-between items-center text-xs bg-indigo-500/5 border border-indigo-500/10 p-2 rounded-lg">
                        <span className="text-slate-400 font-medium">Subtotal</span>
                        <span className="font-bold text-indigo-400">
                          Rs. {Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">Cart is empty. Select items to checkout.</div>
            )}
          </div>

          {/* Cart Summary & Payments */}
          <div className="mt-5 border-t border-slate-800/80 pt-4">
            <div className="flex justify-between text-base font-bold text-slate-200">
              <span>Total Amount</span>
              <span className="text-white">Rs. {Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {/* Paid amount */}
            <input
              type="number"
              placeholder="Enter Paid Amount (Rs.)"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full bg-[#111827] border border-slate-800 text-slate-200 placeholder-slate-500 px-4 py-2.5 rounded-xl outline-none mt-4 text-sm focus:border-indigo-500 transition-colors"
            />

            {/* Checkout CTA */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-semibold mt-4 text-sm transition-all shadow-lg shadow-emerald-600/10 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Confirm Checkout & Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Receipt Modal Sheet */}
      {showInvoice && invoiceData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white text-slate-900 w-full max-w-[450px] rounded-xl overflow-hidden flex flex-col shadow-2xl max-h-[92vh]">
            {/* Scrollable Receipt Body */}
            <div className="overflow-y-auto p-6 font-mono text-xs text-slate-800">
              {/* Header */}
              <div className="text-center border-b border-dashed border-slate-350 pb-5">
                <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">SmartStore LK</h1>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">Grocery & Cosmetic Supermarket</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Colombo, Sri Lanka</p>
                <p className="text-[9px] text-slate-500 mt-3">
                  {invoiceData.date.toLocaleString()}
                </p>
              </div>

              {/* Customer */}
              <div className="my-4 pb-2 border-b border-slate-100 flex justify-between">
                <span className="font-semibold text-slate-500 uppercase text-[10px]">Client:</span>
                <span className="text-slate-950 font-bold uppercase text-[10px]">
                  {invoiceData.customerName}
                </span>
              </div>

              {/* Items Table */}
              <div className="my-5">
                <div className="flex justify-between border-b border-slate-900 pb-1.5 uppercase font-bold text-[9px] text-slate-500">
                  <span className="w-1/2">Item Description</span>
                  <span className="w-1/6 text-center">Qty</span>
                  <span className="w-1/3 text-right">Total (Rs.)</span>
                </div>

                <div className="divide-y divide-slate-100 mt-1">
                  {invoiceData.items.map((item, index) => (
                    <div key={index} className="py-2.5 flex justify-between items-center">
                      <div className="w-1/2">
                        <p className="font-bold text-slate-900 leading-tight">{item.name}</p>
                        <p className="text-[10px] text-slate-450 text-slate-400 mt-0.5">Rs. {Number(item.price).toLocaleString()} / {item.unit}</p>
                      </div>
                      <span className="w-1/6 text-center text-slate-700">
                        {item.quantity}
                      </span>
                      <span className="w-1/3 text-right font-bold text-slate-950">
                        Rs. {Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dotted Divider */}
              <div className="border-t border-dashed border-slate-350 my-4"></div>

              {/* Summary block */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">Subtotal Amount</span>
                  <span className="font-bold text-slate-950">
                    Rs. {Number(invoiceData.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-emerald-700">
                  <span className="font-semibold uppercase text-[10px]">Amount Received</span>
                  <span className="font-bold">
                    Rs. {Number(invoiceData.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-rose-700">
                  <span className="font-semibold uppercase text-[10px]">Remaining Due</span>
                  <span className="font-bold">
                    Rs. {Number(invoiceData.remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-2 text-[10px]">
                  <span className="text-slate-500 uppercase font-semibold">Payment Method</span>
                  <span className="font-bold uppercase text-slate-950">
                    {invoiceData.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 text-center border-t border-dashed border-slate-350 pt-5">
                <p className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Thank You For Shopping</p>
                <h3 className="text-base font-bold text-slate-900 mt-1 tracking-tight">SmartStore LK receipt</h3>
              </div>
            </div>

            {/* Print and Close Actions */}
            <div className="border-t border-slate-100 bg-slate-50 p-4 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                Print Invoice
              </button>

              <button
                onClick={() => setShowInvoice(false)}
                className="flex-1 bg-white hover:bg-slate-100 text-slate-700 py-2.5 rounded-lg border border-slate-200 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default POS;

