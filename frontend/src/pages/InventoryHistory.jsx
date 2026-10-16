import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { History, Search, RefreshCw, ArrowUp, ArrowDown, ShieldAlert, Clock } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Stock Movement Audit Log</h1>
          <p className="text-xs text-slate-500 mt-0.5">Immutable record of every inventory delta, confirmation, and adjustment</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Filter by reason (e.g. restock, Order #)..."
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </form>

        <button
          onClick={fetchMovements}
          title="Refresh Log"
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors inline-flex items-center text-xs font-bold uppercase tracking-wider"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh Log
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-200">
          {error}
        </div>
      )}

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No stock movements recorded</h3>
            <p className="text-xs text-slate-400 mt-1">Adjust product stock or confirm orders to generate audit movements.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Quantity Change</th>
                  <th className="px-6 py-3.5">Resulting Stock</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Logged By</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => {
                  const isPositive = m.change > 0;
                  return (
                    <tr key={m._id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {m.product?.name || 'Archived / Deleted'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600">
                        {m.product?.sku || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUp className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 mr-1 text-rose-600" />
                          )}
                          {isPositive ? `+${m.change}` : m.change}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-900">
                        {m.resultingStock !== undefined ? m.resultingStock : '-'}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {m.reason}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">
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
