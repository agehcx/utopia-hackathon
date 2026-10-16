import { VaultProvider } from '../../store/useVaultStore';
import AppShell from '../../components/AppShell';

export const metadata = {
  title: 'App (demo)',
  description: 'Offline demo of the Bounded policy vault. All data is simulated.',
};

export default function AppLayout({ children }) {
  return (
    <VaultProvider>
      <AppShell>{children}</AppShell>
    </VaultProvider>
  );
}
