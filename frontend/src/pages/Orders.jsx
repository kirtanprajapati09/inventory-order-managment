import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, ShoppingBag, AlertCircle, CheckCircle2, Truck, XCircle, Clock, X, Eye, FileText, User, Phone } from 'lucide-react';

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
      const msg = err.response?.data?.error?.message || 'Conflict: Order status transition failed';
      setConflictError(`[Conflict 409] ${msg}`);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    const statusConfig = {
      Pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
      Confirmed: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
      Shipped: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
      Cancelled: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    };
    const cfg = statusConfig[status] || { bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border ${cfg.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dot}`}></span>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage order confirmation, stock decrement, and shipment dispatch</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Order
        </button>
      </div>

      {/* Global 409 Conflict Banner */}
      {conflictError && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-3xl flex items-start justify-between shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-rose-900 text-xs uppercase tracking-wider">Inventory Shortage Conflict (409)</h4>
              <p className="text-xs text-rose-700 font-medium mt-0.5">{conflictError}</p>
            </div>
          </div>
          <button
            onClick={() => setConflictError('')}
            className="text-rose-400 hover:text-rose-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-200">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No customer orders placed yet</h3>
            <p className="text-xs text-slate-400 mt-1">Click "Create Order" to submit your first customer order.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Items</th>
                  <th className="px-6 py-3.5">Computed Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Placed On</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{o.customerName}</div>
                      <div className="text-xs text-slate-400 font-mono">{o.customerContact}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {o.items?.length || 0} product line(s)
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-900">
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
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100/90 border border-indigo-200/60 transition-all inline-flex items-center"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-xl w-full p-6 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-extrabold text-slate-900">Order #{selectedOrder._id.slice(-6)}</h2>
                  {statusBadge(selectedOrder.status)}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Placed by {selectedOrder.customerName} &bull; {selectedOrder.customerContact}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Line items table */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Order Line Items</h4>
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/50 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        SKU: {item.sku} &bull; Qty: {item.qty} &times; &#8377;{item.price}
                      </div>
                    </div>
                    <div className="font-extrabold text-slate-900">
                      &#8377;{(item.price * item.qty).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 font-extrabold text-slate-900 text-sm">
                <span>Server Computed Total:</span>
                <span className="text-indigo-600">&#8377;{Number(selectedOrder.totalAmount).toLocaleString()}</span>
              </div>
            </div>

            {/* Status workflow buttons */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Status Workflow Actions</h4>
              
              {selectedOrder.status === 'Pending' && (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    disabled={statusSubmitting}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Confirmed')}
                    className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Confirm (Decrement Stock)
                  </button>
                  <button
                    disabled={statusSubmitting}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Cancelled')}
                    className="flex-1 py-2.5 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Cancel Order
                  </button>
                </div>
              )}

              {selectedOrder.status === 'Confirmed' && (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    disabled={statusSubmitting}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Shipped')}
                    className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    <Truck className="w-4 h-4 mr-1.5" />
                    Mark Shipped
                  </button>
                  <button
                    disabled={statusSubmitting}
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Cancelled')}
                    className="flex-1 py-2.5 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Cancel & Restock
                  </button>
                </div>
              )}

              {(selectedOrder.status === 'Shipped' || selectedOrder.status === 'Cancelled') && (
                <div className="text-xs text-slate-500 italic text-center py-1">
                  Order is finalized in "{selectedOrder.status}". No further status transitions are valid.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Create New Customer Order</h2>
                <p className="text-xs text-slate-400 mt-0.5">Server automatically calculates real product prices &amp; totals</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 text-xs text-rose-800 bg-rose-50 rounded-2xl border border-rose-200 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-rose-600" />
                <span className="font-medium">{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Customer Contact (Phone or Email) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210 or customer@domain.com"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Order Items *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
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
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
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
                        className="w-20 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
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
