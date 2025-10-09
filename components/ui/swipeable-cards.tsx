'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion, useDragControls } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Card {
  id: string;
  type: 'alumni' | 'faculty' | 'student';
  content: React.ReactNode;
}

interface SwipeableCardsProps {
  cards: Card[];
  className?: string;
  disableDrag?: boolean;
  headerOffset?: number; // extra pixels above video (title/subtitle paddings)
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onIndexChange?: (index: number) => void;
}

export function SwipeableCards({
  cards,
  className = '',
  disableDrag = false,
  headerOffset = 56,
  onSwipeStart,
  onSwipeEnd,
  onIndexChange,
}: SwipeableCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState<number>(300);
  const prefersReducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setContainerWidth(w);
        const videoH = Math.round(w * 9 / 16);
        const h = Math.max(220, videoH + headerOffset); // ensure enough room but minimize whitespace
        setContainerHeight(h);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const goToCard = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, cards.length - 1));
    if (nextIndex === currentIndex) return;
    setCurrentIndex(nextIndex);
    onIndexChange?.(nextIndex);
  };

  const goToPrevious = () => goToCard(currentIndex - 1);
  const goToNext = () => goToCard(currentIndex + 1);

  // Swipe handlers
  const handleDragEnd = (event: any, info: any) => {
    onSwipeEnd?.();
    const threshold = 50;
    if (info.offset.x > threshold && currentIndex > 0) {
      goToPrevious();
    } else if (info.offset.x < -threshold && currentIndex < cards.length - 1) {
      goToNext();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Cards Container */}
      <div 
        ref={containerRef}
        className="relative overflow-visible mx-auto"
        style={{ maxWidth: '100%' }}
      >
        <div className="relative" style={{ height: containerHeight }}>
          <AnimatePresence initial={false} custom={currentIndex}>
            {cards.map((card, index) => (
              <SwipeableCardSlide
                key={card.id}
                card={card}
                index={index}
                currentIndex={currentIndex}
                containerWidth={containerWidth}
                disableDrag={disableDrag}
                prefersReducedMotion={prefersReducedMotion}
                handleDragEnd={handleDragEnd}
                onSwipeStart={onSwipeStart}
                onSwipeEnd={onSwipeEnd}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation arrows removed per KISS request */}

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => goToCard(index)}
            className={`transition-all ${
              index === currentIndex
                ? 'w-8 h-2 bg-[#004b34] rounded-full'
                : 'w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-400'
            }`}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>

      {/* Mobile Swipe Hint */}
      {cards.length > 1 && (
        <p className="text-center text-xs text-gray-500 mt-1 md:hidden">
          Swipe to explore more stories
        </p>
      )}
    </div>
  );
}

type SwipeableCardSlideProps = {
  card: Card;
  index: number;
  currentIndex: number;
  containerWidth: number;
  disableDrag: boolean;
  prefersReducedMotion: boolean;
  handleDragEnd: (event: any, info: any) => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
};

function SwipeableCardSlide({
  card,
  index,
  currentIndex,
  containerWidth,
  disableDrag,
  prefersReducedMotion,
  handleDragEnd,
  onSwipeStart,
  onSwipeEnd,
}: SwipeableCardSlideProps) {
  const dragControls = useDragControls();
  const isActive = index === currentIndex;
  const isPrevious = index === currentIndex - 1;
  const isNext = index === currentIndex + 1;
  const isVisible = isActive || isPrevious || isNext;

  if (!isVisible) return null;

  return (
    <motion.div
      key={card.id}
      custom={currentIndex}
      initial={prefersReducedMotion ? false : {
        x: index > currentIndex ? containerWidth : -containerWidth,
        opacity: 0,
      }}
      animate={prefersReducedMotion ? {
        x: 0,
        opacity: isActive ? 1 : 0.6,
        scale: 1,
        zIndex: isActive ? 10 : 0,
      } : {
        x: isActive ? 0 : index < currentIndex ? -containerWidth * 0.9 : containerWidth * 0.1,
        opacity: isActive ? 1 : 0.3,
        scale: isActive ? 1 : 0.95,
        zIndex: isActive ? 10 : 0,
      }}
      exit={prefersReducedMotion ? { opacity: 0 } : {
        x: index < currentIndex ? -containerWidth : containerWidth,
        opacity: 0,
      }}
      transition={prefersReducedMotion ? { duration: 0 } : {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      drag={isActive && !disableDrag && !prefersReducedMotion ? 'x' : false}
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      className={`absolute inset-0 ${isNext ? 'pointer-events-none' : ''}`}
      style={{
        cursor: isActive && !prefersReducedMotion ? 'grab' : 'default',
        touchAction: 'pan-y',
      }}
      whileDrag={{ cursor: 'grabbing' }}
      dragMomentum={false}
      onPointerDown={(event) => {
        if (isActive && !disableDrag && !prefersReducedMotion) {
          onSwipeStart?.();
          dragControls.start(event);
        }
      }}
      onPointerUp={() => onSwipeEnd?.()}
    >
      <div className="h-full" data-swipe-card>
        {card.content}
      </div>
    </motion.div>
  );
}
