/**
 * Forms Page - Library View
 * Grid of all form templates with create/search/delete
 *
 * Phase 5: Exports FormsContent component for embedding in Create page
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreErrorBoundary } from '../components/StoreErrorBoundary';
import { useFormsStore } from '../stores/useFormsStore';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Search, Grid3x3, List, FileText } from 'lucide-react';

/**
 * FormsContent - Exportable content component for embedding in Create page
 * Phase 5: Renders without page wrapper for use as a tab
 */
export function FormsContent() {
  const navigate = useNavigate();
  // Subscribe to raw data arrays (stable references)
  const forms = useFormsStore((s) => s.forms);
  const responses = useFormsStore((s) => s.responses);
  const createForm = useFormsStore((s) => s.createForm);
  const deleteForm = useFormsStore((s) => s.deleteForm);
  const duplicateForm = useFormsStore((s) => s.duplicateForm);

  // Compute derived stats in useMemo to avoid infinite loop
  const formsWithStats = useMemo(() => {
    return forms.map((form) => {
      const formResponses = responses.filter((r) => r.formId === form.id);
      const sortedResponses = [...formResponses].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      return {
        ...form,
        responseCount: formResponses.length,
        lastSubmittedAt: sortedResponses.length > 0 ? sortedResponses[0].submittedAt : undefined,
      };
    });
  }, [forms, responses]);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

  const handleCreateForm = () => {
    const newForm = createForm('Untitled Form');
    navigate(`/forms/${newForm.id}/edit`);
  };

  const handleOpenBuilder = (id: string) => {
    navigate(`/forms/${id}/edit`);
  };

  const handleFillForm = (id: string) => {
    navigate(`/forms/${id}/fill`);
  };

  const handleViewResponses = (id: string) => {
    navigate(`/forms/${id}/responses`);
  };

  const handleDeleteForm = (id: string) => {
    setFormToDelete(id);
  };

  const confirmDeleteForm = () => {
    if (formToDelete) {
      deleteForm(formToDelete);
      setFormToDelete(null);
    }
  };

  const handleDuplicateForm = (id: string) => {
    const duplicate = duplicateForm(id);
    if (duplicate) {
      navigate(`/forms/${duplicate.id}/edit`);
    }
  };

  // Filter forms by search query
  const filteredForms = formsWithStats.filter((form) =>
    form.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by most recently updated
  const sortedForms = [...filteredForms].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
        <div>
          <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Forms
          </h2>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
            {sortedForms.length} {sortedForms.length === 1 ? 'form' : 'forms'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
            <input
              type="text"
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex gap-1 bg-surface-light dark:bg-surface-dark rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-accent-blue dark:bg-accent-blue text-white'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
              }`}
              aria-label="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-accent-blue dark:bg-accent-blue text-white'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Create button */}
          <button
            onClick={handleCreateForm}
            className="flex items-center gap-2 px-4 py-2 bg-accent-blue dark:bg-accent-blue text-white rounded-lg hover:bg-accent-blue-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Form
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {sortedForms.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 mb-4 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center">
              <FileText className="w-12 h-12 text-text-light-tertiary dark:text-text-dark-tertiary" />
            </div>
            <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
              {searchQuery ? 'No forms found' : 'No forms yet'}
            </h2>
            <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6 max-w-md">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Create your first form to track habits, collect data, or build custom surveys'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateForm}
                className="flex items-center gap-2 px-6 py-3 bg-accent-blue dark:bg-accent-blue text-white rounded-lg hover:bg-accent-blue-hover transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Your First Form
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid view
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                onEdit={() => handleOpenBuilder(form.id)}
                onFill={() => handleFillForm(form.id)}
                onViewResponses={() => handleViewResponses(form.id)}
                onDelete={() => handleDeleteForm(form.id)}
                onDuplicate={() => handleDuplicateForm(form.id)}
              />
            ))}
          </div>
        ) : (
          // List view
          <div className="space-y-2">
            {sortedForms.map((form) => (
              <FormListItem
                key={form.id}
                form={form}
                onEdit={() => handleOpenBuilder(form.id)}
                onFill={() => handleFillForm(form.id)}
                onViewResponses={() => handleViewResponses(form.id)}
                onDelete={() => handleDeleteForm(form.id)}
                onDuplicate={() => handleDuplicateForm(form.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={formToDelete !== null}
        onClose={() => setFormToDelete(null)}
        onConfirm={confirmDeleteForm}
        title="Delete Form"
        message="Are you sure you want to delete this form and all its responses?"
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}

/**
 * Forms Page - Wraps FormsContent with page structure
 */
export default function Forms() {
  return (
    <StoreErrorBoundary storeName="forms">
      <main className="flex flex-col h-full bg-surface-light dark:bg-surface-dark">
        <FormsContent />
      </main>
    </StoreErrorBoundary>
  );
}

// Form Card Component (Grid View)
interface FormCardProps {
  form: {
    id: string;
    title: string;
    description?: string;
    updatedAt: Date;
    fields: unknown[];
    responseCount: number;
    lastSubmittedAt?: Date;
  };
  onEdit: () => void;
  onFill: () => void;
  onViewResponses: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function FormCard({ form, onEdit, onFill, onViewResponses, onDelete, onDuplicate }: FormCardProps) {
  return (
    <div className="group bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 dark:from-accent-blue/20 dark:to-accent-purple/10">
        <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary truncate mb-1">
          {form.title}
        </h3>
        {form.description && (
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary line-clamp-2">
            {form.description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="p-4">
        <div className="flex items-center justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary mb-3">
          <span>{form.fields.length} {form.fields.length === 1 ? 'field' : 'fields'}</span>
          <span>{form.responseCount} {form.responseCount === 1 ? 'response' : 'responses'}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onFill}
            className="w-full px-3 py-2 text-sm bg-accent-blue dark:bg-accent-blue text-white rounded hover:bg-accent-blue-hover"
          >
            Fill Form
          </button>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex-1 px-2 py-1 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated rounded hover:bg-surface-light dark:hover:bg-surface-dark"
            >
              Edit
            </button>
            <button
              onClick={onViewResponses}
              className="flex-1 px-2 py-1 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated rounded hover:bg-surface-light dark:hover:bg-surface-dark"
            >
              Responses
            </button>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="flex-1 px-2 py-1 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated rounded hover:bg-surface-light dark:hover:bg-surface-dark"
            >
              Duplicate
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex-1 px-2 py-1 text-xs bg-accent-red/10 text-accent-red rounded hover:bg-accent-red/20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Form List Item Component (List View)
function FormListItem({ form, onEdit, onFill, onViewResponses, onDelete, onDuplicate }: FormCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg hover:shadow-md transition-shadow">
      {/* Icon */}
      <div className="w-12 h-12 bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 rounded flex items-center justify-center flex-shrink-0">
        <FileText className="w-6 h-6 text-accent-blue dark:text-accent-purple" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary truncate">
          {form.title}
        </h3>
        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
          {form.fields.length} fields • {form.responseCount} responses • Updated {new Date(form.updatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onFill}
          className="px-4 py-2 text-sm bg-accent-blue dark:bg-accent-blue text-white rounded hover:bg-accent-blue-hover"
        >
          Fill Form
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated rounded hover:bg-surface-light dark:hover:bg-surface-dark"
        >
          Edit
        </button>
        <button
          onClick={onViewResponses}
          className="px-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated rounded hover:bg-surface-light dark:hover:bg-surface-dark"
        >
          Responses
        </button>
        <button
          onClick={onDuplicate}
          className="px-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated rounded hover:bg-surface-light dark:hover:bg-surface-dark"
        >
          Duplicate
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 text-sm bg-accent-red/10 text-accent-red rounded hover:bg-accent-red/20"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
