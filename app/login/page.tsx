'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Login } from '../../pages/Login';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [user, isLoading, router]);

  if (user) {
    return null;
  }

  return <Login />;
}
