import { VaultProvider } from '../../store/useVaultStore';
import AppShell from '../../components/AppShell';
import { BRAND } from '@/lib/site';

export const metadata = {
  title: 'App (demo)',
  description: `Offline demo of the ${BRAND} policy vault. All data is simulated.`,
};

export default function AppLayout({ children }) {
  return (
    <VaultProvider>
      <AppShell>{children}</AppShell>
    </VaultProvider>
  );
}
