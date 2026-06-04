import { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    customerType: "normal",
  });

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
    fetchCustomers();
  }, []);

  // Handle Input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Submit Customer
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      if (editingId) {
        // UPDATE
        await API.put(`/customers/${editingId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        alert("Customer Updated Successfully");
      } else {
        // ADD
        await API.post("/customers", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        alert("Customer Added Successfully");
      }

      // Reset Form
      setFormData({
        name: "",
        phone: "",
        address: "",
        customerType: "normal",
      });

      setEditingId(null);
      fetchCustomers();
    } catch (error) {
      console.log(error);
      alert("Failed to Save Customer");
    }
  };

  // Edit Customer
  const handleEdit = (customer) => {
    setEditingId(customer._id);

    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      customerType: customer.customerType,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Delete Customer
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const confirmDelete = window.confirm("Delete this customer?");

      if (!confirmDelete) return;

      await API.delete(`/customers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Customer Deleted Successfully");
      fetchCustomers();
    } catch (error) {
      console.log(error);
      alert("Failed to Delete Customer");
    }
  };

  // Search Filter
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Customers</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage customer accounts, metrics, and outstanding balances
          </p>
        </div>
      </div>

      {/* Add/Edit Customer Form */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-5 tracking-tight">
          {editingId ? "Edit Customer Profile" : "Register New Customer"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
        >
          <Input
            label="Customer Name"
            name="name"
            value={formData.name}
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

          {/* Customer Type */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Customer Type</label>
            <select
              name="customerType"
              value={formData.customerType}
              onChange={handleChange}
              className="w-full bg-[#111827] border border-slate-800 text-slate-100 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm cursor-pointer"
            >
              <option value="normal">Normal Customer</option>
              <option value="bulk">Bulk Buyer</option>
            </select>
          </div>

          {/* Button */}
          <div className="xl:col-span-4 flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer active:scale-[0.99] shadow-lg shadow-indigo-600/10"
            >
              {editingId ? "Update Account Details" : "Register Customer"}
            </button>
          </div>
        </form>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Filter customer accounts registry..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-[#0b0f19] border border-slate-800 text-slate-200 placeholder-slate-500 px-5 py-3 rounded-xl outline-none focus:border-slate-700 transition-colors text-sm mb-6"
      />

      {/* Customer Table */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#111827]/60 border-b border-slate-800">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Phone</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Address</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Current Debt</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-850">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="hover:bg-slate-800/25 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-200 text-sm">{customer.name}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-sm">{customer.phone}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-sm">{customer.address}</td>

                    {/* Type Badge */}
                    <td className="px-5 py-3.5 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                          customer.customerType === "bulk"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {customer.customerType}
                      </span>
                    </td>

                    {/* Debt */}
                    <td className="px-5 py-3.5 text-rose-400 font-semibold text-sm">
                      Rs. {Number(customer.currentDebt || 0).toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-sm">
                      <div className="flex items-center gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => handleEdit(customer)}
                          className="w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-650 hover:bg-indigo-600 text-indigo-400 hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer"
                        >
                          <FaEdit className="text-xs" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(customer._id)}
                          className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-650 hover:bg-rose-600 text-rose-400 hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-500 text-sm">No customers matched search parameters.</td>
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

export default Customers;

