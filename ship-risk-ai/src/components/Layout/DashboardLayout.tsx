import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../Common/Header';
import { Sidebar } from '../Common/Sidebar';
import { Footer } from '../Common/Footer';
import { Menu, X } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Mobile menu toggle */}
      <div className="lg:hidden flex items-center px-4 py-2 glass border-b border-white/10">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-light hover:text-accent transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <span className="ml-2 text-sm text-light font-medium">Menu</span>
      </div>

      <div className="flex flex-1 relative">
        {/* Desktop sidebar — always visible */}
        <div className="hidden lg:block">
          <Sidebar onNavigate={() => {}} />
        </div>

        {/* Mobile sidebar — overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </>
        )}

        <main className="flex-1 p-4 sm:p-6 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};
