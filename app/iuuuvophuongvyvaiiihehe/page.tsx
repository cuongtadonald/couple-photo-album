'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AlbumList from '@/components/AlbumList';
import LetterList from '@/components/LetterList';
import EventList from '@/components/EventList';
import VoicePermission from '@/components/VoicePermission';
import Image from 'next/image';

type Tab = 'albums' | 'letters' | 'events';

const RELATIONSHIP_START = new Date('2025-11-02T00:00:00');

function useDurationCounter(startDate: Date) {
  const [duration, setDuration] = useState({ years: 0, months: 0, days: 0, totalDays: 0 });

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();
      const totalDays = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
      let years = now.getFullYear() - startDate.getFullYear();
      let months = now.getMonth() - startDate.getMonth();
      let days = now.getDate() - startDate.getDate();
      if (days < 0) { months--; const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0); days += lastMonth.getDate(); }
      if (months < 0) { years--; months += 12; }
      setDuration({ years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days), totalDays });
    };
    calculate();
    const interval = setInterval(calculate, 60000);
    return () => clearInterval(interval);
  }, [startDate]);

  return duration;
}

/* ── Milestone card (shared desktop + mobile menu) ── */
function MilestoneCard({ duration, size = 'desktop' }: { duration: { years: number; months: number; days: number; totalDays: number }; size?: 'desktop' | 'mobile' }) {
  const calSize = size === 'desktop' ? 28 : 24;
  const heartSize = calSize; // same as calendar
  return (
    <div className={`bg-white/70 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-sm ${size === 'desktop' ? 'p-4' : 'p-3'}`}>
      <h3 className={`font-bold text-[#E8548E] text-center mb-3 ${size === 'desktop' ? 'text-sm' : 'text-xs'}`}>
        ❤️ Our special day
      </h3>

      {/* Two rows: calendar | text  then  heart | text – aligned */}
      <div className="flex items-start gap-2">
        {/* Left column: stickers stacked */}
        <div className="flex flex-col items-center gap-1 shrink-0" style={{ width: calSize }}>
          <Image src="/assets-new-design/calendar-sticker.png" alt="calendar" width={calSize} height={calSize} />
          <span className="relative inline-flex" style={{ width: heartSize, height: heartSize }}>
            <Image
              src="/assets-new-design/heart_badge_album_corner.png"
              alt="heart"
              width={heartSize}
              height={heartSize}
              className="absolute inset-0 animate-heartbeat"
              style={{ transformOrigin: 'center center' }}
            />
          </span>
        </div>

        {/* Right column: text rows */}
        <div className="flex-1 space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-gray-500 ${size === 'desktop' ? 'text-xs' : 'text-[10px]'}`}>Ngày quen nhau:</span>
            <span className={`font-bold text-gray-700 ${size === 'desktop' ? 'text-xs' : 'text-[10px]'}`}>02/11/2025</span>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className={`text-gray-500 ${size === 'desktop' ? 'text-xs' : 'text-[10px]'}`}>Đã bên nhau:</span>
            <span className={`font-bold text-pink-500 ${size === 'desktop' ? 'text-base' : 'text-sm'}`}>{duration.totalDays} ngày</span>
            <span className={`text-gray-400 ${size === 'desktop' ? 'text-xs' : 'text-[10px]'}`}>({duration.years} năm, {duration.months} tháng, {duration.days} ngày)</span>
          </div>
        </div>
      </div>

      {/* Bears */}
      <div className="mt-2 flex justify-center">
        <Image
          src="/assets-new-design/bears_couple_365days_alt.png"
          alt="Bears couple"
          width={size === 'desktop' ? 110 : 80}
          height={size === 'desktop' ? 72 : 56}
          className="object-contain"
        />
      </div>

      <p className={`text-gray-400 italic text-center mt-1.5 ${size === 'desktop' ? 'text-[11px]' : 'text-[10px]'}`}>
        The first day of messaging was October 12 &lt;333
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('albums');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const duration = useDurationCounter(RELATIONSHIP_START);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-rose-50">
        <span className="text-6xl animate-heartbeat">💕</span>
        <p className="mt-4 text-rose-500 font-semibold animate-pulse">Đang mở cửa nhà mình...</p>
      </div>
    );
  }
  if (!user) return null;

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'albums', label: 'Ảnh Kỷ Niệm', icon: '📷' },
    { key: 'letters', label: 'Thư Tay', icon: '💌' },
    { key: 'events', label: 'Sự Kiện', icon: '🎉' },
  ];

  return (
    <div className="min-h-screen bg-[#FFF5F7] relative overflow-x-hidden">
      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden lg:flex min-h-screen">
        {/* LEFT SIDEBAR */}
        <aside className="w-[300px] shrink-0 relative">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/assets-new-design/header_notebook_bg.png)' }} />
          {/* Spiral binding */}
          <div className="absolute left-0 top-0 bottom-0 w-[38px] flex flex-col items-center justify-start pt-4 gap-6 z-10">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="w-5 h-5 rounded-full border-[3px] border-[#D4A0A0] bg-[#FFF5F7]" />
            ))}
          </div>

          <div className="relative z-10 pt-8 px-4 pl-12 flex flex-col h-full">
            {/* Couple photo */}
            <div className="relative mx-auto w-[200px]">
              <Image src="/assets-new-design/bow_pink_large.png" alt="bow" width={70} height={40} className="absolute -top-5 left-1/2 -translate-x-1/2 z-10" />
              <div className="bg-white p-2 shadow-md rotate-[-2deg]">
                <div className="w-full aspect-square bg-gradient-to-br from-rose-200 to-pink-100 rounded-sm flex items-center justify-center overflow-hidden">
                  <span className="text-5xl">💕</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mt-4">
              <h1 className="text-[44px] font-bold text-[#E8548E] leading-tight font-[family-name:var(--font-corinthia)]">
                Cuong {'<'}3 Vy's Home
              </h1>
              <p className="text-[24px] text-gray-400 mt-1 italic leading-tight font-[family-name:var(--font-corinthia)]">
                Xin chào, em xãa hãy iuu anh xãa nhìu thêm mỗi ngày nhé &lt;333
              </p>
            </div>

            {/* Navigation tabs */}
            <nav className="mt-6 flex flex-col gap-2 relative" style={{ zIndex: 10 }}>
              {tabs.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all text-left ${activeTab === key
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                    : 'text-gray-500 hover:bg-pink-50 hover:text-rose-500'
                    }`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </nav>

            {/* Our special day card — right below tabs */}
            <div className="mt-4">
              <MilestoneCard duration={duration} size="desktop" />
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 relative">
          {/* Floating decorations */}
          <div className="fixed top-0 right-0 w-full h-full pointer-events-none z-0 overflow-hidden">
            <Image src="/assets-new-design/heart_pink_solid_01.png" alt="" width={30} height={30} className="absolute top-[8%] right-[15%] animate-float opacity-50" />
            <Image src="/assets-new-design/heart_pink_solid_02.png" alt="" width={24} height={24} className="absolute top-[25%] left-[10%] animate-float opacity-40" style={{ animationDelay: '1s' }} />
            <Image src="/assets-new-design/heart_pink_solid_03_small.png" alt="" width={18} height={18} className="absolute top-[60%] right-[8%] animate-float opacity-35" style={{ animationDelay: '2s' }} />
            <Image src="/assets-new-design/flower_pink_small.png" alt="" width={28} height={28} className="absolute top-[15%] left-[25%] animate-float opacity-40" style={{ animationDelay: '0.5s' }} />
            <Image src="/assets-new-design/flower_cherry_tiny_01.png" alt="" width={20} height={20} className="absolute top-[45%] right-[20%] animate-float opacity-30" style={{ animationDelay: '1.5s' }} />
          </div>

          {/* Desktop header banner */}
          <div className="relative z-10 mx-8 mt-6 rounded-2xl overflow-hidden shadow-md" style={{ maxHeight: '650px', height: '650px' }}>
            <Image
              src="/assets-new-design/header-cuongvy.png"
              alt="header"
              width={900}
              height={650}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 30%' }}
            />
            {/* Logout button overlay */}
            <button
              onClick={logout}
              title="Đăng xuất"
              className="absolute top-3 right-3 group grid place-items-center w-11 h-11 rounded-xl bg-white/80 text-pink-400 border border-pink-100 shadow-sm hover:bg-pink-500 hover:text-white hover:border-pink-500 hover:shadow-lg transition-all duration-300 hover:-rotate-12 active:scale-90"
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Content area */}
          <div className="relative z-10 px-8 py-6 pb-12">
            {activeTab === 'albums' && <AlbumList token={token} currentUserId={user.id} />}
            {activeTab === 'letters' && <LetterList token={token} currentUserId={user.id} />}
            {activeTab === 'events' && <EventList token={token} />}
          </div>

          {/* Footer decoration */}
          <div className="relative z-10 flex justify-end px-8 pb-8 pointer-events-none">
            <Image src="/assets-new-design/footer_bear_love_forever.png" alt="Love bear" width={260} height={220} className="object-contain" style={{ zIndex: 10 }} />
          </div>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="lg:hidden">
        {/* Mobile header banner */}
        <div className="relative w-full" style={{ minHeight: '220px' }}>
          <Image src="/assets-new-design/header-cuongvy.png" alt="header" fill className="object-cover" priority />
          {/* Top bar overlay */}
          <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 pt-3 pb-1">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-10 h-10 flex flex-col items-center justify-center gap-1 rounded-xl bg-white/60 backdrop-blur-sm">
              <span className="block w-5 h-0.5 bg-pink-500 rounded" />
              <span className="block w-5 h-0.5 bg-pink-500 rounded" />
              <span className="block w-5 h-0.5 bg-pink-500 rounded" />
            </button>
            <button onClick={logout} title="Đăng xuất" className="group grid place-items-center w-10 h-10 rounded-xl bg-white/80 text-pink-400 border border-pink-200 shadow-sm active:bg-pink-500 active:text-white active:scale-90 transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile tab buttons */}
        <div className="flex justify-center gap-2 px-4 -mt-3 relative z-[9]">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 py-2 px-4 rounded-full text-xs font-semibold transition-all shadow-sm ${activeTab === key
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'bg-white text-pink-500 border border-pink-100'
                }`}
            >
              <span>{icon}</span>
              <span className="hidden min-[360px]:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute left-0 top-0 bottom-0 w-[260px] bg-[#FFF5F7] shadow-xl p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold text-[#E8548E] font-[family-name:var(--font-corinthia)]">Cuong {'<'}3 Vy's Home</h2>
                <p className="text-[10px] text-gray-400 italic mt-1">Xin chào, em xãa hãy iuu anh xãa nhìu thêm mỗi ngày nhé &lt;333</p>
              </div>
              <nav className="flex flex-col gap-2">
                {tabs.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => { setActiveTab(key); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm font-semibold text-left transition-all ${activeTab === key ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'text-gray-500 hover:bg-pink-50'
                      }`}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </nav>
              <div className="mt-5">
                <MilestoneCard duration={duration} size="mobile" />
              </div>
            </div>
          </div>
        )}

        {/* Mobile content */}
        <div className="px-4 py-5 relative z-10">
          {activeTab === 'albums' && <AlbumList token={token} currentUserId={user.id} />}
          {activeTab === 'letters' && <LetterList token={token} currentUserId={user.id} />}
          {activeTab === 'events' && <EventList token={token} />}
        </div>

        {/* Mobile footer bear */}
        <div className="flex justify-center pb-8 pointer-events-none relative">
          <Image src="/assets-new-design/footer_bear_love_forever.png" alt="Love bear" width={200} height={170} className="object-contain opacity-90" />
        </div>
      </div>

      {/* Voice Permission Prompt */}
      <VoicePermission />
    </div>
  );
}
