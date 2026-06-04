import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";
import API from "../../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Login
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await API.post("/auth/login", formData);

      // Save token
      localStorage.setItem("token", response.data.token);

      // Save user
      localStorage.setItem("user", JSON.stringify(response.data.user));

      toast.success("Login Successful");

      // Redirect
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full"></div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl h-[650px] rounded-2xl overflow-hidden flex shadow-2xl border border-slate-800 bg-[#0b0f19] relative z-10"
      >
        {/* Left Side (Mockup Presentation) */}
        <div className="hidden lg:flex flex-1 bg-[#0e1424] border-r border-slate-800/80 p-12 flex-col justify-between relative">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-black shadow-lg shadow-indigo-600/30">
                S
              </span>
              <span className="text-xl font-bold tracking-tight text-white">SmartStore LK</span>
            </div>

            <p className="text-slate-400 mt-5 text-sm leading-relaxed max-w-sm">
              An enterprise-grade grocery and cosmetics POS system designed for precision, speed, and clean financial ledger insights.
            </p>
          </div>

          {/* Interactive CSS Mockup */}
          <div className="relative my-auto py-8">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-2xl max-w-[340px] mx-auto relative">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Live Sales Stream</span>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs bg-slate-900/50 p-2.5 border border-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-slate-200 font-medium">Cosmetics Batch #492</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Walk-in Customer</p>
                  </div>
                  <span className="text-emerald-400 font-semibold">+Rs. 4,850</span>
                </div>
                <div className="flex justify-between items-center text-xs bg-slate-900/50 p-2.5 border border-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-slate-200 font-medium">Beverage Restock</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Distributors Ltd.</p>
                  </div>
                  <span className="text-rose-400 font-semibold">-Rs. 12,400</span>
                </div>
                <div className="flex justify-between items-center text-xs bg-slate-900/50 p-2.5 border border-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-slate-200 font-medium">Bulk Grocery Sale</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">J. R. Wijesinghe</p>
                  </div>
                  <span className="text-emerald-400 font-semibold">+Rs. 18,200</span>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center text-xs bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-lg">
                <span className="text-indigo-300 font-medium">Net Shift revenue</span>
                <span className="text-indigo-400 font-bold">Rs. 84,910</span>
              </div>
            </div>
          </div>

          <div className="text-slate-500 text-xs font-medium">
            © 2026 SmartStore LK. Enterprise POS Platform.
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight">Sign In</h2>
              <p className="text-slate-400 mt-2 text-sm">
                Enter your credentials to manage store operations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@store.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#111827] border border-slate-800 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-200 text-sm"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#111827] border border-slate-800 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-200 text-sm"
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

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

