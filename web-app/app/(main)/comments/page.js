'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useModeration } from '@/contexts/ModerationContext';
import { useYouTube } from '@/contexts/YouTubeContext';

export default function CommentsPage() {
  const router = useRouter();

  const {
    selectedVideoIds, primaryVideo, handleToggleVideo, handleSelectAll, handleDeselectAll,
    comments, commentsLoading, error, predictions, 
    isPolling, togglePolling, handleLoadSelected, 
    processingComment, handleAction,
    fetchProgress, isFetchingMulti
  } = useModeration();

  const { videosCache, selectedChannelId, loadingVideos } = useYouTube();
  const videos = selectedChannelId ? (videosCache[selectedChannelId] || []) : [];
  const videosLoading = loadingVideos && videos.length === 0;

  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [filter, setFilter] = useState('semua');
  const [videoFilter, setVideoFilter] = useState('all');

  const quotaError = null;

  const handleModerate = async (commentId, action) => {
    await handleAction(commentId, action);
  };

  // ── Filter logic ─────────────────────────────────────────────
  const filteredComments = comments.filter(c => {
    // Label filter (jika prediksi belum selesai, tetap tampilkan)
    if (filter !== 'semua') {
      const pred = predictions[c.id];
      if (pred && pred.label?.toLowerCase() !== filter) return false;
    }
    // Video filter
    if (videoFilter !== 'all' && c.videoId !== videoFilter) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    const map = {
      published:     { label: 'Diterbitkan', cls: 'badge badge-success' },
      heldForReview: { label: 'Ditahan',     cls: 'badge badge-warning' },
      rejected:      { label: 'Ditolak',     cls: 'badge badge-danger' },
    };
    const s = map[status] || map.published;
    return <span className={s.cls}>{s.label}</span>;
  };

  // Video unik dari komentar yang sudah dimuat (untuk dropdown filter)
  const loadedVideos = [...new Map(
    comments.map(c => [c.videoId, { id: c.videoId, title: c.videoTitle }])
  ).values()];

  // ── Video Panel: Checklist ───────────────────────────────────
  const VideoPanelContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Daftar Video</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {selectedVideoIds.size > 0
            ? `${selectedVideoIds.size} dari ${videos.length} dipilih`
            : `${videos.length} video tersedia`}
        </p>
      </div>

      {/* Pilih Semua / Batal */}
      {!videosLoading && videos.length > 0 && (
        <div className="flex gap-1.5 px-3 py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={handleSelectAll}
            className="flex-1 text-[11px] text-indigo-500 hover:text-indigo-600 font-medium py-1 px-2 rounded-md hover:bg-indigo-500/10 transition-colors"
          >
            Pilih Semua
          </button>
          <button
            onClick={handleDeselectAll}
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
            <button
              onClick={() => router.push('/channel')}
              className="text-xs text-indigo-400 hover:underline mt-2 block mx-auto"
            >
              Ganti Kanal →
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {videos.map(video => {
              const videoId = video.id.videoId;
              const isChecked = selectedVideoIds.has(videoId);
              return (
                <label
                  key={videoId}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all select-none border ${
                    isChecked
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
                    <img
                      src={video.snippet.thumbnails.default.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-medium line-clamp-2 leading-tight ${
                      isChecked ? 'text-indigo-400' : ''
                    }`}
                    style={!isChecked ? { color: 'var(--text-secondary)' } : {}}
                    >
                      {video.snippet.title}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(video.snippet.publishedAt).toLocaleDateString('id-ID')}
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
          className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all active:scale-95 disabled:cursor-not-allowed flex items-center justify-center gap-2 disabled:opacity-50"
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

        <button
          onClick={() => router.push('/channel')}
          className="w-full text-xs py-1.5 transition-colors text-indigo-400 hover:text-indigo-300"
        >
          ← Ganti Kanal
        </button>
      </div>
    </div>
  );

  // ── Comment Area ─────────────────────────────────────────────
  const CommentArea = () => {
    // 1. Belum ada video dipilih
    if (selectedVideoIds.size === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--bg-card-hover)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--border-hover)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Belum ada video dipilih</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Centang satu atau beberapa video di panel kiri,<br />lalu klik &quot;Muat Komentar&quot;</p>
          <button
            onClick={() => setShowVideoPanel(true)}
            className="mt-4 lg:hidden px-4 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-all"
          >
            Pilih Video
          </button>
        </div>
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
    if (comments.length === 0) {
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
          <button
            onClick={() => handleLoadSelected(false)}
            disabled={isFetchingMulti}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Muat {selectedVideoIds.size} Video
          </button>
        </div>
      );
    }

    // 6. Tampilkan komentar
    return (
      <div className="flex flex-col h-full">
        {/* Header bar */}
        <div className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-shrink-0" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex-1 min-w-0">
            {selectedVideoIds.size === 1 ? (
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>{primaryVideo?.title}</p>
            ) : (
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{selectedVideoIds.size} video dimuat</p>
            )}
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {filteredComments.length} komentar ditampilkan
              {comments.length !== filteredComments.length && ` • ${comments.length} total`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={togglePolling}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isPolling
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'border-[var(--border-default)] hover:bg-[var(--bg-card-hover)]'
                }`}
                style={!isPolling ? { color: 'var(--text-secondary)' } : {}}
            >
              <svg
                className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin text-emerald-400' : ''}`}
                style={!isPolling ? { color: 'var(--text-muted)' } : {}}
                fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              <span className="hidden sm:inline">{isPolling ? 'Polling On' : 'Polling'}</span>
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

        {/* Filter bar */}
        <div className="px-4 py-2 border-b flex items-center gap-2 overflow-x-auto flex-shrink-0" style={{ borderColor: 'var(--border-default)' }}>
          {/* Label filter */}
          {['semua', 'spam', 'normal'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize whitespace-nowrap ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'border border-[var(--border-default)] hover:bg-[var(--bg-card-hover)]'
              }`}
              style={filter !== f ? { color: 'var(--text-secondary)' } : {}}
            >
              {f === 'semua' ? 'Semua' : f}
            </button>
          ))}

          {/* Video filter dropdown — hanya tampil jika ada >1 video */}
          {loadedVideos.length > 1 && (
            <div className="ml-auto flex-shrink-0">
              <select
                value={videoFilter}
                onChange={e => setVideoFilter(e.target.value)}
                className="input-dark text-xs"
              >
                <option value="all">Semua Video ({comments.length})</option>
                {loadedVideos.map(v => {
                  const count = comments.filter(c => c.videoId === v.id).length;
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
          {filteredComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="w-10 h-10 text-muted mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <p className="text-sm text-secondary">Tidak ada komentar ditemukan</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead
                    className="sticky top-0 z-10"
                    style={{ background: 'var(--bg-card)' }}
                  >
                    <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                      {['Pengguna','Komentar', ...(loadedVideos.length > 1 ? ['Video'] : []), 'AI','Status','Aksi'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredComments.map(comment => {
                      const prediction = predictions[comment.id];
                      const isSpam = prediction?.label?.toLowerCase() === 'spam';
                      const isProcessing = processingComment === comment.id;
                      return (
                        <tr key={comment.id} className="transition-colors group hover:bg-[var(--bg-card-hover)] border-b" style={{ borderColor: 'var(--border-default)' }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <img className="w-7 h-7 rounded-full flex-shrink-0" src={comment.authorProfileImageUrl} alt="" />
                              <div>
                                <p className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{comment.authorDisplayName}</p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(comment.publishedAt).toLocaleDateString('id-ID')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-[200px] xl:max-w-xs">
                            <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: comment.textDisplay }} />
                          </td>
                          {/* Kolom Video — hanya tampil jika multi-video */}
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
                                <span className={`badge ${isSpam ? 'badge-danger' : 'badge-success'}`}>
                                  {isSpam ? '🚨 Spam' : '✅ Normal'}
                                </span>
                                {!isSpam && prediction.sentiment && (
                                  <span className={`ml-1 badge ${
                                    prediction.sentiment === 'positive' ? 'badge-success'
                                    : prediction.sentiment === 'negative' ? 'badge-danger'
                                    : 'badge-muted'
                                  }`}>
                                    {prediction.sentiment === 'positive' ? '😊 Positif' : prediction.sentiment === 'negative' ? '😠 Negatif' : '😐 Netral'}
                                  </span>
                                )}
                                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                                  {Math.round(prediction.confidence * 100)}%
                                  {prediction.sentiment_score && !isSpam ? ` • Sentimen: ${Math.round(prediction.sentiment_score * 100)}%` : ''}
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(comment.status)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-0.5 opacity-30 group-hover:opacity-100 transition-opacity">
                              <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'publish')} title="Terbitkan"
                                className="p-1.5 rounded-md hover:bg-emerald-500/10 disabled:opacity-30" style={{ color: 'var(--color-success-text)' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'hold')} title="Tahan"
                                className="p-1.5 rounded-md hover:bg-amber-500/10 text-amber-500 disabled:opacity-30">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'reject')} title="Tolak"
                                className="p-1.5 rounded-md hover:bg-rose-500/10 disabled:opacity-30" style={{ color: 'var(--color-danger-text)' }}>
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

              {/* Mobile Cards */}
              <div className="md:hidden p-3 space-y-3">
                {filteredComments.map(comment => {
                  const prediction = predictions[comment.id];
                  const isSpam = prediction?.label?.toLowerCase() === 'spam';
                  const isProcessing = processingComment === comment.id;
                  return (
                    <div key={comment.id} className="rounded-xl border p-3.5 space-y-2.5" style={{ background: 'var(--bg-card-hover)', borderColor: 'var(--border-default)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img className="w-7 h-7 rounded-full flex-shrink-0" src={comment.authorProfileImageUrl} alt="" />
                          <div>
                            <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{comment.authorDisplayName}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(comment.publishedAt).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                        {getStatusBadge(comment.status)}
                      </div>

                      {/* Video badge — hanya tampil jika multi-video */}
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
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isSpam ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                  {isSpam ? '🚨 Spam' : '✅ Normal'}
                                </span>
                                <span className="text-[10px] text-muted">{Math.round(prediction.confidence * 100)}%</span>
                              </div>
                              {!isSpam && prediction.sentiment && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`badge ${
                                    prediction.sentiment === 'positive' ? 'badge-success'
                                    : prediction.sentiment === 'negative' ? 'badge-danger'
                                    : 'badge-muted'
                                  }`}>
                                    {prediction.sentiment === 'positive' ? '😊 Positif' : prediction.sentiment === 'negative' ? '😠 Negatif' : '😐 Netral'}
                                  </span>
                                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{Math.round(prediction.sentiment_score * 100)}%</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'publish')} className="p-2 rounded-lg hover:bg-emerald-500/10 disabled:opacity-30 active:scale-95 transition-all" style={{ color: 'var(--color-success-text)' }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                          <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'hold')} className="p-2 rounded-lg text-amber-500 hover:bg-amber-500/10 disabled:opacity-30 active:scale-95 transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                          <button disabled={isProcessing} onClick={() => handleModerate(comment.id, 'reject')} className="p-2 rounded-lg hover:bg-rose-500/10 disabled:opacity-30 active:scale-95 transition-all" style={{ color: 'var(--color-danger-text)' }}>
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
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b flex-shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
        <div>
          <h1 className="text-base lg:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Antrian Moderasi</h1>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Pilih beberapa video lalu muat komentarnya sekaligus</p>
        </div>
        <button
          onClick={() => setShowVideoPanel(true)}
          className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all bento-card"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          {selectedVideoIds.size > 0 ? `${selectedVideoIds.size} dipilih` : 'Pilih Video'}
        </button>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: Left video panel (checklist) */}
        <div className="hidden lg:flex lg:flex-col w-64 xl:w-72 border-r flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-default)' }}>
          <VideoPanelContent />
        </div>

        {/* Right: comment area */}
        <div className="flex-1 overflow-hidden flex flex-col" style={{ background: 'var(--bg-card)' }}>
          <CommentArea />
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
              <VideoPanelContent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
