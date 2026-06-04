import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { FaEdit, FaTrash } from "react-icons/fa";
import API from "../../services/api";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [image, setImage] = useState(null);

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
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

      // NEW
      // eslint-disable-next-line react-hooks/immutability
      formData.productType = productType;
      formData.unit = unit;

      if (editingId) {
        // UPDATE
        await API.put(`/products/${editingId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        alert("Product Updated Successfully");
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

        alert("Product Added Successfully");
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
      console.log(error);
      alert("Failed to Save Product");
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
      bulkPrice: product.bulkPrice,
      stock: product.stock,
      barcode: product.barcode,
    });

    // NEW
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
      const confirmDelete = window.confirm("Delete this product?");

      if (!confirmDelete) return;

      await API.delete(`/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Product Deleted Successfully");
      fetchProducts();
    } catch (error) {
      console.log(error);
      alert("Failed to Delete Product");
    }
  };

  // Filter
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Products</h1>
          <p className="text-slate-500 text-sm mt-1">Smart inventory management and catalog control</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-5 tracking-tight">
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
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Product Type</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full bg-[#111827] border border-slate-800 text-slate-100 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm cursor-pointer"
            >
              <option value="fixed">Fixed Product</option>
              <option value="weighted">Weighted Product</option>
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-[#111827] border border-slate-800 text-slate-100 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm cursor-pointer"
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
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Product Image</label>
              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
                className="w-full bg-[#111827] border border-slate-800 text-slate-400 rounded-xl px-4 py-1.5 text-xs outline-none cursor-pointer file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/15 file:text-indigo-400 hover:file:bg-indigo-600/25"
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

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Filter products catalog by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#0b0f19] border border-slate-800 text-slate-200 placeholder-slate-500 px-5 py-3 rounded-xl outline-none focus:border-slate-700 transition-colors text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#111827]/60 border-b border-slate-800">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Image</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Buying (Rs.)</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Selling (Rs.)</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Stock</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Unit</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-850">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr
                    key={product._id}
                    className="hover:bg-slate-800/25 transition-colors"
                  >
                    {/* Image */}
                    <td className="px-5 py-3.5">
                      <img
                        src={`http://localhost:5000/${product.image}`}
                        alt={product.name}
                        className="w-11 h-11 rounded-lg object-cover bg-slate-900 border border-slate-800"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=120&auto=format&fit=crop";
                        }}
                      />
                    </td>

                    {/* Name */}
                    <td className="px-5 py-3.5 font-semibold text-slate-200 text-sm">{product.name}</td>

                    {/* Category */}
                    <td className="px-5 py-3.5 text-slate-400 text-sm">{product.category}</td>

                    {/* Buying */}
                    <td className="px-5 py-3.5 text-slate-300 text-sm">Rs. {Number(product.buyingPrice).toLocaleString()}</td>

                    {/* Selling */}
                    <td className="px-5 py-3.5 text-indigo-400 font-medium text-sm">Rs. {Number(product.sellingPrice).toLocaleString()}</td>

                    {/* Stock */}
                    <td className="px-5 py-3.5 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                          product.stock <= 5
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                        }`}
                      >
                        {product.stock} {product.unit}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3.5 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                          product.productType === "weighted"
                            ? "bg-amber-500/10 text-amber-450 text-amber-400 border-amber-500/20"
                            : "bg-indigo-500/10 text-indigo-450 text-indigo-400 border-indigo-500/20"
                        }`}
                      >
                        {product.productType}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="px-5 py-3.5 uppercase text-slate-400 text-xs font-semibold">{product.unit}</td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-sm">
                      <div className="flex items-center gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => handleEdit(product)}
                          className="w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-650 hover:bg-indigo-600 text-indigo-400 hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer"
                        >
                          <FaEdit className="text-xs" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(product._id)}
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
                  <td colSpan="9" className="text-center py-6 text-slate-500 text-sm">No products matched search parameters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Input Component
const Input = ({ label, name, type = "text", value, onChange }) => {
  return (
    <div>
      <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full bg-[#111827] border border-slate-800 text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm"
      />
    </div>
  );
};

// Category Select
const Select = ({ label, name, value, onChange }) => {
  return (
    <div>
      <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full bg-[#111827] border border-slate-800 text-slate-100 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 transition-all text-sm cursor-pointer"
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

