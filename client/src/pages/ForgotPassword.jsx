import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setEmailError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Invalid email format'); return; }
    setLoading(true);
    setServerError('');
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setServerError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-color)]">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FF4D2E] shadow-lg shadow-[#FF4D2E]/30 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-color)] tracking-tight">Reset your password</h1>
          <p className="text-sm text-[var(--text-muted-color)] mt-1">Enter your email and we'll send you a reset link</p>
        </div>

        <div className="bg-[var(--surface-color)] rounded-2xl p-8 shadow-xl border border-[var(--text-muted-color)]/10">
          {submitted ? (
            <div className="text-center flex flex-col gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[var(--text-color)] font-medium">Check your inbox</p>
              <p className="text-sm text-[var(--text-muted-color)]">
                If an account exists for <strong>{email}</strong>, a password reset link has been sent.
              </p>
              <Link to="/login" className="text-[#FF5236] hover:underline text-sm font-medium mt-2">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <Input
                id="forgot-email"
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); setServerError(''); }}
                error={emailError}
                autoComplete="email"
              />

              {serverError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">
                  {serverError}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full mt-2">
                Send Reset Link
              </Button>

              <p className="text-center text-sm text-[var(--text-muted-color)]">
                <Link to="/login" className="text-[#FF5236] hover:underline font-medium">
                  Back to Login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
