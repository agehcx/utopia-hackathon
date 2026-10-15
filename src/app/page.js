'use client';

import { useState } from 'react';
import { VaultProvider } from '../store/useVaultStore';
import SidebarNav from '../components/layout/SidebarNav';
import Topbar from '../components/layout/Topbar';
import ToastContainer from '../components/Toast';
import PolicyPage from '../views/PolicyPage';
import AgentPage from '../views/AgentPage';
import AuditPage from '../views/AuditPage';

function AppShell() {
  const [page, setPage] = useState('policy');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case 'policy': return <PolicyPage />;
      case 'agent':  return <AgentPage />;
      case 'audit':  return <AuditPage />;
      default:       return <PolicyPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-300">
      <SidebarNav
        page={page}
        setPage={setPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar page={page} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function Home() {
  return (
    <VaultProvider>
      <AppShell />
    </VaultProvider>
  );
}
