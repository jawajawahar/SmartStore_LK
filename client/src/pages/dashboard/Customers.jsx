import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaCloudUploadAlt } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { toast } from "react-toastify";
import BulkUpload from "../../components/BulkUpload";
import Pagination from "../../components/Pagination";
import { TableSkeleton } from "../../components/SkeletonLoader";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    customerType: "normal",
  });

  // Fetch Customers
  const fetchCustomers = async () => {
    setLoading(true);
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
      toast.error("Failed to load customer accounts registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

        toast.success("Customer account updated successfully");
      } else {
        // ADD
        await API.post("/customers", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        toast.success("Customer registered successfully");
      }

      // Reset Form
      setFormData({
        name: "",
        phone: "",
        address: "",
        customerType: "normal",
      });

      setEditingId(null);
      setShowForm(false);
      fetchCustomers();
    } catch (error) {
      console.log(error);
      toast.error("Failed to save customer record");
    }
  };

  // Edit Customer
  const handleEdit = (customer) => {
    setEditingId(customer._id);

    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || "",
      customerType: customer.customerType || "normal",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Delete Customer
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const confirmDelete = window.confirm("Are you sure you want to delete this customer account?");

      if (!confirmDelete) return;

      await API.delete(`/customers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Customer record deleted successfully");
      fetchCustomers();
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete customer");
    }
  };

  // Search Filter
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone?.includes(search)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">Customers</h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage customer accounts, metrics, and outstanding balances
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/15 border border-indigo-600/20 text-indigo-500 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            <FaCloudUploadAlt /> Bulk Import CSV
          </button>

          <button
            onClick={() => {
              setShowForm(!showForm);
              if (editingId) {
                setEditingId(null);
                setFormData({ name: "", phone: "", address: "", customerType: "normal" });
              }
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/15 cursor-pointer active:scale-[0.98]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? "Hide Form" : "Add Customer"}
          </button>
        </div>
      </div>

      {/* Add/Edit Customer Form */}
      {showForm && (
        <div className="bg-bg-card border border-border-color rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-text-main mb-5 tracking-tight">
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
              <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Customer Type</label>
              <select
                name="customerType"
                value={formData.customerType}
                onChange={handleChange}
                className="w-full bg-bg-main border border-border-color text-text-main px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm cursor-pointer"
              >
                <option value="normal">Normal Customer</option>
                <option value="bulk">Bulk Buyer</option>
              </select>
            </div>

            {/* Button */}
            <div className="xl:col-span-4 flex justify-end gap-3">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer active:scale-[0.99] shadow-lg shadow-indigo-600/10"
              >
                {editingId ? "Update Account Details" : "Register Customer"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    name: "",
                    phone: "",
                    address: "",
                    customerType: "normal",
                  });
                }}
                className="px-4 py-2.5 border border-border-color hover:bg-bg-main text-text-secondary rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Filter customer accounts by name or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-bg-card border border-border-color text-text-main placeholder-text-secondary/40 px-5 py-3 rounded-xl outline-none focus:border-indigo-500 transition-colors text-xs mb-6 shadow-xs"
      />

      {/* Customer Table */}
      {loading ? (
        <TableSkeleton cols={6} rows={6} />
      ) : (
        <div className="bg-bg-card border border-border-color rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-main/60 border-b border-border-color">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Phone</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Address</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Type</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Current Debt</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-color/60">
                {currentCustomers.length > 0 ? (
                  currentCustomers.map((customer) => (
                    <tr
                      key={customer._id}
                      className="hover:bg-bg-main/30 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-text-main text-xs">{customer.name}</td>
                      <td className="px-5 py-3.5 text-text-secondary text-xs">{customer.phone}</td>
                      <td className="px-5 py-3.5 text-text-secondary text-xs text-slate-500">{customer.address || "—"}</td>

                      {/* Type Badge */}
                      <td className="px-5 py-3.5 text-xs">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase ${
                            customer.customerType === "bulk"
                              ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                              : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          }`}
                        >
                          {customer.customerType}
                        </span>
                      </td>

                      {/* Debt */}
                      <td className="px-5 py-3.5 text-rose-500 font-extrabold text-xs">
                        Rs. {Number(customer.currentDebt || 0).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-xs">
                        <div className="flex items-center gap-2">
                          {/* Edit */}
                          <button
                            onClick={() => handleEdit(customer)}
                            className="w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-650 hover:bg-indigo-600 text-indigo-500 hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer"
                          >
                            <FaEdit className="text-[10px]" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(customer._id)}
                            className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-650 hover:bg-rose-600 text-rose-500 hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer"
                          >
                            <FaTrash className="text-[10px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-text-secondary text-xs">No customers matched search parameters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
      <BulkUpload
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        type="customers"
        onSuccess={fetchCustomers}
      />
    </DashboardLayout>
  );
};

// Reusable Input
const Input = ({ label, name, value, onChange }) => {
  return (
    <div>
      <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full bg-bg-main border border-border-color text-text-main placeholder-text-secondary/40 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm"
      />
    </div>
  );
};

export default Customers;
