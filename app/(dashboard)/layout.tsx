'use client';

import { useAuth } from '@/components/AuthProvider';
import { Loader } from '@/components/Loader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {children}
    </div>
  );
}
