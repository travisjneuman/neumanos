import React, { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useSaveStatus } from '../stores/useSaveStatus';

// Lazy load modals to prevent main bundle bloat
const AboutModal = lazy(() => import('./AboutModal').then(m => ({ default: m.AboutModal })));
const PrivacyModal = lazy(() => import('./PrivacyModal').then(m => ({ default: m.PrivacyModal })));
const SupportModal = lazy(() => import('./SupportModal').then(m => ({ default: m.SupportModal })));

/**
 * Footer component with save status indicator, Privacy Policy, and About Us
 * Sticky footer at bottom with links, save status at bottom-right
 */
export const Footer: React.FC = () => {
  const { status, lastSaveTime } = useSaveStatus();
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Simplified status text
  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaveTime ? formatDistanceToNow(lastSaveTime, { addSuffix: true }) : 'Saved';
      case 'error':
        return 'Failed';
      default:
        return 'Saved';
    }
  };

  return (
    <>
      {/* Main Footer - Centered Floating Pill */}
      <motion.footer
        initial={{ opacity: 0, y: 50, x: "-50%" }}
        animate={{ opacity: 1, y: 0, x: "-50%" }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="fixed bottom-[72px] md:bottom-4 left-1/2 z-30 pointer-events-none"
      >
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 sm:gap-4 sm:px-4 sm:py-2 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-lg rounded-full border border-border-light dark:border-border-dark pointer-events-auto shadow-lg">
          {/* Footer Links - Centered */}
          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
            <button
              onClick={() => setShowAboutModal(true)}
              className="text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-blue dark:hover:text-accent-blue-hover transition-all duration-standard ease-smooth whitespace-nowrap"
            >
              About<span className="hidden sm:inline"> Us</span>
            </button>
            <span className="text-border-light dark:text-border-dark">|</span>
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-blue dark:hover:text-accent-blue-hover transition-all duration-standard ease-smooth whitespace-nowrap"
            >
              Privacy<span className="hidden sm:inline"> Policy</span>
            </button>
            <span className="text-border-light dark:text-border-dark">|</span>
            <button
              onClick={() => setShowSupportModal(true)}
              className="text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-primary dark:hover:text-accent-primary-hover transition-all duration-standard ease-smooth whitespace-nowrap"
              title="Get help or report issues"
            >
              Help<span className="hidden sm:inline"> & Support</span>
            </button>
            <span className="text-border-light dark:text-border-dark">|</span>
            <span className="text-text-light-secondary dark:text-text-dark-secondary whitespace-nowrap">
              © {new Date().getFullYear()}<span className="hidden sm:inline"> NeumanOS</span>
            </span>
          </div>

          {/* Save Status (hidden on mobile) - Visually balanced */}
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border-light dark:border-border-dark">
            {/* Status Dot */}
            <span
              className={`w-2.5 h-2.5 rounded-full ${status === 'saving'
                  ? 'bg-accent-blue animate-pulse'
                  : status === 'error'
                    ? 'bg-accent-red'
                    : 'bg-accent-neon-green animate-neon-pulse'
                }`}
            />

            {/* Status Text */}
            <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary whitespace-nowrap">
              {getStatusText()}
            </span>
          </div>
        </div>
      </motion.footer>

      {/* Lazy-loaded modals wrapped in Suspense */}
      <Suspense fallback={null}>
        {/* Support Modal */}
        {showSupportModal && (
          <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
        )}

        {/* About Modal */}
        {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}

        {/* Privacy Modal */}
        {showPrivacyModal && <PrivacyModal onClose={() => setShowPrivacyModal(false)} />}
      </Suspense>
    </>
  );
};
