'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { ShimmerButton } from '@/components/ui/shimmer-button-simple';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

type StatEntry = {
  id: string;
  headline: string;
  detail: string;
  accent?: string;
};

const statEntries: StatEntry[] = [
  {
    id: 'students',
    headline: '683',
    detail: 'Pre-K through Grade 12.',
    accent: 'bg-gradient-to-br from-emerald-50 via-white to-white',
  },
  {
    id: 'college',
    headline: '100%',
    detail: '100% college acceptance rate.',
    accent: 'bg-gradient-to-br from-emerald-100/40 via-white to-white',
  },
  {
    id: 'state-titles',
    headline: '20',
    detail: 'State championships in football, golf, track, tennis, and soccer.',
    accent: 'bg-gradient-to-br from-emerald-50/70 via-white to-white',
  },
  {
    id: 'niche',
    headline: 'A+',
    detail: 'A+ rating on Niche.com — top-rated independent school.',
    accent: 'bg-gradient-to-br from-amber-50 via-white to-white',
  },
  {
    id: 'steam',
    headline: 'STEAM',
    detail: '16,000 sq. ft. state-of-the-art, hands-on STEAM center.',
    accent: 'bg-gradient-to-br from-yellow-50 via-white to-white',
  },
  {
    id: 'marine',
    headline: '🐬',
    detail: '6,000 sq. ft. marine science facility — the only waterfront program in the area.',
    accent: 'bg-gradient-to-br from-cyan-50 via-white to-white',
  },
  {
    id: 'class-size',
    headline: '14-18',
    detail: 'Average students per class.',
    accent: 'bg-gradient-to-br from-lime-50 via-white to-white',
  },
  {
    id: 'global',
    headline: '🌍',
    detail: 'Sister schools worldwide: Denmark, Spain, Argentina, Japan, Tanzania, Honduras.',
    accent: 'bg-gradient-to-br from-sky-50 via-white to-white',
  },
  {
    id: 'merit',
    headline: '53',
    detail: 'National Merit Scholarship finalists since 2005.',
    accent: 'bg-gradient-to-br from-amber-50 via-white to-white',
  },
  {
    id: 'sports',
    headline: '14',
    detail: '14 varsity sports offered.',
    accent: 'bg-gradient-to-br from-teal-50 via-white to-white',
  },
];

type StatCardProps = {
  entry: StatEntry;
  isActive: boolean;
  onToggle: () => void;
};

function StatCard({ entry, isActive, onToggle }: StatCardProps) {
  const { headline, detail, accent } = entry;
  const detailId = `${entry.id}-detail`;

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onToggle();
      }
    },
    [onToggle]
  );

  return (
    <motion.button
      layout
      type="button"
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      aria-expanded={isActive}
      aria-controls={detailId}
      className={`group relative flex w-full flex-col rounded-2xl border border-gray-200 p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#004b34]/40 ${isActive ? 'bg-[#004b34] text-white shadow-xl ring-1 ring-[#2d7a5a]/40' : `${accent ?? 'bg-white/90'} text-[#003825] hover:shadow-md`}`}
      transition={{ layout: { duration: 0.2, ease: 'easeOut' } }}
    >
      <div className="flex items-center justify-between">
        <span className={`text-4xl font-schraft-medium sm:text-5xl ${isActive ? 'text-white' : 'text-[#003825]'}`}>
          {headline}
        </span>
      </div>

      <AnimatePresence initial={false} mode="wait">
        {isActive && (
          <motion.p
            id={detailId}
            key="detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-3 text-sm font-schraft leading-snug text-white/90"
          >
            {detail}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [activeStat, setActiveStat] = useState<string | null>(null);

  useEffect(() => {
    // Ensure video plays on mount and set playback speed
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75; // Subtle motion
      videoRef.current.play().catch(error => {
        console.log('Video autoplay was prevented:', error);
      });
    }
  }, []);
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="px-4 py-3 bg-transparent fixed w-full z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="font-bold text-lg text-white">
            Saint Stephen&apos;s Episcopal School
          </div>
          <a
            href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1pPQ9xNbaHdCjn0RLmWLqhkuL5ePgy2tEp6YAT6tCvHG8emnJQr3gayPfmsnOPCbze_Q_ccJcD"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <Calendar className="h-4 w-4 transition-transform group-hover:scale-110" />
            Book Tour
          </a>
        </div>
      </nav>

      {/* Hero Section with Video Background */}
      <section className="relative min-h-[600px] h-[70vh] overflow-hidden">
        {/* Video Background */}
        <div className="absolute -inset-10 w-[calc(100%+80px)] h-[calc(100%+80px)]">
          <video
            ref={videoRef}
            autoPlay={true}
            loop={true}
            muted={true}
            playsInline={true}
            preload="metadata"
            className={`absolute top-0 left-0 w-full h-full object-cover animate-ken-burns transition-opacity duration-500 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
            style={{ 
              transformOrigin: 'center center'
            }}
            onLoadedData={(e) => {
              const video = e.target as HTMLVideoElement;
              video.play().then(() => setVideoReady(true)).catch(error => {
                console.log('Video autoplay failed:', error);
              });
            }}
          >
            <source src="/hero-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {/* Overlay with green gradient at top and bottom */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[#004b34]/60 via-transparent to-[#004b34]/60"></div>
          </div>
        </div>

        {/* Content positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-12">
          {/* Green blur background for content - more subtle */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#004b34]/90 via-[#004b34]/50 to-transparent -z-10"></div>
          
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <p className="text-lg md:text-xl text-white mb-8 font-light">
                Explore programs that fit you in 2 minutes.
              </p>

              <div className="max-w-sm mx-auto">
                <Link
                  href="/quiz"
                  className="group relative block overflow-hidden rounded-xl border-2 border-white/80 bg-white/5 text-white backdrop-blur-md transition-all duration-300 hover:border-white hover:bg-white/15 hover:scale-105 hover:shadow-2xl hover:shadow-white/20 focus:outline-none focus:ring-4 focus:ring-white/30"
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Content with enhanced spacing and typography */}
                  <div className="relative py-5 px-8">
                    <div className="text-xl md:text-2xl font-bold mb-1 group-hover:text-white transition-colors">
                      Begin Your Falcon's Journey
                    </div>
                    <div className="text-xs md:text-sm uppercase tracking-wider text-white/90 group-hover:text-white transition-colors">
                      Take the Quiz
                    </div>
                  </div>

                  {/* Animated border shimmer */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-0 rounded-xl border-2 border-white/20 animate-pulse" />
                  </div>
                </Link>
              </div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Props Grid - Shared Borders */}
      <section className="py-8 md:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:hidden">
            {statEntries.map(stat => {
              const isActive = activeStat === stat.id;
              return (
                <StatCard
                  key={stat.id}
                  entry={stat}
                  isActive={isActive}
                  onToggle={() => setActiveStat(prev => (prev === stat.id ? null : stat.id))}
                />
              );
            })}
          </div>

          <div className="hidden lg:grid grid-cols-12 border-t border-l border-dotted border-gray-300">
            
            {/* Student Body - Large */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="col-span-12 sm:col-span-7 md:col-span-4 lg:col-span-4 row-span-1 md:row-span-2 border-b border-r border-dotted border-gray-300 p-4 md:p-8 flex flex-col items-center justify-center"
            >
              <div className="text-6xl md:text-8xl lg:text-9xl font-schraft-medium text-[#003825] mb-2">683</div>
              <p className="text-base md:text-lg uppercase tracking-wider text-gray-600 font-schraft">Students</p>
              <p className="text-xs md:text-sm text-gray-400 mt-1">Pre-K through Grade 12</p>
            </motion.div>

            {/* Class Size - Asymmetric on mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="col-span-7 sm:col-span-5 md:col-span-2 lg:col-span-2 border-b border-r border-dotted border-gray-300 p-3 md:p-6 flex flex-col items-center justify-center"
            >
              <div className="flex items-baseline">
                <span className="text-3xl md:text-5xl font-schraft-medium text-[#003825]">14</span>
                <span className="text-2xl md:text-3xl font-schraft-medium text-[#003825] ml-1">-18</span>
              </div>
              <p className="text-xs md:text-sm uppercase tracking-wider text-gray-600 mt-2 font-schraft">Students Per Class</p>
            </motion.div>

            {/* College Success - Spans full width on mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="col-span-5 sm:col-span-6 md:col-span-2 lg:col-span-2 border-b border-r border-dotted border-gray-300 p-3 md:p-6 flex items-center justify-center"
            >
              <div className="text-center">
                <div className="relative">
                  {/* Enhanced badge with shimmer effect */}
                  <div className="inline-flex items-baseline justify-center relative group">
                    <span className="text-4xl md:text-6xl font-schraft-medium text-[#003825] relative z-10">100</span>
                    <span className="text-2xl md:text-3xl font-schraft-medium text-[#003825] ml-1 relative z-10">%</span>

                    {/* Sophisticated badge background */}
                    <div className="absolute inset-0 -m-2 rounded-2xl bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100" />
                    <div className="absolute inset-0 -m-2 rounded-2xl border-2 border-emerald-200/30 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  </div>

                  {/* Excellence badge */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  </div>
                </div>
                <p className="text-xs md:text-sm uppercase tracking-wider text-gray-600 mt-2 font-schraft">College Acceptance</p>
              </div>
            </motion.div>

            {/* Global Education */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="col-span-4 sm:col-span-6 md:col-span-2 lg:col-span-2 row-span-1 sm:row-span-1 md:row-span-2 border-b border-r border-dotted border-gray-300 p-3 md:p-6"
            >
              <div className="h-full flex flex-col justify-center text-center">
                <p className="text-xs uppercase tracking-wider text-[#2f7c4c] font-schraft mb-2">Global Education</p>
                <p className="text-xs md:text-sm text-gray-600 font-schraft leading-relaxed">
                  Sister schools in Denmark, Spain, Argentina, Japan, Tanzania, and Honduras
                </p>
              </div>
            </motion.div>

            {/* Marine Science - Wide on mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="col-span-8 sm:col-span-6 md:col-span-4 lg:col-span-4 row-span-1 md:row-span-2 border-b border-r border-dotted border-gray-300 p-4 md:p-8"
            >
              <div className="h-full flex flex-col justify-center items-center">
                <div className="text-3xl md:text-4xl lg:text-5xl font-schraft-medium text-transparent bg-clip-text bg-gradient-to-b from-blue-600 to-[#004b34]">
                  Marine Science
                </div>
                <p className="text-xs md:text-sm text-gray-600 mt-2 md:mt-3 font-schraft uppercase tracking-wider">
                  6,000 Square Foot Facility
                </p>
                <p className="text-xs text-gray-500 mt-2 text-center font-schraft leading-relaxed">
                  The area&apos;s only school with waterfront access
                </p>
              </div>
            </motion.div>

            {/* National Merit - Tiny on mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="col-span-3 sm:col-span-3 md:col-span-2 lg:col-span-2 border-b border-r border-dotted border-gray-300 p-3 md:p-6 flex flex-col items-center justify-center"
            >
              <div className="text-3xl md:text-5xl font-schraft-medium text-[#d4a017]">53</div>
              <p className="text-xs uppercase tracking-wider text-gray-600 mt-2 md:mt-3 font-schraft leading-relaxed text-center">
                National Merit Scholarship Finalists<br/>Since 2005
              </p>
            </motion.div>

            {/* Athletics - State Titles */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="col-span-9 sm:col-span-9 md:col-span-6 lg:col-span-6 border-b border-r border-dotted border-gray-300 p-3 md:p-6"
            >
              <div className="text-center">
                <div className="text-3xl md:text-5xl font-schraft-medium text-[#003825]">20</div>
                <p className="text-xs uppercase tracking-wider text-gray-600 mt-1 font-schraft">State Titles</p>
                <p className="text-xs text-gray-500 mt-2 font-schraft">Football, Golf, Track, Tennis, Soccer</p>
              </div>
            </motion.div>

            {/* Athletics - Sports Offered */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.68 }}
              className="col-span-3 sm:col-span-3 md:col-span-2 lg:col-span-2 border-b border-r border-dotted border-gray-300 p-3 md:p-6 flex flex-col items-center justify-center"
            >
              <div className="text-3xl md:text-5xl font-schraft-medium text-[#003825]">14</div>
              <p className="text-xs uppercase tracking-wider text-gray-600 mt-1 font-schraft text-center leading-relaxed">
                Sports Offered<br/>Grades 6-12
              </p>
            </motion.div>

            {/* STEAM Center - Medium on mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="col-span-6 sm:col-span-4 md:col-span-3 lg:col-span-4 border-b border-r border-dotted border-gray-300 p-3 md:p-6"
            >
              <div className="text-center">
                <div className="text-3xl md:text-5xl font-schraft-medium text-[#d4a017]">STEAM</div>
                <p className="text-xs md:text-sm uppercase tracking-wider text-gray-600 mt-1 md:mt-2 font-schraft">Innovation Center</p>
                <p className="text-xs text-gray-500 mt-2 font-schraft">16,000 Square Feet</p>
              </div>
            </motion.div>

            {/* Niche Grade - Small on mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="col-span-6 sm:col-span-2 md:col-span-2 lg:col-span-2 border-b border-r border-dotted border-gray-300 p-3 md:p-6 flex flex-col items-center justify-center"
            >
              <div className="relative group">
                {/* Enhanced A+ badge with golden accent */}
                <div className="relative inline-block">
                  <div className="text-4xl md:text-6xl font-schraft-medium text-[#003825] relative z-10">A+</div>

                  {/* Sophisticated badge background */}
                  <div className="absolute inset-0 -m-3 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100" />
                  <div className="absolute inset-0 -m-3 rounded-2xl border-2 border-amber-200/40 opacity-0 group-hover:opacity-100 transition-all duration-300" />

                  {/* Gold excellence indicator */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-lg animate-pulse" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider text-gray-600 mt-2 font-schraft group-hover:text-gray-700 transition-colors">Niche.com Ranking</p>
            </motion.div>

          </div>
          
          {/* Modifiers */}
          <div className="mt-6 text-xs text-gray-500 text-right pr-4">
            <p>*High School</p>
          </div>
        </div>
      </section>

      {/* Admin Link at Bottom */}
      <footer className="py-8 text-center">
        <Link 
          href="/admin" 
          className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
        >
          Admin
        </Link>
      </footer>

    </div>
  );
}
