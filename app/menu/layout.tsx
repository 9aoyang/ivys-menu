import type { Metadata, Viewport } from 'next';
import RoleGuard from '@/components/RoleGuard';

export const metadata: Metadata = {
  title: "Ivy's Menu · 餐厅",
  manifest: '/menu/manifest.json',
  appleWebApp: {
    capable: true,
    title: "Ivy's Menu",
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#ec4899',
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-black">
      <RoleGuard require="ivy">{children}</RoleGuard>
    </div>
  );
}
