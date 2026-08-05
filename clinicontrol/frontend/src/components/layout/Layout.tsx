import type { ReactNode } from 'react';
import { useState } from 'react';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import ToastContainer from '../ui/Toast';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <TopNav sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <main className={`${sidebarOpen ? 'pl-64' : ''} pt-14 transition-[padding] duration-300`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
