import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuppliers(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSuppliers();
  }, []);

  // Handle Input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Add Supplier
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      await API.post("/suppliers", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Supplier Added Successfully");

      setFormData({
        name: "",
        company: "",
        phone: "",
        address: "",
      });

      fetchSuppliers();
    } catch (error) {
      console.log(error);
      alert("Failed to Add Supplier");
    }
  };

  // Search Filter
  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Suppliers</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage supplier vendor accounts and total payable outstanding balances
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search suppliers list..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#0b0f19] border border-slate-800 text-slate-200 placeholder-slate-500 px-5 py-2.5 rounded-xl outline-none focus:border-slate-700 text-sm w-full md:w-[260px] transition-colors"
        />
      </div>

      {/* Add Supplier Form */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-5 tracking-tight">Add New Supplier</h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
        >
          <Input
            label="Supplier Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />

          <Input
            label="Company Name"
            name="company"
            value={formData.company}
            onChange={handleChange}
          />

          <Input
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />

          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />

          {/* Button */}
          <div className="xl:col-span-4 flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer active:scale-[0.99] shadow-lg shadow-indigo-600/10"
            >
              Register Supplier Account
            </button>
          </div>
        </form>
      </div>

      {/* Supplier Table */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#111827]/60 border-b border-slate-800">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Supplier Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Company</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Phone</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Address</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Payable Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-850">
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier._id}
                    className="hover:bg-slate-800/25 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-200 text-sm">{supplier.name}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-sm">{supplier.company}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-sm">{supplier.phone}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-sm">{supplier.address}</td>
                    <td className="px-5 py-3.5 text-rose-400 font-bold text-sm">
                      Rs. {Number(supplier.payableAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-500 text-sm">No suppliers matched search parameters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Reusable Input
const Input = ({ label, name, value, onChange }) => {
  return (
    <div>
      <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full bg-[#111827] border border-slate-800 text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm"
      />
    </div>
  );
};

export default Suppliers;

