import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { History, Search, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';

export default function InventoryHistory() {
  const [movements, setMovements] = useState([]);
  const [reasonFilter, setReasonFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (reasonFilter.trim()) params.reason = reasonFilter.trim();

      const res = await api.get('/movements', { params });
      setMovements(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch inventory history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMovements();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Movements</h1>
          <p className="text-sm text-slate-500 mt-0.5">Audit log of all stock adjustments, replenishments, and deductions</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Filter by reason (e.g. restock, order)..."
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </form>

        <button
          onClick={fetchMovements}
          title="Refresh Log"
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors inline-flex items-center text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-400">
            No stock movements recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Change</th>
                  <th className="px-6 py-3.5">Resulting Stock</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => {
                  const isPositive = m.change > 0;
                  return (
                    <tr key={m._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {m.product?.name || 'Deleted Product'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {m.product?.sku || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isPositive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                          {isPositive ? `+${m.change}` : m.change}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {m.resultingStock !== undefined ? m.resultingStock : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {m.reason}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {m.user || 'system'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(m.time || m.createdAt).toLocaleString()}
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
