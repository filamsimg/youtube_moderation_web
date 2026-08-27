'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Tv, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useYouTube } from '@/contexts/YouTubeContext';

export default function ChannelPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const { channels, fetchChannel, loadingChannel, updateSelectedChannelId } = useYouTube();

  useEffect(() => {
    if (session?.accessToken && channels.length === 0) {
      fetchChannel();
    }
  }, [session?.accessToken, fetchChannel, channels.length]);

  const handleSelectChannel = (channel) => {
    updateSelectedChannelId(channel.id);
    router.push('/comments');
  };

  if (loadingChannel) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="text-center p-10 bg-card rounded-xl border border-[var(--border-default)]">
        <Tv className="mx-auto h-10 w-10 text-muted mb-3" />
        <h3 className="text-sm font-semibold text-primary">Tidak Ada Kanal</h3>
        <p className="mt-1 text-xs text-secondary">Akun Google Anda tidak memiliki kanal YouTube aktif.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-5">
      <div className="mb-6">
        <h1 className="text-lg lg:text-xl font-bold text-primary">Kanal Anda</h1>
        <p className="text-sm text-secondary mt-0.5">Pilih kanal untuk melihat video dan mulai moderasi.</p>
      </div>

      {/* Responsive grid: 1 col mobile, 2 sm, 3 lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((channel) => (
          <div
            key={channel.id}
            onClick={() => handleSelectChannel(channel)}
            className="group relative bg-card p-5 rounded-xl border border-[var(--border-default)] hover:shadow-md hover:border-amber-500/50 cursor-pointer transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={channel?.snippet?.thumbnails?.default?.url || ''}
                alt={channel?.snippet?.title || ''}
                className="w-12 h-12 rounded-full border-2 border-amber-50 flex-shrink-0"
                loading="lazy"
              />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-primary truncate group-hover:text-amber-500 transition-colors">
                  {channel.snippet.title}
                </h3>
                <p className="text-xs text-secondary truncate">{channel.snippet.customUrl}</p>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <span className="flex items-center gap-1 text-amber-600 font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Pilih</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
