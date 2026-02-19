/**
 * Page Settings Panel
 *
 * Displays page-specific settings in a modal
 * Currently supports Dashboard widget customization
 */

import React from 'react';
import { Modal } from './Modal';
import { WidgetManager } from './WidgetManager';

interface PageSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pagePath: string;
}

export const PageSettingsPanel: React.FC<PageSettingsPanelProps> = ({
  isOpen,
  onClose,
  pagePath,
}) => {
  // Dashboard settings - show widget manager
  if (pagePath === '/') {
    return <WidgetManager isOpen={isOpen} onClose={onClose} />;
  }

  // Notes settings (placeholder for future)
  if (pagePath === '/notes') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Notes Settings">
        <div className="space-y-4">
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Notes settings will be added when Notes feature is implemented.
          </p>
        </div>
      </Modal>
    );
  }

  // Planning settings (placeholder for future)
  if (pagePath === '/planning') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Planning Settings">
        <div className="space-y-4">
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Planning settings will be added when needed.
          </p>
        </div>
      </Modal>
    );
  }

  // Tasks settings (placeholder for future)
  if (pagePath === '/tasks') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Tasks Settings">
        <div className="space-y-4">
          <p className="text-text-light-secondary dark:text-text-dark-secondary">
            Tasks settings will be added when needed.
          </p>
        </div>
      </Modal>
    );
  }

  // Default: no settings
  return null;
};
