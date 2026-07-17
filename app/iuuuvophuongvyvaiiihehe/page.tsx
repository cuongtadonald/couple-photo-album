'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AlbumList from '@/components/AlbumList';
import LetterList from '@/components/LetterList';
import EventList from '@/components/EventList';
import { LogOut, Camera, Mail, PartyPopper } from 'lucide-react';

type Tab = 'albums' | 'letters' | 'events';

export default function DashboardPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('albums');

  useEffect(() => {
    // Chỉ chuyển về login khi đã xác thực xong (loading=false) mà vẫn không có user.
    // Tránh việc F5/back bị văng ra login trong lúc còn đang kiểm tra token.
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Màn hình chờ dễ thương trong lúc xác thực phiên đăng nhập
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-rose-50">
        <span className="text-6xl animate-heartbeat">💕</span>
        <p className="mt-4 text-rose-500 font-semibold animate-pulse">Đang mở cửa nhà mình...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tabs: { key: Tab; label: string; icon: typeof Camera }[] = [
    { key: 'albums', label: 'Ảnh Kỷ Niệm', icon: Camera },
    { key: 'letters', label: 'Thư Tay', icon: Mail },
    { key: 'events', label: 'Sự Kiện', icon: PartyPopper },
  ];

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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-5 lg:px-8 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-3xl sm:text-4xl animate-heartbeat shrink-0">💕</span>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent truncate">
                Cuong {'<'}3 Vy{'\''}s Home
              </h1>
              <p className="text-gray-600 mt-1 text-xs sm:text-sm line-clamp-2">
                👋 {user.role === 'em'
                  ? 'Xin chào, em xãa hãy iuu anh xãa nhiều hơn mỗi ngày nhé <3'
                  : 'Xin chào, anh xãa hãy iuu em xãa nhiều hơn mỗi ngày nhé <3'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Đăng xuất"
            aria-label="Đăng xuất"
            className="group shrink-0 grid place-items-center w-11 h-11 rounded-cute bg-white text-rose-500 border-2 border-rose-200 shadow-sm hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-lg transition-all duration-300 hover:-rotate-12 active:scale-90"
          >
            <LogOut size={20} className="transition-transform group-hover:scale-110" />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-md border-b border-rose-100 relative z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <nav className="flex gap-2 sm:gap-4 overflow-x-auto py-2" aria-label="Tabs">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 py-2 px-4 rounded-cute font-semibold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 whitespace-nowrap border-2 ${
                  activeTab === key
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-md'
                    : 'bg-white/70 text-gray-600 border-rose-100 hover:border-rose-300 hover:text-rose-600'
                }`}
              >
                <Icon size={18} />
                <span className="hidden xs:inline sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 py-6 sm:px-4 sm:py-8 lg:px-8 relative z-10">
        <div className="animate-fade-in">
          {activeTab === 'albums' && <AlbumList token={token} />}
          {activeTab === 'letters' && <LetterList token={token} currentUserId={user.id} />}
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
