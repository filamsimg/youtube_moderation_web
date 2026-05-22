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

  // Initialize selected channel from local storage on mount
  useEffect(() => {
    const savedId = localStorage.getItem('selectedChannelId');
    if (savedId) setSelectedChannelId(savedId);
  }, []);

  const hasFetchedChannelRef = useRef(false);
  const fetchedVideosChannelsRef = useRef(new Set());
  const lastTokenRef = useRef(null);

  // Reset tracking refs if the authentication token changes (e.g. user switched accounts or logged out)
  useEffect(() => {
    if (session?.accessToken !== lastTokenRef.current) {
      lastTokenRef.current = session?.accessToken || null;
      hasFetchedChannelRef.current = false;
      fetchedVideosChannelsRef.current.clear();
    }
  }, [session?.accessToken]);

  const updateSelectedChannelId = (id) => {
    setSelectedChannelId(id);
    localStorage.setItem('selectedChannelId', id);
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
      toast.error('Gagal mengambil daftar video dari YouTube');
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
