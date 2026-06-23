import { useEffect, useState } from "react";
import { FaTruck, FaSearch, FaPlus, FaCloudUploadAlt, FaEdit, FaTrash, FaBoxOpen, FaTimes } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import API from "../../services/api";
import { toast } from "react-toastify";
import BulkUpload from "../../components/BulkUpload";
import Pagination from "../../components/Pagination";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Products Modal State
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    address: "",
    notificationPreference: "email",
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

  // Add or Edit Supplier
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      if (editingId) {
        // UPDATE
        await API.put(`/suppliers/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Supplier updated successfully");
      } else {
        // ADD
        await API.post("/suppliers", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Supplier registered successfully");
      }

      setFormData({ name: "", company: "", phone: "", email: "", address: "", notificationPreference: "email" });
      setShowForm(false);
      setEditingId(null);
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      toast.error(editingId ? "Failed to update supplier" : "Failed to register supplier");
    }
  };

  // Pre-fill form for editing
  const handleEdit = (supplier) => {
    setEditingId(supplier._id);
    setFormData({
      name: supplier.name,
      company: supplier.company || "",
      phone: supplier.phone,
      email: supplier.email || "",
      address: supplier.address || "",
      notificationPreference: supplier.notificationPreference || "email",
    });
    setShowForm(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Delete Supplier
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const confirmDelete = window.confirm("Are you sure you want to delete this supplier?");
      if (!confirmDelete) return;

      await API.delete(`/suppliers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Supplier deleted successfully");
      fetchSuppliers();
      if (editingId === id) {
        setEditingId(null);
        setShowForm(false);
        setFormData({ name: "", company: "", phone: "", email: "", address: "", notificationPreference: "email" });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete supplier");
    }
  };

  // View Products for Supplier
  const handleViewProducts = async (supplier) => {
    try {
      setLoadingProducts(true);
      const token = localStorage.getItem("token");
      const response = await API.get(`/suppliers/${supplier._id}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSupplierProducts(response.data);
      setViewingSupplier(supplier);
      setIsProductsModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch supplier products");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle Selectione Suppliers
  const handleBulkDelete = async () => {
    try {
      const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedIds.length} selected suppliers?`);
      if (!confirmDelete) return;

      const token = localStorage.getItem("token");
      await API.post(`/suppliers/bulk-delete`, { ids: selectedIds }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`${selectedIds.length} suppliers deleted successfully`);
      setSelectedIds([]);
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      toast.error("Failed to bulk delete suppliers");
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredSuppliers.map(s => s._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.company?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

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
          <div className="relative flex items-center gap-2">
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
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 text-red-500 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap"
              >
                <FaTrash className="text-xs" /> Delete ({selectedIds.length})
              </button>
            )}
          </div>

          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/15 border border-indigo-600/20 text-indigo-500 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer"
          >
            <FaCloudUploadAlt /> Bulk Import
          </button>

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

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-5">
            <FormInput label="Supplier Name" name="name" value={formData.name} onChange={handleChange} />
            <FormInput label="Company Name" name="company" value={formData.company} onChange={handleChange} />
            <FormInput label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
            <FormInput label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" />
            <FormInput label="Address" name="address" value={formData.address} onChange={handleChange} />
            <div>
              <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Notification Alert</label>
              <select
                name="notificationPreference"
                value={formData.notificationPreference}
                onChange={handleChange}
                className="w-full bg-bg-main border border-border-color text-text-main px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm cursor-pointer"
              >
                <option value="email">Email Only</option>
                <option value="sms">SMS Only</option>
                <option value="whatsapp">WhatsApp Only</option>
                <option value="all">All Channels</option>
                <option value="none">None (Disabled)</option>
              </select>
            </div>

            <div className="xl:col-span-6 flex justify-end gap-3">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                {editingId ? "Update Supplier Info" : "Register Supplier Account"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setShowForm(false);
                    setFormData({ name: "", company: "", phone: "", address: "", email: "", notificationPreference: "email" });
                  }}
                  className="px-4 py-2.5 border border-border-color hover:bg-bg-main text-text-secondary rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
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
                <th className="px-5 py-3.5 w-12 text-left">
                  <input
                    type="checkbox"
                    checked={filteredSuppliers.length > 0 && selectedIds.length === filteredSuppliers.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-border-color bg-bg-card text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                {["Supplier Name", "Company", "Phone", "Email", "Address", "Preferred Alert", "Payable Balance", "Actions"].map((th) => (
                  <th key={th} className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    {th}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border-color">
              {currentSuppliers.length > 0 ? (
                currentSuppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-bg-main/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(supplier._id)}
                        onChange={() => handleSelect(supplier._id)}
                        className="w-4 h-4 rounded border-border-color bg-bg-card text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
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
                    <td className="px-5 py-3.5 text-text-secondary text-sm font-mono">{supplier.email || "—"}</td>
                    <td className="px-5 py-3.5 text-text-secondary text-sm max-w-[180px] truncate">{supplier.address || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider ${
                        supplier.notificationPreference === "whatsapp"
                          ? "bg-emerald-550/10 bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : supplier.notificationPreference === "sms"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : supplier.notificationPreference === "all"
                          ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                          : supplier.notificationPreference === "none"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                      }`}>
                        {supplier.notificationPreference || "email"}
                      </span>
                    </td>
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
                    <td className="px-5 py-3.5 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewProducts(supplier)}
                          className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                          title="View Supplied Products"
                        >
                          <FaBoxOpen className="text-[10px]" />
                        </button>
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="w-7 h-7 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 text-indigo-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                          title="Edit Supplier"
                        >
                          <FaEdit className="text-[10px]" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier._id)}
                          className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                          title="Delete Supplier"
                        >
                          <FaTrash className="text-[10px]" />
                        </button>
                      </div>
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
      <BulkUpload
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        type="suppliers"
        onSuccess={fetchSuppliers}
      />

      {/* Supplier Products Modal */}
      {isProductsModalOpen && viewingSupplier && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border-color rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-border-color bg-bg-main/50">
              <div>
                <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <FaBoxOpen className="text-sm" />
                  </span>
                  Products Supplied by {viewingSupplier.company || viewingSupplier.name}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Contact: {viewingSupplier.name} ({viewingSupplier.phone})
                </p>
              </div>
              <button
                onClick={() => setIsProductsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-bg-main hover:bg-rose-500/10 text-text-secondary hover:text-rose-500 flex items-center justify-center transition-all cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-text-secondary text-sm">Loading products...</p>
                </div>
              ) : supplierProducts.length === 0 ? (
                <div className="text-center py-10">
                  <FaBoxOpen className="text-4xl text-text-secondary/20 mx-auto mb-3" />
                  <p className="text-text-secondary text-sm">This supplier does not supply any products currently.</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-border-color rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-bg-main border-b border-border-color">
                      <tr>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-text-secondary">Product Name</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-text-secondary">SKU</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-text-secondary">Stock</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-text-secondary text-right">Buying Price</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-text-secondary text-right">Selling Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color/50">
                      {supplierProducts.map(p => (
                        <tr key={p._id} className="hover:bg-bg-main/30 transition-colors">
                          <td className="px-4 py-3 font-semibold text-text-main">{p.name}</td>
                          <td className="px-4 py-3 text-text-secondary font-mono">{p.sku || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${p.stock <= 5 ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {p.stock} {p.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-right text-text-main">Rs. {p.buyingPrice.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-right text-text-main">Rs. {p.sellingPrice.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
