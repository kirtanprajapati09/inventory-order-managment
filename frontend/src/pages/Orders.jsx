import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, ShoppingCart, AlertCircle, CheckCircle, Truck, XCircle, Clock, X, Eye } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Conflict error banner for 409s
  const [conflictError, setConflictError] = useState('');

  // Create order modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [orderItems, setOrderItems] = useState([{ productId: '', qty: 1 }]);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // View order detail modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const fetchOrdersAndProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const [orderRes, prodRes] = await Promise.all([
        api.get('/orders'),
        api.get('/products'),
      ]);
      setOrders(orderRes.data.data);
      setProducts(prodRes.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch orders data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndProducts();
  }, []);

  const openCreateModal = () => {
    setCustomerName('');
    setCustomerContact('');
    setOrderItems([{ productId: products[0]?._id || '', qty: 1 }]);
    setCreateError('');
    setIsCreateOpen(true);
  };

  const handleAddItemRow = () => {
    setOrderItems([...orderItems, { productId: products[0]?._id || '', qty: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    setOrderItems(updated);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError('');

    try {
      const payload = {
        customerName,
        customerContact,
        items: orderItems.map((item) => ({
          productId: item.productId,
          qty: parseInt(item.qty, 10),
        })),
      };

      await api.post('/orders', payload);
      setIsCreateOpen(false);
      fetchOrdersAndProducts();
    } catch (err) {
      setCreateError(err.response?.data?.error?.message || 'Failed to create order');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId, nextStatus) => {
    setStatusSubmitting(true);
    setConflictError('');

    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
      setSelectedOrder(res.data.data);
      fetchOrdersAndProducts();
    } catch (err) {
      // Show 409 errors clearly
      const msg = err.response?.data?.error?.message || 'Conflict: Order status update failed';
      setConflictError(`[Conflict 409] ${msg}`);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      Pending: 'bg-amber-100 text-amber-800 border-amber-200',
      Confirmed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      Shipped: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Process orders, confirm inventory deductions, and update shipments</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Order
        </button>
      </div>

      {/* Global 409 Conflict Banner */}
      {conflictError && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start justify-between shadow-sm">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-900 text-sm">Inventory / Status Conflict</h4>
              <p className="text-sm text-rose-700 mt-0.5">{conflictError}</p>
            </div>
          </div>
          <button
            onClick={() => setConflictError('')}
            className="text-rose-400 hover:text-rose-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-400">
            No customer orders created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Items</th>
                  <th className="px-6 py-3.5">Server Computed Total</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created At</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{o.customerName}</div>
                      <div className="text-xs text-slate-400">{o.customerContact}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {o.items?.length || 0} product(s)
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      &#8377;{Number(o.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {statusBadge(o.status)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setConflictError('');
                          setSelectedOrder(o);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors inline-flex items-center"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail & Status Transition Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-900">Order #{selectedOrder._id.slice(-6)}</h2>
                  {statusBadge(selectedOrder.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placed by {selectedOrder.customerName} ({selectedOrder.customerContact})
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items list */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Order Line Items</h4>
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 flex justify-between items-center text-sm">
                    <div>
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-400 font-mono">SKU: {item.sku} &bull; Qty: {item.qty} &times; &#8377;{item.price}</div>
                    </div>
                    <div className="font-semibold text-slate-800">
                      &#8377;{(item.price * item.qty).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 font-bold text-slate-900">
                <span>Calculated Total:</span>
                <span>&#8377;{Number(selectedOrder.totalAmount).toLocaleString()}</span>
              </div>
            </div>

            {/* Transition actions */}
            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Status Workflow Actions</h4>
              
              {selectedOrder.status === 'Pending' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    disabled={statusSubmitting}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Confirmed')}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Confirm Order (Decrement Stock)
                  </button>
                  <button
                    disabled={statusSubmitting}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Cancelled')}
                    className="flex-1 py-2 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Cancel Order
                  </button>
                </div>
              )}

              {selectedOrder.status === 'Confirmed' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    disabled={statusSubmitting}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Shipped')}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    <Truck className="w-4 h-4 mr-1.5" />
                    Mark as Shipped
                  </button>
                  <button
                    disabled={statusSubmitting}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Cancelled')}
                    className="flex-1 py-2 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Cancel & Restock
                  </button>
                </div>
              )}

              {(selectedOrder.status === 'Shipped' || selectedOrder.status === 'Cancelled') && (
                <div className="text-xs text-slate-500 italic">
                  This order is finalized in state "{selectedOrder.status}" and no further transitions are allowed.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Create Customer Order</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Alice Smith"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Customer Contact (Phone/Email) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210 or alice@example.com"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold uppercase text-slate-600">
                    Order Items *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.sku}) &bull; Stock: {p.stock}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                        className="w-20 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
