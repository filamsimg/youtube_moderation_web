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
  const [hasLoaded, setHasLoaded] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [dbHistory, setDbHistory] = useState([]);

  // Pagination states
  const [nextPageTokens, setNextPageTokens] = useState({});
  const [canLoadMore, setCanLoadMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const sessionRef = useRef(session);
  const predictionsRef = useRef({});
  const selectedVideoIdsRef = useRef(selectedVideoIds);
  const isFetchingRef = useRef(false);

  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { predictionsRef.current = predictions; }, [predictions]);
  useEffect(() => { selectedVideoIdsRef.current = selectedVideoIds; }, [selectedVideoIds]);

  const lastUserChannelRef = useRef({ email: null, channelId: null });

  // Watch session change (User Switch or Sign Out) to purge states and load scoped selectedVideoIds
  useEffect(() => {
    const email = session?.user?.email;

    // Jika user email atau channel berganti, lakukan pembersihan total
    if (email !== lastUserChannelRef.current.email || selectedChannelId !== lastUserChannelRef.current.channelId) {
      lastUserChannelRef.current = { email, channelId: selectedChannelId };
      
      // Purge all sensitive internal in-memory states
      setSelectedVideoIds(new Set());
      setPrimaryVideo(null);
      setComments([]);
      setCommentsLoading(false);
      setError(null);
      setPredictions({});
      setIsPolling(false);
      setProcessingComment(null);
      setFetchProgress({ current: 0, total: 0 });
      setIsFetchingMulti(false);
      setHasLoaded(false);
      setSessionHistory([]);
      setDbHistory([]);
      setNextPageTokens({});
      setCanLoadMore(false);
      setLoadingMore(false);

      // Reset tracking refs
      predictionsRef.current = {};
      selectedVideoIdsRef.current = new Set();
      isFetchingRef.current = false;
    }

    // Muat seleksi dari localStorage terisolasi jika channel & cache sudah siap
    if (email && selectedChannelId && videosCache[selectedChannelId]) {
      const currentVideos = videosCache[selectedChannelId];
      if (currentVideos.length > 0) {
        try {
          const savedIds = JSON.parse(localStorage.getItem(`selectedVideoIds_${email}`) || '[]');
          if (savedIds.length > 0) {
            const validIds = savedIds.filter(id => currentVideos.some(v => v.id.videoId === id));
            if (validIds.length > 0) {
              const newSet = new Set(validIds);
              setSelectedVideoIds(newSet);
              selectedVideoIdsRef.current = newSet;
              const firstVideo = currentVideos.find(v => v.id.videoId === validIds[0]);
              if (firstVideo) {
                setPrimaryVideo({ id: firstVideo.id.videoId, title: firstVideo.snippet.title });
              }
            }
          }
        } catch (err) {
          console.error('Error restoring selectedVideoIds:', err);
        }
      }
    }
  }, [session?.user?.email, selectedChannelId, videosCache]);

  const handleToggleVideo = (video) => {
    const videoId = video.id.videoId;
    const isCurrentlySelected = selectedVideoIds.has(videoId);
    const next = new Set(selectedVideoIds);

    setHasLoaded(false);

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
    const email = session?.user?.email;
    if (email) {
      localStorage.setItem(`selectedVideoIds_${email}`, JSON.stringify([...next]));
    }
  };

  const handleSelectAll = () => {
    const currentVideos = videosCache[selectedChannelId] || [];
    const allIds = currentVideos.map(v => v.id.videoId);
    setSelectedVideoIds(new Set(allIds));
    setHasLoaded(false);
    if (currentVideos.length > 0) {
      setPrimaryVideo({ id: currentVideos[0].id.videoId, title: currentVideos[0].snippet.title });
    }
    const email = session?.user?.email;
    if (email) {
      localStorage.setItem(`selectedVideoIds_${email}`, JSON.stringify(allIds));
    }
  };

  const handleDeselectAll = () => {
    setSelectedVideoIds(new Set());
    setPrimaryVideo(null);
    const email = session?.user?.email;
    if (email) {
      localStorage.removeItem(`selectedVideoIds_${email}`);
    }
    setComments([]);
    setPredictions({});
    setSessionHistory([]);
    setDbHistory([]);
    setIsPolling(false);
    setError(null);
    setHasLoaded(false);
  };

  const performInferenceBatch = async (commentsToAnalyze) => {
    try {
      const texts = commentsToAnalyze.map(c => c.textOriginal);
      const res = await axios.post('/api/predict', { texts });
      const results = res.data.results || [];
      const newPredictions = {};

      results.forEach((r, i) => {
        newPredictions[commentsToAnalyze[i].id] = {
          label: r.label,
          confidence: r.confidence,
          score: r.confidence,
          sentiment: r.sentiment,
          sentiment_score: r.sentiment_score
        };
      });
      return newPredictions;
    } catch (err) {
      console.error('Batch inference error:', err);
      toast.error('Gagal menganalisis komentar secara massal.');
      return {};
    }
  };

  const handleLoadSelected = useCallback(async (isSilent = false, loadMore = false) => {
    if (isFetchingRef.current) return;
    const videoIds = [...selectedVideoIdsRef.current];
    const currentVideos = videosCache[selectedChannelId] || [];

    if (videoIds.length === 0) return;

    // Filter target videos for loadMore
    const targets = loadMore 
      ? videoIds.filter(vid => nextPageTokens[vid])
      : videoIds;

    if (loadMore && targets.length === 0) {
      setCanLoadMore(false);
      return;
    }

    isFetchingRef.current = true;
    
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setIsFetchingMulti(true);
      if (!isSilent) {
        setCommentsLoading(true);
        setComments([]);
        setPredictions({});
        setNextPageTokens({});
        setCanLoadMore(false);
        setError(null);
        setFetchProgress({ current: 0, total: targets.length });
      }
    }

    try {
      const email = sessionRef.current?.user?.email;
      const historyMap = {};
      let filteredDbHistory = [];
      if (email) {
        try {
          const history = await historyService.getHistory(email);
          history.forEach(h => { if (h.comment_id) historyMap[h.comment_id] = h.action; });
          filteredDbHistory = history.filter(h => h.channel_id === selectedChannelId);
        } catch (e) { console.error('Gagal memuat history:', e); }
      }
      setDbHistory(filteredDbHistory);

      const allNewComments = [];
      const updatedTokens = { ...(loadMore ? nextPageTokens : {}) };

      for (let i = 0; i < targets.length; i++) {
        const videoId = targets[i];
        const videoObj = currentVideos.find(v => v.id.videoId === videoId);
        const videoTitle = videoObj?.snippet?.title || videoId;

        const ok = await deductQuota('FETCH_COMMENTS', `Video: ${videoTitle}`);
        if (!ok) break;

        try {
          const currentToken = loadMore ? nextPageTokens[videoId] : null;
          const data = await youtubeService.getComments(videoId, sessionRef.current?.accessToken, currentToken);
          const normalized = (data.items || []).map(item => ({
            id: item.id,
            ...item.snippet.topLevelComment.snippet,
            videoId,
            videoTitle
          }));
          const filtered = normalized.filter(c => !historyMap[c.id]);
          allNewComments.push(...filtered);

          // Track next token
          updatedTokens[videoId] = data.nextPageToken || null;
        } catch (err) {
          console.error(`Error loading comments for ${videoId}:`, err);
          if (!isSilent && !loadMore) {
            toast.error(`Gagal memuat komentar untuk video: ${videoTitle}`);
          }
        }

        if (!isSilent && !loadMore) setFetchProgress({ current: i + 1, total: targets.length });
      }

      setNextPageTokens(updatedTokens);
      
      // Determine if there are still any page tokens left among all selected video IDs
      const activeCanLoadMore = videoIds.some(vid => !!updatedTokens[vid]);
      setCanLoadMore(activeCanLoadMore);

      if (allNewComments.length > 0) {
        if (loadMore) {
          setComments(prev => [...prev, ...allNewComments]);
        } else {
          if (!isSilent) setComments(allNewComments);
        }

        let newPredictions = {};
        if (settings.batchModeration) {
          newPredictions = await performInferenceBatch(allNewComments);
        } else {
          for (let i = 0; i < allNewComments.length; i++) {
            try {
              const res = await axios.post('/api/predict', { text: allNewComments[i].textOriginal });
              newPredictions[allNewComments[i].id] = {
                label: res.data.label,
                confidence: res.data.confidence,
                score: res.data.confidence,
                sentiment: res.data.sentiment,
                sentiment_score: res.data.sentiment_score
              };
            } catch (e) { }
          }
        }

        setPredictions(prev => {
          const merged = { ...prev, ...newPredictions };
          predictionsRef.current = merged;
          return merged;
        });

        if (isSilent && !loadMore) {
          setComments(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const trulyNew = allNewComments.filter(c => !existingIds.has(c.id));
            if (trulyNew.length > 0 && settings.notifKomentar) {
              toast.info(`Ada ${trulyNew.length} komentar baru!`);
              
              // Native OS Desktop Notification
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification('Athena Shield - Komentar Baru', {
                    body: `Ada ${trulyNew.length} komentar baru yang masuk dan perlu ditinjau!`,
                    icon: '/logo.webp',
                  });
                } catch (err) {
                  console.error('Gagal mengirimkan notifikasi native:', err);
                }
              }
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
            const heldComments = [];
            pendingHold.forEach(cid => {
              const commentObj = allNewComments.find(c => c.id === cid);
              historyService.saveAction(userEmail, {
                channelId: selectedChannelId,
                commentId: cid,
                action: 'heldForReview',
                commentText: commentObj?.textOriginal || 'Ditahan otomatis',
                author: commentObj?.authorDisplayName || 'Auto-Mod',
                videoTitle: commentObj?.videoTitle || 'auto',
                aiLabel: 'Spam',
                aiConfidence: newPredictions[cid].score,
              });
              if (commentObj) {
                heldComments.push({
                  ...commentObj,
                  status: 'heldForReview',
                  action: 'heldForReview',
                  createdAt: new Date().toISOString()
                });
              }
            });
            setSessionHistory(prev => [...heldComments, ...prev]);
            setComments(prev => prev.filter(c => !pendingHold.includes(c.id)));
          }

          if (pendingReject.length > 0 && tok) {
            await youtubeService.moderateCommentsBatch(pendingReject, 'rejected', tok);
            const rejectedComments = [];
            pendingReject.forEach(cid => {
              const commentObj = allNewComments.find(c => c.id === cid);
              historyService.saveAction(userEmail, {
                channelId: selectedChannelId,
                commentId: cid,
                action: 'rejected',
                commentText: commentObj?.textOriginal || 'Dihapus otomatis',
                author: commentObj?.authorDisplayName || 'Auto-Mod',
                videoTitle: commentObj?.videoTitle || 'auto',
                aiLabel: 'Spam',
                aiConfidence: newPredictions[cid].score,
              });
              if (commentObj) {
                rejectedComments.push({
                  ...commentObj,
                  status: 'rejected',
                  action: 'rejected',
                  createdAt: new Date().toISOString()
                });
              }
            });
            setSessionHistory(prev => [...rejectedComments, ...prev]);
            setComments(prev => prev.filter(c => !pendingReject.includes(c.id)));
          }
        }
      } else {
        if (!isSilent && !loadMore) setComments([]);
      }

      if (!loadMore) {
        setHasLoaded(true);
      }
    } catch (err) {
      console.error('handleLoadSelected error:', err);
      if (!isSilent && !loadMore) setError(err.message);
    } finally {
      setIsFetchingMulti(false);
      setCommentsLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [selectedChannelId, videosCache, settings, deductQuota, toast, nextPageTokens]);

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
      const statusMap = {
        'publish': 'published',
        'approve': 'published',
        'hold': 'heldForReview',
        'reject': 'rejected'
      };
      const ok = await deductQuota('MODERATE_SINGLE', `Aksi: ${action}`);
      if (!ok) return;

      await youtubeService.moderateComment(commentId, statusMap[action], sessionRef.current.accessToken);

      const prediction = predictionsRef.current[commentId];
      if (sessionRef.current?.user?.email) {
        await historyService.saveAction(sessionRef.current.user.email, {
          channelId: selectedChannelId,
          commentId: comment.id,
          action: statusMap[action],
          commentText: comment.textOriginal,
          author: comment.authorDisplayName,
          videoTitle: comment.videoTitle || 'unknown',
          aiLabel: prediction?.label || 'Normal',
          aiConfidence: prediction?.score || 0,
          sentiment: prediction?.sentiment || null,
          sentimentScore: prediction?.sentiment_score || null
        });
      }

      setSessionHistory(prev => [
        {
          ...comment,
          status: statusMap[action],
          action: statusMap[action],
          aiLabel: prediction?.label || 'Normal',
          aiConfidence: prediction?.confidence || prediction?.score || 0,
          sentiment: prediction?.sentiment || null,
          sentimentScore: prediction?.sentiment_score || null,
          createdAt: new Date().toISOString()
        },
        ...prev.filter(c => c.id !== commentId)
      ]);

      // Sync dbHistory state agar handleUndoAction bisa menemukan data AI
      setDbHistory(prev => [
        {
          comment_id: comment.id,
          user_email: sessionRef.current?.user?.email,
          channel_id: selectedChannelId,
          action: statusMap[action],
          comment_text: comment.textOriginal,
          author: comment.authorDisplayName,
          video_title: comment.videoTitle || 'unknown',
          ai_label: prediction?.label || 'Normal',
          ai_confidence: prediction?.score || 0,
          sentiment: prediction?.sentiment || null,
          sentiment_score: prediction?.sentiment_score || null,
          created_at: new Date().toISOString()
        },
        ...prev.filter(h => h.comment_id !== comment.id)
      ]);

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success(`Komentar berhasil di-${action}`);
    } catch (err) {
      console.error(`Action ${action} error:`, err);
      toast.error(`Gagal melakukan aksi pada komentar`);
    } finally {
      setProcessingComment(null);
    }
  };

  const handleBatchAction = async (commentIds, action) => {
    if (!commentIds || commentIds.length === 0) return false;
    
    // Set processing untuk semua komentar yang termasuk dalam batch
    commentIds.forEach(id => setProcessingComment(id));
    
    try {
      const statusMap = {
        'publish': 'published',
        'approve': 'published',
        'hold': 'heldForReview',
        'reject': 'rejected'
      };
      
      const targetStatus = statusMap[action];
      if (!targetStatus) {
        toast.error('Aksi batch tidak valid');
        return false;
      }

      // Potong kuota MODERATE_BATCH (Hanya 50 unit sekali potong berapapun jumlah komentarnya!)
      const ok = await deductQuota('MODERATE_BATCH', `${commentIds.length} Komentar`);
      if (!ok) return false;

      // Kirim request batch ke YouTube API
      await youtubeService.moderateCommentsBatch(commentIds, targetStatus, sessionRef.current.accessToken);

      // Cari semua objek komentar yang diproses dari state comments
      const batchComments = comments.filter(c => commentIds.includes(c.id));
      const nowString = new Date().toISOString();

      // Siapkan item riwayat untuk Supabase
      const historyItems = batchComments.map(comment => {
        const prediction = predictionsRef.current[comment.id];
        return {
          channelId: selectedChannelId,
          commentId: comment.id,
          action: targetStatus,
          commentText: comment.textOriginal,
          author: comment.authorDisplayName,
          videoTitle: comment.videoTitle || 'unknown',
          aiLabel: prediction?.label || 'Normal',
          aiConfidence: prediction?.score || 0,
          sentiment: prediction?.sentiment || null,
          sentimentScore: prediction?.sentiment_score || null
        };
      });

      // Simpan batch ke Supabase
      if (sessionRef.current?.user?.email && historyItems.length > 0) {
        await historyService.saveBatchActions(sessionRef.current.user.email, historyItems);
      }

      // Update session history state dengan field AI utuh
      const newSessionItems = batchComments.map(comment => {
        const prediction = predictionsRef.current[comment.id];
        return {
          ...comment,
          status: targetStatus,
          action: targetStatus,
          aiLabel: prediction?.label || 'Normal',
          aiConfidence: prediction?.confidence || prediction?.score || 0,
          sentiment: prediction?.sentiment || null,
          sentimentScore: prediction?.sentiment_score || null,
          createdAt: nowString
        };
      });
      
      setSessionHistory(prev => [
        ...newSessionItems,
        ...prev.filter(c => !commentIds.includes(c.id))
      ]);

      // Sync dbHistory state agar handleUndoAction bisa bekerja
      const newDbItems = batchComments.map(comment => {
        const prediction = predictionsRef.current[comment.id];
        return {
          comment_id: comment.id,
          user_email: sessionRef.current?.user?.email,
          channel_id: selectedChannelId,
          action: targetStatus,
          comment_text: comment.textOriginal,
          author: comment.authorDisplayName,
          video_title: comment.videoTitle || 'unknown',
          ai_label: prediction?.label || 'Normal',
          ai_confidence: prediction?.score || 0,
          sentiment: prediction?.sentiment || null,
          sentiment_score: prediction?.sentiment_score || null,
          created_at: nowString
        };
      });

      setDbHistory(prev => [
        ...newDbItems,
        ...prev.filter(h => !commentIds.includes(h.comment_id))
      ]);

      // Hapus komentar dari antrian utama
      setComments(prev => prev.filter(c => !commentIds.includes(c.id)));
      
      toast.success(`${commentIds.length} komentar berhasil di-${action}`);
      return true;
    } catch (err) {
      console.error(`Batch Action ${action} error:`, err);
      toast.error(`Gagal melakukan aksi massal pada komentar`);
      return false;
    } finally {
      setProcessingComment(null);
    }
  };

  const handleUndoAction = async (commentId) => {
    setProcessingComment(commentId);
    try {
      const okDb = await historyService.deleteAction(commentId);
      if (!okDb) {
        toast.error('Gagal membatalkan aksi di database');
        return;
      }

      // Cari komentar asli di sessionHistory atau dbHistory
      const sessionItem = sessionHistory.find(c => c.id === commentId);
      const dbItem = dbHistory.find(h => h.comment_id === commentId);

      let originalComment = sessionItem;

      if (!originalComment && dbItem) {
        originalComment = {
          id: dbItem.comment_id,
          textOriginal: dbItem.comment_text,
          textDisplay: dbItem.comment_text,
          authorDisplayName: dbItem.author,
          authorProfileImageUrl: null,
          videoId: null,
          videoTitle: dbItem.video_title,
          status: 'published',
          publishedAt: dbItem.created_at
        };
      }

      if (originalComment) {
        // Restorasi prediksi AI dari berbagai sumber (fallback chain)
        if (!predictionsRef.current[commentId]) {
          // Sumber 1: dari dbHistory
          // Sumber 2: dari sessionHistory (yang sekarang menyimpan data AI)
          // Sumber 3: re-inference sebagai fallback terakhir
          const aiLabel = dbItem?.ai_label || sessionItem?.aiLabel;
          const aiConfidence = dbItem?.ai_confidence || sessionItem?.aiConfidence;
          const sentiment = dbItem?.sentiment || sessionItem?.sentiment;
          const sentimentScore = dbItem?.sentiment_score || sessionItem?.sentimentScore;

          if (aiLabel) {
            setPredictions(prev => ({
              ...prev,
              [commentId]: {
                label: aiLabel,
                confidence: aiConfidence,
                score: aiConfidence,
                sentiment: sentiment,
                sentiment_score: sentimentScore
              }
            }));
          } else {
            // Fallback terakhir: jalankan ulang prediksi AI
            try {
              const textToPredict = originalComment.textOriginal || originalComment.textDisplay;
              if (textToPredict) {
                const res = await axios.post('/api/predict', { text: textToPredict });
                setPredictions(prev => ({
                  ...prev,
                  [commentId]: {
                    label: res.data.label,
                    confidence: res.data.confidence,
                    score: res.data.confidence,
                    sentiment: res.data.sentiment,
                    sentiment_score: res.data.sentiment_score
                  }
                }));
              }
            } catch (e) {
              console.error('Re-inference saat undo gagal:', e);
            }
          }
        }

        setComments(prev => {
          if (prev.some(c => c.id === commentId)) return prev;
          return [originalComment, ...prev];
        });
      }

      setSessionHistory(prev => prev.filter(c => c.id !== commentId));
      setDbHistory(prev => prev.filter(h => h.comment_id !== commentId));

      toast.success('Aksi berhasil dibatalkan dan komentar dikembalikan ke antrian');
    } catch (err) {
      console.error('handleUndoAction error:', err);
      toast.error('Gagal membatalkan aksi moderasi');
    } finally {
      setProcessingComment(null);
    }
  };

  const handleChangeAction = async (commentId, newAction) => {
    setProcessingComment(commentId);
    try {
      const statusMap = {
        'publish': 'published',
        'approve': 'published',
        'hold': 'heldForReview',
        'reject': 'rejected'
      };
      const targetStatus = statusMap[newAction];

      const ok = await deductQuota('MODERATE_SINGLE', `Ubah Aksi: ${newAction}`);
      if (!ok) return;

      await youtubeService.moderateComment(commentId, targetStatus, sessionRef.current.accessToken);

      let originalComment = sessionHistory.find(c => c.id === commentId);
      let dbItem = dbHistory.find(h => h.comment_id === commentId);

      const commentText = originalComment?.textOriginal || dbItem?.comment_text || '';
      const author = originalComment?.authorDisplayName || dbItem?.author || '';
      const videoTitle = originalComment?.videoTitle || dbItem?.video_title || 'unknown';
      const prediction = predictionsRef.current[commentId];

      const historyItem = {
        channelId: selectedChannelId,
        commentId: commentId,
        action: targetStatus,
        commentText: commentText,
        author: author,
        videoTitle: videoTitle,
        aiLabel: prediction?.label || dbItem?.ai_label || 'Normal',
        aiConfidence: prediction?.score || dbItem?.ai_confidence || 0,
        sentiment: prediction?.sentiment || dbItem?.sentiment || null,
        sentimentScore: prediction?.sentiment_score || dbItem?.sentiment_score || null
      };

      if (sessionRef.current?.user?.email) {
        await historyService.saveAction(sessionRef.current.user.email, historyItem);
      }

      setSessionHistory(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, status: targetStatus, action: targetStatus };
        }
        return c;
      }));

      setDbHistory(prev => prev.map(h => {
        if (h.comment_id === commentId) {
          return { ...h, action: targetStatus };
        }
        return h;
      }));

      toast.success(`Aksi berhasil diubah menjadi ${newAction}`);
    } catch (err) {
      console.error('handleChangeAction error:', err);
      toast.error('Gagal mengubah aksi moderasi');
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
        processingComment, handleAction, handleBatchAction,
        fetchProgress, isFetchingMulti, hasLoaded,
        sessionHistory, dbHistory, handleUndoAction, handleChangeAction,
        canLoadMore, loadingMore
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
