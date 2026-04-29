'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { youtubeService } from '@/services/youtubeService';
import { Tv, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChannelPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.accessToken) loadChannels(session.accessToken);
  }, [session]);

  const loadChannels = async (token) => {
    try {
      setLoading(true);
      const data = await youtubeService.getUserChannel(token);
      setChannels(data.items || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch channels');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChannel = (channelId) => {
    localStorage.setItem('selectedChannelId', channelId);
    router.push('/comments');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-5 rounded-xl flex items-start gap-3 border border-red-100">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-red-800">Gagal memuat kanal</h3>
          <p className="text-xs text-red-600 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="text-center p-10 bg-white rounded-xl border border-gray-200">
        <Tv className="mx-auto h-10 w-10 text-gray-300 mb-3" />
        <h3 className="text-sm font-semibold text-gray-900">Tidak Ada Kanal</h3>
        <p className="mt-1 text-xs text-gray-400">Akun Google Anda tidak memiliki kanal YouTube aktif.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-5">
      <div>
        <h1 className="text-lg lg:text-xl font-bold text-gray-900">Kanal Anda</h1>
        <p className="text-sm text-gray-400 mt-0.5">Pilih kanal untuk melihat video dan mulai moderasi.</p>
      </div>

      {/* Responsive grid: 1 col mobile, 2 sm, 3 lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((channel) => (
          <div
            key={channel.id}
            onClick={() => handleSelectChannel(channel.id)}
            className="group relative bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src={channel.snippet.thumbnails.default.url}
                alt={channel.snippet.title}
                className="w-12 h-12 rounded-full border-2 border-indigo-50 flex-shrink-0"
              />
              <div className="flex-1 overflow-hidden">
                <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                  {channel.snippet.title}
                </h3>
                <p className="text-xs text-gray-400 truncate">{channel.snippet.customUrl}</p>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <span className="flex items-center gap-1 text-indigo-600 font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity">
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
