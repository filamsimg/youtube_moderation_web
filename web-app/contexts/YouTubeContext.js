'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { youtubeService } from '@/services/youtubeService';
import { useToast } from './ToastContext';

const YouTubeContext = createContext(null);

export function YouTubeProvider({ children }) {
  const { data: session } = useSession();
  const toast = useToast();

  const [channels, setChannels] = useState([]);
  const [videosCache, setVideosCache] = useState({});
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [loadingChannel, setLoadingChannel] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const hasFetchedChannelRef = useRef(false);
  const fetchedVideosChannelsRef = useRef(new Set());
  const lastTokenRef = useRef(null);

  // Watch session change (User Switch or Sign Out) to purge states and load scoped selectedChannelId
  useEffect(() => {
    const email = session?.user?.email;

    // Purge all sensitive internal in-memory states
    setChannels([]);
    setVideosCache({});
    setLoadingChannel(false);
    setLoadingVideos(false);

    // Reset tracking refs
    hasFetchedChannelRef.current = false;
    fetchedVideosChannelsRef.current = new Set();
    lastTokenRef.current = session?.accessToken || null;

    if (email) {
      const savedId = localStorage.getItem(`selectedChannelId_${email}`);
      setSelectedChannelId(savedId || null);
    } else {
      setSelectedChannelId(null);
    }
  }, [session?.user?.email, session?.accessToken]);

  const updateSelectedChannelId = (id) => {
    setSelectedChannelId(id);
    const email = session?.user?.email;
    if (email && id) {
      localStorage.setItem(`selectedChannelId_${email}`, id);
    }
  };

  const fetchChannel = useCallback(async () => {
    if (!session?.accessToken) return null;
    setLoadingChannel(true);
    try {
      const data = await youtubeService.getUserChannel(session.accessToken);
      if (data?.items?.length > 0) {
        setChannels(data.items);
        // Auto-select if none selected
        if (!selectedChannelId) {
          updateSelectedChannelId(data.items[0].id);
        }
        return data.items;
      }
    } catch (err) {
      console.error('Fetch channel error:', err);
    } finally {
      setLoadingChannel(false);
    }
    return null;
  }, [session?.accessToken, selectedChannelId]);

  const fetchVideos = useCallback(async (channelId, forceRefresh = false) => {
    if (!session?.accessToken || !channelId) return [];

    // Return from cache if exists and not forcing refresh
    if (!forceRefresh && videosCache[channelId]) {
      return videosCache[channelId];
    }

    setLoadingVideos(true);
    try {
      const data = await youtubeService.getVideosByChannel(channelId, session.accessToken);
      const videoItems = (data.items || []).filter(item => item.id?.videoId);

      setVideosCache(prev => ({
        ...prev,
        [channelId]: videoItems
      }));
      return videoItems;
    } catch (err) {
      console.error('Fetch videos error:', err);
      if (err.isExpired || err.status === 401) {
        toast.error('Sesi akses YouTube berakhir. Silakan masuk kembali (Re-login).');
      } else if (err.reason === 'quotaExceeded' || err.status === 403) {
        toast.error('Kuota harian YouTube API Anda telah habis.');
      } else {
        toast.error(`Gagal mengambil daftar video: ${err.message || 'Error tidak diketahui'}`);
      }
      return [];
    } finally {
      setLoadingVideos(false);
    }
  }, [session?.accessToken, videosCache, toast]);

  // Auto-fetch channels when session is available, channels list is empty, and we haven't fetched yet
  useEffect(() => {
    if (session?.accessToken && channels.length === 0 && !hasFetchedChannelRef.current) {
      hasFetchedChannelRef.current = true;
      fetchChannel();
    }
  }, [session?.accessToken, fetchChannel, channels.length]);

  // Auto-fetch videos when session is available, selectedChannelId is set, and we haven't fetched it yet
  useEffect(() => {
    if (
      session?.accessToken &&
      selectedChannelId &&
      !videosCache[selectedChannelId] &&
      !fetchedVideosChannelsRef.current.has(selectedChannelId)
    ) {
      fetchedVideosChannelsRef.current.add(selectedChannelId);
      fetchVideos(selectedChannelId);
    }
  }, [session?.accessToken, selectedChannelId, fetchVideos, videosCache]);

  const activeChannel = channels.find(c => c.id === selectedChannelId) || channels[0] || null;

  return (
    <YouTubeContext.Provider
      value={{
        channels,
        activeChannel,
        selectedChannelId,
        updateSelectedChannelId,
        videosCache,
        fetchChannel,
        fetchVideos,
        loadingChannel,
        loadingVideos
      }}
    >
      {children}
    </YouTubeContext.Provider>
  );
}

export const useYouTube = () => {
  const context = useContext(YouTubeContext);
  if (!context) {
    throw new Error('useYouTube must be used within a YouTubeProvider');
  }
  return context;
};
