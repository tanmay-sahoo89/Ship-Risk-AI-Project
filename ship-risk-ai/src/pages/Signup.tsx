import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ship, Mail, Lock, Shield, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { UserRole } from '../types/user';

export const Signup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roleParam = (searchParams.get('role') as UserRole) || 'user';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      addNotification('error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      addNotification('error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, roleParam);
      addNotification('success', `Account created as ${roleParam} successfully!`);
      navigate('/dashboard');
    } catch (error) {
      addNotification('error', 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="gradient-primary p-3 rounded-xl inline-block mb-4">
            <Ship className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-light">Join Ship Risk AI today</p>

          {/* Role Badge */}
          <div className="mt-3 inline-flex items-center gap-2 glass-light px-3 py-1.5 rounded-lg">
            {roleParam === 'admin' ? (
              <Shield className="w-4 h-4 text-accent" />
            ) : (
              <User className="w-4 h-4 text-accent" />
            )}
            <span className="text-sm text-accent font-medium capitalize">
              {roleParam} Account
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-light mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-light mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                placeholder="At least 6 characters"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-light mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field pl-10"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-light">
            Already have an account?{' '}
            <Link to={`/login?role=${roleParam}`} className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
