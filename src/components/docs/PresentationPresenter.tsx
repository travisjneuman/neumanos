/**
 * PresentationPresenter Component
 *
 * Fullscreen presentation mode with speaker notes, timer, and navigation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Maximize,
  Minimize,
  Play,
  Pause,
} from 'lucide-react';
import type { Slide } from '../../types';
import { PresentationCanvas } from './PresentationCanvas';

interface PresentationPresenterProps {
  slides: Slide[];
  initialSlideIndex?: number;
  onClose: () => void;
  onSlideChange?: (index: number) => void;
}

export function PresentationPresenter({
  slides,
  initialSlideIndex = 0,
  onClose,
  onSlideChange,
}: PresentationPresenterProps) {
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const [showNotes, setShowNotes] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = slides[currentIndex];
  const nextSlide = slides[currentIndex + 1];

  // Timer
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  // Format time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Navigation
  const goToSlide = useCallback(
    (index: number) => {
      const newIndex = Math.max(0, Math.min(slides.length - 1, index));
      setCurrentIndex(newIndex);
      onSlideChange?.(newIndex);
    },
    [slides.length, onSlideChange]
  );

  const goNext = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'Enter':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          goPrev();
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(slides.length - 1);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'n':
          e.preventDefault();
          setShowNotes((prev) => !prev);
          break;
        case 't':
          e.preventDefault();
          setShowTimer((prev) => !prev);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, goToSlide, onClose, slides.length]);

  // Fullscreen
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!currentSlide) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onClick={(e) => {
        // Click on main area advances slide
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-slide-area]')) {
          goNext();
        }
      }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-black/50 text-white/80 text-sm opacity-0 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4">
          {/* Timer */}
          {showTimer && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(elapsedSeconds)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTimerRunning((prev) => !prev);
                }}
                className="p-1 hover:bg-white/20 rounded"
                title={isTimerRunning ? 'Pause timer' : 'Resume timer'}
              >
                {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
            </div>
          )}

          {/* Slide counter */}
          <div>
            {currentIndex + 1} / {slides.length}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle notes */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNotes((prev) => !prev);
            }}
            className={`p-2 rounded transition-colors ${
              showNotes ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
            title="Toggle speaker notes (N)"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Toggle timer */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTimer((prev) => !prev);
            }}
            className={`p-2 rounded transition-colors ${
              showTimer ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
            title="Toggle timer (T)"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-2 hover:bg-white/10 rounded"
            title="Toggle fullscreen (F)"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>

          {/* Exit */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-white/10 rounded"
            title="Exit presentation (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex">
        {/* Main slide */}
        <div
          data-slide-area
          className="flex-1 flex items-center justify-center cursor-pointer"
        >
          <PresentationCanvas
            slide={currentSlide}
            containerWidth={showNotes ? window.innerWidth * 0.65 : window.innerWidth}
            containerHeight={window.innerHeight}
            selectedElementId={null}
            onSelectElement={() => {}}
            onUpdateElement={() => {}}
            currentTool="select"
            isEditable={false}
          />
        </div>

        {/* Speaker notes panel */}
        {showNotes && (
          <div
            className="w-[35%] bg-gray-900 border-l border-gray-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Next slide preview */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white/60 text-xs uppercase mb-2">Next Slide</h3>
              {nextSlide ? (
                <div className="bg-black rounded overflow-hidden">
                  <PresentationCanvas
                    slide={nextSlide}
                    containerWidth={280}
                    containerHeight={158}
                    selectedElementId={null}
                    onSelectElement={() => {}}
                    onUpdateElement={() => {}}
                    currentTool="select"
                    isEditable={false}
                  />
                </div>
              ) : (
                <div className="bg-black rounded h-[158px] flex items-center justify-center text-white/40 text-sm">
                  End of presentation
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="text-white/60 text-xs uppercase mb-2">Speaker Notes</h3>
              <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                {currentSlide.speakerNotes || (
                  <span className="text-white/40 italic">No speaker notes for this slide</span>
                )}
              </div>
            </div>

            {/* Quick info */}
            <div className="p-4 border-t border-gray-700 text-white/40 text-xs">
              <div className="flex items-center justify-between">
                <span>Slide {currentIndex + 1} of {slides.length}</span>
                <span>{formatTime(elapsedSeconds)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation arrows */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          disabled={currentIndex === 0}
          className="p-3 bg-black/50 rounded-full text-white/80 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous slide (←)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          disabled={currentIndex === slides.length - 1}
          className="p-3 bg-black/50 rounded-full text-white/80 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next slide (→)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
