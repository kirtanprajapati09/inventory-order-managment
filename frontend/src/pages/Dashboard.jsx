import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Package, AlertTriangle, ShoppingCart, CheckCircle, Clock, Truck, XCircle, ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  const { totalProducts, lowStockCount, totalOrders, countsByStatus, recentOrders } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time inventory metrics and fulfillment summary</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Total Products</div>
            <div className="text-2xl font-bold text-slate-900">{totalProducts || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Low Stock (&le; 10)</div>
            <div className="text-2xl font-bold text-amber-600">{lowStockCount || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Total Orders</div>
            <div className="text-2xl font-bold text-slate-900">{totalOrders || 0}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Confirmed / Active</div>
            <div className="text-2xl font-bold text-emerald-600">
              {(countsByStatus?.Confirmed || 0) + (countsByStatus?.Shipped || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Status Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Orders Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-slate-700">Pending</span>
            </div>
            <span className="text-lg font-bold text-slate-900">{countsByStatus?.Pending || 0}</span>
          </div>

          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">Confirmed</span>
            </div>
            <span className="text-lg font-bold text-slate-900">{countsByStatus?.Confirmed || 0}</span>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Truck className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">Shipped</span>
            </div>
            <span className="text-lg font-bold text-slate-900">{countsByStatus?.Shipped || 0}</span>
          </div>

          <div className="p-4 bg-red-50/60 rounded-xl border border-red-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-slate-700">Cancelled</span>
            </div>
            <span className="text-lg font-bold text-slate-900">{countsByStatus?.Cancelled || 0}</span>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">Last 5 created customer orders</p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {(!recentOrders || recentOrders.length === 0) ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No orders created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  const statusColors = {
                    Pending: 'bg-amber-100 text-amber-800',
                    Confirmed: 'bg-indigo-100 text-indigo-800',
                    Shipped: 'bg-emerald-100 text-emerald-800',
                    Cancelled: 'bg-rose-100 text-rose-800',
                  };
                  return (
                    <tr key={order._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {order.customerName}
                        <div className="text-xs text-slate-400">{order.customerContact}</div>
                      </td>
                      <td className="px-6 py-4">
                        {order.items?.length || 0} item(s)
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        &#8377;{Number(order.totalAmount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusColors[order.status] || 'bg-slate-100 text-slate-700'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
