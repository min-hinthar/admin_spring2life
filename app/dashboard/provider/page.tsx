'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { ProviderDashboard } from '../../../pages/ProviderDashboard';

export default function ProviderDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'provider') {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [user, isLoading, router]);

  if (!user || user.role !== 'provider') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <ProviderDashboard />;
}
