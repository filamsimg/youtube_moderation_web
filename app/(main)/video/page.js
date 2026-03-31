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
    if (!channelId) {
      router.push('/channel');
      return;
    }

    if (session?.accessToken) {
      loadVideos(channelId, session.accessToken);
    }
  }, [session, router]);

  const loadVideos = async (channelId, token) => {
    try {
      setLoading(true);
      const data = await youtubeService.getVideosByChannel(channelId, token);
      // search list returns items where id object has videoId
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
      <div className="bg-red-50 p-6 rounded-2xl flex items-start space-x-4 border border-red-100">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-red-800 font-medium text-lg mb-1">Error fetching videos</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-200">
        <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No Videos Found</h3>
        <p className="mt-1 text-gray-500">This channel has no uploaded videos.</p>
        <button 
          onClick={() => router.push('/channel')}
          className="mt-6 px-4 py-2 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
        >
          Select another channel
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Select Video</h1>
          <p className="mt-1 text-gray-500">Choose a video below to moderate its comments.</p>
        </div>
        <button
          onClick={() => router.push('/channel')}
          className="text-sm text-indigo-600 hover:underline font-medium"
        >
          &larr; Back to Channels
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((item) => (
          <div
            key={item.id.videoId}
            onClick={() => handleSelectVideo(item.id.videoId, item.snippet.title)}
            className="group flex flex-col overflow-hidden rounded-2xl shadow-sm bg-white border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div className="relative aspect-video bg-gray-100 overflow-hidden">
              <img
                src={item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url}
                alt={item.snippet.title}
                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
              <PlayCircle className="absolute bottom-3 right-3 w-8 h-8 text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                {item.snippet.title}
              </h3>
              <p className="text-xs text-gray-500 mt-2 mt-auto">
                {new Date(item.snippet.publishedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
