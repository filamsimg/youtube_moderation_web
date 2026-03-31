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
    if (session?.accessToken) {
      loadChannels(session.accessToken);
    }
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
    // Optionally save selected channelId in context/localstorage
    localStorage.setItem('selectedChannelId', channelId);
    router.push('/video');
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
      <div className="bg-red-50 p-6 rounded-2xl flex items-start space-x-4 border border-red-100">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-red-800 font-medium text-lg mb-1">Error fetching channel</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl border border-gray-200">
        <Tv className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No Channels Found</h3>
        <p className="mt-1 text-gray-500">Your Google account does not have an active YouTube channel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Channels</h1>
        <p className="mt-1 text-gray-500">Select a channel to view its videos and start moderating.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel) => (
          <div
            key={channel.id}
            onClick={() => handleSelectChannel(channel.id)}
            className="group relative bg-white min-h-[160px] p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-200 cursor-pointer transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center space-x-4 mb-4">
              <img
                src={channel.snippet.thumbnails.default.url}
                alt={channel.snippet.title}
                className="w-16 h-16 rounded-full border-2 border-indigo-50"
              />
              <div className="flex-1 overflow-hidden">
                <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                  {channel.snippet.title}
                </h3>
                <p className="text-sm text-gray-500 truncate">{channel.snippet.customUrl}</p>
              </div>
            </div>
            
            <button className="absolute bottom-6 right-6 flex items-center space-x-1 text-indigo-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Select</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
