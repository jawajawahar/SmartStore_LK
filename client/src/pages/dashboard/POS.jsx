import { useEffect, useState } from "react";
import {
  FaTrash,
  FaPause,
  FaFolderOpen,
  FaPlus,
  FaMinus,
  FaPercentage,
  FaReceipt,
  FaTimes,
  FaBarcode,
  FaCreditCard,
  FaMoneyBillWave,
  FaUniversity,
  FaUserTag,
  FaCamera,
} from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { toast } from "react-toastify";
import BarcodeScanner from "../../components/BarcodeScanner";

const POS = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Payment Mode State: cash, card, bank_transfer, credit
  const [paymentMode, setPaymentMode] = useState("cash");

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
      console.error("Error fetching products:", error);
      toast.error("Failed to load products inventory");
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
      console.error("Error fetching customers:", error);
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
      if (product.productType !== "weighted") {
        const nextQty = existingItem.quantity + 1;
        if (nextQty > product.stock) {
          toast.warning(`Cannot exceed available stock of ${product.stock} items.`);
          return;
        }
        setCart(
          cart.map((item) =>
            item.product === product._id
              ? {
                  ...item,
                  quantity: nextQty,
                  total: nextQty * item.price,
                }
              : item
          )
        );
      }
    } else {
      if (product.productType !== "weighted" && product.stock < 1) {
        toast.warning("Product is out of stock.");
        return;
      }
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

  // Scan Barcode Handlers
  const handleScanBarcode = async (barcode) => {
    try {
      const token = localStorage.getItem("token");
      const response = await API.get(`/products?barcode=${encodeURIComponent(barcode)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.length > 0) {
        const product = response.data[0];
        addToCart(product);
        toast.success(`Scanned: ${product.name}`);
      } else {
        toast.error(`Product with barcode "${barcode}" not found in inventory.`);
      }
    } catch (error) {
      console.error("Barcode search error:", error);
      toast.error("Error looking up barcode.");
    }
  };

  // Increase Quantity
  const increaseQty = (id) => {
    const cartItem = cart.find((item) => item.product === id);
    const originalProduct = products.find((p) => p._id === id);

    if (cartItem && originalProduct) {
      const nextQty = cartItem.quantity + 1;
      if (nextQty > originalProduct.stock) {
        toast.warning(`Cannot exceed available stock of ${originalProduct.stock} ${originalProduct.unit}.`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.product === id
            ? {
                ...item,
                quantity: nextQty,
                total: nextQty * item.price,
              }
            : item
        )
      );
    }
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
    const originalProduct = products.find((p) => p._id === id);
    const qty = parseFloat(value) || 0;

    if (originalProduct && qty > originalProduct.stock) {
      toast.warning(`Cannot exceed available stock of ${originalProduct.stock} ${originalProduct.unit}.`);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product === id
          ? {
              ...item,
              quantity: qty,
              total: qty * item.price,
            }
          : item
      )
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
      note: holdNote || `Parked Sale - ${new Date().toLocaleTimeString()}`,
      cart,
      selectedCustomer,
      paidAmount,
      discountType,
      discountValue,
      taxRate,
      paymentMode,
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
    setPaymentMode("cash");
    setShowHoldModal(false);
    toast.info("Active cart parked successfully.");
  };

  // Recall / Restore Held Sale
  const handleRecallSale = (heldSale) => {
    setCart(heldSale.cart);
    setSelectedCustomer(heldSale.selectedCustomer);
    setPaidAmount(heldSale.paidAmount);
    setDiscountType(heldSale.discountType || "percentage");
    setDiscountValue(heldSale.discountValue || "");
    setTaxRate(heldSale.taxRate || "0");
    setPaymentMode(heldSale.paymentMode || "cash");

    // Remove from held list
    const updated = heldSales.filter((s) => s.id !== heldSale.id);
    setHeldSales(updated);
    localStorage.setItem("smartstore_held_sales", JSON.stringify(updated));
    toast.success("Parked cart restored successfully.");
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

  // Auto-calculated paid amount based on payment mode
  useEffect(() => {
    if (paymentMode === "card" || paymentMode === "bank_transfer") {
      setPaidAmount(netAmount.toFixed(0));
    } else if (paymentMode === "credit") {
      setPaidAmount("0");
    } else {
      // Cash
      setPaidAmount("");
    }
  }, [paymentMode, netAmount]);

  const paidVal = Number(paidAmount) || 0;
  const changeAmount = paidVal > netAmount ? paidVal - netAmount : 0;

  // Checkout Payment Method payload determination
  const getPayloadPaymentMethod = () => {
    if (paymentMode === "credit") {
      if (paidVal === 0) return "credit";
      if (paidVal < netAmount) return "partial";
    }
    return paymentMode; // cash, card, bank_transfer
  };

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Require Customer if there is any outstanding balance / unpaid amount
    const hasRemaining = paidVal < netAmount;
    if (hasRemaining && !selectedCustomer) {
      toast.error("A registered Customer is required when there is an outstanding balance / unpaid amount!");
      return;
    }

    // Warn if credit payment upfront cash equals or exceeds net total
    if (paymentMode === "credit" && paidVal >= netAmount) {
      toast.error("Credit transactions must have upfront cash less than grand total.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const checkoutMethod = getPayloadPaymentMethod();

      const saleData = {
        customer: selectedCustomer || null,
        items: cart,
        totalAmount: subtotalAmount,
        paidAmount: paidVal,
        paymentMethod: checkoutMethod,
        discountType: discountType === "none" ? null : discountType,
        discountValue: discVal,
        discountAmount,
        taxRate: taxPercent,
        taxAmount,
        netAmount,
      };

      const res = await API.post("/sales", saleData, {
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
        invoiceNo: res.data.sale?._id ? res.data.sale._id.toString().slice(-6).toUpperCase() : "TEMP",
      });

      setShowInvoice(true);
      toast.success("Sale completed successfully!");

      // Clear POS workspace
      setCart([]);
      setSelectedCustomer("");
      setPaidAmount("");
      setDiscountValue("");
      setPaymentMode("cash");
      fetchProducts();
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.response?.data?.message || "Checkout Failed");
    }
  };

  // Search Filter
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku?.toLowerCase().includes(search.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">POS Billing</h1>
          <p className="text-text-secondary text-sm mt-1">SmartStore LK checkout billing workstation</p>
        </div>

        {/* Held Sales Button */}
        {heldSales.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-xs text-amber-500 font-bold uppercase tracking-wider">
              {heldSales.length} Parked Bill(s)
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Products Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Search bar & Barcode Indicator */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary">
                <FaBarcode className="text-base" />
              </span>
              <input
                type="text"
                placeholder="Scan barcode or type product name/SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-bg-card border border-border-color text-text-main pl-10 pr-5 py-3 rounded-xl outline-none text-sm transition-all focus:border-indigo-500 placeholder-text-secondary/50"
              />
            </div>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center bg-indigo-650 bg-indigo-600 hover:bg-indigo-550 hover:bg-indigo-550 text-white rounded-xl transition-all shadow-md active:scale-95 cursor-pointer h-[46px] w-[46px] shrink-0 border border-indigo-650/10"
              title="Scan barcode with camera"
            >
              <FaCamera className="text-sm" />
            </button>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-bg-card border border-border-color rounded-xl p-4.5 flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-200 shadow-sm hover:shadow-md group"
                >
                  <div>
                    <div className="relative mb-3.5 rounded-lg overflow-hidden border border-border-color/60 bg-bg-main">
                      <img
                        src={`http://localhost:5000/${product.image}`}
                        alt={product.name}
                        className="w-full h-36 object-cover bg-bg-main group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=120&auto=format&fit=crop";
                        }}
                      />
                      {product.stock <= product.minStockLevel && (
                        <span className="absolute top-2 right-2 bg-rose-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase shadow-sm">
                          Low Stock
                        </span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-bold text-sm line-clamp-2 text-text-main leading-tight" title={product.name}>
                        {product.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-text-secondary font-medium tracking-wide">
                        SKU: {product.sku || "N/A"}
                      </span>
                      <span
                        className={`inline-flex px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider border shrink-0 ${
                          product.productType === "weighted"
                            ? "bg-amber-500/5 text-amber-500 border-amber-500/10"
                            : "bg-indigo-500/5 text-indigo-500 border-indigo-500/10"
                        }`}
                      >
                        {product.productType}
                      </span>
                    </div>

                    <p className="text-text-secondary text-xs mt-1 font-semibold">
                      Stock: <span className={product.stock <= product.minStockLevel ? "text-rose-500" : "text-text-main"}>{product.stock} {product.unit}</span>
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-indigo-500 font-extrabold text-base">
                      Rs. {Number(product.sellingPrice).toLocaleString()}{" "}
                      <span className="text-[10px] font-normal text-text-secondary">/{product.unit}</span>
                    </p>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className="w-full bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 disabled:bg-bg-main disabled:text-text-secondary/40 text-white py-2 rounded-lg mt-3 text-xs font-semibold cursor-pointer transition-all active:scale-[0.98] disabled:scale-100 disabled:pointer-events-none shadow-sm hover:shadow"
                    >
                      {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-text-secondary text-sm bg-bg-card border border-border-color rounded-xl">
                No inventory items match search parameters.
              </div>
            )}
          </div>

          {/* Parked / Held Sales recall view */}
          {heldSales.length > 0 && (
            <div className="border border-border-color rounded-xl p-5 bg-bg-card shadow-sm">
              <h3 className="text-sm font-bold mb-3.5 flex items-center gap-2 text-text-main">
                <FaFolderOpen className="text-amber-500" />
                Recall Parked Bills
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {heldSales.map((held) => (
                  <div key={held.id} className="p-3.5 border border-border-color rounded-xl flex items-center justify-between text-xs bg-bg-main/50">
                    <div>
                      <p className="font-bold text-text-main">{held.note}</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        {held.cart.length} items • {new Date(held.date).toLocaleTimeString()}
                      </p>
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
                        className="text-text-secondary hover:text-rose-500 p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-rose-500/10"
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
        <div className="border border-border-color rounded-xl p-5 bg-bg-card shadow-sm sticky top-5 h-fit flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-border-color/60">
            <h2 className="text-base font-bold tracking-tight text-text-main">Active Cart</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-secondary font-bold bg-bg-main px-2 py-0.5 rounded-md border border-border-color">
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
            <div className="flex items-center gap-1 text-[10px] text-text-secondary uppercase font-bold mb-1.5 tracking-wider">
              <FaUserTag /> <span>Select Customer</span>
            </div>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full bg-bg-main border border-border-color text-text-main px-4 py-2.5 rounded-xl outline-none text-xs cursor-pointer focus:border-indigo-500 transition-colors"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} {customer.currentDebt > 0 ? `(Debt: Rs. ${customer.currentDebt})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items Area - dedicated scrollable list container */}
          <div className="space-y-3 max-h-[190px] min-h-[90px] overflow-y-auto pr-1 border border-border-color/30 rounded-xl p-2.5 bg-bg-main/15 scrollbar-thin mb-4">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div
                  key={item.product}
                  className="border border-border-color/60 rounded-xl p-3 bg-bg-main/30 hover:border-border-color transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-xs leading-snug line-clamp-1 text-text-main" title={item.name}>
                        {item.name}
                      </h3>
                      <p className="text-text-secondary text-[10px] mt-0.5 font-medium">
                        Rs. {Number(item.price).toLocaleString()} / {item.unit}
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(item.product)}
                      className="text-text-secondary hover:text-rose-500 transition-colors cursor-pointer text-xs font-bold px-1"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Fixed Qty adjustment */}
                  {item.productType !== "weighted" ? (
                    <div className="flex items-center justify-between mt-3.5">
                      <div className="flex items-center gap-2.5 bg-bg-card border border-border-color rounded-lg p-0.5">
                        <button
                          onClick={() => decreaseQty(item.product)}
                          className="bg-bg-main hover:bg-border-color text-text-main w-6.5 h-6.5 rounded-md font-extrabold flex items-center justify-center cursor-pointer transition-colors text-xs active:scale-90"
                        >
                          -
                        </button>
                        <span className="text-text-main font-bold text-xs px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => increaseQty(item.product)}
                          className="bg-bg-main hover:bg-border-color text-text-main w-6.5 h-6.5 rounded-md font-extrabold flex items-center justify-center cursor-pointer transition-colors text-xs active:scale-90"
                        >
                          +
                        </button>
                      </div>

                      <div className="font-bold text-indigo-500 text-xs">
                        Rs. {Number(item.total).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    /* Weighted product adjustments */
                    <div className="mt-3">
                      <label className="text-text-secondary text-[9px] uppercase font-bold block mb-1 tracking-wider">
                        Enter Weight ({item.unit})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateWeight(item.product, e.target.value)}
                        className="w-full border border-border-color rounded-lg px-2.5 py-1.5 text-xs outline-none bg-bg-card text-text-main focus:border-indigo-500 transition-colors"
                      />

                      {/* Subtotal block */}
                      <div className="mt-2 flex justify-between items-center text-[10px] bg-indigo-500/5 border border-indigo-500/10 p-1.5 rounded-lg">
                        <span className="text-text-secondary font-medium">Subtotal</span>
                        <span className="font-bold text-indigo-500">
                          Rs. {Number(item.total).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-text-secondary text-xs">
                Cart is empty. Select items to checkout.
              </div>
            )}
          </div>

          {/* Cart Summary & Payments */}
          <div className="border-t border-border-color/60 pt-3.5 space-y-3">
            {/* Subtotal */}
            <div className="flex justify-between text-xs font-semibold text-text-secondary">
              <span>Subtotal</span>
              <span>Rs. {Number(subtotalAmount).toLocaleString()}</span>
            </div>

            {/* Discount Section */}
            <div className="space-y-1.5 p-3 rounded-lg border border-dashed border-border-color">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                  <FaPercentage className="text-[8px]" /> Discount
                </span>
                <select
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value);
                    setDiscountValue("");
                  }}
                  className="border border-border-color px-2 py-0.5 rounded text-[9px] bg-bg-main text-text-main cursor-pointer"
                >
                  <option value="none">None</option>
                  <option value="percentage">% Percent</option>
                  <option value="fixed">Flat (Rs.)</option>
                </select>
              </div>

              {discountType !== "none" && (
                <input
                  type="number"
                  placeholder={discountType === "percentage" ? "Enter % (e.g. 10)" : "Enter Flat Rs."}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full border border-border-color px-3 py-1.5 rounded-lg text-xs outline-none bg-bg-main text-text-main placeholder-text-secondary/40"
                />
              )}
            </div>

            {/* Tax Section */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">Tax / VAT (%)</span>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="border border-border-color px-2.5 py-1 rounded-lg text-xs bg-bg-main text-text-main cursor-pointer"
              >
                <option value="0">0% Tax</option>
                <option value="5">5% VAT</option>
                <option value="12">12% Service</option>
                <option value="15">15% VAT + Luxury</option>
              </select>
            </div>

            {/* Sub-breakdowns if applicable */}
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-emerald-500 font-semibold">
                <span>Discount</span>
                <span>- Rs. {discountAmount.toLocaleString()}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-xs text-rose-500 font-semibold">
                <span>Tax ({taxRate}%)</span>
                <span>+ Rs. {taxAmount.toLocaleString()}</span>
              </div>
            )}

            {/* Net Total */}
            <div className="flex justify-between text-sm font-bold border-t border-border-color/60 pt-2 text-text-main">
              <span>Grand Total</span>
              <span className="text-indigo-500 font-black text-base">Rs. {Number(netAmount).toLocaleString()}</span>
            </div>

            {/* PAYMENT METHOD SELECTOR */}
            <div className="border-t border-border-color/60 pt-3">
              <label className="block text-[10px] text-text-secondary uppercase font-bold mb-2 tracking-wider">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode("cash")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[10px] font-bold border uppercase transition-all cursor-pointer ${
                    paymentMode === "cash"
                      ? "bg-indigo-600/10 text-indigo-500 border-indigo-500/40"
                      : "bg-bg-main/40 text-text-secondary border-border-color hover:bg-bg-main"
                  }`}
                >
                  <FaMoneyBillWave /> Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("card")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[10px] font-bold border uppercase transition-all cursor-pointer ${
                    paymentMode === "card"
                      ? "bg-indigo-600/10 text-indigo-500 border-indigo-500/40"
                      : "bg-bg-main/40 text-text-secondary border-border-color hover:bg-bg-main"
                  }`}
                >
                  <FaCreditCard /> Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("bank_transfer")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[10px] font-bold border uppercase transition-all cursor-pointer ${
                    paymentMode === "bank_transfer"
                      ? "bg-indigo-600/10 text-indigo-500 border-indigo-500/40"
                      : "bg-bg-main/40 text-text-secondary border-border-color hover:bg-bg-main"
                  }`}
                >
                  <FaUniversity /> Bank
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("credit")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[10px] font-bold border uppercase transition-all cursor-pointer ${
                    paymentMode === "credit"
                      ? "bg-indigo-600/10 text-indigo-500 border-indigo-500/40"
                      : "bg-bg-main/40 text-text-secondary border-border-color hover:bg-bg-main"
                  }`}
                >
                  <FaUserTag /> Credit
                </button>
              </div>
            </div>

            {/* Paid amount & Change Calculator */}
            <div className="space-y-2 pt-2">
              <input
                type="number"
                placeholder={paymentMode === "credit" ? "0 (Credit Payment)" : "Enter Paid Cash (Rs.)"}
                value={paidAmount}
                disabled={paymentMode === "card" || paymentMode === "bank_transfer" || paymentMode === "credit"}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full bg-bg-main border border-border-color text-text-main placeholder-text-secondary/40 px-4 py-2.5 rounded-xl outline-none text-xs transition-all focus:border-indigo-500 disabled:opacity-60"
              />

              {paymentMode === "cash" && paidVal > 0 && (
                <div className="flex justify-between items-center text-[10px] p-2.5 rounded-xl bg-bg-main border border-border-color font-semibold">
                  <span className="text-text-secondary">Change Due:</span>
                  <span className="font-black text-emerald-500 text-xs">
                    Rs. {changeAmount.toLocaleString()}
                  </span>
                </div>
              )}

              {paymentMode === "credit" && (
                <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-bg-main border border-border-color text-[10px]">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-text-secondary">Upfront Payment:</span>
                    <span className="font-bold text-text-main">Rs. {paidVal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold border-t border-border-color/60 pt-1.5">
                    <span className="text-rose-500">Unpaid Credit Balance:</span>
                    <span className="font-black text-rose-500 text-xs">
                      Rs. {Math.max(0, netAmount - paidVal).toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="number"
                    placeholder="Enter upfront payment (if any)"
                    value={paidAmount === "0" ? "" : paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full mt-1.5 bg-bg-card border border-border-color text-text-main px-3 py-1.5 rounded-lg outline-none text-[10px]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Checkout CTA (Fixed at bottom) */}
          <div className="flex-none pt-3.5 border-t border-border-color/60 mt-3.5">
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-md active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none cursor-pointer"
            >
              Complete Sale & Print
            </button>
          </div>
        </div>
      </div>

      {/* Hold/Park Sale Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md border border-border-color rounded-2xl overflow-hidden shadow-2xl p-6 bg-bg-card text-text-main">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-border-color/60">
              <h3 className="font-bold text-sm">Park Current Bill</h3>
              <button
                onClick={() => setShowHoldModal(false)}
                className="text-text-secondary hover:text-text-main p-1 cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-text-secondary mb-1.5 uppercase font-bold tracking-wider">
                  Add Reference Note
                </label>
                <input
                  type="text"
                  placeholder="E.g., Customer went to fetch cash..."
                  value={holdNote}
                  onChange={(e) => setHoldNote(e.target.value)}
                  className="w-full border border-border-color px-4 py-2.5 rounded-xl text-xs outline-none bg-bg-main text-text-main placeholder-text-secondary/40 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleHoldSale}
                className="w-full bg-amber-500 hover:bg-amber-400 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer shadow-sm"
              >
                Park Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal Sheet */}
      {showInvoice && invoiceData && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white text-slate-900 w-full max-w-[420px] rounded-2xl overflow-hidden flex flex-col shadow-2xl max-h-[92vh]">
            {/* Scrollable Receipt Body */}
            <div className="overflow-y-auto p-6 font-mono text-xs text-slate-800">
              {/* Header */}
              <div className="text-center border-b border-dashed border-slate-300 pb-5">
                <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">SmartStore LK</h1>
                <p className="text-[9px] text-slate-500 mt-1 uppercase font-semibold">Grocery & Cosmetic Supermarket</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Colombo, Sri Lanka</p>
                <div className="flex justify-between items-center mt-4 text-[9px] text-slate-500 bg-slate-50 p-1.5 rounded">
                  <span>INVOICE: #{invoiceData.invoiceNo}</span>
                  <span>{invoiceData.date.toLocaleString()}</span>
                </div>
              </div>

              {/* Customer */}
              <div className="my-3.5 pb-2 border-b border-slate-100 flex justify-between text-[10px]">
                <span className="font-semibold text-slate-400 uppercase">Customer:</span>
                <span className="text-slate-900 font-bold uppercase">{invoiceData.customerName}</span>
              </div>

              {/* Items Table */}
              <div className="my-4">
                <div className="flex justify-between border-b border-slate-900 pb-1.5 uppercase font-bold text-[9px] text-slate-400">
                  <span className="w-1/2">Item Description</span>
                  <span className="w-1/6 text-center">Qty</span>
                  <span className="w-1/3 text-right">Total (Rs.)</span>
                </div>

                <div className="divide-y divide-slate-100 mt-1">
                  {invoiceData.items.map((item, index) => (
                    <div key={index} className="py-2 flex justify-between items-center text-[10px]">
                      <div className="w-1/2">
                        <p className="font-bold text-slate-900 leading-tight truncate">{item.name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Rs. {Number(item.price).toLocaleString()} / {item.unit}</p>
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
              <div className="border-t border-dashed border-slate-300 my-3.5"></div>

              {/* Summary block */}
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal Amount</span>
                  <span className="font-bold text-slate-950">
                    Rs. {Number(invoiceData.totalAmount).toLocaleString()}
                  </span>
                </div>

                {invoiceData.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount ({invoiceData.discountType === "percentage" ? `${invoiceData.discountValue}%` : "Fixed"})</span>
                    <span className="font-bold">
                      - Rs. {Number(invoiceData.discountAmount).toLocaleString()}
                    </span>
                  </div>
                )}

                {invoiceData.taxAmount > 0 && (
                  <div className="flex justify-between text-rose-700 font-medium">
                    <span>VAT ({invoiceData.taxRate}%)</span>
                    <span className="font-bold">
                      + Rs. {Number(invoiceData.taxAmount).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-950 text-xs">
                  <span className="uppercase">Grand Total</span>
                  <span className="text-indigo-600 font-black">
                    Rs. {Number(invoiceData.netAmount).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Amount Paid</span>
                  <span className="font-bold text-slate-950">
                    Rs. {Number(invoiceData.paidAmount).toLocaleString()}
                  </span>
                </div>

                {invoiceData.change > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold border-t border-slate-100 pt-1.5">
                    <span>Change Due</span>
                    <span>Rs. {Number(invoiceData.change).toLocaleString()}</span>
                  </div>
                )}

                {invoiceData.remaining > 0 && (
                  <div className="flex justify-between text-rose-700 font-bold border-t border-slate-100 pt-1.5">
                    <span>Remaining Balance</span>
                    <span>Rs. {Number(invoiceData.remaining).toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-100 pt-2 text-[9px] text-slate-400 font-semibold uppercase">
                  <span>Payment Method</span>
                  <span className="font-bold text-slate-950">
                    {invoiceData.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 text-center border-t border-dashed border-slate-300 pt-4">
                <p className="text-slate-400 font-semibold uppercase text-[9px] tracking-widest">Thank You For Your Business</p>
                <p className="text-[8px] text-slate-400 mt-1">SmartStore LK • Systems Inc.</p>
              </div>
            </div>

            {/* Print and Close Actions */}
            <div className="border-t border-slate-150 bg-slate-50 p-4 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm"
              >
                Print Receipt
              </button>

              <button
                onClick={() => setShowInvoice(false)}
                className="flex-1 bg-white hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl border border-slate-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanBarcode}
      />
    </DashboardLayout>
  );
};

export default POS;
