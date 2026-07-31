'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/iuuuvophuongvyvaiiihehe');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
      <p className="text-gray-600">Đang tải...</p>
    </main>
  );
}
