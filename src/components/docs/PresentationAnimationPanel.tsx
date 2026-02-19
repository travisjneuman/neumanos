/**
 * PresentationAnimationPanel Component
 *
 * Panel for configuring slide transitions and element animations.
 */

import { useState } from 'react';
import { X, Play, Sparkles, ArrowRight } from 'lucide-react';
import type { SlideElement, SlideTransition } from '../../types';

interface PresentationAnimationPanelProps {
  element: SlideElement | null;
  slideTransition: SlideTransition | undefined;
  onUpdateElement: (updates: Partial<SlideElement>) => void;
  onUpdateTransition: (transition: SlideTransition | undefined) => void;
  onPreviewAnimation: () => void;
  onClose: () => void;
}

type AnimationEffect = 'fade' | 'slide' | 'zoom' | 'bounce';
type AnimationDirection = 'in' | 'out' | 'left' | 'right' | 'up' | 'down';
type AnimationTrigger = 'on-click' | 'with-previous' | 'after-previous';
type TransitionType = 'none' | 'fade' | 'slide' | 'zoom' | 'flip';
type TransitionDirection = 'left' | 'right' | 'up' | 'down';

const ANIMATION_EFFECTS: { value: AnimationEffect; label: string }[] = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'bounce', label: 'Bounce' },
];

const ANIMATION_DIRECTIONS: { value: AnimationDirection; label: string }[] = [
  { value: 'in', label: 'In' },
  { value: 'out', label: 'Out' },
  { value: 'left', label: 'From Left' },
  { value: 'right', label: 'From Right' },
  { value: 'up', label: 'From Top' },
  { value: 'down', label: 'From Bottom' },
];

const ANIMATION_TRIGGERS: { value: AnimationTrigger; label: string }[] = [
  { value: 'on-click', label: 'On Click' },
  { value: 'with-previous', label: 'With Previous' },
  { value: 'after-previous', label: 'After Previous' },
];

const TRANSITION_TYPES: { value: TransitionType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'flip', label: 'Flip' },
];

const TRANSITION_DIRECTIONS: { value: TransitionDirection; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
];

export function PresentationAnimationPanel({
  element,
  slideTransition,
  onUpdateElement,
  onUpdateTransition,
  onPreviewAnimation,
  onClose,
}: PresentationAnimationPanelProps) {
  const [activeTab, setActiveTab] = useState<'element' | 'slide'>('slide');

  const animation = element?.animation;

  // Element animation handlers
  const handleSetAnimation = (effect: AnimationEffect) => {
    onUpdateElement({
      animation: {
        effect,
        direction: 'in',
        duration: 500,
        delay: 0,
        trigger: 'on-click',
      },
    });
  };

  const handleUpdateAnimation = (updates: Partial<NonNullable<SlideElement['animation']>>) => {
    if (!animation) return;
    onUpdateElement({
      animation: { ...animation, ...updates },
    });
  };

  const handleRemoveAnimation = () => {
    onUpdateElement({ animation: undefined });
  };

  // Slide transition handlers
  const handleSetTransition = (type: TransitionType) => {
    if (type === 'none') {
      onUpdateTransition(undefined);
    } else {
      onUpdateTransition({
        type,
        direction: 'left',
        duration: 500,
      });
    }
  };

  const handleUpdateTransition = (updates: Partial<SlideTransition>) => {
    if (!slideTransition) return;
    onUpdateTransition({ ...slideTransition, ...updates });
  };

  return (
    <div className="w-64 bg-surface-light dark:bg-surface-dark-elevated border-l border-border-light dark:border-border-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border-light dark:border-border-dark">
        <h3 className="font-medium text-text-light-primary dark:text-text-dark-primary">
          Animations
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-light dark:border-border-dark">
        <button
          onClick={() => setActiveTab('slide')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            activeTab === 'slide'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <ArrowRight className="w-3 h-3" />
            Transition
          </div>
        </button>
        <button
          onClick={() => setActiveTab('element')}
          disabled={!element}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            activeTab === 'element'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary'
          } ${!element ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            Element
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'slide' ? (
          // Slide Transition Tab
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                Transition Type
              </label>
              <div className="grid grid-cols-2 gap-1">
                {TRANSITION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => handleSetTransition(t.value)}
                    className={`px-2 py-1.5 text-xs rounded transition-colors ${
                      (slideTransition?.type ?? 'none') === t.value
                        ? 'bg-accent-primary text-white'
                        : 'bg-surface-light-alt dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary hover:bg-accent-primary/10'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {slideTransition && slideTransition.type !== 'none' && (
              <>
                {/* Direction - only for slide and flip */}
                {(slideTransition.type === 'slide' || slideTransition.type === 'flip') && (
                  <div>
                    <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                      Direction
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      {TRANSITION_DIRECTIONS.map((d) => (
                        <button
                          key={d.value}
                          onClick={() => handleUpdateTransition({ direction: d.value })}
                          className={`px-2 py-1.5 text-xs rounded transition-colors ${
                            slideTransition.direction === d.value
                              ? 'bg-accent-primary text-white'
                              : 'bg-surface-light-alt dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary hover:bg-accent-primary/10'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duration */}
                <div>
                  <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                    Duration: {slideTransition.duration}ms
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={slideTransition.duration}
                    onChange={(e) => handleUpdateTransition({ duration: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {/* Preview button */}
            <button
              onClick={onPreviewAnimation}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
            >
              <Play className="w-4 h-4" />
              Preview Transition
            </button>
          </div>
        ) : (
          // Element Animation Tab
          <div className="space-y-4">
            {!element ? (
              <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary text-center py-4">
                Select an element to add animations
              </p>
            ) : !animation ? (
              <div>
                <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Add Animation
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {ANIMATION_EFFECTS.map((effect) => (
                    <button
                      key={effect.value}
                      onClick={() => handleSetAnimation(effect.value)}
                      className="px-2 py-1.5 text-xs rounded bg-surface-light-alt dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary hover:bg-accent-primary/10 transition-colors"
                    >
                      {effect.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Current animation */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
                    {ANIMATION_EFFECTS.find((e) => e.value === animation.effect)?.label} Animation
                  </span>
                  <button
                    onClick={handleRemoveAnimation}
                    className="text-xs text-status-error hover:text-status-error/80"
                  >
                    Remove
                  </button>
                </div>

                {/* Effect */}
                <div>
                  <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                    Effect
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    {ANIMATION_EFFECTS.map((effect) => (
                      <button
                        key={effect.value}
                        onClick={() => handleUpdateAnimation({ effect: effect.value })}
                        className={`px-2 py-1.5 text-xs rounded transition-colors ${
                          animation.effect === effect.value
                            ? 'bg-accent-primary text-white'
                            : 'bg-surface-light-alt dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary hover:bg-accent-primary/10'
                        }`}
                      >
                        {effect.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direction */}
                <div>
                  <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                    Direction
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {ANIMATION_DIRECTIONS.map((dir) => (
                      <button
                        key={dir.value}
                        onClick={() => handleUpdateAnimation({ direction: dir.value })}
                        className={`px-2 py-1.5 text-xs rounded transition-colors ${
                          animation.direction === dir.value
                            ? 'bg-accent-primary text-white'
                            : 'bg-surface-light-alt dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary hover:bg-accent-primary/10'
                        }`}
                      >
                        {dir.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trigger */}
                <div>
                  <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                    Trigger
                  </label>
                  <select
                    value={animation.trigger}
                    onChange={(e) => handleUpdateAnimation({ trigger: e.target.value as AnimationTrigger })}
                    className="w-full px-2 py-1.5 text-xs rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
                  >
                    {ANIMATION_TRIGGERS.map((trigger) => (
                      <option key={trigger.value} value={trigger.value}>
                        {trigger.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                    Duration: {animation.duration}ms
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={animation.duration}
                    onChange={(e) => handleUpdateAnimation({ duration: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Delay */}
                <div>
                  <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                    Delay: {animation.delay ?? 0}ms
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="100"
                    value={animation.delay ?? 0}
                    onChange={(e) => handleUpdateAnimation({ delay: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Preview button */}
                <button
                  onClick={onPreviewAnimation}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Preview Animation
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
