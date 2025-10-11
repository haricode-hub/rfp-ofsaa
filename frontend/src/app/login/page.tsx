"use client";

import React, { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Login failed');
      }

      // Redirect to home page after successful login - use window.location for full page reload
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex"
         style={{
           backgroundColor: 'var(--bg-primary)',
           color: 'var(--text-primary)'
         }}>
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo/Brand */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2"
                style={{ color: 'var(--blue-primary)' }}>
              SensAi
            </h1>
            <p className="text-sm"
               style={{ color: 'var(--text-secondary)' }}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Login Form */}
          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium"
                       style={{ color: 'var(--text-primary)' }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input w-full"
                  placeholder="name@example.com"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium"
                         style={{ color: 'var(--text-primary)' }}>
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input w-full"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-4 rounded-lg text-sm border"
                     style={{
                       backgroundColor: 'rgba(239, 68, 68, 0.1)',
                       borderColor: 'rgba(239, 68, 68, 0.3)',
                       color: '#ef4444'
                     }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>

          {/* Footer Text */}
          <p className="text-center text-sm"
             style={{ color: 'var(--text-muted)' }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8"
           style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="max-w-md space-y-5 text-center">
          <h2 className="text-2xl font-bold"
              style={{ color: 'var(--text-heading)' }}>
            Welcome to SensAi
          </h2>
          <p className="text-base"
             style={{ color: 'var(--text-secondary)' }}>
            SensAI is our organization&apos;s hub for intelligent automation and productivity—going far beyond document generation.It orchestrates AI-powered workflows; 
            automates repetitive tasks; and applies advanced analytics and recommendations to drive better decisions.
          </p>
          <div className="grid gap-3 pt-6">
            <div className="flex items-start gap-2 text-left">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                   style={{ backgroundColor: 'var(--blue-primary)' }}>
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-0.5"
                    style={{ color: 'var(--text-primary)' }}>
                  Advanced AI models for intelligent document analysis
                </h3>
              </div>
            </div>
            <div className="flex items-start gap-2 text-left">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                   style={{ backgroundColor: 'var(--blue-primary)' }}>
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-0.5"
                    style={{ color: 'var(--text-primary)' }}>
                  Enterprise-grade security for your sensitive documents
                </h3>
              </div>
            </div>
            <div className="flex items-start gap-2 text-left">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                   style={{ backgroundColor: 'var(--blue-primary)' }}>
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-0.5"
                    style={{ color: 'var(--text-primary)' }}>
                  Lightning-fast processing and real-time results
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
