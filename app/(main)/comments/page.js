'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { youtubeService } from '@/services/youtubeService';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function CommentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [predictions, setPredictions] = useState({});
  const [isPolling, setIsPolling] = useState(false);
  const [processingComment, setProcessingComment] = useState(null);
  const [filter, setFilter] = useState('semua'); // semua, spam, normal

  const fetchComments = useCallback(async (videoId, token, isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const data = await youtubeService.getComments(videoId, token);
      const normalizedComments = data.items.map(item => ({
        id: item.id,
        ...item.snippet.topLevelComment.snippet,
        status: 'published',
      }));
      setComments(normalizedComments);
      await predictComments(normalizedComments);
    } catch (err) {
      if (!isSilent) setError(err.message || 'Gagal memuat komentar');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  const predictComments = async (commentList) => {
    for (const comment of commentList) {
      if (predictions[comment.id]) continue;
      try {
        const res = await axios.post('/api/predict', { text: comment.textDisplay });
        setPredictions(prev => ({
          ...prev,
          [comment.id]: { label: res.data.label, confidence: res.data.confidence },
        }));
      } catch (err) {
        console.error('Gagal memprediksi komentar', comment.id);
      }
    }
  };

  useEffect(() => {
    const videoId = localStorage.getItem('selectedVideoId');
    const vTitle = localStorage.getItem('selectedVideoTitle');

    if (!videoId) {
      router.push('/video');
      return;
    }

    setVideoTitle(vTitle || 'Video tidak diketahui');
    if (session?.accessToken) {
      fetchComments(videoId, session.accessToken);
    }
  }, [session, router, fetchComments]);

  useEffect(() => {
    let intervalId;
    if (isPolling && session?.accessToken) {
      const videoId = localStorage.getItem('selectedVideoId');
      intervalId = setInterval(() => {
        fetchComments(videoId, session.accessToken, true);
      }, 30000);
    }
    return () => clearInterval(intervalId);
  }, [isPolling, session, fetchComments]);

  const handleModerate = async (commentId, action) => {
    setProcessingComment(commentId);
    try {
      const statusMap = { hold: 'heldForReview', publish: 'published', reject: 'rejected' };
      await youtubeService.moderateComment(commentId, statusMap[action], session.accessToken);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, status: statusMap[action] } : c));

      // Save to moderation history in localStorage
      const comment = comments.find(c => c.id === commentId);
      if (comment) {
        const history = JSON.parse(localStorage.getItem('moderationHistory') || '[]');
        history.unshift({
          commentId,
          action: statusMap[action],
          commentText: comment.textDisplay?.replace(/<[^>]*>/g, '') || '',
          author: comment.authorDisplayName || '',
          videoTitle: videoTitle,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem('moderationHistory', JSON.stringify(history.slice(0, 200)));
      }
    } catch (err) {
      console.error('Moderasi gagal:', err);
    } finally {
      setProcessingComment(null);
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl flex items-start gap-3 border border-red-100">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div>
          <h3 className="text-sm font-semibold text-red-800">Gagal memuat komentar</h3>
          <p className="text-xs text-red-600 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Antrian Moderasi</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Video: <span className="font-medium text-gray-600">{videoTitle}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Polling toggle */}
          <button
            onClick={() => setIsPolling(!isPolling)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              isPolling
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            {isPolling ? 'Polling Aktif (30d)' : 'Mulai Polling'}
          </button>
          <button
            onClick={() => {
              const videoId = localStorage.getItem('selectedVideoId');
              fetchComments(videoId, session.accessToken);
            }}
            className="px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all active:scale-95"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {['semua', 'spam', 'normal'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              filter === f
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'semua' ? 'Semua Tindakan' : f}
          </button>
        ))}
      </div>

      {/* Table */}
      {filteredComments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          <p className="text-sm text-gray-500">Tidak ada komentar ditemukan</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Pengguna</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Komentar</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Analisis AI</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredComments.map((comment) => {
                  const prediction = predictions[comment.id];
                  const isSpam = prediction?.label?.toLowerCase() === 'spam';
                  const isProcessing = processingComment === comment.id;

                  return (
                    <tr key={comment.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img className="w-8 h-8 rounded-full" src={comment.authorProfileImageUrl} alt="" />
                          <div>
                            <p className="text-xs font-medium text-gray-800">{comment.authorDisplayName}</p>
                            <p className="text-[10px] text-gray-400">{new Date(comment.publishedAt).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="text-xs text-gray-700 line-clamp-2" dangerouslySetInnerHTML={{ __html: comment.textDisplay }} />
                      </td>
                      <td className="px-5 py-3.5">
                        {!prediction ? (
                          <div className="flex items-center gap-1.5">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-500"></div>
                            <span className="text-[10px] text-gray-400">Menganalisis...</span>
                          </div>
                        ) : (
                          <div>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              isSpam ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {isSpam ? '🚨 Spam' : '✅ Normal'}
                            </span>
                            <p className="text-[10px] text-gray-400 mt-1">Conf: {Math.round(prediction.confidence * 100)}%</p>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(comment.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button
                            disabled={isProcessing}
                            onClick={() => handleModerate(comment.id, 'publish')}
                            title="Terbitkan"
                            className="p-1.5 rounded-md text-green-600 hover:bg-green-50 disabled:opacity-30"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            disabled={isProcessing}
                            onClick={() => handleModerate(comment.id, 'hold')}
                            title="Tahan"
                            className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 disabled:opacity-30"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            disabled={isProcessing}
                            onClick={() => handleModerate(comment.id, 'reject')}
                            title="Tolak"
                            className="p-1.5 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-30"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
