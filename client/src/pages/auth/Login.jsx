import { useState } from "react";
import { FaEye, FaEyeSlash, FaShoppingCart, FaChartLine, FaBoxOpen, FaUsers } from "react-icons/fa";
import { motion } from "framer-motion";
import API from "../../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const FEATURES = [
  { icon: FaChartLine, label: "Live Analytics", desc: "Real-time sales & revenue dashboards" },
  { icon: FaBoxOpen, label: "Inventory Control", desc: "Stock tracking with auto-reorder alerts" },
  { icon: FaUsers, label: "Customer CRM", desc: "Credit accounts and debt management" },
  { icon: FaShoppingCart, label: "Fast POS Checkout", desc: "Multi-payment mode point of sale" },
];

const MOCK_SALES = [
  { name: "Cosmetics Batch #492", sub: "Walk-in Customer", amount: "+Rs. 4,850", positive: true },
  { name: "Beverage Restock", sub: "Distributors Ltd.", amount: "−Rs. 12,400", positive: false },
  { name: "Bulk Grocery Sale", sub: "J. R. Wijesinghe", amount: "+Rs. 18,200", positive: true },
];

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await API.post("/auth/login", formData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      toast.success("Welcome back! Redirecting to dashboard...");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] flex items-center justify-center p-4 relative overflow-hidden font-sans">

      {/* Background ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/8 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-violet-600/6 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/4 blur-[100px] rounded-full" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="w-full max-w-5xl rounded-2xl overflow-hidden flex shadow-2xl shadow-black/40 border border-white/[0.06] bg-[#0c1020]/90 backdrop-blur-xl relative z-10"
      >
        {/* ── Left Panel (Branding) ── */}
        <div className="hidden lg:flex flex-1 flex-col justify-between p-10 relative border-r border-white/[0.06]">
          {/* Gradient tint */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/8 via-transparent to-violet-600/5 pointer-events-none" />

          {/* Logo */}
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-600/30">
                S
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white">SmartStore LK</span>
                <span className="block text-[9px] text-slate-500 font-semibold uppercase tracking-widest -mt-0.5">Enterprise POS Platform</span>
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              A complete point-of-sale and financial management system built for modern Sri Lankan retail stores.
            </p>

            {/* Feature list */}
            <div className="mt-8 space-y-4">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="text-indigo-400 text-[11px]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live sales mockup */}
          <div className="relative mt-6">
            <div className="bg-[#111827]/80 border border-white/[0.06] rounded-xl p-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-white/[0.05] pb-2.5 mb-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Sales Stream</span>
                <span className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  LIVE
                </span>
              </div>
              <div className="space-y-2">
                {MOCK_SALES.map((sale, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.12, duration: 0.4 }}
                    className="flex justify-between items-center text-xs bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-lg"
                  >
                    <div>
                      <p className="text-slate-200 font-medium text-[11px]">{sale.name}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{sale.sub}</p>
                    </div>
                    <span className={`font-bold text-[11px] ${sale.positive ? "text-emerald-400" : "text-rose-400"}`}>
                      {sale.amount}
                    </span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-3 flex justify-between items-center text-xs bg-indigo-500/8 border border-indigo-500/15 p-2.5 rounded-lg">
                <span className="text-indigo-300 font-medium text-[11px]">Net Shift Revenue</span>
                <span className="text-indigo-400 font-bold text-[11px]">Rs. 84,910</span>
              </div>
            </div>
          </div>

          <p className="text-slate-600 text-[10px] font-medium mt-4 relative">
            © 2026 SmartStore LK. All rights reserved.
          </p>
        </div>

        {/* ── Right Panel (Login Form) ── */}
        <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-sm">

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-600/30">
                S
              </div>
              <span className="text-lg font-bold tracking-tight text-white">SmartStore LK</span>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
              <p className="text-slate-400 mt-2 text-sm">
                Sign in to access your store dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-2">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="name@store.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-600 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all duration-200 text-sm"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-600 px-4 py-3 pr-12 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all duration-200 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer relative overflow-hidden group"
              >
                <span className="relative z-10">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing In...
                    </span>
                  ) : "Sign In to Dashboard"}
                </span>
                {/* Shimmer on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </button>
            </form>

            <p className="text-slate-600 text-[11px] text-center mt-8">
              For access requests, contact your system administrator.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
