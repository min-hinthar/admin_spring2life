'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { User, ShieldCheck, Stethoscope } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'user' | 'provider'>('user');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        await login(email, password);
        navigate('/');
      } else {
        await register(email, password, fullName, role);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    try {
      await login(demoEmail, 'password');
      navigate('/');
    } catch (e) {
      setError('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4">
      <div className="text-center mb-8 max-w-xl">
        <h1 className="text-4xl font-bold text-teal-900 mb-4 tracking-tight">Spring2Life</h1>
        <p className="text-gray-600 text-lg">
          A modern, secure platform connecting you with top mental health professionals.
        </p>
      </div>

      <Card className="w-full max-w-md shadow-lg border-0">
        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'signin' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'signup' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setMode('signup')}
          >
            Create Account
          </button>
        </div>

        <CardBody className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('user')}
                      className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${role === 'user' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('provider')}
                      className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${role === 'provider' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      Provider
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full py-2.5" isLoading={loading}>
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {mode === 'signin' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or try a demo account</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => handleDemoLogin('jane@example.com')} className="flex flex-col items-center justify-center p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <User className="h-5 w-5 text-gray-600 mb-1" />
                    <span className="text-xs text-gray-600">Patient</span>
                 </button>
                <button onClick={() => handleDemoLogin('dr.smith@spring2life.com')} className="flex flex-col items-center justify-center p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <Stethoscope className="h-5 w-5 text-gray-600 mb-1" />
                    <span className="text-xs text-gray-600">Provider</span>
                 </button>
                <button onClick={() => handleDemoLogin('admin@spring2life.com')} className="flex flex-col items-center justify-center p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <ShieldCheck className="h-5 w-5 text-gray-600 mb-1" />
                    <span className="text-xs text-gray-600">Admin</span>
                 </button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
