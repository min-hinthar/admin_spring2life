'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace(`/dashboard/${user.role}`);
    } else {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center space-y-4">
        <div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-600">Preparing your Spring2Life experience...</p>
        <Button onClick={() => router.replace('/login')} variant="outline">
          Go to sign in
        </Button>
      </div>
    </div>
  );
}
