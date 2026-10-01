import AdminDashboardModal from './AdminDashboardModal';
import type { Theme } from '../App';

/** Keep the standalone admin route on the same authenticated dashboard surface. */
export default function AdminDashboard({ theme }: { theme: Theme }) {
  return <AdminDashboardModal isOpen standalone theme={theme} onClose={() => window.location.assign('/')} />;
}
