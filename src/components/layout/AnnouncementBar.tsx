/* ===================================================
   AUTHENTIC GIRLSWEAR - Announcement Bar
   - Sits ABOVE the Navbar
   - Fully editable from Admin Panel (Content Editor)
   - Supports: marquee scroll, fade animation, static
   - Customizable: bg color, text color, messages
   =================================================== */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useContentStore } from '@/store/contentstore';

export const AnnouncementBar: React.FC = () => {
  const { content } = useContentStore();
  const [visible, setVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const announcement = content.announcement;
  const messages = announcement?.messages?.filter(m => m.trim()) || [];

  // Auto-rotate messages in 'fade' mode
  useEffect(() => {
    if (!announcement?.enabled || messages.length <= 1 || announcement.animation !== 'fade') return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages.length, announcement?.enabled, announcement?.animation]);

  if (!announcement?.enabled || messages.length === 0 || !visible) return null;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: announcement.bgColor || '#B76E79',
        color: announcement.textColor || '#FFFFFF',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-9 md:h-10 relative">
          {/* MARQUEE / SCROLL animation */}
          {announcement.animation === 'marquee' && (
            <div className="flex whitespace-nowrap animate-marquee">
              {[...messages, ...messages, ...messages].map((msg, i) => (
                <span
                  key={i}
                  className="mx-8 text-xs md:text-sm font-medium tracking-wide flex items-center gap-2"
                  style={{ fontWeight: announcement.bold ? 600 : 500 }}
                >
                  ✨ {msg}
                </span>
              ))}
            </div>
          )}

          {/* FADE animation (rotates messages) */}
          {announcement.animation === 'fade' && (
            <div className="relative h-full w-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="text-xs md:text-sm tracking-wide text-center px-8"
                  style={{ fontWeight: announcement.bold ? 600 : 500 }}
                >
                  ✨ {messages[currentIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          )}

          {/* STATIC (no animation) */}
          {announcement.animation === 'static' && (
            <p
              className="text-xs md:text-sm tracking-wide text-center px-8"
              style={{ fontWeight: announcement.bold ? 600 : 500 }}
            >
              ✨ {messages.join('  •  ')}
            </p>
          )}

          {/* Close button (optional) */}
          {announcement.dismissible && (
            <button
              onClick={() => setVisible(false)}
              className="absolute right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close announcement"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Inline marquee animation CSS */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};