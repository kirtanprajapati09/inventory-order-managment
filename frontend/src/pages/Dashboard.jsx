import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Package, AlertTriangle, ShoppingBag, CheckCircle2, Clock, Truck, XCircle, ArrowUpRight, TrendingUp } from 'lucide-react';

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
      <div className="flex justify-center items-center py-28">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-200 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchDashboard}
            className="px-3 py-1 bg-white text-rose-700 font-semibold text-xs rounded-lg border border-rose-200 hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { totalProducts, lowStockCount, totalOrders, countsByStatus, recentOrders } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time inventory metrics, order fulfillment pipeline, and logs</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Sync Active</span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Products</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalProducts || 0}</div>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-400 flex items-center">
            <span className="text-indigo-600 font-bold mr-1">Active items</span> in catalog
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Low Stock Alerts</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{lowStockCount || 0}</div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-400 flex items-center">
            <span className="text-amber-600 font-bold mr-1">Stock &le; 10</span> requires restock
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Orders</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalOrders || 0}</div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-400 flex items-center">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600 mr-1" />
            <span>All-time client requests</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Pipeline</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {(countsByStatus?.Confirmed || 0) + (countsByStatus?.Shipped || 0)}
              </div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-400 flex items-center">
            <span>Confirmed or Shipped orders</span>
          </div>
        </div>
      </div>

      {/* Orders Status Pipeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase tracking-wider text-slate-500 mb-4">
          Fulfillment Status Matrix
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100/80 rounded-xl text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Pending</span>
            </div>
            <span className="text-xl font-extrabold text-slate-900">{countsByStatus?.Pending || 0}</span>
          </div>

          <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100/80 rounded-xl text-indigo-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Confirmed</span>
            </div>
            <span className="text-xl font-extrabold text-slate-900">{countsByStatus?.Confirmed || 0}</span>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100/80 rounded-xl text-emerald-700">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Shipped</span>
            </div>
            <span className="text-xl font-extrabold text-slate-900">{countsByStatus?.Shipped || 0}</span>
          </div>

          <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-rose-100/80 rounded-xl text-rose-700">
                <XCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Cancelled</span>
            </div>
            <span className="text-xl font-extrabold text-slate-900">{countsByStatus?.Cancelled || 0}</span>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Customer Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">Quick glance at recent purchase activity</p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100/80 transition-colors"
          >
            <span>All Orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!recentOrders || recentOrders.length === 0) ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No customer orders found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Line Items</th>
                  <th className="px-6 py-3">Total Amount</th>
                  <th className="px-6 py-3">Order Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  const statusConfig = {
                    Pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
                    Confirmed: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
                    Shipped: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
                    Cancelled: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
                  };
                  const cfg = statusConfig[order.status] || { bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' };

                  return (
                    <tr key={order._id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{order.customerName}</div>
                        <div className="text-xs text-slate-400 font-mono">{order.customerContact}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600">
                        {order.items?.length || 0} product(s)
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        &#8377;{Number(order.totalAmount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border ${cfg.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dot}`}></span>
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
