'use client';

import { useState } from 'react';
import { VaultProvider } from '../store/useVaultStore';
import Header from '../components/Header';
import Toasts from '../components/Toast';
import OverviewPage from '../views/OverviewPage';
import RulesPage from '../views/RulesPage';
import AgentPage from '../views/AgentPage';
import ReceiptsPage from '../views/ReceiptsPage';

const PAGES = { overview: OverviewPage, rules: RulesPage, agent: AgentPage, receipts: ReceiptsPage };

export default function Home() {
  const [tab, setTab] = useState('overview');
  const Page = PAGES[tab];
  return (
    <VaultProvider>
      <div className="mx-auto max-w-[1280px] p-3 pb-28 sm:p-6 md:pb-6">
        <div className="rounded-[2rem] bg-paper p-5 shadow-[0_30px_60px_-40px_rgba(0,0,0,.35)] sm:p-8">
          <Header tab={tab} setTab={setTab} />
          <main className="mt-8">
            <Page go={setTab} />
          </main>
          <footer className="mt-10 text-center text-xs text-mute">
            Guardrails cap the damage; they don’t make the AI’s decisions good. Testnet only · unaudited · all data on this screen is MOCK.
          </footer>
        </div>
      </div>
      <Toasts />
    </VaultProvider>
  );
}
