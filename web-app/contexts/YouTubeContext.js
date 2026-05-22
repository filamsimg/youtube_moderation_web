'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
