import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, FolderOpen, Archive } from 'lucide-react';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import { ConfirmDialog } from './ConfirmDialog';
import type { TimeTrackingProject } from '../types';

// Predefined color palette for projects
const PROJECT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Cyan
  '#45B7D1', // Blue
  '#FFA07A', // Orange
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Light Blue
  '#52B788', // Green
  '#F8B500', // Gold
];

interface ProjectFormData {
  name: string;
  color: string;
  clientName?: string;
  hourlyRate?: number;
  active: boolean;
}

/**
 * ProjectManager Component
 * CRUD interface for managing time tracking projects
 */
export function ProjectManager() {
  const {
    projects,
    loadProjects,
    addProject,
    updateProject,
    deleteProject,
  } = useTimeTrackingStore();

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    color: PROJECT_COLORS[0],
    clientName: '',
    hourlyRate: undefined,
    active: true,
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await loadProjects();
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadProjects]);

  const handleOpenForm = (project?: TimeTrackingProject) => {
    if (project) {
      setEditingId(project.id);
      setFormData({
        name: project.name,
        color: project.color,
        clientName: project.clientName || '',
        hourlyRate: project.hourlyRate,
        active: project.active,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
        clientName: '',
        hourlyRate: undefined,
        active: true,
      });
    }
    setFormError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.name.trim()) {
      setFormError('Project name is required');
      return;
    }

    try {
      if (editingId) {
        await updateProject(editingId, formData);
      } else {
        await addProject({ ...formData, archived: false });
      }

      handleCloseForm();
      await loadProjects(); // Refresh list
    } catch (error) {
      console.error('Failed to save project:', error);
      setFormError('Failed to save project. Please try again.');
    }
  };

  const handleDelete = useCallback((id: string) => {
    setProjectToDelete(id);
  }, []);

  const confirmDeleteProject = useCallback(async () => {
    if (!projectToDelete) return;

    setDeletingId(projectToDelete);
    try {
      await deleteProject(projectToDelete);
      await loadProjects(); // Refresh list
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setDeletingId(null);
      setProjectToDelete(null);
    }
  }, [projectToDelete, deleteProject, loadProjects]);

  const handleToggleActive = async (project: TimeTrackingProject) => {
    try {
      await updateProject(project.id, { active: !project.active });
      await loadProjects(); // Refresh list
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const activeProjects = projects.filter(p => p.active && !p.archived);
  const archivedProjects = projects.filter(p => !p.active || p.archived);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-light-secondary dark:text-text-dark-secondary">
          Loading projects...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Projects
          </h2>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
            Organize your time entries by project
          </p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white dark:text-dark-background bg-accent-primary rounded-buttonhover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Project Form */}
      {showForm && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-button border border-border-light dark:border-border-dark p-6">
          <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
            {editingId ? 'Edit Project' : 'New Project'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="px-4 py-3 bg-accent-red/10 border border-accent-red/20 rounded-button text-accent-red text-sm">
                {formError}
              </div>
            )}

            {/* Project Name */}
            <div>
              <label
                htmlFor="projectName"
                className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2"
              >
                Project Name *
              </label>
              <input
                id="projectName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-buttonfocus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary"
                placeholder="e.g., NeumanOS, Client Work"
                autoFocus
              />
            </div>

            {/* Project Color */}
            <div>
              <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                Color
              </label>
              <div className="grid grid-cols-10 gap-2">
                {PROJECT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-accent-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Client Name */}
            <div>
              <label
                htmlFor="projectClientName"
                className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2"
              >
                Client Name <span className="text-text-light-tertiary dark:text-text-dark-tertiary font-normal">(optional)</span>
              </label>
              <input
                id="projectClientName"
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-buttonfocus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary"
                placeholder="e.g., Acme Corp, John Doe"
              />
            </div>

            {/* Hourly Rate */}
            <div>
              <label
                htmlFor="projectHourlyRate"
                className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2"
              >
                Default Hourly Rate <span className="text-text-light-tertiary dark:text-text-dark-tertiary font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary text-sm">
                  $
                </span>
                <input
                  id="projectHourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourlyRate || ''}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full pl-7 pr-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-buttonfocus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
                Used to calculate billable amounts for time entries
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                id="projectActive"
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-accent-primary bg-surface-light-elevated dark:bg-surface-dark-elevated border-border-light dark:border-border-dark rounded-buttonfocus:ring-2 focus:ring-accent-primary"
              />
              <label
                htmlFor="projectActive"
                className="text-sm text-text-light-primary dark:text-text-dark-primary"
              >
                Active (show in project selector)
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 text-sm font-medium text-text-light-primary dark:text-text-dark-primary bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button hover:bg-surface-light dark:hover:bg-surface-dark transition-all duration-standard ease-smooth"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white dark:text-dark-background bg-accent-primary rounded-buttonhover:opacity-90 transition-opacity"
              >
                {editingId ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Projects List */}
      <div>
        <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-3 flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          Active Projects ({activeProjects.length})
        </h3>

        {activeProjects.length === 0 ? (
          <div className="bg-surface-light dark:bg-surface-dark rounded-button border border-border-light dark:border-border-dark p-8 text-center">
            <p className="text-text-light-secondary dark:text-text-dark-secondary mb-2">
              No active projects yet
            </p>
            <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              Create your first project to organize time entries
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="bg-surface-light dark:bg-surface-dark rounded-button border border-border-light dark:border-border-dark p-4 hover:border-accent-primary transition-all duration-standard ease-smooth"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <h4 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary truncate">
                        {project.name}
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {project.clientName && (
                        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                          Client: {project.clientName}
                        </p>
                      )}
                      {project.hourlyRate && (
                        <p className="text-sm font-mono font-medium text-status-success-text">
                          ${project.hourlyRate.toFixed(2)}/hr
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleOpenForm(project)}
                      className="p-2 rounded-buttonhover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-blue dark:hover:text-accent-blue-hover transition-all duration-standard ease-smooth"
                      title="Edit project"
                      aria-label="Edit project"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(project)}
                      className="p-2 rounded-buttonhover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:text-status-warning transition-all duration-standard ease-smooth"
                      title="Archive project"
                      aria-label="Archive project"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={deletingId === project.id}
                      className="p-2 rounded-buttonhover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:text-status-error transition-all duration-standard ease-smooth disabled:opacity-50"
                      title="Delete project"
                      aria-label="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-light-secondary dark:text-text-dark-secondary mb-3 flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Archived Projects ({archivedProjects.length})
          </h3>

          <div className="grid gap-3">
            {archivedProjects.map((project) => (
              <div
                key={project.id}
                className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-button border border-border-light dark:border-border-dark p-4 opacity-60"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <h4 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary truncate">
                        {project.name}
                      </h4>
                    </div>
                    {project.clientName && (
                      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        Client: {project.clientName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(project)}
                      className="p-2 rounded-button hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-green transition-all duration-standard ease-smooth"
                      title="Unarchive project"
                      aria-label="Unarchive project"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={deletingId === project.id}
                      className="p-2 rounded-button hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-red transition-all duration-standard ease-smooth disabled:opacity-50"
                      title="Delete project"
                      aria-label="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={projectToDelete !== null}
        onClose={() => setProjectToDelete(null)}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message="Delete this project? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
