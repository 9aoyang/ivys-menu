import type { Metadata, Viewport } from 'next';
import RoleGuard from '@/components/RoleGuard';

export const metadata: Metadata = {
  title: '后厨 Kitchen',
  manifest: '/kitchen/manifest.json',
  appleWebApp: {
    capable: true,
    title: '后厨',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
};

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-black">
      <RoleGuard require="chef">{children}</RoleGuard>
    </div>
  );
}
