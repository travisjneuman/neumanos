import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { aboutUsContent } from '../content/aboutUs';
import { BUILD_HASH, formatBuildTimestamp } from '../utils/buildInfo';
import { useThemeStore } from '../stores/useThemeStore';

interface AboutModalProps {
  onClose: () => void;
}

/**
 * About Modal Component
 * Shows the story of NeumanOS with 2 narrative versions:
 * 1. Platform & Principles - About the platform vision and core principles
 * 2. Values & Background - From the founder's perspective
 *
 * Responsive: Uses compact versions on mobile for better readability
 */
const FOUNDER_NAME = 'Travis J. Neuman';
const FOUNDER_URL = 'https://travisjneuman.com';
const PLATFORM_NAME = 'NeumanOS';
const PLATFORM_URL = 'https://os.neuman.dev';

const LINK_CLASS = 'text-accent-blue hover:text-accent-blue-hover hover:underline transition-all duration-standard ease-smooth';

/**
 * Renders content with both founder name and platform name as clickable links
 */
function renderContentWithLinks(text: string): React.ReactNode {
  // First split by founder name, then by platform name
  const linkPatterns = [
    { name: FOUNDER_NAME, url: FOUNDER_URL },
    { name: PLATFORM_NAME, url: PLATFORM_URL },
  ];

  // Create a regex that matches either name
  const regex = new RegExp(`(${linkPatterns.map(p => p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const link = linkPatterns.find(p => p.name === part);
    if (link) {
      return (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          {link.name}
        </a>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  const [selectedNarrative, setSelectedNarrative] = useState<'platform' | 'founder'>('platform');
  const [isMobile, setIsMobile] = useState(false);
  const mode = useThemeStore((s) => s.mode);
  const logoSrc = mode === 'dark' ? '/images/logos/logo_white.png' : '/images/logos/logo_black.png';

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get appropriate content based on screen size
  const getContent = () => {
    if (isMobile) {
      return selectedNarrative === 'platform'
        ? aboutUsContent.compact.platform
        : aboutUsContent.compact.founder;
    }
    return selectedNarrative === 'platform'
      ? aboutUsContent.stories.platform
      : aboutUsContent.stories.founder;
  };

  const content = getContent();

  return (
    <Modal
      isOpen={true}
      title="About NeumanOS"
      onClose={onClose}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Logo or Founder Photo */}
        <div className="flex flex-col items-center gap-2">
          {selectedNarrative === 'platform' ? (
            <div className="w-3/5 overflow-hidden">
              <img
                src={logoSrc}
                alt="NeumanOS Logo"
                className="w-full h-auto object-contain"
              />
            </div>
          ) : (
            <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-button overflow-hidden">
              <img
                src="/images/founder.jpg"
                alt="Travis J. Neuman"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <a
            href={selectedNarrative === 'platform' ? PLATFORM_URL : FOUNDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${LINK_CLASS} text-sm font-medium`}
          >
            {selectedNarrative === 'platform' ? PLATFORM_NAME : FOUNDER_NAME}
          </a>
        </div>

        {/* Narrative Selector */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setSelectedNarrative('platform')}
            className={`px-2 sm:px-3 py-1.5 rounded-button text-xs sm:text-sm font-medium transition-all duration-standard ease-smooth ${selectedNarrative === 'platform'
                ? 'bg-accent-blue text-white'
                : 'bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
              }`}
          >
            <span className="hidden sm:inline">Platform & Principles</span>
            <span className="sm:hidden">Platform</span>
          </button>
          <button
            onClick={() => setSelectedNarrative('founder')}
            className={`px-2 sm:px-3 py-1.5 rounded-button text-xs sm:text-sm font-medium transition-all duration-standard ease-smooth ${selectedNarrative === 'founder'
                ? 'bg-accent-primary text-white'
                : 'bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
              }`}
          >
            <span className="hidden sm:inline">Values & Background</span>
            <span className="sm:hidden">Founder</span>
          </button>
        </div>

        {/* Content Title */}
        <div className="text-center">
          <h3 className="text-base sm:text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            {content.title}
          </h3>
          {content.subtitle && (
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
              {content.subtitle}
            </p>
          )}
        </div>

        {/* Selected Narrative */}
        <div className="prose prose-sm max-w-none dark:prose-invert max-h-[35vh] sm:max-h-[45vh] overflow-y-auto pr-2">
          <div className="text-text-light-primary dark:text-text-dark-primary whitespace-pre-line leading-relaxed text-xs sm:text-sm">
            {renderContentWithLinks(content.content)}
          </div>
        </div>

        {/* Build Info */}
        <div className="text-center mt-4">
          <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary font-mono">
            Build: {BUILD_HASH} ({formatBuildTimestamp()})
          </span>
        </div>

        {/* Footer Links */}
        <div className="border-t border-border-light dark:border-border-dark pt-3 mt-2">
          <div className="flex flex-wrap gap-3 justify-center text-xs">
            <a
              href="https://os.neuman.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-blue hover:text-accent-blue-hover hover:underline transition-all duration-standard ease-smooth"
            >
              Official Website
            </a>
            <a
              href="mailto:travis@neuman.dev"
              className="text-accent-blue hover:text-accent-blue-hover hover:underline transition-all duration-standard ease-smooth"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
};
