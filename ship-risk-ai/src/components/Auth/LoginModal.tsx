import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, X } from 'lucide-react';
import type { UserRole } from '../../types/user';

interface LoginModalProps {
  onSelectRole: (role: UserRole) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSelectRole, onClose }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setTimeout(() => onSelectRole(role), 300);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="card max-w-md w-full mx-4 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-light hover:text-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            How would you like to login?
          </h2>
          <p className="text-light text-center mb-6 text-sm">
            Select your role to continue
          </p>

          {!selectedRole ? (
            <div className="space-y-4">
              <button
                onClick={() => handleSelect('user')}
                className="w-full p-5 glass-light rounded-lg hover:border-accent transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                    <User className="w-6 h-6" style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-lg">Login as User</div>
                    <div className="text-sm text-light mt-0.5">
                      View your shipments & track orders
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSelect('admin')}
                className="w-full p-5 glass-light rounded-lg hover:border-accent transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg gradient-primary">
                    <Shield className="w-6 h-6" style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-lg">Login as Admin</div>
                    <div className="text-sm text-light mt-0.5">
                      Full access to all shipments & reports
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-3"></div>
              <p className="text-light">
                Redirecting to {selectedRole} login...
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
