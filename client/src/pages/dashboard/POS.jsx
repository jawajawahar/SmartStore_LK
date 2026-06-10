import { useEffect, useState } from "react";
import { FaTrash, FaPause, FaFolderOpen, FaPlus, FaMinus, FaPercentage, FaReceipt, FaCoins, FaTimes, FaBarcode } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const POS = () => {
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  // Discount & Tax States
  const [discountType, setDiscountType] = useState("percentage"); // percentage, fixed, none
  const [discountValue, setDiscountValue] = useState("");
  const [taxRate, setTaxRate] = useState("0"); // e.g. 5% or 0%

  // Held Sales State
  const [heldSales, setHeldSales] = useState([]);
  const [holdNote, setHoldNote] = useState("");
  const [showHoldModal, setShowHoldModal] = useState(false);

  // Invoice Receipt State
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
      console.log("Error fetching products:", error);
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
      console.log("Error fetching customers:", error);
    }
  };

  // Load Held Sales from LocalStorage
  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    const stored = localStorage.getItem("smartstore_held_sales");
    if (stored) {
      try {
        setHeldSales(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Add To Cart
  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.product === product._id);

    if (existingItem) {
      setCart(
        cart.map((item) => {
          if (item.product === product._id) {
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
        })
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
          : item
      )
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
            : item
        )
        .filter((item) => item.quantity > 0)
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
      })
    );
  };

  // Remove Item
  const removeItem = (id) => {
    setCart(cart.filter((item) => item.product !== id));
  };

  // Hold / Park Sale
  const handleHoldSale = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: Date.now().toString(),
      note: holdNote || `Held Sale - ${new Date().toLocaleTimeString()}`,
      cart,
      selectedCustomer,
      paidAmount,
      discountType,
      discountValue,
      taxRate,
      date: new Date(),
    };
    const updated = [newHold, ...heldSales];
    setHeldSales(updated);
    localStorage.setItem("smartstore_held_sales", JSON.stringify(updated));

    // Reset current POS workspace
    setCart([]);
    setSelectedCustomer("");
    setPaidAmount("");
    setHoldNote("");
    setShowHoldModal(false);
    alert("Sale parked successfully.");
  };

  // Recall / Restore Held Sale
  const handleRecallSale = (heldSale) => {
    setCart(heldSale.cart);
    setSelectedCustomer(heldSale.selectedCustomer);
    setPaidAmount(heldSale.paidAmount);
    setDiscountType(heldSale.discountType || "percentage");
    setDiscountValue(heldSale.discountValue || "");
    setTaxRate(heldSale.taxRate || "0");

    // Remove from held list
    const updated = heldSales.filter((s) => s.id !== heldSale.id);
    setHeldSales(updated);
    localStorage.setItem("smartstore_held_sales", JSON.stringify(updated));
    alert("Parked sale restored to active cart.");
  };

  // Delete Held Sale
  const handleDeleteHeldSale = (id) => {
    const updated = heldSales.filter((s) => s.id !== id);
    setHeldSales(updated);
    localStorage.setItem("smartstore_held_sales", JSON.stringify(updated));
  };

  // CALCULATE SUMMARY DETAILS
  const subtotalAmount = cart.reduce((acc, item) => acc + item.total, 0);

  // Discount
  const discVal = Number(discountValue) || 0;
  const discountAmount =
    discountType === "percentage"
      ? subtotalAmount * (discVal / 100)
      : discountType === "fixed"
      ? discVal
      : 0;

  // Tax
  const taxPercent = Number(taxRate) || 0;
  const taxAmount = (subtotalAmount - discountAmount) * (taxPercent / 100);

  // Net amount
  const netAmount = Math.max(0, subtotalAmount - discountAmount + taxAmount);

  // Change amount
  const paidVal = Number(paidAmount) || 0;
  const changeAmount = paidVal > netAmount ? paidVal - netAmount : 0;

  // Payment Method
  const getPaymentMethod = () => {
    if (paidVal === 0) {
      return "credit";
    }
    if (paidVal < netAmount) {
      return "partial";
    }
    return "cash";
  };

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const saleData = {
        customer: selectedCustomer || null,
        items: cart,
        totalAmount: subtotalAmount,
        paidAmount: paidVal,
        paymentMethod: getPaymentMethod(),
        discountType: discountType === "none" ? null : discountType,
        discountValue: discVal,
        discountAmount,
        taxRate: taxPercent,
        taxAmount,
        netAmount,
      };

      await API.post("/sales", saleData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Invoice Data
      setInvoiceData({
        ...saleData,
        remaining: Math.max(0, netAmount - paidVal),
        change: changeAmount,
        customerName:
          customers.find((c) => c._id === selectedCustomer)?.name ||
          "Walk-in Customer",
        date: new Date(),
      });

      setShowInvoice(true);
      alert("Sale Completed Successfully");

      // Clear POS workspace
      setCart([]);
      setSelectedCustomer("");
      setPaidAmount("");
      setDiscountValue("");
      fetchProducts();
    } catch (error) {
      console.log("Checkout error:", error);
      alert(error.response?.data?.message || "Checkout Failed");
    }
  };

  // Search Filter
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const isDark = theme === "dark";

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>POS Billing</h1>
          <p className="text-slate-500 text-sm mt-1">SmartStore LK billing desk workstation</p>
        </div>

        {/* Held Sales Button */}
        {heldSales.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <span className="text-xs text-amber-500 font-bold uppercase tracking-wider">
              {heldSales.length} Parked Sale(s)
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Products Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Search bar & Barcode Indicator */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <FaBarcode className="text-sm" />
            </span>
            <input
              type="text"
              placeholder="Search products by barcode, SKU or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full border pl-10 pr-5 py-3 rounded-xl outline-none text-sm transition-all ${
                isDark ? "bg-[#0b0f19] border-slate-800 text-slate-200 placeholder-slate-500 focus:border-slate-700" : "bg-white border-slate-250 text-slate-900 focus:border-slate-350"
              }`}
            />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className={`border rounded-xl p-4.5 flex flex-col justify-between hover:border-indigo-500/40 transition-all duration-200 shadow-sm ${
                    isDark ? "bg-[#0b0f19] border-slate-800/80" : "bg-white border-slate-200"
                  }`}
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
                      <h2 className={`font-semibold text-sm line-clamp-1 ${isDark ? "text-slate-200" : "text-slate-800"}`}>{product.name}</h2>
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
                          product.productType === "weighted"
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
              <div className={`col-span-full text-center py-10 text-slate-500 text-sm border rounded-xl ${
                isDark ? "bg-[#0b0f19] border-slate-800" : "bg-white border-slate-200"
              }`}>
                No items match search parameters.
              </div>
            )}
          </div>

          {/* Parked / Held Sales recall view */}
          {heldSales.length > 0 && (
            <div className={`border rounded-xl p-5 ${isDark ? "bg-[#0b0f19] border-slate-800" : "bg-white border-slate-200"}`}>
              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                <FaFolderOpen className="text-amber-500" />
                Recall Parked Bills / Sales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {heldSales.map((held) => (
                  <div key={held.id} className={`p-3.5 border rounded-xl flex items-center justify-between text-xs ${
                    isDark ? "bg-[#111827]/30 border-slate-800/80" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div>
                      <p className="font-semibold text-slate-350">{held.note}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{held.cart.length} item(s) • {new Date(held.date).toLocaleTimeString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRecallSale(held)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-colors cursor-pointer"
                      >
                        Recall
                      </button>
                      <button
                        onClick={() => handleDeleteHeldSale(held.id)}
                        className="text-slate-500 hover:text-rose-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart Column */}
        <div className={`border rounded-xl p-5 shadow-sm h-fit sticky top-5 ${
          isDark ? "bg-[#0b0f19] border-slate-800/80" : "bg-white border-slate-200"
        }`}>
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800/50">
            <h2 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Active Cart</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold bg-slate-800/50 px-2 py-0.5 rounded-md">
                {cart.reduce((acc, item) => acc + (item.productType === "weighted" ? 1 : item.quantity), 0)} items
              </span>
              {cart.length > 0 && (
                <button
                  onClick={() => setShowHoldModal(true)}
                  className="bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-500/20 px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
                >
                  <FaPause className="text-[8px]" /> Park
                </button>
              )}
            </div>
          </div>

          {/* Customer Dropdown */}
          <div className="mb-4">
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className={`w-full border px-4 py-2.5 rounded-xl outline-none text-sm cursor-pointer transition-colors ${
                isDark ? "bg-[#111827] border-slate-800 text-slate-200 focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
              }`}
            >
              <option value="">Walk-in Customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} {customer.currentDebt > 0 ? `(Debt: Rs. ${customer.currentDebt})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items Area */}
          <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div
                  key={item.product}
                  className={`border rounded-xl p-3.5 ${
                    isDark ? "bg-[#111827]/40 border-slate-800/60" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className={`font-semibold text-sm leading-snug line-clamp-1 ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.name}</h3>
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
                        Rs. {Number(item.total).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    /* Weighted product adjustments */
                    <div className="mt-4">
                      <label className="text-slate-550 text-slate-500 text-[10px] uppercase font-bold block mb-1.5 tracking-wider">
                        Enter Weight ({item.unit})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateWeight(item.product, e.target.value)
                        }
                        className={`w-full border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500 transition-colors ${
                          isDark ? "bg-[#111827] border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-900"
                        }`}
                      />

                      {/* Subtotal block */}
                      <div className="mt-2.5 flex justify-between items-center text-xs bg-indigo-500/5 border border-indigo-500/10 p-2 rounded-lg">
                        <span className="text-slate-400 font-medium">Subtotal</span>
                        <span className="font-bold text-indigo-400">
                          Rs. {Number(item.total).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-550 text-slate-500 text-xs">Cart is empty. Select items to checkout.</div>
            )}
          </div>

          {/* Cart Summary & Payments */}
          <div className="mt-5 border-t border-slate-800/80 pt-4 space-y-3">
            {/* Subtotal */}
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Subtotal</span>
              <span>Rs. {Number(subtotalAmount).toLocaleString()}</span>
            </div>

            {/* Discount Section */}
            <div className="space-y-1.5 p-3 rounded-lg border border-dashed border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <FaPercentage className="text-[9px]" /> Apply Discount
                </span>
                <select
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value);
                    setDiscountValue("");
                  }}
                  className={`border px-2 py-0.5 rounded text-[10px] ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-100 border-slate-200 text-slate-900"
                  }`}
                >
                  <option value="none">No Discount</option>
                  <option value="percentage">% Percentage</option>
                  <option value="fixed">Flat Rate (Rs.)</option>
                </select>
              </div>

              {discountType !== "none" && (
                <input
                  type="number"
                  placeholder={discountType === "percentage" ? "Enter % (e.g. 10)" : "Enter Flat Rs."}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className={`w-full border px-3 py-1.5 rounded-lg text-xs outline-none ${
                    isDark ? "bg-[#111827] border-slate-800 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              )}
            </div>

            {/* Tax Section */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Tax / VAT (%)</span>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className={`border px-2 py-1 rounded-lg text-xs ${
                  isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-100 border-slate-200 text-slate-900"
                }`}
              >
                <option value="0">0% No Tax</option>
                <option value="5">5% VAT</option>
                <option value="12">12% Service Tax</option>
                <option value="15">15% VAT + Luxury Tax</option>
              </select>
            </div>

            {/* Sub-breakdowns if applicable */}
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-emerald-500 font-semibold">
                <span>Discount Applied</span>
                <span>- Rs. {discountAmount.toLocaleString()}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-xs text-rose-400">
                <span>Tax Amount ({taxRate}%)</span>
                <span>+ Rs. {taxAmount.toLocaleString()}</span>
              </div>
            )}

            {/* Net Total */}
            <div className="flex justify-between text-base font-bold border-t border-slate-800/40 pt-2 text-slate-200">
              <span>Grand Total</span>
              <span className="text-indigo-400 font-black">Rs. {Number(netAmount).toLocaleString()}</span>
            </div>

            {/* Paid amount & Change Calculator */}
            <div className="space-y-2 pt-2 border-t border-slate-800/40">
              <input
                type="number"
                placeholder="Enter Paid Amount (Rs.)"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className={`w-full border px-4 py-2.5 rounded-xl outline-none text-sm transition-all ${
                  isDark ? "bg-[#111827] border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                }`}
              />

              {paidVal > 0 && (
                <div className="flex justify-between items-center text-xs p-2 rounded bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-400 font-semibold">Change Due:</span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    Rs. {changeAmount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Checkout CTA */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-600/10 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Confirm Checkout & Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Hold/Park Sale Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md border rounded-xl overflow-hidden shadow-2xl p-6 ${
            isDark ? "bg-[#0b0f19] border-slate-800" : "bg-white text-slate-900"
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base">Park/Hold Current Sale</h3>
              <button onClick={() => setShowHoldModal(false)} className="text-slate-400 hover:text-white">
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 uppercase font-bold">Add Custom Note / Reference</label>
                <input
                  type="text"
                  placeholder="E.g., Customer went to grab wallet..."
                  value={holdNote}
                  onChange={(e) => setHoldNote(e.target.value)}
                  className={`w-full border px-3 py-2 rounded-xl text-xs outline-none ${
                    isDark ? "bg-[#111827] border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>
              <button
                onClick={handleHoldSale}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide cursor-pointer"
              >
                Park Bill
              </button>
            </div>
          </div>
        </div>
      )}

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
                        <p className="text-[10px] text-slate-400 mt-0.5">Rs. {Number(item.price).toLocaleString()} / {item.unit}</p>
                      </div>
                      <span className="w-1/6 text-center text-slate-700">
                        {item.quantity}
                      </span>
                      <span className="w-1/3 text-right font-bold text-slate-950">
                        Rs. {Number(item.total).toLocaleString()}
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
                    Rs. {Number(invoiceData.totalAmount).toLocaleString()}
                  </span>
                </div>

                {invoiceData.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="font-semibold uppercase text-[10px]">Discount Value ({invoiceData.discountType === "percentage" ? `${invoiceData.discountValue}%` : "Fixed"})</span>
                    <span className="font-bold">
                      - Rs. {Number(invoiceData.discountAmount).toLocaleString()}
                    </span>
                  </div>
                )}

                {invoiceData.taxAmount > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span className="font-semibold uppercase text-[10px]">Taxes / VAT ({invoiceData.taxRate}%)</span>
                    <span className="font-bold">
                      + Rs. {Number(invoiceData.taxAmount).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900">
                  <span className="uppercase text-[10px]">Grand Total</span>
                  <span className="text-indigo-600 font-black">
                    Rs. {Number(invoiceData.netAmount).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold uppercase text-[10px]">Amount Paid</span>
                  <span className="font-bold">
                    Rs. {Number(invoiceData.paidAmount).toLocaleString()}
                  </span>
                </div>

                {invoiceData.change > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span className="uppercase text-[10px]">Change Due</span>
                    <span>Rs. {Number(invoiceData.change).toLocaleString()}</span>
                  </div>
                )}

                {invoiceData.remaining > 0 && (
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span className="uppercase text-[10px]">Remaining Balance</span>
                    <span>Rs. {Number(invoiceData.remaining).toLocaleString()}</span>
                  </div>
                )}

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
