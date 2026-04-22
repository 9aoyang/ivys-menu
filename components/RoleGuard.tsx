'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRole, type Role } from '@/lib/role';

export default function RoleGuard({
  require,
  children,
}: {
  require: Role;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const current = getRole();
    if (current !== require) {
      router.replace('/');
    } else {
      setOk(true);
    }
  }, [require, router]);

  if (!ok) return <div className="min-h-[100dvh] bg-black" />;
  return <>{children}</>;
}
