'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import AlbumList from '@/components/AlbumList';
import LetterList from '@/components/LetterList';
import EventList from '@/components/EventList';

type Tab = 'albums' | 'letters' | 'events';

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('albums');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/4 w-36 h-36 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-md border-b border-rose-100 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-heartbeat">💕</span>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                Tình Yêu Của Chúng Ta
              </h1>
              <p className="text-gray-600 mt-1 text-sm">👋 Xin chào, <span className="font-semibold text-rose-600">{user.fullName}</span></p>
            </div>
          </div>
          <Button
            onClick={logout}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            ↪️ Đăng xuất
          </Button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-md border-b border-rose-100 relative z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {(['albums', 'letters', 'events'] as Tab[]).map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab
                    ? 'border-rose-500 text-rose-600 shadow-[0_2px_0_rgba(244,63,94,0.3)]'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-rose-200'
                }`}
              >
                <span className="mr-2">
                  {tab === 'albums' && '📷'}
                  {tab === 'letters' && '💌'}
                  {tab === 'events' && '🎉'}
                </span>
                {tab === 'albums' && 'Ảnh Kỷ Niệm'}
                {tab === 'letters' && 'Thư Tay'}
                {tab === 'events' && 'Sự Kiện'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        <div className="animate-fade-in">
          {activeTab === 'albums' && <AlbumList token={token} />}
          {activeTab === 'letters' && <LetterList token={token} />}
          {activeTab === 'events' && <EventList token={token} />}
        </div>
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
