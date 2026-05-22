'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { youtubeService } from '@/services/youtubeService';
import { historyService } from '@/services/historyService';
import axios from 'axios';
import { useToast } from './ToastContext';
import { useQuota } from './QuotaContext';
import { useSettings } from './SettingsContext';
import { useYouTube } from './YouTubeContext';

const ModerationContext = createContext(null);

export function ModerationProvider({ children }) {
  const { data: session } = useSession();
  const toast = useToast();
  const { deductQuota } = useQuota();
  const { settings } = useSettings();
  const { videosCache, selectedChannelId } = useYouTube();

  const [selectedVideoIds, setSelectedVideoIds] = useState(new Set());
  const [primaryVideo, setPrimaryVideo] = useState(null);
  
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [isPolling, setIsPolling] = useState(false);
  const [processingComment, setProcessingComment] = useState(null);
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 });
  const [isFetchingMulti, setIsFetchingMulti] = useState(false);

  const sessionRef = useRef(session);
  const predictionsRef = useRef({});
  const selectedVideoIdsRef = useRef(selectedVideoIds);
  const isFetchingRef = useRef(false);

  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { predictionsRef.current = predictions; }, [predictions]);
  useEffect(() => { selectedVideoIdsRef.current = selectedVideoIds; }, [selectedVideoIds]);

  // Restore saved selection
  useEffect(() => {
    if (!selectedChannelId || !videosCache[selectedChannelId]) return;
    const currentVideos = videosCache[selectedChannelId];
    if (currentVideos.length === 0) return;
    
    try {
      const savedIds = JSON.parse(localStorage.getItem('selectedVideoIds') || '[]');
      if (savedIds.length > 0) {
        const validIds = savedIds.filter(id => currentVideos.some(v => v.id.videoId === id));
        if (validIds.length > 0) {
          setSelectedVideoIds(new Set(validIds));
          const firstVideo = currentVideos.find(v => v.id.videoId === validIds[0]);
          if (firstVideo) {
            setPrimaryVideo({ id: firstVideo.id.videoId, title: firstVideo.snippet.title });
          }
        }
      }
    } catch { /* ignore */ }
  }, [selectedChannelId, videosCache]);

  const handleToggleVideo = (video) => {
    const videoId = video.id.videoId;
    const isCurrentlySelected = selectedVideoIds.has(videoId);
    const next = new Set(selectedVideoIds);

    if (isCurrentlySelected) {
      next.delete(videoId);
      if (next.size > 0) {
        const firstId = [...next][0];
        const currentVideos = videosCache[selectedChannelId] || [];
        const firstVid = currentVideos.find(v => v.id.videoId === firstId);
        if (firstVid) setPrimaryVideo({ id: firstId, title: firstVid.snippet.title });
      } else {
        setPrimaryVideo(null);
      }
    } else {
      next.add(videoId);
      setPrimaryVideo({ id: videoId, title: video.snippet.title });
    }

    setSelectedVideoIds(next);
    localStorage.setItem('selectedVideoIds', JSON.stringify([...next]));
  };

  const handleSelectAll = () => {
    const currentVideos = videosCache[selectedChannelId] || [];
    const allIds = currentVideos.map(v => v.id.videoId);
    setSelectedVideoIds(new Set(allIds));
    if (currentVideos.length > 0) {
      setPrimaryVideo({ id: currentVideos[0].id.videoId, title: currentVideos[0].snippet.title });
    }
    localStorage.setItem('selectedVideoIds', JSON.stringify(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedVideoIds(new Set());
    setPrimaryVideo(null);
    localStorage.removeItem('selectedVideoIds');
    setComments([]);
    setPredictions({});
    setIsPolling(false);
    setError(null);
  };

  const performInferenceBatch = async (commentsToAnalyze) => {
    try {
      const texts = commentsToAnalyze.map(c => c.textOriginal);
      const res = await axios.post('/api/moderate/batch', { texts });
      const results = res.data.results || [];
      const newPredictions = {};
      
      results.forEach((r, i) => {
        newPredictions[commentsToAnalyze[i].id] = { label: r.label, score: r.score };
      });
      return newPredictions;
    } catch (err) {
      console.error('Batch inference error:', err);
      toast.error('Gagal menganalisis komentar secara massal.');
      return {};
    }
  };

  const handleLoadSelected = useCallback(async (isSilent = false) => {
    if (isFetchingRef.current) return;
    const videoIds = [...selectedVideoIdsRef.current];
    const currentVideos = videosCache[selectedChannelId] || [];

    if (videoIds.length === 0) return;

    isFetchingRef.current = true;
    setIsFetchingMulti(true);

    if (!isSilent) {
      setCommentsLoading(true);
      setComments([]);
      setPredictions({});
      setError(null);
      setFetchProgress({ current: 0, total: videoIds.length });
    }

    try {
      const email = sessionRef.current?.user?.email;
      const historyMap = {};
      if (email) {
        try {
          const history = await historyService.getHistory(email);
          history.forEach(h => { if (h.comment_id) historyMap[h.comment_id] = h.action; });
        } catch (e) { console.error('Gagal memuat history:', e); }
      }

      const allNewComments = [];

      for (let i = 0; i < videoIds.length; i++) {
        const videoId = videoIds[i];
        const videoObj = currentVideos.find(v => v.id.videoId === videoId);
        const videoTitle = videoObj?.snippet?.title || videoId;

        const ok = await deductQuota('FETCH_COMMENTS', `Video: ${videoTitle}`);
        if (!ok) break;

        try {
          const data = await youtubeService.getComments(videoId, sessionRef.current?.accessToken);
          const normalized = (data.items || []).map(item => ({
            id: item.id,
            ...item.snippet.topLevelComment.snippet,
            videoId
          }));
          const filtered = normalized.filter(c => !historyMap[c.id]);
          allNewComments.push(...filtered);
        } catch (err) {
          console.error(`Error loading comments for ${videoId}:`, err);
        }
        
        if (!isSilent) setFetchProgress({ current: i + 1, total: videoIds.length });
      }

      if (allNewComments.length > 0) {
        if (!isSilent) setComments(allNewComments);
        
        let newPredictions = {};
        if (settings.batchModeration) {
          const ok = await deductQuota('MODERATE_BATCH', `${allNewComments.length} Komentar`);
          if (ok) {
            newPredictions = await performInferenceBatch(allNewComments);
          }
        } else {
          for (let i = 0; i < allNewComments.length; i++) {
            const ok = await deductQuota('MODERATE_SINGLE', '1 Komentar');
            if (!ok) break;
            try {
              const res = await axios.post('/api/moderate', { text: allNewComments[i].textOriginal });
              newPredictions[allNewComments[i].id] = { label: res.data.label, score: res.data.score };
            } catch (e) { }
          }
        }

        setPredictions(prev => {
          const merged = { ...prev, ...newPredictions };
          predictionsRef.current = merged;
          return merged;
        });
        
        if (isSilent) {
          setComments(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const trulyNew = allNewComments.filter(c => !existingIds.has(c.id));
            if (trulyNew.length > 0 && settings.notifKomentar) {
              toast.info(`Ada ${trulyNew.length} komentar baru!`);
            }
            return [...trulyNew, ...prev];
          });
        }
        
        // Auto-Moderation Engine
        if (settings.autoTahan || settings.autoHapus) {
          const pendingHold = [];
          const pendingReject = [];
          allNewComments.forEach(c => {
            const pred = newPredictions[c.id];
            if (!pred || pred.label !== 'Cyberbullying') return;
            const scr = Math.round(pred.score * 100);
            if (settings.autoHapus && scr >= settings.thresholdReject) {
              pendingReject.push(c.id);
            } else if (settings.autoTahan && scr >= settings.thresholdHold) {
              pendingHold.push(c.id);
            }
          });

          const tok = sessionRef.current?.accessToken;
          const userEmail = sessionRef.current?.user?.email;

          if (pendingHold.length > 0 && tok) {
            await youtubeService.moderateCommentsBatch(pendingHold, 'heldForReview', tok);
            pendingHold.forEach(cid => {
              historyService.saveActivity({
                action: 'HOLD', comment_id: cid, author_name: 'Auto-Mod', text: 'Ditahan otomatis', 
                confidence_score: newPredictions[cid].score, video_id: 'auto'
              }, userEmail);
            });
            setComments(prev => prev.filter(c => !pendingHold.includes(c.id)));
          }

          if (pendingReject.length > 0 && tok) {
            await youtubeService.moderateCommentsBatch(pendingReject, 'rejected', tok);
            pendingReject.forEach(cid => {
              historyService.saveActivity({
                action: 'REJECT', comment_id: cid, author_name: 'Auto-Mod', text: 'Dihapus otomatis',
                confidence_score: newPredictions[cid].score, video_id: 'auto'
              }, userEmail);
            });
            setComments(prev => prev.filter(c => !pendingReject.includes(c.id)));
          }
        }
      }
    } catch (err) {
      console.error('handleLoadSelected error:', err);
      if (!isSilent) setError(err.message);
    } finally {
      setCommentsLoading(false);
      setIsFetchingMulti(false);
      isFetchingRef.current = false;
    }
  }, [selectedChannelId, videosCache, settings, deductQuota, toast]);

  // Polling Effect
  useEffect(() => {
    let intervalId;
    if (isPolling && session?.accessToken && selectedVideoIds.size > 0) {
      const interval = (settings.pollingInterval || 120) * 1000;
      intervalId = setInterval(() => {
        if (!isFetchingRef.current && selectedVideoIdsRef.current.size > 0) {
          handleLoadSelected(true);
        }
      }, interval);
    }
    return () => clearInterval(intervalId);
  }, [isPolling, session, selectedVideoIds.size, settings.pollingInterval, handleLoadSelected]);

  const togglePolling = () => {
    if (!isPolling && selectedVideoIds.size === 0) {
      toast.warning('Pilih minimal 1 video terlebih dahulu');
      return;
    }
    if (!isPolling) {
      if (comments.length === 0) handleLoadSelected(false);
      setIsPolling(true);
      toast.success('Auto-moderasi di latar belakang diaktifkan');
    } else {
      setIsPolling(false);
      toast.info('Auto-moderasi dihentikan');
    }
  };

  const handleAction = async (commentId, action) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    setProcessingComment(commentId);
    try {
      const statusMap = { 'approve': 'published', 'hold': 'heldForReview', 'reject': 'rejected' };
      const ok = await deductQuota('TAKE_ACTION', `Aksi: ${action}`);
      if (!ok) return;

      await youtubeService.moderateComment(commentId, statusMap[action], sessionRef.current.accessToken);

      const prediction = predictionsRef.current[commentId];
      if (sessionRef.current?.user?.email) {
        await historyService.saveActivity({
          action: action.toUpperCase(),
          comment_id: comment.id,
          author_name: comment.authorDisplayName,
          text: comment.textOriginal,
          confidence_score: prediction?.score || 0,
          video_id: comment.videoId,
        }, sessionRef.current.user.email);
      }

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success(`Komentar berhasil di-${action}`);
    } catch (err) {
      console.error(`Action ${action} error:`, err);
      toast.error(`Gagal melakukan aksi pada komentar`);
    } finally {
      setProcessingComment(null);
    }
  };

  return (
    <ModerationContext.Provider 
      value={{
        selectedVideoIds, primaryVideo, handleToggleVideo, handleSelectAll, handleDeselectAll,
        comments, commentsLoading, error, predictions, 
        isPolling, togglePolling, handleLoadSelected, 
        processingComment, handleAction,
        fetchProgress, isFetchingMulti
      }}
    >
      {children}
    </ModerationContext.Provider>
  );
}

export const useModeration = () => {
  const context = useContext(ModerationContext);
  if (!context) {
    throw new Error('useModeration must be used within a ModerationProvider');
  }
  return context;
};
