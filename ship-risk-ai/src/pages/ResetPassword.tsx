import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Mail,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
  ActionCodeError,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";

export const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const oobCode = new URLSearchParams(window.location.search).get("oobCode");

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError("Invalid password reset link");
        setVerifying(false);
        return;
      }

      try {
        if (!auth) {
          throw new Error("Firebase is not configured");
        }
        const email = await verifyPasswordResetCode(auth, oobCode);
        setEmail(email);
        setVerifying(false);
      } catch (err) {
        if (err instanceof ActionCodeError) {
          if (err.code === "auth/expired-action-code") {
            setError(
              "This password reset link has expired. Please request a new one.",
            );
          } else if (err.code === "auth/invalid-action-code") {
            setError("Invalid password reset link. Please request a new one.");
          } else {
            setError("Unable to verify reset link. Please try again.");
          }
        } else {
          setError("An error occurred. Please try again.");
        }
        setVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please enter and confirm your password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!auth || !oobCode) {
        throw new Error("Firebase configuration error");
      }
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      if (err instanceof ActionCodeError) {
        if (err.code === "auth/expired-action-code") {
          setError(
            "This link has expired. Please request a new password reset.",
          );
        } else if (err.code === "auth/invalid-action-code") {
          setError("Invalid link. Please request a new password reset.");
        } else if (err.code === "auth/weak-password") {
          setError("Password is too weak. Please use a stronger password.");
        } else {
          setError("Failed to reset password. Please try again.");
        }
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F0F] to-[#1a1a2e] flex items-center justify-center px-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C09891]"></div>
          <p className="text-light">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F0F] to-[#1a1a2e] flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Password Reset Successful
            </h1>
            <p className="text-light text-sm">
              Your password has been successfully reset. Redirecting you to
              login...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F0F] to-[#1a1a2e] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C09891] to-[#8B5E3C] flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Ship Risk AI</h1>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Reset Your Password
          </h2>
          <p className="text-light text-sm">
            Enter your new password below
            {email && (
              <span className="block mt-1">
                for <span className="text-accent">{email}</span>
              </span>
            )}
          </p>
        </div>

        {/* Card */}
        <div className="card space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password Field */}
            <div>
              <label className="block text-sm font-medium text-light mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter new password"
                  required
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light hover:text-accent transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-light mt-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-light mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Confirm password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light hover:text-accent transition-colors"
                >
                  {showConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Resetting...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Reset Password
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-light">
              Remember your password?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-accent hover:text-[#d4a9a0] transition-colors font-medium"
              >
                Back to Login
              </button>
            </p>
          </div>
        </div>

        {/* Security Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
        >
          <p className="text-xs text-blue-300 text-center">
            🔒 This page is secure. Your password will be encrypted.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
