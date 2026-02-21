/**
 * PresentationEditor Component
 *
 * Main wrapper component for the presentation editor.
 * Manages slides, active slide, element selection, and auto-save.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { StickyNote, ChevronUp, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { toast } from '../../stores/useToastStore';
import type { PresentationDoc, Slide, SlideElement, SlideTheme, SlideTransition } from '../../types';
import { PresentationCanvas } from './PresentationCanvas';
import { PresentationToolbar, type PresentationTool } from './PresentationToolbar';
import { PresentationSidebar } from './PresentationSidebar';
import { PresentationPropertiesPanel } from './PresentationPropertiesPanel';
import { PresentationThemeDialog } from './PresentationThemeDialog';
import { PresentationPresenter } from './PresentationPresenter';
import { PresentationAnimationPanel } from './PresentationAnimationPanel';
import { PresentationExportDialog } from './PresentationExportDialog';
import { createSlideFromLayout, type SlideLayout } from './presentationTemplates';

interface PresentationEditorProps {
  doc: PresentationDoc;
  onSave: (updates: Partial<PresentationDoc>) => void;
}

// Create a new empty slide
function createEmptySlide(order: number): Slide {
  return {
    id: crypto.randomUUID(),
    order,
    background: { type: 'color', color: '#FFFFFF' },
    elements: [],
  };
}

export function PresentationEditor({ doc, onSave }: PresentationEditorProps) {
  const [slides, setSlides] = useState<Slide[]>(doc.slides);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<PresentationTool>('select');
  const [isPresenting, setIsPresenting] = useState(false);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showAnimationPanel, setShowAnimationPanel] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Sync slides from doc when it changes externally
  useEffect(() => {
    setSlides(doc.slides);
  }, [doc.slides]);

  // Measure container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Auto-save with debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveSlides = useCallback(
    (newSlides: Slide[]) => {
      setSlides(newSlides);

      // Debounced save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        onSave({ slides: newSlides });
      }, 500);
    },
    [onSave]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const activeSlide = slides[activeSlideIndex];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setCurrentTool('select');
            break;
          case 't':
            setCurrentTool('text');
            break;
          case 'r':
            setCurrentTool('rectangle');
            break;
          case 'e':
            setCurrentTool('ellipse');
            break;
          case 'l':
            setCurrentTool('line');
            break;
          case 'a':
            if (!e.ctrlKey && !e.metaKey) {
              setCurrentTool('arrow');
            }
            break;
        }
      }

      // Delete selected element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && activeSlide) {
          const newElements = activeSlide.elements.filter((el) => el.id !== selectedElementId);
          const newSlides = slides.map((s, i) =>
            i === activeSlideIndex ? { ...s, elements: newElements } : s
          );
          saveSlides(newSlides);
          setSelectedElementId(null);
        }
      }

      // Navigate slides with arrow keys (when not editing element)
      if (!selectedElementId) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          setActiveSlideIndex((prev) => Math.max(0, prev - 1));
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
        }
      }

      // F5 to present
      if (e.key === 'F5') {
        e.preventDefault();
        handlePresent();
      }

      // Escape to exit presentation or deselect
      if (e.key === 'Escape') {
        if (isPresenting) {
          setIsPresenting(false);
        } else {
          setSelectedElementId(null);
          setCurrentTool('select');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, activeSlide, activeSlideIndex, slides, isPresenting, saveSlides]);

  // Slide operations
  const handleAddSlide = useCallback(() => {
    const newSlide = createEmptySlide(slides.length);
    const newSlides = [...slides, newSlide];
    saveSlides(newSlides);
    setActiveSlideIndex(newSlides.length - 1);
    setSelectedElementId(null);
    toast.success('Slide added');
  }, [slides, saveSlides]);

  const handleDeleteSlide = useCallback(() => {
    if (slides.length <= 1) {
      toast.error('Cannot delete the only slide');
      return;
    }

    const newSlides = slides.filter((_, i) => i !== activeSlideIndex);
    // Reorder remaining slides
    const reorderedSlides = newSlides.map((s, i) => ({ ...s, order: i }));
    saveSlides(reorderedSlides);
    setActiveSlideIndex(Math.min(activeSlideIndex, reorderedSlides.length - 1));
    setSelectedElementId(null);
    toast.success('Slide deleted');
  }, [slides, activeSlideIndex, saveSlides]);

  const handleDuplicateSlide = useCallback(() => {
    if (!activeSlide) return;

    const duplicatedSlide: Slide = {
      ...activeSlide,
      id: crypto.randomUUID(),
      order: activeSlideIndex + 1,
      elements: activeSlide.elements.map((el) => ({
        ...el,
        id: crypto.randomUUID(),
      })),
    };

    // Insert after current slide and reorder
    const newSlides = [
      ...slides.slice(0, activeSlideIndex + 1),
      duplicatedSlide,
      ...slides.slice(activeSlideIndex + 1),
    ].map((s, i) => ({ ...s, order: i }));

    saveSlides(newSlides);
    setActiveSlideIndex(activeSlideIndex + 1);
    setSelectedElementId(null);
    toast.success('Slide duplicated');
  }, [activeSlide, activeSlideIndex, slides, saveSlides]);

  // Element operations
  const handleUpdateElement = useCallback(
    (elementId: string, updates: Partial<SlideElement>) => {
      if (!activeSlide) return;

      const newElements = activeSlide.elements.map((el) =>
        el.id === elementId ? { ...el, ...updates } : el
      );

      const newSlides = slides.map((s, i) =>
        i === activeSlideIndex ? { ...s, elements: newElements } : s
      );

      saveSlides(newSlides);
    },
    [activeSlide, activeSlideIndex, slides, saveSlides]
  );

  const handleAddElement = useCallback(
    (element: SlideElement) => {
      if (!activeSlide) return;

      const newElements = [...activeSlide.elements, element];
      const newSlides = slides.map((s, i) =>
        i === activeSlideIndex ? { ...s, elements: newElements } : s
      );

      saveSlides(newSlides);
      setCurrentTool('select'); // Switch to select after adding
    },
    [activeSlide, activeSlideIndex, slides, saveSlides]
  );

  // Image upload
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Convert to data URL
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;

        // Create image element at center of slide
        const newElement: SlideElement = {
          id: crypto.randomUUID(),
          type: 'image',
          x: 400,
          y: 200,
          width: 400,
          height: 300,
          image: {
            src: dataUrl,
            fit: 'contain',
          },
        };

        handleAddElement(newElement);
        setSelectedElementId(newElement.id);
      };

      reader.readAsDataURL(file);
    };

    input.click();
  }, [handleAddElement]);

  // Background image upload
  const handleBackgroundImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newSlides = slides.map((s, i) =>
          i === activeSlideIndex
            ? { ...s, background: { type: 'image' as const, imageUrl: dataUrl } }
            : s
        );
        saveSlides(newSlides);
        toast.success('Background image set');
      };
      reader.readAsDataURL(file);
    };

    input.click();
  }, [slides, activeSlideIndex, saveSlides]);

  // Presentation mode
  const handlePresent = useCallback(() => {
    setIsPresenting(true);
    setSelectedElementId(null);
    toast.info('Press Escape to exit presentation');
  }, []);

  // Export dialog
  const handleExport = useCallback(() => {
    setShowExportDialog(true);
  }, []);

  // Theme dialog
  const handleTheme = useCallback(() => {
    setShowThemeDialog(true);
  }, []);

  // Apply theme to slides
  const handleApplyTheme = useCallback(
    (theme: SlideTheme, applyToAll: boolean) => {
      const newSlides = slides.map((slide, index) => {
        if (applyToAll || index === activeSlideIndex) {
          return {
            ...slide,
            background: { type: 'color' as const, color: theme.colors.background },
            // Update text elements with theme colors
            elements: slide.elements.map((el) => {
              if (el.type === 'text' && el.text) {
                return {
                  ...el,
                  text: {
                    ...el.text,
                    color: theme.colors.text,
                    fontFamily: el.text.fontSize && el.text.fontSize >= 48
                      ? theme.fonts.heading
                      : theme.fonts.body,
                  },
                };
              }
              return el;
            }),
          };
        }
        return slide;
      });

      saveSlides(newSlides);
      onSave({ theme });
      toast.success(applyToAll ? 'Theme applied to all slides' : 'Theme applied to current slide');
    },
    [slides, activeSlideIndex, saveSlides, onSave]
  );

  // Apply layout to current slide
  const handleApplyLayout = useCallback(
    (layout: SlideLayout) => {
      const newSlide = createSlideFromLayout(layout, activeSlideIndex, doc.theme);
      newSlide.id = activeSlide?.id || crypto.randomUUID();

      const newSlides = slides.map((s, i) =>
        i === activeSlideIndex ? newSlide : s
      );

      saveSlides(newSlides);
      setSelectedElementId(null);
      toast.success(`Applied ${layout} layout`);
    },
    [activeSlide, activeSlideIndex, slides, doc.theme, saveSlides]
  );

  // Update slide transition
  const handleUpdateTransition = useCallback(
    (transition: SlideTransition | undefined) => {
      if (!activeSlide) return;

      const newSlides = slides.map((s, i) =>
        i === activeSlideIndex ? { ...s, transition } : s
      );

      saveSlides(newSlides);
      toast.success(transition ? `Applied ${transition.type} transition` : 'Transition removed');
    },
    [activeSlide, activeSlideIndex, slides, saveSlides]
  );

  // Animation button handler
  const handleAnimation = useCallback(() => {
    setShowAnimationPanel(true);
  }, []);

  // Update speaker notes
  const handleUpdateSpeakerNotes = useCallback(
    (notes: string) => {
      if (!activeSlide) return;

      const newSlides = slides.map((s, i) =>
        i === activeSlideIndex ? { ...s, speakerNotes: notes } : s
      );

      saveSlides(newSlides);
    },
    [activeSlide, activeSlideIndex, slides, saveSlides]
  );

  // Preview animation
  const handlePreviewAnimation = useCallback(() => {
    toast.info('Animation preview - enter presenter mode to see full animation');
  }, []);

  if (!activeSlide) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-text-light-tertiary dark:text-text-dark-tertiary">
          No slides found
        </p>
      </div>
    );
  }

  // Presentation mode
  if (isPresenting) {
    return (
      <PresentationPresenter
        slides={slides}
        initialSlideIndex={activeSlideIndex}
        onClose={() => setIsPresenting(false)}
        onSlideChange={setActiveSlideIndex}
      />
    );
  }

  return (
    <div className="h-full flex flex-col border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark-elevated overflow-hidden">
      {/* Toolbar */}
      <PresentationToolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        onAddSlide={handleAddSlide}
        onDeleteSlide={handleDeleteSlide}
        onDuplicateSlide={handleDuplicateSlide}
        onPresent={handlePresent}
        onExport={handleExport}
        onTheme={handleTheme}
        onAnimation={handleAnimation}
        onImageUpload={handleImageUpload}
        onBackgroundImage={handleBackgroundImage}
        slideCount={slides.length}
        canDeleteSlide={slides.length > 1}
      />

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide thumbnails */}
        <PresentationSidebar
          slides={slides}
          activeSlideIndex={activeSlideIndex}
          onSlideSelect={(index) => {
            setActiveSlideIndex(index);
            setSelectedElementId(null);
          }}
          onAddSlide={handleAddSlide}
        />

        {/* Canvas area */}
        <div ref={containerRef} className="flex-1 overflow-hidden p-4">
          <PresentationCanvas
            slide={activeSlide}
            containerWidth={containerSize.width - 32 - (showPropertiesPanel ? 256 : 0) - (showAnimationPanel ? 256 : 0)} // Account for padding and panels
            containerHeight={containerSize.height - 32}
            selectedElementId={selectedElementId}
            onSelectElement={(id) => {
              setSelectedElementId(id);
              if (id) setShowPropertiesPanel(true);
            }}
            onUpdateElement={handleUpdateElement}
            onAddElement={handleAddElement}
            currentTool={currentTool}
            isEditable={true}
          />
        </div>

        {/* Properties panel */}
        {showPropertiesPanel && (
          <PresentationPropertiesPanel
            element={activeSlide.elements.find((el) => el.id === selectedElementId) || null}
            onUpdate={(updates) => {
              if (selectedElementId) {
                handleUpdateElement(selectedElementId, updates);
              }
            }}
            onClose={() => {
              setShowPropertiesPanel(false);
              setSelectedElementId(null);
            }}
          />
        )}

        {/* Animation panel */}
        {showAnimationPanel && (
          <PresentationAnimationPanel
            element={activeSlide.elements.find((el) => el.id === selectedElementId) || null}
            slideTransition={activeSlide.transition}
            onUpdateElement={(updates) => {
              if (selectedElementId) {
                handleUpdateElement(selectedElementId, updates);
              }
            }}
            onUpdateTransition={handleUpdateTransition}
            onPreviewAnimation={handlePreviewAnimation}
            onClose={() => setShowAnimationPanel(false)}
          />
        )}
      </div>

      {/* Speaker Notes Panel */}
      <div className="border-t border-border-light dark:border-border-dark">
        <button
          onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
          className="w-full flex items-center justify-between px-4 py-2 text-sm text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark transition-colors"
        >
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4" />
            <span>Speaker Notes</span>
            {activeSlide?.speakerNotes && (
              <span className="w-2 h-2 bg-accent-primary rounded-full" />
            )}
          </div>
          {showSpeakerNotes ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
        {showSpeakerNotes && (
          <div className="px-4 pb-3">
            <textarea
              value={activeSlide?.speakerNotes || ''}
              onChange={(e) => handleUpdateSpeakerNotes(e.target.value)}
              placeholder="Add speaker notes for this slide..."
              className="w-full h-24 px-3 py-2 text-sm bg-surface-light-alt dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg resize-y text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>
        )}
      </div>

      {/* Theme dialog */}
      {showThemeDialog && (
        <PresentationThemeDialog
          currentTheme={doc.theme}
          onApplyTheme={handleApplyTheme}
          onApplyLayout={handleApplyLayout}
          onClose={() => setShowThemeDialog(false)}
        />
      )}

      {/* Export dialog */}
      {showExportDialog && (
        <PresentationExportDialog
          slides={slides}
          title={doc.title || 'Presentation'}
          theme={doc.theme}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
}
