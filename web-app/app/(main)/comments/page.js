'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { youtubeService } from '@/services/youtubeService';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import axios from 'axios';
import { historyService } from '@/services/historyService';

// Variabel global sementara untuk mencegah alert bertumpuk
let isSessionExpiredAlertShown = false;

export default function CommentsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Helper untuk menangani sesi habis
  const handleApiError = (err) => {
    if (err.isExpired) {
      if (!isSessionExpiredAlertShown) {
        isSessionExpiredAlertShown = true;
        alert("Sesi Google Anda telah berakhir demi keamanan. Silakan Login kembali.");
        signOut({ callbackUrl: '/login' });
        setTimeout(() => { isSessionExpiredAlertShown = false; }, 5000);
      }
      return true;
    }
    return false;
  };

  // ── Video state ──────────────────────────────────────────────
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null); // { id, title, thumbnail }
  const [showVideoPanel, setShowVideoPanel] = useState(false); // mobile drawer

  // ── Comment state ────────────────────────────────────────────
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [isPolling, setIsPolling] = useState(false);
  const [processingComment, setProcessingComment] = useState(null);
  const [filter, setFilter] = useState('semua');

  // Ref to keep values for use inside predictComments (avoid stale closure)
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // ── Load videos on mount ─────────────────────────────────────
  useEffect(() => {
    const channelId = localStorage.getItem('selectedChannelId');
    if (!channelId) { router.push('/channel'); return; }
    if (session?.accessToken) loadVideos(channelId, session.accessToken);
  }, [session, router]);

  // Restore last selected video
  useEffect(() => {
    if (videos.length === 0) return;
    const savedId = localStorage.getItem('selectedVideoId');
    const savedTitle = localStorage.getItem('selectedVideoTitle');
    if (savedId) {
      const match = videos.find(v => v.id.videoId === savedId);
      if (match) {
        setSelectedVideo({
          id: savedId,
          title: savedTitle || match.snippet.title,
          thumbnail: match.snippet.thumbnails.medium?.url || match.snippet.thumbnails.default.url,
        });
      }
    }
  }, [videos]);

  // Fetch comments when selectedVideo changes
  useEffect(() => {
    if (selectedVideo && session?.accessToken) {
      setPredictions({});
      setComments([]);
      setError(null);
      fetchComments(selectedVideo.id, session.accessToken);
    }
  }, [selectedVideo?.id, session?.accessToken]);

  // ── Polling ──────────────────────────────────────────────────
  useEffect(() => {
    let intervalId;
    if (isPolling && session?.accessToken && selectedVideo) {
      const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
      const interval = (settings.pollingInterval || 120) * 1000;
      intervalId = setInterval(() => fetchComments(selectedVideo.id, session.accessToken, true), interval);
    }
    return () => clearInterval(intervalId);
  }, [isPolling, session, selectedVideo]);

  // ── Data fetchers ────────────────────────────────────────────
  const loadVideos = async (channelId, token) => {
    try {
      setVideosLoading(true);
      const data = await youtubeService.getVideosByChannel(channelId, token);
      const videoItems = (data.items || []).filter(item => item.id?.videoId);
      setVideos(videoItems);
    } catch (err) {
      if (handleApiError(err)) return;
      console.error('Error load videos:', err);
      setVideosError(err.message);
    } finally {
      setVideosLoading(false);
    }
  };

  const fetchComments = useCallback(async (videoId, token, isSilent = false) => {
    try {
      if (!isSilent) setCommentsLoading(true);
      setError(null);
      const data = await youtubeService.getComments(videoId, token);
      const normalized = data.items.map(item => ({
        id: item.id,
        ...item.snippet.topLevelComment.snippet,
        status: 'published',
      }));
      setComments(normalized);
      await predictComments(normalized);
    } catch (err) {
      const msg = typeof err === 'object' ? err.message : err;
      if (!isSilent) setError(msg || 'Gagal memuat komentar');
    } finally {
      if (!isSilent) setCommentsLoading(false);
    }
  }, []);

  const predictComments = async (commentList) => {
    const settings = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('userSettings') || '{}') : {};
    const tHold = (settings.thresholdHold || 70) / 100;
    const tReject = (settings.thresholdReject || 90) / 100;
    const useBatch = settings.batchModeration !== false;
    const pendingHold = [], pendingReject = [];

    for (const comment of commentList) {
      try {
        const res = await axios.post('/api/predict', { text: comment.textDisplay });
        const prediction = { label: res.data.label, confidence: res.data.confidence, sentiment: res.data.sentiment, sentiment_score: res.data.sentiment_score };
        setPredictions(prev => ({ ...prev, [comment.id]: prediction }));

        if (prediction.label?.toLowerCase() === 'spam') {
          if (settings.autoHapus && prediction.confidence > tReject) {
            useBatch ? pendingReject.push(comment.id) : handleModerate(comment.id, 'reject', prediction, commentList);
          } else if (settings.autoTahan && prediction.confidence > tHold) {
            useBatch ? pendingHold.push(comment.id) : handleModerate(comment.id, 'hold', prediction, commentList);
          }
        }
      } catch { /* skip failed predictions */ }
    }

    const tok = sessionRef.current?.accessToken;
    if (useBatch && tok) {
      const email = sessionRef.current?.user?.email;
      const vidTitle = selectedVideo?.title || '';
      const chanId = localStorage.getItem('selectedChannelId');

      if (pendingHold.length > 0) {
        try {
          await youtubeService.moderateCommentsBatch(pendingHold, 'heldForReview', tok);
          setComments(prev => prev.map(c => pendingHold.includes(c.id) ? { ...c, status: 'heldForReview' } : c));
          
          // Save batch to Supabase
          const batchItems = commentList
            .filter(c => pendingHold.includes(c.id))
            .map(c => ({
              channelId: chanId,
              commentId: c.id,
              action: 'heldForReview',
              commentText: c.textDisplay?.replace(/<[^>]*>/g, '') || '',
              author: c.authorDisplayName || '',
              videoTitle: vidTitle,
              aiLabel: predictions[c.id]?.label || 'Spam',
              aiConfidence: predictions[c.id]?.confidence || 0.9,
              sentiment: predictions[c.id]?.sentiment || null,
              sentimentScore: predictions[c.id]?.sentiment_score || null
            }));
          if (email) historyService.saveBatchActions(email, batchItems);
        } catch { /* ignore */ }
      }
      if (pendingReject.length > 0) {
        try {
          await youtubeService.moderateCommentsBatch(pendingReject, 'rejected', tok);
          setComments(prev => prev.map(c => pendingReject.includes(c.id) ? { ...c, status: 'rejected' } : c));
          
          // Save batch to Supabase
          const batchItems = commentList
            .filter(c => pendingReject.includes(c.id))
            .map(c => ({
              channelId: chanId,
              commentId: c.id,
              action: 'rejected',
              commentText: c.textDisplay?.replace(/<[^>]*>/g, '') || '',
              author: c.authorDisplayName || '',
              videoTitle: vidTitle,
              aiLabel: predictions[c.id]?.label || 'Spam',
              aiConfidence: predictions[c.id]?.confidence || 0.95,
              sentiment: predictions[c.id]?.sentiment || null,
              sentimentScore: predictions[c.id]?.sentiment_score || null
            }));
          if (email) historyService.saveBatchActions(email, batchItems);
        } catch { /* ignore */ }
      }
    }
  };

  // ── Moderation action ─────────────────────────────────────────
  const handleModerate = async (commentId, action, providedPrediction = null, commentList = null) => {
    setProcessingComment(commentId);
    try {
      const statusMap = { hold: 'heldForReview', publish: 'published', reject: 'rejected' };
      await youtubeService.moderateComment(commentId, statusMap[action], sessionRef.current.accessToken);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, status: statusMap[action] } : c));

      const list = commentList || comments;
      const comment = list.find(c => c.id === commentId);
      if (comment) {
        const prediction = providedPrediction || predictions[comment.id];
        const email = sessionRef.current?.user?.email;
        
        if (email) {
          await historyService.saveAction(email, {
            channelId: localStorage.getItem('selectedChannelId'),
            commentId,
            action: statusMap[action],
            commentText: comment.textDisplay?.replace(/<[^>]*>/g, '') || '',
            author: comment.authorDisplayName || '',
            videoTitle: selectedVideo?.title || '',
            aiLabel: prediction?.label || 'Normal',
            aiConfidence: prediction?.confidence || 0,
            sentiment: prediction?.sentiment || null,
            sentimentScore: prediction?.sentiment_score || null,
          });
        }
      }
    } catch (err) {
      console.error('Moderasi gagal:', err);
    } finally {
      setProcessingComment(null);
    }
  };

  // ── Select video ──────────────────────────────────────────────
  const handleSelectVideo = (video) => {
    const vid = { id: video.id.videoId, title: video.snippet.title, thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url };
    setSelectedVideo(vid);
    localStorage.setItem('selectedVideoId', vid.id);
    localStorage.setItem('selectedVideoTitle', vid.title);
    setIsPolling(false);
    setFilter('semua');
    setShowVideoPanel(false);
  };

  // ── Helpers ───────────────────────────────────────────────────
  const filteredComments = comments.filter(c => {
    if (filter === 'semua') return true;
    const pred = predictions[c.id];
    if (!pred) return true;
    return pred.label?.toLowerCase() === filter;
  });

  const getStatusBadge = (status) => {
    const map = {
      published: { label: 'Diterbitkan', cls: 'bg-green-100 text-green-700' },
      heldForReview: { label: 'Ditahan', cls: 'bg-amber-100 text-amber-700' },
      rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700' },
    };
    const s = map[status] || map.published;
    return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
  };

  // ── Video Panel (shared between desktop sidebar and mobile drawer) ──
  const VideoPanelContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Daftar Video</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{videos.length} video ditemukan</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {videosLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-xs text-gray-400">Tidak ada video ditemukan.</p>
            <button onClick={() => router.push('/channel')} className="text-xs text-indigo-600 hover:underline mt-2 block">Ganti Kanal →</button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {videos.map((video) => {
              const isActive = selectedVideo?.id === video.id.videoId;
              return (
                <button
                  key={video.id.videoId}
                  onClick={() => handleSelectVideo(video)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                    isActive ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="w-14 h-10 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                    <img
                      src={video.snippet.thumbnails.default.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-medium line-clamp-2 leading-tight ${isActive ? 'text-indigo-700' : 'text-gray-700'}`}>
                      {video.snippet.title}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(video.snippet.publishedAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => router.push('/channel')}
          className="w-full text-xs text-gray-500 hover:text-indigo-600 py-1.5 transition-colors"
        >
          ← Ganti Kanal
        </button>
      </div>
    </div>
  );

  // ── Comment area ──────────────────────────────────────────────
  const CommentArea = () => {
    if (!selectedVideo) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">Pilih video terlebih dahulu</p>
          <p className="text-xs text-gray-400 mt-1">Klik salah satu video di panel kiri untuk memuat komentar</p>
          {/* Mobile: show button to open video panel */}
          <button
            onClick={() => setShowVideoPanel(true)}
            className="mt-4 lg:hidden px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all"
          >
            Pilih Video
          </button>
        </div>
      );
    }

    if (commentsLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
          <p className="text-xs text-gray-400">Memuat & menganalisis komentar...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="m-4">
          <div className="bg-red-50 p-5 rounded-xl flex items-start gap-3 border border-red-100">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-red-800">Gagal memuat komentar</h3>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Comment header bar */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">{selectedVideo.title}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{filteredComments.length} komentar</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsPolling(!isPolling)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isPolling ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              <span className="hidden sm:inline">{isPolling ? 'Polling On' : 'Polling'}</span>
            </button>
            <button
              onClick={() => fetchComments(selectedVideo.id, session.accessToken)}
              className="px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all active:scale-95"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-2 border-b border-gray-50 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          {['semua', 'spam', 'normal'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize whitespace-nowrap ${
                filter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'semua' ? 'Semua' : f}
            </button>
          ))}
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto">
          {filteredComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="w-10 h-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
              <p className="text-sm text-gray-400">Tidak ada komentar ditemukan</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Pengguna</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Komentar</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">AI</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredComments.map((comment) => {
                      const prediction = predictions[comment.id];
                      const isSpam = prediction?.label?.toLowerCase() === 'spam';
                      const isProcessing = processingComment === comment.id;
                      return (
                        <tr key={comment.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <img className="w-7 h-7 rounded-full flex-shrink-0" src={comment.authorProfileImageUrl} alt="" />
                              <div>
                                <p className="text-xs font-medium text-gray-800 whitespace-nowrap">{comment.authorDisplayName}</p>
                                <p className="text-[10px] text-gray-400">{new Date(comment.publishedAt).toLocaleDateString('id-ID')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-[220px] xl:max-w-xs">
                            <p className="text-xs text-gray-700 line-clamp-2" dangerouslySetInnerHTML={{ __html: comment.textDisplay }} />
                          </td>
                          <td className="px-4 py-3">
                            {!prediction ? (
                              <div className="flex items-center gap-1"><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-400"></div><span className="text-[10px] text-gray-400">...</span></div>
                            ) : (
                              <div>
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isSpam ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                  {isSpam ? '🚨 Spam' : '✅ Normal'}
                                </span>
                                {!isSpam && prediction.sentiment && (
                                  <span className={`ml-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${prediction.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' : prediction.sentiment === 'negative' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {prediction.sentiment === 'positive' ? '😊 Positif' : prediction.sentiment === 'negative' ? '😠 Negatif' : '😐 Netral'}
                                  </span>
                                )}
                                <p className="text-[10px] text-gray-400 mt-1">{Math.round(prediction.confidence * 100)}% {prediction.sentiment_score && !isSpam && ` • Sentimen: ${Math.round(prediction.sentiment_score * 100)}%`}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(comment.status)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-0.5 opacity-30 group-hover:opacity-100 transition-opacity">
                              <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'publish')} title="Terbitkan" className="p-1.5 rounded-md text-green-600 hover:bg-green-50 disabled:opacity-30">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                              <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'hold')} title="Tahan" className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 disabled:opacity-30">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                              <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'reject')} title="Tolak" className="p-1.5 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-30">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden p-3 space-y-3">
                {filteredComments.map((comment) => {
                  const prediction = predictions[comment.id];
                  const isSpam = prediction?.label?.toLowerCase() === 'spam';
                  const isProcessing = processingComment === comment.id;
                  return (
                    <div key={comment.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img className="w-7 h-7 rounded-full flex-shrink-0" src={comment.authorProfileImageUrl} alt="" />
                          <div>
                            <p className="text-xs font-medium text-gray-800">{comment.authorDisplayName}</p>
                            <p className="text-[10px] text-gray-400">{new Date(comment.publishedAt).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                        {getStatusBadge(comment.status)}
                      </div>
                      <p className="text-xs text-gray-700 line-clamp-3" dangerouslySetInnerHTML={{ __html: comment.textDisplay }} />
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                        <div>
                          {!prediction ? (
                            <div className="flex items-center gap-1"><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-400"></div><span className="text-[10px] text-gray-400">Menganalisis...</span></div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isSpam ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                  {isSpam ? '🚨 Spam' : '✅ Normal'}
                                </span>
                                <span className="text-[10px] text-gray-400">{Math.round(prediction.confidence * 100)}%</span>
                              </div>
                              {!isSpam && prediction.sentiment && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${prediction.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' : prediction.sentiment === 'negative' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {prediction.sentiment === 'positive' ? '😊 Positif' : prediction.sentiment === 'negative' ? '😠 Negatif' : '😐 Netral'}
                                  </span>
                                  <span className="text-[10px] text-gray-400">{Math.round(prediction.sentiment_score * 100)}%</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'publish')} className="p-2 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-30 active:scale-95 transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                          <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'hold')} className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 disabled:opacity-30 active:scale-95 transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                          <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'reject')} className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30 active:scale-95 transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────
  return (
    <div className="animate-fade-in-up -m-4 lg:-m-6 h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Page title bar */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div>
          <h1 className="text-base lg:text-lg font-semibold text-gray-900">Antrian Moderasi</h1>
          <p className="text-[11px] text-gray-400">Pilih video lalu moderasi komentarnya</p>
        </div>
        {/* Mobile: button to open video drawer */}
        <button
          onClick={() => setShowVideoPanel(true)}
          className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          {selectedVideo ? 'Ganti Video' : 'Pilih Video'}
        </button>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: Left video panel */}
        <div className="hidden lg:flex lg:flex-col w-64 xl:w-72 border-r border-gray-200 bg-white flex-shrink-0 overflow-hidden">
          <VideoPanelContent />
        </div>

        {/* Right: comment area */}
        <div className="flex-1 bg-white overflow-hidden flex flex-col">
          <CommentArea />
        </div>
      </div>

      {/* Mobile: Video drawer overlay */}
      {showVideoPanel && (
        <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setShowVideoPanel(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-50 w-[300px] max-w-[85vw] h-full bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Pilih Video</p>
              <button onClick={() => setShowVideoPanel(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <VideoPanelContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
