/**
 * ProjectSettingsModal Component
 *
 * Modal wrapper for the ProjectSettings component.
 * Used from the ProjectContextDropdown to allow project management
 * without navigating away from the current page.
 *
 * Uses the same ProjectSettings component as the Settings page,
 * so all changes are automatically synced via the Zustand store.
 */

import React from 'react';
import { Modal } from './Modal';
import { ProjectSettings } from '../widgets/Settings/ProjectSettings';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Projects"
      maxWidth="xl"
    >
      <ProjectSettings />
    </Modal>
  );
};
