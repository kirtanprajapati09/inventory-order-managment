import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Authentication failed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-2 text-indigo-600">
          <Layers className="w-10 h-10" />
          <span className="text-3xl font-extrabold tracking-tight">StockFlow</span>
        </div>
        <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-slate-800">
          {isRegister ? 'Create an inventory account' : 'Sign in to your account'}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          {isRegister ? 'First user is automatically assigned Admin role' : 'Enter your credentials to continue'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex rounded-lg bg-slate-100 p-1 mb-6 text-sm">
            <button
              type="button"
              className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                !isRegister ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => {
                setIsRegister(false);
                setError('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                isRegister ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => {
                setIsRegister(true);
                setError('');
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Jane Doe"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 inline-flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
