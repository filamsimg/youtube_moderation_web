'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Halaman /video sudah digabung ke /comments
// Redirect otomatis ke /comments
export default function VideoPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/comments');
  }, [router]);

  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
}
