/**
 * Template Settings Widget
 * Manage custom note templates from Settings page
 */

import { useState } from 'react';
import { FileText, Edit2, Trash2, BookOpen } from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';
import { TemplateLibrary } from '../../components/TemplateLibrary';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { NoteTemplate } from '../../types/notes';
import { getAvailableVariables } from '../../utils/templateVariables';

export function TemplateSettings() {
  const getAllNoteTemplates = useNotesStore((state) => state.getAllNoteTemplates);
  const deleteNoteTemplate = useNotesStore((state) => state.deleteNoteTemplate);

  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<NoteTemplate | null>(null);
  const [showVariableReference, setShowVariableReference] = useState(false);

  const allTemplates = getAllNoteTemplates();
  const customTemplates = allTemplates.filter((t) => !t.isBuiltIn);
  const builtInTemplates = allTemplates.filter((t) => t.isBuiltIn);

  const availableVariables = getAvailableVariables();

  const handleDeleteTemplate = (template: NoteTemplate) => {
    setDeleteConfirmTemplate(template);
  };

  const confirmDelete = () => {
    if (deleteConfirmTemplate) {
      deleteNoteTemplate(deleteConfirmTemplate.id);
      setDeleteConfirmTemplate(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Note Templates
        </h3>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          Manage custom note templates. Templates can include variables like {'{date}'}, {'{time}'}, {'{title}'}, and {'{user}'}.
        </p>
      </div>

      {/* Manage Templates Button */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowTemplateLibrary(true)}
          className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue-hover transition-colors font-medium"
        >
          Manage Templates
        </button>
        <button
          onClick={() => setShowVariableReference(!showVariableReference)}
          className="px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary rounded-lg hover:bg-border-light dark:hover:bg-border-dark transition-colors flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          {showVariableReference ? 'Hide' : 'Show'} Variable Reference
        </button>
      </div>

      {/* Template Count Summary */}
      <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
        <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
          <span className="font-semibold">{customTemplates.length}</span> custom template
          {customTemplates.length !== 1 ? 's' : ''},{' '}
          <span className="font-semibold">{builtInTemplates.length}</span> built-in template
          {builtInTemplates.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Variable Reference (Collapsible) */}
      {showVariableReference && (
        <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
          <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
            Available Template Variables
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark">
                  <th className="text-left py-2 pr-4 text-text-light-secondary dark:text-text-dark-secondary font-medium">
                    Variable
                  </th>
                  <th className="text-left py-2 pr-4 text-text-light-secondary dark:text-text-dark-secondary font-medium">
                    Description
                  </th>
                  <th className="text-left py-2 text-text-light-secondary dark:text-text-dark-secondary font-medium">
                    Example
                  </th>
                </tr>
              </thead>
              <tbody>
                {availableVariables.map((variable) => (
                  <tr
                    key={variable.name}
                    className="border-b border-border-light dark:border-border-dark last:border-0"
                  >
                    <td className="py-2 pr-4">
                      <code className="px-2 py-0.5 bg-accent-purple/10 text-accent-purple rounded font-mono text-xs">
                        {variable.syntax}
                      </code>
                    </td>
                    <td className="py-2 pr-4 text-text-light-secondary dark:text-text-dark-secondary">
                      {variable.description}
                    </td>
                    <td className="py-2 text-text-light-tertiary dark:text-text-dark-tertiary font-mono text-xs">
                      {variable.example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Custom Templates List */}
      {customTemplates.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
            Your Custom Templates
          </h4>
          <div className="space-y-2">
            {customTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark hover:border-accent-primary transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 flex items-center justify-center bg-surface-light dark:bg-surface-dark rounded text-lg flex-shrink-0">
                    {template.icon || '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                      {template.name}
                    </h5>
                    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {template.category}
                      {template.defaultTags && template.defaultTags.length > 0 && (
                        <span className="ml-2">
                          • {template.defaultTags.length} default tag
                          {template.defaultTags.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setShowTemplateLibrary(true)}
                    className="px-3 py-1.5 bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary rounded hover:bg-border-light dark:hover:bg-border-dark transition-colors flex items-center gap-1 text-sm"
                    title="Edit template"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template)}
                    className="px-3 py-1.5 bg-accent-red/10 text-accent-red rounded hover:bg-accent-red/20 transition-colors flex items-center gap-1 text-sm"
                    title="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {customTemplates.length === 0 && (
        <div className="text-center py-8 px-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
          <FileText className="w-12 h-12 mx-auto mb-3 text-text-light-tertiary dark:text-text-dark-tertiary" />
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
            You haven't created any custom templates yet.
          </p>
          <button
            onClick={() => setShowTemplateLibrary(true)}
            className="px-6 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue-hover transition-colors font-medium"
          >
            Create Your First Template
          </button>
        </div>
      )}

      {/* Template Library Modal */}
      <TemplateLibrary
        isOpen={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmTemplate && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteConfirmTemplate(null)}
          onConfirm={confirmDelete}
          title="Delete Template"
          message={`Are you sure you want to delete the template "${deleteConfirmTemplate.name}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}
