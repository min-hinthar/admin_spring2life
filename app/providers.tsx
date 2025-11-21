'use client';

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { Layout } from '../components/Layout';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Layout>{children}</Layout>
    </AuthProvider>
  );
}
