'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl mb-4 animate-bounce flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.12C19.544 3.5 12 3.5 12 3.5s-7.544 0-9.386.566A2.994 2.994 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a2.994 2.994 0 0 0 2.112 2.12C4.456 20.5 12 20.5 12 20.5s7.544 0 9.386-.566a2.994 2.994 0 0 0 2.112-2.12C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <p className="text-gray-400 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  const steps = [
    // Step 1: Welcome
    {
      content: (
        <div className="animate-fade-in-up">
          {/* Icon */}
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-200">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.12C19.544 3.5 12 3.5 12 3.5s-7.544 0-9.386.566A2.994 2.994 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a2.994 2.994 0 0 0 2.112 2.12C4.456 20.5 12 20.5 12 20.5s7.544 0 9.386-.566a2.994 2.994 0 0 0 2.112-2.12C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-2">Selamat Datang di Moderasi YouTube</h1>
          <p className="text-sm text-gray-400 mb-8">Kelola komentar kanal YouTube Anda dengan lebih efisien dan aman</p>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="border border-gray-200 rounded-xl p-4 text-center hover:border-blue-200 hover:bg-blue-50/30 transition-all">
              <svg className="w-6 h-6 text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <p className="text-xs font-semibold text-gray-700">Moderasi Otomatis</p>
              <p className="text-[10px] text-gray-400 mt-1">Tinjau dan kelola komentar dengan cepat</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 text-center hover:border-blue-200 hover:bg-blue-50/30 transition-all">
              <svg className="w-6 h-6 text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <p className="text-xs font-semibold text-gray-700">Keputusan Cepat</p>
              <p className="text-[10px] text-gray-400 mt-1">Tahan, tolak, atau terbitkan dalam sekali klik</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 text-center hover:border-blue-200 hover:bg-blue-50/30 transition-all">
              <svg className="w-6 h-6 text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-semibold text-gray-700">Riwayat Lengkap</p>
              <p className="text-[10px] text-gray-400 mt-1">Lacak semua tindakan moderasi Anda</p>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 mb-6">
            <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p className="text-[11px] text-gray-500">Anda akan diminta untuk memberikan izin moderasi komentar. Data Anda aman dan tidak dibagikan.</p>
          </div>

          {/* Login button */}
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-6 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            Masuk dengan Google
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      ),
    },
    // Step 2: Channel selection (shown after login)
    {
      content: (
        <div className="animate-fade-in-up">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pilih Kanal YouTube</h2>
          <p className="text-sm text-gray-400 mb-6">Pilih kanal yang ingin Anda moderasi</p>
          <p className="text-xs text-gray-400">Silakan login terlebih dahulu untuk melihat kanal Anda.</p>
        </div>
      ),
    },
    // Step 3: Permission
    {
      content: (
        <div className="animate-fade-in-up">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-purple-200">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Berikan Izin Moderasi</h2>
          <p className="text-sm text-gray-400 mb-6">Izin diperlukan untuk membaca dan mengelola komentar kanal Anda</p>

          <div className="border border-gray-200 rounded-xl p-4 mb-4 text-left">
            <p className="text-xs font-semibold text-gray-700 mb-3">Izin yang dibutuhkan:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-green-700">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Membaca komentar dari video Anda
              </li>
              <li className="flex items-center gap-2 text-xs text-green-700">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Menahan atau menolak komentar
              </li>
              <li className="flex items-center gap-2 text-xs text-green-700">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Menerbitkan komentar yang ditahan
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-[11px] text-gray-500">Izin moderasi diperlukan untuk memproses komentar. Anda dapat mencabut izin kapan saja.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCurrentStep(0)}
              className="py-3 px-6 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
            >
              Kembali
            </button>
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="py-3 px-6 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              Berikan Izin
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          {steps[currentStep].content}
        </div>

        {/* Step indicator dots */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-6 bg-blue-600'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
