'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

interface FireworkHeart {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export default function LoginPage() {
  const [passcode, setPasscode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [fireworks, setFireworks] = useState<FireworkHeart[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { user, loading: authLoading, loginWithPasscode } = useAuth();
  const router = useRouter();

  // Nếu đã đăng nhập rồi (vd: bấm back về trang login) thì đưa về trang nhà.
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/iuuuvophuongvyvaiiihehe');
    }
  }, [authLoading, user, router]);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPasscode = [...passcode];
    newPasscode[index] = value.slice(-1);
    setPasscode(newPasscode);

    // Create firework hearts when typing
    if (value && index < 6) {
      const newFireworks: FireworkHeart[] = [];
      for (let i = 0; i < 3; i++) {
        newFireworks.push({
          id: Date.now() + i,
          x: (index * 52) + 26 + (Math.random() - 0.5) * 40,
          y: -20 - Math.random() * 30,
          rotation: (Math.random() - 0.5) * 60,
          scale: 0.5 + Math.random() * 0.5,
        });
      }
      setFireworks(prev => [...prev, ...newFireworks]);
      
      // Remove fireworks after animation
      setTimeout(() => {
        setFireworks(prev => prev.filter(f => !newFireworks.includes(f)));
      }, 1000);

      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !passcode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fullPasscode = passcode.join('');

    if (fullPasscode.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 số');
      setLoading(false);
      return;
    }

    try {
      await loginWithPasscode(fullPasscode);
      router.push('/iuuuvophuongvyvaiiihehe');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mã gán không đúng');
      setShake(true);
      setPasscode(['', '', '', '', '', '']);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: 'url(/backgroundlogin-phone.png)',
      }}
    >
      {/* Desktop background - hidden on mobile */}
      <div 
        className="hidden md:block absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/backgroundlogin-win.png)',
          zIndex: 0,
        }}
      />

      {/* Fallback gradient if images don't load */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-rose-50 opacity-90" style={{ zIndex: -1 }} />

      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse hidden sm:block" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse hidden sm:block" />
      <div className="absolute top-1/2 left-1/2 w-36 h-36 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-700 hidden sm:block" />

      <div className="relative z-10 w-full max-w-sm px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <div className="inline-block mb-4 sm:mb-6">
            <div className="text-5xl sm:text-6xl animate-bounce">💕</div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 bg-clip-text text-transparent mb-2">
            Cuong {'<'}3 Vy{'\''}s Home
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">Nhập mã riêng của bạn để tiếp tục</p>
        </div>

        {/* Passcode Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className={`flex gap-3 justify-center transition-transform duration-300 ${shake ? 'animate-shake' : ''}`}>
              {passcode.map((digit, index) => (
                <div key={index} className="relative w-12 h-12 sm:w-14 sm:h-14">
                  <input
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading}
                    className={`absolute inset-0 w-full h-full text-center text-2xl font-bold rounded-xl border-2 transition-all duration-300 focus:outline-none cursor-pointer bg-transparent z-10
                      ${digit ? 'border-rose-400 shadow-md' : 'border-gray-300'}
                      focus:border-rose-500 focus:ring-2 focus:ring-rose-200
                      ${error && shake ? 'border-red-500 bg-red-50' : ''}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  />
                  {digit && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <img
                        src="/assets-new-design/heart_badge_album_corner.png"
                        alt="*"
                        className="w-8 h-8 sm:w-10 sm:h-10 animate-heartbeat-fast"
                      />
                    </div>
                  )}
                  {!digit && (
                    <div className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 pointer-events-none
                      ${passcode.filter(Boolean).length > index ? 'border-rose-400 shadow-md' : 'border-gray-300'}
                      ${error && shake ? 'border-red-500 bg-red-50' : ''}
                    `} />
                  )}
                </div>
              ))}
            </div>
            
            {/* Firework hearts */}
            {fireworks.map(heart => (
              <div
                key={heart.id}
                className="absolute pointer-events-none animate-firework"
                style={{
                  left: `${heart.x}px`,
                  top: `${heart.y}px`,
                  transform: `rotate(${heart.rotation}deg) scale(${heart.scale})`,
                }}
              >
                <Image
                  src="/assets-new-design/heart_pink_solid_01.png"
                  alt=""
                  width={24}
                  height={24}
                  className="opacity-80"
                />
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center animate-fade-in">
              {error}
            </div>
          )}



          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || passcode.filter(Boolean).length !== 6}
            className={`w-full py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform
              ${passcode.filter(Boolean).length === 6 && !loading
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Đang xử lý...</span>
                <span className="sm:hidden">Xử lý...</span>
              </span>
            ) : (
              '💗 Vào'
            )}
          </button>
        </form>

        {/* Footer decoration */}
        <div className="mt-8 sm:mt-12 text-center">
          <div className="flex justify-center gap-2 text-xl sm:text-2xl">
            <span className="animate-bounce delay-100">✨</span>
            <span className="animate-bounce delay-300">💑</span>
            <span className="animate-bounce delay-500">✨</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-8px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(8px);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes firework {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(1.5) rotate(180deg);
          }
        }

        .animate-shake {
          animation: shake 0.5s;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-firework {
          animation: firework 1s ease-out forwards;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }

        .delay-700 {
          animation-delay: 0.7s;
        }
      `}</style>
    </div>
  );
}
