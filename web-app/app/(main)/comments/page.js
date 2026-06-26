'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useModeration } from '@/contexts/ModerationContext';
import { useYouTube } from '@/contexts/YouTubeContext';
import { useQuota } from '@/contexts/QuotaContext';
import { useSettings } from '@/contexts/SettingsContext';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import UserAvatar from '@/components/ui/UserAvatar';

export default function CommentsPage() {
  const router = useRouter();
  const { isFeatureDisabled } = useQuota();

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      const originalPadding = mainEl.style.padding;
      const originalOverflow = mainEl.style.overflow;
      mainEl.style.padding = '0';
      mainEl.style.overflow = 'hidden';
      return () => {
        mainEl.style.padding = originalPadding;
        mainEl.style.overflow = originalOverflow;
      };
    }
  }, []);

  const { settings } = useSettings();
  const {
    selectedVideoIds, primaryVideo, handleToggleVideo, handleSelectAll, handleDeselectAll,
    comments, commentsLoading, error, predictions,
    isPolling, togglePolling, handleLoadSelected,
    processingComment, handleAction, handleBatchAction,
    fetchProgress, isFetchingMulti, hasLoaded,
    sessionHistory, dbHistory, handleUndoAction, handleChangeAction,
    canLoadMore, loadingMore,
    pollingStatus, nextPollAt, lastPollingResult
  } = useModeration();

  // Countdown state: hitung mundur detik menuju poll berikutnya
  const [countdown, setCountdown] = useState(null);
  useEffect(() => {
    if (!isPolling || !nextPollAt) { setCountdown(null); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((nextPollAt - Date.now()) / 1000));
      setCountdown(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isPolling, nextPollAt]);

  const [selectedComments, setSelectedComments] = useState(new Set());

  const toggleSelectComment = (commentId) => {
    setSelectedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const toggleSelectAllComments = (items) => {
    setSelectedComments(prev => {
      // Jika semua item yang saat ini tampil sudah dicentang, kosongkan seleksi
      const allSelected = items.every(item => prev.has(item.id));
      if (allSelected) {
        const next = new Set(prev);
        items.forEach(item => next.delete(item.id));
        return next;
      } else {
        const next = new Set(prev);
        items.forEach(item => next.add(item.id));
        return next;
      }
    });
  };

  const handleExecuteBatch = async (action) => {
    const idsArray = Array.from(selectedComments);
    if (idsArray.length === 0) return;

    const success = await handleBatchAction(idsArray, action);
    if (success) {
      setSelectedComments(new Set()); // Reset seleksi setelah sukses
    }
  };

  const { videosCache, selectedChannelId, loadingVideos } = useYouTube();
  const videos = selectedChannelId ? (videosCache[selectedChannelId] || []) : [];
  const videosLoading = loadingVideos && videos.length === 0;

  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [filter, setFilter] = useState('semua');
  const [videoFilter, setVideoFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('belum'); // 'belum' | 'sudah'
  const [videoSearchQuery, setVideoSearchQuery] = useState('');

  const quotaError = null;

  const handleModerate = async (commentId, action) => {
    await handleAction(commentId, action);
  };

  const getModeratedComments = () => {
    const merged = new Map();
    dbHistory.forEach(h => {
      merged.set(h.comment_id, {
        id: h.comment_id,
        authorDisplayName: h.author || 'Pengguna YouTube',
        authorProfileImageUrl: null,
        textOriginal: h.comment_text,
        textDisplay: h.comment_text,
        videoTitle: h.video_title || 'Video YouTube',
        status: h.action,
        action: h.action,
        aiLabel: h.ai_label,
        aiConfidence: h.ai_confidence,
        sentiment: h.sentiment,
        sentimentScore: h.sentiment_score,
        createdAt: h.created_at,
        isFromDb: true
      });
    });
    sessionHistory.forEach(c => {
      const pred = predictions[c.id];
      merged.set(c.id, {
        ...c,
        aiLabel: pred?.label || c.aiLabel || null,
        aiConfidence: pred?.confidence || pred?.score || c.aiConfidence || null,
        sentiment: pred?.sentiment || c.sentiment || null,
        sentimentScore: pred?.sentiment_score || c.sentimentScore || null,
        isFromDb: false
      });
    });
    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.createdAt || b.publishedAt) - new Date(a.createdAt || a.publishedAt)
    );
  };

  const moderatedCommentsList = getModeratedComments();

  // ── Filter logic ─────────────────────────────────────────────
  const filteredComments = comments.filter(c => {
    if (filter !== 'semua') {
      const pred = predictions[c.id];
      if (pred && pred.label?.toLowerCase() !== filter) return false;
    }
    if (videoFilter !== 'all' && c.videoId !== videoFilter) return false;
    return true;
  });

  const filteredModeratedComments = moderatedCommentsList.filter(c => {
    if (filter !== 'semua') {
      const label = c.aiLabel || predictions[c.id]?.label || '';
      if (label.toLowerCase() !== filter) return false;
    }
    if (videoFilter !== 'all') {
      const targetVideo = videos.find(v => v.id.videoId === videoFilter);
      if (targetVideo) {
        const targetTitle = targetVideo.snippet.title;
        if (c.videoTitle !== targetTitle && c.videoId !== videoFilter) return false;
      }
    }
    return true;
  });

  // Video unik dari komentar yang sudah dimuat (untuk dropdown filter)
  const loadedVideos = [...new Map(
    comments.map(c => [c.videoId, { id: c.videoId, title: c.videoTitle }])
  ).values()];

  // ── Video Panel: Checklist ───────────────────────────────────
  const VideoPanelContent = () => {
    const filteredVideos = videos.filter(video =>
      video?.snippet?.title?.toLowerCase().includes(videoSearchQuery.toLowerCase())
    );

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Daftar Video</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {selectedVideoIds.size > 0
              ? `${selectedVideoIds.size} dari ${videos.length} video dipilih`
              : 'Pilih satu/beberapa video di bawah'}
          </p>
        </div>

        {/* Input Pencarian Video */}
        {!videosLoading && videos.length > 0 && (
          <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari judul video..."
                value={videoSearchQuery}
                onChange={(e) => setVideoSearchQuery(e.target.value)}
                className="input-dark pr-7 py-1.5 text-xs w-full rounded-lg"
                style={{
                  background: 'var(--bg-card-hover)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                  paddingLeft: '2.25rem'
                }}
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                </svg>
              </div>
              {videoSearchQuery && (
                <button
                  onClick={() => setVideoSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pilih Semua / Batal */}
        {!videosLoading && videos.length > 0 && (
          <div className="flex gap-1.5 px-3 py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <button
              onClick={() => {
                if (videoSearchQuery) {
                  filteredVideos.forEach(v => {
                    if (!selectedVideoIds.has(v.id.videoId)) {
                      handleToggleVideo(v);
                    }
                  });
                } else {
                  handleSelectAll();
                }
              }}
              className="flex-1 text-[11px] text-indigo-500 hover:text-indigo-600 font-medium py-1 px-2 rounded-md hover:bg-indigo-500/10 transition-colors"
            >
              Pilih Semua
            </button>
            <button
              onClick={() => {
                if (videoSearchQuery) {
                  filteredVideos.forEach(v => {
                    if (selectedVideoIds.has(v.id.videoId)) {
                      handleToggleVideo(v);
                    }
                  });
                } else {
                  handleDeselectAll();
                }
              }}
              disabled={selectedVideoIds.size === 0}
              className="flex-1 text-[11px] font-medium py-1 px-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg-card-hover)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Batal Pilih
            </button>
          </div>
        )}

        {/* Daftar Video dengan Checkbox */}
        <div className="flex-1 overflow-y-auto">
          {videosLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500" />
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tidak ada video ditemukan.</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tidak ada video yang cocok.</p>
              <button
                onClick={() => setVideoSearchQuery('')}
                className="text-xs text-indigo-400 hover:underline mt-2 block mx-auto animate-fade-in"
              >
                Hapus Pencarian
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {filteredVideos.map(video => {
                const videoId = video?.id?.videoId;
                if (!videoId) return null;
                const isChecked = selectedVideoIds.has(videoId);
                return (
                  <label
                    key={videoId}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all select-none border ${isChecked
                      ? 'bg-indigo-500/10 border-indigo-500/20'
                      : 'border-transparent hover:bg-[var(--bg-card-hover)]'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleVideo(video)}
                      className="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer flex-shrink-0"
                    />
                    <div className="w-12 h-9 rounded-md overflow-hidden flex-shrink-0 bg-card-hover border border-border-default">
                      {video?.snippet?.thumbnails?.default?.url ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={video.snippet.thumbnails.default.url}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </>
                      ) : (
                        <div className="w-full h-full bg-[var(--bg-card-hover)] flex items-center justify-center text-[10px] text-[var(--text-muted)]">No Image</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-medium line-clamp-2 leading-tight ${isChecked ? 'text-indigo-400' : ''
                        }`}
                        style={!isChecked ? { color: 'var(--text-secondary)' } : {}}
                      >
                        {video?.snippet?.title || 'Video Tanpa Judul'}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {video?.snippet?.publishedAt
                          ? new Date(video.snippet.publishedAt).toLocaleDateString('id-ID')
                          : 'Tanggal tidak diketahui'}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: Progress + Tombol Muat */}
        <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--border-default)' }}>
          {/* Progress bar saat fetch */}
          {isFetchingMulti && fetchProgress.total > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span>Video {fetchProgress.current} / {fetchProgress.total}</span>
                <span>{Math.round((fetchProgress.current / fetchProgress.total) * 100)}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${fetchProgress.total > 0 ? (fetchProgress.current / fetchProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={() => { handleLoadSelected(false); setShowVideoPanel(false); }}
            disabled={selectedVideoIds.size === 0 || isFetchingMulti}
            className={`w-full py-2 px-3 text-white text-xs font-semibold rounded-xl transition-all active:scale-95 disabled:cursor-not-allowed flex items-center justify-center gap-2 disabled:opacity-50 ${selectedVideoIds.size > 0 && !hasLoaded && !isFetchingMulti
                ? 'bg-indigo-600 hover:bg-indigo-700 animate-pulse shadow-lg shadow-indigo-500/20'
                : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
          >
            {isFetchingMulti ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white flex-shrink-0" />
                Memuat...
              </>
            ) : selectedVideoIds.size === 0 ? (
              'Pilih video terlebih dahulu'
            ) : (
              <>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Muat Komentar ({selectedVideoIds.size} video)
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // ── Comment Area ─────────────────────────────────────────────
  const CommentArea = () => {
    // 1. Belum ada video dipilih
    if (selectedVideoIds.size === 0) {
      return (
        <EmptyState
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          }
          title="Belum ada video dipilih"
          description="Centang satu atau beberapa video di panel kiri, lalu klik &quot;Muat Komentar&quot;"
          actionButton={
            <button
              onClick={() => setShowVideoPanel(true)}
              className="lg:hidden px-4 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-all"
            >
              Pilih Video
            </button>
          }
        />
      );
    }

    // 2. Loading
    if (commentsLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-20">
          {fetchProgress.total > 1 && (
            <div className="mb-4 text-center">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Video {fetchProgress.current} / {fetchProgress.total}
              </p>
              <div className="w-48 h-1.5 rounded-full overflow-hidden mx-auto" style={{ background: 'var(--border-default)' }}>
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${fetchProgress.total > 0 ? (fetchProgress.current / fetchProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3" />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Memuat &amp; menganalisis komentar...</p>
        </div>
      );
    }

    // 3. Quota error
    if (quotaError) {
      return (
        <div className="m-4">
          <div className="bento-card border-amber-500/20 p-5 flex items-start gap-3" style={{ background: 'var(--color-warning-bg)' }}>
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-warning-text)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-warning-text)' }}>Kuota API Tidak Cukup</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-warning-text)', opacity: 0.85 }}>{quotaError}</p>
              <a href="/pricing" className="inline-block mt-2 text-xs font-medium underline" style={{ color: 'var(--color-warning-text)' }}>
                ⚡ Top-up Kuota Sekarang →
              </a>
            </div>
          </div>
        </div>
      );
    }

    // 4. Error lain
    if (error) {
      return (
        <div className="m-4">
          <div className="bento-card border-rose-500/20 p-5 flex items-start gap-3" style={{ background: 'var(--color-danger-bg)' }}>
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-danger-text)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-danger-text)' }}>Gagal memuat komentar</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-danger-text)', opacity: 0.85 }}>{error}</p>
            </div>
          </div>
        </div>
      );
    }

    // 5. Sudah dipilih tapi belum dimuat (belum klik tombol)
    if (!hasLoaded) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--accent-ai-soft)' }}>
            <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {selectedVideoIds.size} video dipilih
          </p>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
            Klik tombol di bawah untuk memuat komentar dari semua video yang dipilih
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs sm:max-w-none px-4 animate-fade-in">
            <button
              onClick={() => handleLoadSelected(false)}
              disabled={isFetchingMulti}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Muat {selectedVideoIds.size} Video
            </button>
            <button
              onClick={() => setShowVideoPanel(true)}
              className="lg:hidden w-full sm:w-auto px-5 py-2.5 bg-[var(--bg-card-hover)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-secondary)] text-xs font-semibold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V15.75z" />
              </svg>
              Pilih / Ganti Video
            </button>
          </div>
        </div>
      );
    }

    // 6. Tampilkan komentar
    return (
      <div className="flex flex-col h-full animate-fade-in">
        {/* Header bar */}
        <div className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-shrink-0" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex-1 min-w-0">
            {selectedVideoIds.size === 1 ? (
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>{primaryVideo?.title}</p>
            ) : (
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{selectedVideoIds.size} video dimuat</p>
            )}
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {activeTab === 'belum' ? (
                <>
                  {filteredComments.length} komentar ditampilkan
                  {comments.length !== filteredComments.length && ` • ${comments.length} total`}
                </>
              ) : (
                <>
                  {filteredModeratedComments.length} riwayat tindakan ditampilkan
                  {moderatedCommentsList.length !== filteredModeratedComments.length && ` • ${moderatedCommentsList.length} total`}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={togglePolling}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${isPolling
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                : 'border-[var(--border-default)] hover:bg-[var(--bg-card-hover)]'
                }`}
              style={!isPolling ? { color: 'var(--text-secondary)' } : {}}
            >
              <svg
                className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`}
                style={!isPolling ? { color: 'var(--text-muted)' } : {}}
                fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              <span className="hidden sm:inline">{isPolling ? 'Auto Moderasi On' : 'Auto Moderasi'}</span>
            </button>
            <button
              onClick={() => handleLoadSelected(false)}
              disabled={isFetchingMulti}
              className="px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* ── Polling Status Bar ─────────────────────────────────── */}
        {isPolling && (
          <div
            className="px-4 py-2 flex items-center gap-3 flex-wrap border-b text-[11px]"
            style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-default)' }}
          >
            {/* Phase indicator */}
            <div className="flex items-center gap-1.5">
              {pollingStatus === 'idle' ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {countdown !== null
                      ? `Pemeriksaan berikutnya dalam ${countdown} detik`
                      : 'Auto-moderasi aktif'}
                  </span>
                </>
              ) : pollingStatus === 'fetching' ? (
                <>
                  <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-blue-400" />
                  <span className="text-blue-400 font-medium">Mengambil komentar baru...</span>
                </>
              ) : pollingStatus === 'analyzing' ? (
                <>
                  <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-amber-400" />
                  <span className="text-amber-400 font-medium">Menganalisis dengan AI...</span>
                </>
              ) : pollingStatus === 'moderating' ? (
                <>
                  <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-rose-400" />
                  <span className="text-rose-400 font-medium">Menerapkan moderasi otomatis...</span>
                </>
              ) : null}
            </div>

            {/* Separator */}
            {lastPollingResult && pollingStatus === 'idle' && (
              <>
                <span style={{ color: 'var(--border-hover)' }}>•</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  Siklus terakhir:
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}> {lastPollingResult.found} komentar ditemukan</span>
                  {lastPollingResult.autoModerated > 0 && (
                    <>, <span className="text-emerald-400 font-semibold">{lastPollingResult.autoModerated} dimoderasi otomatis</span></>
                  )}
                </span>
              </>
            )}

            {/* Auto-mod config badges */}
            <div className="ml-auto flex items-center gap-1.5">
              {settings.autoTahan && !settings.autoHapus && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Tahan Otomatis ON</span>
              )}
              {settings.autoHapus && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">Sembunyikan Otomatis ON</span>
              )}
              {!settings.autoTahan && !settings.autoHapus && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">Aksi Otomatis: Nonaktif</span>
              )}
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="px-4 border-b flex gap-4 flex-shrink-0" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-card)' }}>
          <button
            onClick={() => setActiveTab('belum')}
            className={`py-3 text-xs font-semibold relative transition-all flex items-center gap-2 ${activeTab === 'belum' ? 'text-indigo-400 font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
          >
            Daftar Tunggu Moderasi
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium transition-all ${activeTab === 'belum'
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'bg-[var(--bg-card-hover)] text-[var(--text-muted)]'
              }`}>
              {comments.length}
            </span>
            {activeTab === 'belum' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full animate-fade-in" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('sudah')}
            className={`py-3 text-xs font-semibold relative transition-all flex items-center gap-2 ${activeTab === 'sudah' ? 'text-indigo-400 font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
          >
            Telah Diperiksa (Riwayat)
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium transition-all ${activeTab === 'sudah'
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'bg-[var(--bg-card-hover)] text-[var(--text-muted)]'
              }`}>
              {moderatedCommentsList.length}
            </span>
            {activeTab === 'sudah' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full animate-fade-in" />
            )}
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-4 py-2 border-b flex items-center gap-2 overflow-x-auto flex-shrink-0" style={{ borderColor: 'var(--border-default)' }}>
          {/* Label filter */}
          {['semua', 'spam', 'normal'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize whitespace-nowrap ${filter === f
                ? 'bg-indigo-600 text-white'
                : 'border border-[var(--border-default)] hover:bg-[var(--bg-card-hover)]'
                }`}
              style={filter !== f ? { color: 'var(--text-secondary)' } : {}}
            >
              {f === 'semua' ? 'Semua' : f === 'spam' ? 'Spam Judol' : f === 'normal' ? 'Normal' : f}
            </button>
          ))}

          {/* Video filter dropdown — hanya tampil jika ada >1 video */}
          {loadedVideos.length > 1 && (
            <div className="ml-auto flex-shrink-0">
              <select
                value={videoFilter}
                onChange={e => setVideoFilter(e.target.value)}
                className="input-dark text-xs animate-fade-in"
              >
                <option value="all">Semua Video ({activeTab === 'belum' ? comments.length : moderatedCommentsList.length})</option>
                {loadedVideos.map(v => {
                  const count = activeTab === 'belum'
                    ? comments.filter(c => c.videoId === v.id).length
                    : moderatedCommentsList.filter(c => c.videoTitle === v.title || c.videoId === v.id).length;
                  const title = v.title.length > 25 ? `${v.title.slice(0, 25)}…` : v.title;
                  return (
                    <option key={v.id} value={v.id}>{title} ({count})</option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'belum' ? (
            // ── TAB 1: BELUM DIMODERASI ──────────────────────────────
            filteredComments.length === 0 ? (
              comments.length === 0 ? (
                <EmptyState
                  icon={
                    <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  }
                  title="Semua Komentar Bersih & Aman!"
                  description="Seluruh komentar baru dari video yang dipilih telah berhasil dimoderasi atau memang tidak ada komentar baru yang masuk."
                />
              ) : (
                <EmptyState
                  icon={
                    <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                  }
                  title="Tidak Ada Komentar Sesuai Filter"
                  description={`Komentar terdeteksi ada, namun tidak memenuhi kriteria filter aktif Anda (${filter !== 'semua' ? `kategori ${filter}` : ''} ${videoFilter !== 'all' ? 'video tertentu' : ''}). Coba ubah opsi filter di atas.`}
                />
              )
            ) : (
              <>
                {/* Desktop Table - Tab 1 */}
                <div className="hidden md:block animate-fade-in">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-card)' }}>
                      <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                        <th className="px-4 py-3 w-10 text-left">
                          <input
                            type="checkbox"
                            checked={filteredComments.length > 0 && filteredComments.every(c => selectedComments.has(c.id))}
                            onChange={() => toggleSelectAllComments(filteredComments)}
                            className="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer flex-shrink-0"
                          />
                        </th>
                        {['Pengguna', 'Komentar', ...(loadedVideos.length > 1 ? ['Video'] : []), 'AI Analisis', 'Status', 'Aksi'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredComments.map(comment => {
                        const prediction = predictions[comment.id];
                        const isSpam = prediction?.label?.toLowerCase() === 'spam';
                        const isProcessing = processingComment === comment.id;
                        const commentStatus = comment.status || comment.moderationStatus || 'published';
                        return (
                          <tr key={comment.id} className="transition-colors group hover:bg-[var(--bg-card-hover)] border-b" style={{ borderColor: 'var(--border-default)' }}>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedComments.has(comment.id)}
                                onChange={() => toggleSelectComment(comment.id)}
                                className="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer flex-shrink-0"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <UserAvatar name={comment.authorDisplayName} src={comment.authorProfileImageUrl} className="w-7 h-7 animate-fade-in" />
                                <div>
                                  <p className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{comment.authorDisplayName}</p>
                                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(comment.publishedAt).toLocaleDateString('id-ID')}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 max-w-[200px] xl:max-w-xs">
                              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: comment.textDisplay }} />
                            </td>
                            {loadedVideos.length > 1 && (
                              <td className="px-4 py-3 max-w-[120px]">
                                <p className="text-[10px] line-clamp-2 leading-tight" style={{ color: 'var(--text-muted)' }}>{comment.videoTitle}</p>
                              </td>
                            )}
                            <td className="px-4 py-3">
                              {!prediction ? (
                                <div className="flex items-center gap-1">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-400" />
                                  <span className="text-[10px] text-muted">...</span>
                                </div>
                              ) : (
                                <div>
                                  <StatusBadge type="ai_label" value={prediction.label} />
                                  {!isSpam && prediction.sentiment && (
                                    <StatusBadge type="sentiment" value={prediction.sentiment} className="ml-1" />
                                  )}
                                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                    {Math.round(prediction.confidence * 100)}%
                                    {prediction.sentiment_score && !isSpam ? ` • Sentimen: ${Math.round(prediction.sentiment_score * 100)}%` : ''}
                                  </p>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge type="status" value={commentStatus} label={commentStatus === 'published' ? 'Diterbitkan' : commentStatus === 'heldForReview' ? 'Ditahan (Perlu Ditinjau)' : 'Telah Dihapus'} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-0.5 opacity-30 group-hover:opacity-100 transition-opacity">
                                {commentStatus !== 'published' && (
                                  <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'publish')} title="Terbitkan"
                                    className="p-1.5 rounded-md hover:bg-emerald-500/10 disabled:opacity-30" style={{ color: 'var(--color-success-text)' }}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                )}
                                {commentStatus !== 'heldForReview' && (
                                  <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'hold')} title="Tahan untuk Ditinjau"
                                    className="p-1.5 rounded-md hover:bg-amber-500/10 text-amber-500 disabled:opacity-30">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                )}
                                {commentStatus !== 'rejected' && (
                                 <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'reject')} title="Sembunyikan dari Publik"
                                    className="p-1.5 rounded-md hover:bg-rose-500/10 disabled:opacity-30" style={{ color: 'var(--color-danger-text)' }}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards - Tab 1 */}
                <div className="md:hidden p-3 space-y-3 animate-fade-in">
                  {filteredComments.map(comment => {
                    const prediction = predictions[comment.id];
                    const isSpam = prediction?.label?.toLowerCase() === 'spam';
                    const isProcessing = processingComment === comment.id;
                    const commentStatus = comment.status || comment.moderationStatus || 'published';
                    return (
                      <div key={comment.id} className="rounded-xl border p-3.5 space-y-2.5" style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-default)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedComments.has(comment.id)}
                              onChange={() => toggleSelectComment(comment.id)}
                              className="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer flex-shrink-0 mr-1"
                            />
                            <UserAvatar name={comment.authorDisplayName} src={comment.authorProfileImageUrl} className="w-7 h-7" />
                            <div>
                              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{comment.authorDisplayName}</p>
                              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(comment.publishedAt).toLocaleDateString('id-ID')}</p>
                            </div>
                          </div>
                          <StatusBadge type="status" value={commentStatus} label={commentStatus === 'published' ? 'Diterbitkan' : commentStatus === 'heldForReview' ? 'Ditahan (Perlu Ditinjau)' : 'Telah Dihapus'} />
                        </div>

                        {loadedVideos.length > 1 && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                            </svg>
                            <p className="text-[10px] text-secondary line-clamp-1">{comment.videoTitle}</p>
                          </div>
                        )}

                        <p className="text-xs line-clamp-3" style={{ color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: comment.textDisplay }} />

                        <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border-default)' }}>
                          <div>
                            {!prediction ? (
                              <div className="flex items-center gap-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-400" />
                                <span className="text-[10px] text-muted">Menganalisis...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <StatusBadge type="ai_label" value={prediction.label} />
                                  <span className="text-[10px] text-muted">{Math.round(prediction.confidence * 100)}%</span>
                                </div>
                                {!isSpam && prediction.sentiment && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <StatusBadge type="sentiment" value={prediction.sentiment} />
                                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{Math.round(prediction.sentiment_score * 100)}%</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {commentStatus !== 'published' && (
                              <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'publish')} className="p-2 rounded-lg hover:bg-emerald-500/10 disabled:opacity-30 active:scale-95 transition-all" style={{ color: 'var(--color-success-text)' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                            )}
                            {commentStatus !== 'heldForReview' && (
                              <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'hold')} className="p-2 rounded-lg text-amber-500 hover:bg-amber-500/10 disabled:opacity-30 active:scale-95 transition-all">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                            )}
                            {commentStatus !== 'rejected' && (
                              <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'reject')} className="p-2 rounded-lg hover:bg-rose-500/10 disabled:opacity-30 active:scale-95 transition-all" style={{ color: 'var(--color-danger-text)' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Muat Komentar Lainnya (Load More) Button */}
                {canLoadMore && (
                  <div className="flex justify-center py-6 border-t" style={{ borderColor: 'var(--border-default)' }}>
                    <button
                      onClick={() => handleLoadSelected(false, true)}
                      disabled={loadingMore}
                      className="px-6 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/30 text-xs font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-400 flex-shrink-0" />
                          Memuat Komentar...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                          Muat Komentar Lainnya
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )
          ) : (
            // ── TAB 2: SUDAH DIMODERASI (RIWAYAT) ─────────────────────
            filteredModeratedComments.length === 0 ? (
              moderatedCommentsList.length === 0 ? (
                <EmptyState
                  icon={
                    <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  }
                  title="Belum Ada Riwayat Tindakan"
                  description="Anda belum melakukan tindakan penyaringan apa pun pada video yang dipilih dalam sesi ini maupun riwayat sebelumnya."
                />
              ) : (
                <EmptyState
                  icon={
                    <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                  }
                  title="Tidak Ada Riwayat Sesuai Filter"
                  description="Riwayat penyaringan ditemukan, namun tidak memenuhi kriteria filter aktif Anda. Coba ubah opsi filter di atas."
                />
              )
            ) : (
              <>
                {/* Desktop Table - Tab 2 */}
                <div className="hidden md:block animate-fade-in">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-card)' }}>
                      <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                        {['Pengguna', 'Komentar', ...(loadedVideos.length > 1 ? ['Video'] : []), 'AI Analisis', 'Tindakan', 'Aksi / Ubah'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredModeratedComments.map(comment => {
                        const isProcessing = processingComment === comment.id;
                        return (
                          <tr key={comment.id} className="transition-colors group hover:bg-[var(--bg-card-hover)] border-b" style={{ borderColor: 'var(--border-default)' }}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <UserAvatar name={comment.authorDisplayName} src={comment.authorProfileImageUrl} className="w-7 h-7 animate-fade-in" />
                                <div>
                                  <p className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{comment.authorDisplayName}</p>
                                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(comment.createdAt || comment.publishedAt).toLocaleDateString('id-ID')}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 max-w-[200px] xl:max-w-xs">
                              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: comment.textDisplay }} />
                            </td>
                            {loadedVideos.length > 1 && (
                              <td className="px-4 py-3 max-w-[120px]">
                                <p className="text-[10px] line-clamp-2 leading-tight" style={{ color: 'var(--text-muted)' }}>{comment.videoTitle}</p>
                              </td>
                            )}
                            <td className="px-4 py-3">
                              {comment.aiLabel ? (
                                <div>
                                  <StatusBadge type="ai_label" value={comment.aiLabel} />
                                  {comment.sentiment && (
                                    <StatusBadge type="sentiment" value={comment.sentiment} className="ml-1" />
                                  )}
                                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                    {Math.round(comment.aiConfidence * 100)}%
                                    {comment.sentimentScore ? ` • Sentimen: ${Math.round(comment.sentimentScore * 100)}%` : ''}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <StatusBadge type="status" value={comment.status} label={comment.status === 'published' ? 'Diterbitkan' : comment.status === 'heldForReview' ? 'Ditahan (Perlu Ditinjau)' : 'Telah Dihapus'} />
                                {isProcessing && (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-500" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Tombol Rollback / Undo */}
                                <button
                                  disabled={isProcessing}
                                  onClick={() => handleUndoAction(comment.id)}
                                  title="Batal Tindakan (Kembalikan ke antrean)"
                                  className="p-1.5 rounded-md text-amber-500 hover:bg-amber-500/10 hover:text-amber-600 disabled:opacity-30 flex items-center justify-center transition-all mr-2 hover:scale-105 active:scale-95"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                  </svg>
                                </button>

                                {/* Ubah Status Cepat */}
                                <div className="flex items-center gap-1 border-l pl-2.5" style={{ borderColor: 'var(--border-default)' }}>
                                  {/* Publish */}
                                  {comment.status !== 'published' && (
                                    <button
                                      disabled={isProcessing}
                                      onClick={() => handleChangeAction(comment.id, 'publish')}
                                      title="Ubah ke Diterbitkan"
                                      className="p-1.5 rounded-md hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 disabled:opacity-30 transition-all active:scale-95 hover:scale-105"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </button>
                                  )}

                                  {/* Hold */}
                                  {comment.status !== 'heldForReview' && (
                                    <button
                                      disabled={isProcessing}
                                      onClick={() => handleChangeAction(comment.id, 'hold')}
                                      title="Ubah ke Ditahan (Folder Tinjauan)"
                                      className="p-1.5 rounded-md hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 disabled:opacity-30 transition-all active:scale-95 hover:scale-105"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </button>
                                  )}

                                  {/* Reject */}
                                  {comment.status !== 'rejected' && (
                                    <button
                                      disabled={isProcessing}
                                      onClick={() => handleChangeAction(comment.id, 'reject')}
                                      title="Ubah ke Dihapus"
                                      className="p-1.5 rounded-md hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 disabled:opacity-30 transition-all active:scale-95 hover:scale-105"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards - Tab 2 */}
                <div className="md:hidden p-3 space-y-3 animate-fade-in">
                  {filteredModeratedComments.map(comment => {
                    const isProcessing = processingComment === comment.id;
                    return (
                      <div key={comment.id} className="rounded-xl border p-3.5 space-y-2.5" style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-default)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UserAvatar name={comment.authorDisplayName} src={comment.authorProfileImageUrl} className="w-7 h-7 animate-fade-in" />
                            <div>
                              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{comment.authorDisplayName}</p>
                              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(comment.createdAt || comment.publishedAt).toLocaleDateString('id-ID')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <StatusBadge type="status" value={comment.status} label={comment.status === 'published' ? 'Diterbitkan' : comment.status === 'heldForReview' ? 'Ditahan (Perlu Ditinjau)' : 'Telah Dihapus'} />
                            {isProcessing && (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-500" />
                            )}
                          </div>
                        </div>

                        {loadedVideos.length > 1 && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                            </svg>
                            <p className="text-[10px] text-secondary line-clamp-1">{comment.videoTitle}</p>
                          </div>
                        )}

                        <p className="text-xs line-clamp-3" style={{ color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: comment.textDisplay }} />

                        <div className="flex items-center justify-between pt-2 border-t animate-fade-in" style={{ borderColor: 'var(--border-default)' }}>
                          <div>
                            {comment.aiLabel ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <StatusBadge type="ai_label" value={comment.aiLabel} />
                                  <span className="text-[10px] text-muted">{Math.round(comment.aiConfidence * 100)}%</span>
                                </div>
                                {comment.sentiment && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <StatusBadge type="sentiment" value={comment.sentiment} />
                                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{Math.round(comment.sentimentScore * 100)}%</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>-</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/* Mobile Rollback Button */}
                            <button
                              disabled={isProcessing}
                              onClick={() => handleUndoAction(comment.id)}
                              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 hover:text-amber-600 disabled:opacity-30 flex items-center justify-center transition-all mr-1 hover:scale-105 active:scale-95"
                              title="Batal Tindakan"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                              </svg>
                            </button>

                            {/* Mobile Change Action Button Row */}
                            <div className="flex items-center gap-0.5 border-l pl-2" style={{ borderColor: 'var(--border-default)' }}>
                              {comment.status !== 'published' && (
                                <button
                                  disabled={isProcessing}
                                  onClick={() => handleChangeAction(comment.id, 'publish')}
                                  className="p-1.5 rounded-md transition-all active:scale-90 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-30"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                              )}
                              {comment.status !== 'heldForReview' && (
                                <button
                                  disabled={isProcessing}
                                  onClick={() => handleChangeAction(comment.id, 'hold')}
                                  className="p-1.5 rounded-md transition-all active:scale-90 text-amber-500 hover:bg-amber-500/10 disabled:opacity-30"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                              )}
                              {comment.status !== 'rejected' && (
                                <button
                                  disabled={isProcessing}
                                  onClick={() => handleChangeAction(comment.id, 'reject')}
                                  className="p-1.5 rounded-md transition-all active:scale-90 text-rose-500 hover:bg-rose-500/10 disabled:opacity-30"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )
          )}
        </div>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────
  return (
    <div className="animate-fade-in-up h-[calc(100vh-3.5rem)] w-full flex flex-col">
      {/* Page title bar */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b flex-shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
        <div>
          <h1 className="text-base lg:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Moderasi Komentar</h1>
          <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-x-2 gap-y-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1 text-indigo-400 font-semibold flex-shrink-0">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              Panduan Cepat:
            </span>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span>(1) Centang video di daftar kiri</span>
              <span className="opacity-40 font-normal">•</span>
              <span>(2) Klik tombol <strong className="text-indigo-400 font-semibold">&quot;Muat Komentar&quot;</strong> di bawah daftar</span>
              <span className="opacity-40 font-normal">•</span>
              <span>(3) Moderasi komentar yang terdeteksi judi</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowVideoPanel(true)}
          className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-sm"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
          </svg>
          <span>{selectedVideoIds.size > 0 ? `${selectedVideoIds.size} Video` : 'Pilih Video'}</span>
        </button>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: Left video panel (checklist) */}
        <div className="hidden lg:flex lg:flex-col w-64 xl:w-72 border-r flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-default)' }}>
          {VideoPanelContent()}
        </div>

        {/* Right: comment area */}
        <div className="flex-1 overflow-hidden flex flex-col" style={{ background: 'var(--bg-card)' }}>
          {CommentArea()}
        </div>
      </div>

      {/* Mobile: Video drawer overlay */}
      {showVideoPanel && (
        <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setShowVideoPanel(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-50 w-[300px] max-w-[85vw] h-full shadow-2xl flex flex-col"
            style={{ background: 'var(--bg-card)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Pilih Video</p>
              <button
                onClick={() => setShowVideoPanel(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-card-hover)]"
              >
                <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {VideoPanelContent()}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar untuk Aksi Massal */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ease-out transform flex items-center px-5 py-3 rounded-full border shadow-[0_10px_35px_rgba(0,0,0,0.3)] max-w-2xl w-[calc(100vw-2rem)] md:w-auto ${selectedComments.size > 0 && activeTab === 'belum'
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-24 opacity-0 scale-95 pointer-events-none'
          }`}
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'var(--border-default)',
        }}
      >
        {isFeatureDisabled('bulk_moderation') ? (
          <div className="flex flex-row items-center justify-between gap-4 w-full text-xs">
            <div className="flex items-center gap-2 text-amber-500">
              <svg className="w-4 h-4 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="font-semibold text-secondary">
                Fitur Bulk Moderasi terkunci untuk paket Anda.
              </span>
            </div>
            <a
              href="/pricing"
              className="px-4 py-2 rounded-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all shadow-md shadow-indigo-900/10 cursor-pointer select-none"
            >
              Upgrade
            </a>
            <button
              onClick={() => setSelectedComments(new Set())}
              className="p-1.5 rounded-full hover:bg-card-hover text-muted hover:text-primary transition-all cursor-pointer text-xs"
            >
              Batal
            </button>
          </div>
        ) : (
          <div className="flex flex-row items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className="h-5 px-2 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[11px] shadow-sm shadow-indigo-500/20">
                {selectedComments.size}
              </span>
              <span className="text-[11px] md:text-xs font-semibold tracking-wide uppercase opacity-90 hidden sm:inline" style={{ color: 'var(--text-primary)' }}>
                Komentar Terpilih
              </span>
            </div>

            <div className="hidden sm:block h-5 w-px" style={{ background: 'var(--border-default)' }} />

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleExecuteBatch('publish')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all hover:-translate-y-0.5 shadow-md shadow-emerald-900/10"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Terbitkan</span>
              </button>

              <button
                onClick={() => handleExecuteBatch('hold')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 transition-all hover:-translate-y-0.5 shadow-md shadow-amber-900/10"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Tahan</span>
              </button>

              <button
                onClick={() => handleExecuteBatch('reject')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all hover:-translate-y-0.5 shadow-md shadow-rose-900/10"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Sembunyikan</span>
              </button>

              <div className="h-5 w-px mx-0.5" style={{ background: 'var(--border-default)' }} />

              <button
                onClick={() => setSelectedComments(new Set())}
                className="p-1.5 rounded-full hover:bg-[var(--bg-card-hover)] active:scale-90 transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                title="Batal Pilihan"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
