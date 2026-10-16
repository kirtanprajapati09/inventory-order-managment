import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, Trash2, SlidersHorizontal, AlertCircle, RefreshCw, X } from 'lucide-react';

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: '',
    stock: '',
  });

  // Adjust stock modal state
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustDelta, setAdjustDelta] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Form submit state
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category.trim()) params.category = category.trim();

      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params }),
        api.get('/products/categories'),
      ]);

      setProducts(prodRes.data.data);
      setCategories(catRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: '',
      price: '',
      stock: '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      description: prod.description || '',
      category: prod.category,
      price: prod.price,
      stock: prod.stock,
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, {
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          category: formData.category,
          price: Number(formData.price),
        });
      } else {
        await api.post('/products', {
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock),
        });
      }
      setIsFormOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to save product');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete product');
    }
  };

  const openAdjustModal = (prod) => {
    setAdjustingProduct(prod);
    setAdjustDelta('');
    setAdjustReason('');
    setAdjustError('');
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjustSubmitting(true);
    setAdjustError('');

    const delta = parseInt(adjustDelta, 10);
    if (isNaN(delta) || delta === 0) {
      setAdjustError('Delta must be a non-zero number');
      setAdjustSubmitting(false);
      return;
    }

    try {
      await api.post(`/products/${adjustingProduct._id}/adjust`, {
        delta,
        reason: adjustReason,
      });
      setAdjustingProduct(null);
      fetchProducts();
    } catch (err) {
      // Show 409 conflict error clearly
      const msg = err.response?.data?.error?.message || 'Stock adjustment conflict (409)';
      setAdjustError(msg);
    } finally {
      setAdjustSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage inventory catalog, pricing, and stock levels</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Product
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full md:w-48 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button
            onClick={fetchProducts}
            title="Refresh"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-400">
            No products found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Stock</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => {
                  const isLow = prod.stock <= 10;
                  return (
                    <tr key={prod._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{prod.name}</div>
                        {prod.description && (
                          <div className="text-xs text-slate-400 line-clamp-1">{prod.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-medium text-slate-700">
                        {prod.sku}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">
                          {prod.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        &#8377;{Number(prod.price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                            {prod.stock}
                          </span>
                          {isLow && (
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-amber-100 text-amber-800">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openAdjustModal(prod)}
                          title="Adjust Stock"
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors inline-flex items-center"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                          Adjust
                        </button>
                        <button
                          onClick={() => openEditModal(prod)}
                          title="Edit Product"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors inline-flex items-center"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod._id, prod.name)}
                          title="Delete Product"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Ergonomic Keyboard"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                    placeholder="KB-001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Electronics"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Price (&#8377;) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="2499"
                  />
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Initial Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="20"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Optional item details..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Adjust Inventory Stock</h2>
                <p className="text-xs text-slate-500">
                  {adjustingProduct.name} ({adjustingProduct.sku}) &bull; Current Stock: <span className="font-bold text-slate-800">{adjustingProduct.stock}</span>
                </p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adjustError && (
              <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <span className="font-bold">Conflict (409): </span>
                  <span>{adjustError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Delta (Change Amount) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="+10 to add, -5 to remove"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Positive integer adds stock. Negative integer decrements stock. Cannot result in negative stock.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shipment arrival, Damaged write-off, Audit correction"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {adjustSubmitting ? 'Adjusting...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
