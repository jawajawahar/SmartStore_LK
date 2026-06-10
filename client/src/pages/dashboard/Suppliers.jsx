import { useEffect, useState } from "react";
import { FaTruck, FaSearch, FaPlus } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { toast } from "react-toastify";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    address: "",
  });

  // Fetch Suppliers
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/suppliers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load suppliers");
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add Supplier
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await API.post("/suppliers", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Supplier registered successfully");
      setFormData({ name: "", company: "", phone: "", address: "" });
      setShowForm(false);
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      toast.error("Failed to register supplier");
    }
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">Suppliers</h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage supplier vendor accounts and outstanding payable balances
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[10px]" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-border-color bg-bg-card text-text-main placeholder:text-text-secondary/50 pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 text-sm w-full md:w-[240px] transition-all"
            />
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/15 cursor-pointer active:scale-[0.98]"
          >
            <FaPlus className="text-xs" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Add Supplier Form (Collapsible) */}
      {showForm && (
        <div className="border border-border-color bg-bg-card rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-text-main mb-5 tracking-tight">Register New Supplier</h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <FormInput label="Supplier Name" name="name" value={formData.name} onChange={handleChange} />
            <FormInput label="Company Name" name="company" value={formData.company} onChange={handleChange} />
            <FormInput label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
            <FormInput label="Address" name="address" value={formData.address} onChange={handleChange} />

            <div className="xl:col-span-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-border-color text-text-secondary hover:bg-bg-main transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-indigo-600/10"
              >
                Register Supplier Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Suppliers", value: suppliers.length, color: "indigo" },
          { label: "Total Outstanding", value: `Rs. ${suppliers.reduce((a, s) => a + (s.payableAmount || 0), 0).toLocaleString()}`, color: "rose" },
          { label: "Fully Settled", value: suppliers.filter(s => !s.payableAmount || s.payableAmount === 0).length, color: "emerald" },
          { label: "With Balance Due", value: suppliers.filter(s => s.payableAmount > 0).length, color: "amber" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`border border-${color}-500/15 bg-${color}-500/5 rounded-xl p-4`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider text-${color}-500 mb-1`}>{label}</p>
            <p className="text-lg font-extrabold text-text-main">{value}</p>
          </div>
        ))}
      </div>

      {/* Supplier Table */}
      <div className="border border-border-color bg-bg-card rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-main border-b border-border-color">
              <tr>
                {["Supplier Name", "Company", "Phone", "Address", "Payable Balance"].map((th) => (
                  <th key={th} className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    {th}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border-color">
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-bg-main/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-black uppercase">
                          {supplier.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-text-main">{supplier.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary text-sm">{supplier.company || "—"}</td>
                    <td className="px-5 py-3.5 text-text-secondary text-sm font-mono">{supplier.phone || "—"}</td>
                    <td className="px-5 py-3.5 text-text-secondary text-sm max-w-[180px] truncate">{supplier.address || "—"}</td>
                    <td className="px-5 py-3.5">
                      {Number(supplier.payableAmount || 0) > 0 ? (
                        <span className="text-rose-500 font-bold text-sm">
                          Rs. {Number(supplier.payableAmount || 0).toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-text-secondary text-sm">
                    <FaTruck className="mx-auto mb-2 text-2xl opacity-30" />
                    No suppliers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Reusable Input Component
const FormInput = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required
      className="w-full border border-border-color bg-bg-main text-text-main placeholder:text-text-secondary/40 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm"
    />
  </div>
);

export default Suppliers;
