import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { FaEdit, FaTrash, FaPlus, FaFilter, FaCloudUploadAlt } from "react-icons/fa";
import API from "../../services/api";
import { toast } from "react-toastify";
import BulkUpload from "../../components/BulkUpload";
import Pagination from "../../components/Pagination";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [image, setImage] = useState(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Product Type
  const [productType, setProductType] = useState("fixed");

  // Unit
  const [unit, setUnit] = useState("pcs");

  // Form
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    buyingPrice: "",
    sellingPrice: "",
    bulkPrice: "",
    stock: "",
    barcode: "",
  });

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
      toast.error("Failed to load products registry");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle Input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Submit Product
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      formData.productType = productType;
      formData.unit = unit;

      if (editingId) {
        // UPDATE
        await API.put(`/products/${editingId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        toast.success("Product updated successfully");
      } else {
        // ADD
        const productData = new FormData();

        Object.keys(formData).forEach((key) => {
          productData.append(key, formData[key]);
        });

        if (image) {
          productData.append("image", image);
        }

        await API.post("/products", productData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        toast.success("Product added successfully");
      }

      // Reset
      setFormData({
        name: "",
        category: "",
        buyingPrice: "",
        sellingPrice: "",
        bulkPrice: "",
        stock: "",
        barcode: "",
      });

      setProductType("fixed");
      setUnit("pcs");
      setImage(null);
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to Save Product");
    }
  };

  // Edit Product
  const handleEdit = (product) => {
    setEditingId(product._id);

    setFormData({
      name: product.name,
      category: product.category,
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      bulkPrice: product.bulkPrice || "",
      stock: product.stock,
      barcode: product.barcode || "",
    });

    setProductType(product.productType || "fixed");
    setUnit(product.unit || "pcs");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Delete Product
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const confirmDelete = window.confirm("Are you sure you want to delete this product?");

      if (!confirmDelete) return;

      await API.delete(`/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete product");
    }
  };

  // Filter
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku?.toLowerCase().includes(search.toLowerCase()) ||
    product.category?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">Products</h1>
          <p className="text-text-secondary text-sm mt-1">Smart inventory management and catalog control</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/15 border border-indigo-600/20 text-indigo-500 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            <FaCloudUploadAlt /> Bulk Import CSV
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-bg-card border border-border-color rounded-xl p-6 mb-8 shadow-sm">
        <h2 className="text-lg font-bold text-text-main mb-5 tracking-tight">
          {editingId ? "Edit Product Details" : "Add New Product"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          <Input
            label="Product Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />

          <Select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          />

          <Input
            label="Buying Price (Rs.)"
            name="buyingPrice"
            type="number"
            value={formData.buyingPrice}
            onChange={handleChange}
          />

          <Input
            label="Selling Price (Rs.)"
            name="sellingPrice"
            type="number"
            value={formData.sellingPrice}
            onChange={handleChange}
          />

          <Input
            label="Bulk Price (Rs.)"
            name="bulkPrice"
            type="number"
            value={formData.bulkPrice}
            onChange={handleChange}
          />

          <Input
            label="Initial Stock"
            name="stock"
            type="number"
            value={formData.stock}
            onChange={handleChange}
          />

          <Input
            label="Barcode / SKU"
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
          />

          {/* Product Type */}
          <div>
            <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Product Type</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full bg-bg-main border border-border-color text-text-main px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm cursor-pointer"
            >
              <option value="fixed">Fixed Product</option>
              <option value="weighted">Weighted Product</option>
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-bg-main border border-border-color text-text-main px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm cursor-pointer"
            >
              <option value="pcs">Pieces (pcs)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="litre">Litres (litre)</option>
              <option value="ml">Millilitres (ml)</option>
            </select>
          </div>

          {/* Image */}
          {!editingId && (
            <div>
              <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">Product Image</label>
              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
                className="w-full bg-bg-main border border-border-color text-text-secondary rounded-xl px-4 py-1.5 text-xs outline-none cursor-pointer file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/15 file:text-indigo-500 hover:file:bg-indigo-600/25"
              />
            </div>
          )}

          {/* Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer active:scale-[0.99] shadow-lg shadow-indigo-600/10"
            >
              {editingId ? "Update Product" : "Add Product to Inventory"}
            </button>
          </div>
        </form>
      </div>

      {/* Search Filter */}
      <div className="mb-6 relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary">
          <FaFilter className="text-xs" />
        </span>
        <input
          type="text"
          placeholder="Filter products catalog by name, category or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-bg-card border border-border-color text-text-main pl-9 pr-5 py-3 rounded-xl outline-none focus:border-indigo-500 transition-colors text-xs placeholder-text-secondary/40 shadow-xs"
        />
      </div>

      {/* Table */}
      <div className="bg-bg-card border border-border-color rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-main/60 border-b border-border-color">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Image</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Buying (Rs.)</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Selling (Rs.)</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Stock</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Unit</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-color/60">
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => (
                  <tr
                    key={product._id}
                    className="hover:bg-bg-main/30 transition-colors"
                  >
                    {/* Image */}
                    <td className="px-5 py-3.5">
                      <img
                        src={`http://localhost:5000/${product.image}`}
                        alt={product.name}
                        className="w-11 h-11 rounded-lg object-cover bg-bg-main border border-border-color/60"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=120&auto=format&fit=crop";
                        }}
                      />
                    </td>

                    {/* Name */}
                    <td className="px-5 py-3.5 font-bold text-text-main text-xs">{product.name}</td>

                    {/* Category */}
                    <td className="px-5 py-3.5 text-text-secondary text-xs">{product.category || "General"}</td>

                    {/* Buying */}
                    <td className="px-5 py-3.5 text-text-secondary text-xs">Rs. {Number(product.buyingPrice).toLocaleString()}</td>

                    {/* Selling */}
                    <td className="px-5 py-3.5 text-indigo-500 font-extrabold text-xs">Rs. {Number(product.sellingPrice).toLocaleString()}</td>

                    {/* Stock */}
                    <td className="px-5 py-3.5 text-xs">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          product.stock <= product.minStockLevel
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            : "bg-emerald-550/10 bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        }`}
                      >
                        {product.stock} {product.unit}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3.5 text-xs">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          product.productType === "weighted"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                        }`}
                      >
                        {product.productType}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="px-5 py-3.5 uppercase text-text-secondary text-[10px] font-bold">{product.unit}</td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-xs">
                      <div className="flex items-center gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => handleEdit(product)}
                          className="w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-650 hover:bg-indigo-600 text-indigo-500 hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer"
                        >
                          <FaEdit className="text-[10px]" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(product._id)}
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
                  <td colSpan="9" className="text-center py-8 text-text-secondary text-xs">No products matched search parameters.</td>
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
        type="products"
        onSuccess={fetchProducts}
      />
    </DashboardLayout>
  );
};

// Input Component
const Input = ({ label, name, type = "text", value, onChange }) => {
  return (
    <div>
      <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full bg-bg-main border border-border-color text-text-main placeholder-text-secondary/40 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm"
      />
    </div>
  );
};

// Category Select
const Select = ({ label, name, value, onChange }) => {
  return (
    <div>
      <label className="block text-text-secondary text-[10px] font-bold uppercase tracking-wider mb-2">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full bg-bg-main border border-border-color text-text-main px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm cursor-pointer"
      >
        <option value="">Select Category</option>
        <option value="Grocery">Grocery</option>
        <option value="Cosmetics">Cosmetics</option>
        <option value="Beverages">Beverages</option>
        <option value="Household">Household</option>
      </select>
    </div>
  );
};

export default Products;
