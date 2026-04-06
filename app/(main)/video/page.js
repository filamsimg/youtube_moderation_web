'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { youtubeService } from '@/services/youtubeService';
import { Video, AlertCircle, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VideoPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const channelId = localStorage.getItem('selectedChannelId');
    if (!channelId) { router.push('/channel'); return; }
    if (session?.accessToken) loadVideos(channelId, session.accessToken);
  }, [session, router]);

  const loadVideos = async (channelId, token) => {
    try {
      setLoading(true);
      const data = await youtubeService.getVideosByChannel(channelId, token);
      const videoItems = data.items.filter(item => item.id && item.id.videoId);
      setVideos(videoItems);
    } catch (err) {
      setError(err.message || 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVideo = (videoId, videoTitle) => {
    localStorage.setItem('selectedVideoId', videoId);
    localStorage.setItem('selectedVideoTitle', videoTitle);
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
          <h3 className="text-sm font-semibold text-red-800">Gagal memuat video</h3>
          <p className="text-xs text-red-600 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center p-10 bg-white rounded-xl border border-gray-200">
        <Video className="mx-auto h-10 w-10 text-gray-300 mb-3" />
        <h3 className="text-sm font-semibold text-gray-900">Tidak Ada Video</h3>
        <p className="mt-1 text-xs text-gray-400">Kanal ini tidak memiliki video yang diunggah.</p>
        <button
          onClick={() => router.push('/channel')}
          className="mt-5 px-4 py-2 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
        >
          Pilih Kanal Lain
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-lg lg:text-xl font-bold text-gray-900">Pilih Video</h1>
          <p className="text-sm text-gray-400 mt-0.5">Pilih video untuk memoderasi komentarnya.</p>
        </div>
        <button
          onClick={() => router.push('/channel')}
          className="text-sm text-indigo-600 hover:underline font-medium self-start sm:self-auto"
        >
          ← Ganti Kanal
        </button>
      </div>

      {/* Responsive grid: 1 col mobile, 2 sm, 3 lg, 4 xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((item) => (
          <div
            key={item.id.videoId}
            onClick={() => handleSelectVideo(item.id.videoId, item.snippet.title)}
            className="group flex flex-col overflow-hidden rounded-xl shadow-sm bg-white border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <div className="relative aspect-video bg-gray-100 overflow-hidden">
              <img
                src={item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url}
                alt={item.snippet.title}
                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300"></div>
              <PlayCircle className="absolute bottom-3 right-3 w-8 h-8 text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                {item.snippet.title}
              </h3>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(item.snippet.publishedAt).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
