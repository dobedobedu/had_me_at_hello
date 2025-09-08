'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { ShimmerButton } from '@/components/ui/shimmer-button-simple';
import { useEffect, useRef, useState } from 'react';

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

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
            className="text-white hover:text-white/80 text-sm transition-colors"
          >
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
                  className="block text-center py-4 px-6 border-2 border-white text-white hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
                >
                  <div className="text-xl md:text-2xl font-bold mb-1">Begin Your Falcon's Journey</div>
                  <div className="text-xs md:text-sm uppercase tracking-wide">TAKE THE QUIZ</div>
                </Link>
              </div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Props Grid - Shared Borders */}
      <section className="py-8 md:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 border-t border-l border-dotted border-gray-300">
            
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
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl md:text-6xl font-schraft-medium text-[#003825]">100</span>
                  <span className="text-2xl md:text-3xl font-schraft-medium text-[#003825]">%</span>
                </div>
                <p className="text-xs md:text-sm uppercase tracking-wider text-gray-600 mt-1 font-schraft">College Acceptance</p>
              </div>
            </motion.div>

            {/* Diversity - Narrow on mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="col-span-4 sm:col-span-6 md:col-span-2 lg:col-span-2 row-span-1 sm:row-span-1 md:row-span-2 border-b border-r border-dotted border-gray-300 p-3 md:p-6"
            >
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-3 md:mb-6 font-schraft">From</p>
              <div className="space-y-3 md:space-y-6">
                <div className="text-center">
                  <div className="text-3xl md:text-5xl font-schraft-medium text-[#003825]">12</div>
                  <p className="text-xs text-gray-600 mt-1 font-schraft">Countries</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-5xl font-schraft-medium text-[#003825]">18</div>
                  <p className="text-xs text-gray-600 mt-1 font-schraft">States</p>
                </div>
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
                <div className="text-xs uppercase tracking-wider text-blue-600 mb-1 md:mb-2">Living</div>
                <div className="text-4xl md:text-6xl lg:text-7xl font-schraft-medium text-transparent bg-clip-text bg-gradient-to-b from-blue-600 to-[#004b34]">REEF</div>
                <p className="text-xs md:text-sm text-gray-600 mt-2 md:mt-3 font-schraft">Marine Science Lab</p>
                <p className="text-xs text-gray-400 mt-1">Research on Campus</p>
              </div>
            </motion.div>

            {/* National Merit - Tiny on mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="col-span-3 sm:col-span-3 md:col-span-2 lg:col-span-2 border-b border-r border-dotted border-gray-300 p-3 md:p-6 flex flex-col items-center justify-center"
            >
              <div className="text-3xl md:text-5xl font-schraft-medium text-[#d4a017]">52</div>
              <p className="text-xs uppercase tracking-wider text-gray-600 mt-2 md:mt-3 font-schraft leading-relaxed">National<br/>Merit<br/>Finalists</p>
            </motion.div>

            {/* Athletics - Spans most width on mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="col-span-9 sm:col-span-9 md:col-span-6 lg:col-span-6 border-b border-r border-dotted border-gray-300 p-3 md:p-6"
            >
              <div className="flex justify-around items-center">
                <div className="text-center">
                  <div className="text-3xl md:text-5xl font-schraft-medium text-[#003825]">20</div>
                  <p className="text-xs uppercase tracking-wider text-gray-600 mt-1 font-schraft">State Titles</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-5xl font-schraft-medium text-[#003825]">19</div>
                  <p className="text-xs uppercase tracking-wider text-gray-600 mt-1 font-schraft">Sports</p>
                </div>
              </div>
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
              </div>
            </motion.div>

            {/* Niche Grade - Small on mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="col-span-6 sm:col-span-2 md:col-span-2 lg:col-span-2 border-b border-r border-dotted border-gray-300 p-3 md:p-6 flex flex-col items-center justify-center"
            >
              <div className="text-4xl md:text-6xl font-schraft-medium text-[#003825]">A+</div>
              <p className="text-xs uppercase tracking-wider text-gray-600 mt-1 font-schraft">Niche.com</p>
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
