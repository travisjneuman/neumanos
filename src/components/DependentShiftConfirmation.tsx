import type { Task } from '../types';

interface TaskShift {
  taskId: string;
  newStartDate: string | null;
  newDueDate: string | null;
  reason: string;
}

interface DependentShiftConfirmationProps {
  shifts: TaskShift[];
  tasks: Task[];
  onConfirm: () => void;
  onCancel: () => void;
  onDontAskAgain: () => void;
}

export function DependentShiftConfirmation({
  shifts,
  tasks,
  onConfirm,
  onCancel,
  onDontAskAgain,
}: DependentShiftConfirmationProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-bg-primary border border-border-primary rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-primary">
          <h2 className="text-xl font-semibold text-text-primary">
            Shift Dependent Tasks?
          </h2>
          <p className="text-text-secondary mt-2">
            Moving this task will affect <strong>{shifts.length}</strong> dependent task{shifts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Affected Tasks List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {shifts.map((shift) => {
              const task = tasks.find(t => t.id === shift.taskId);
              if (!task) return null;

              const oldStart = formatDate(task.startDate);
              const newStart = formatDate(shift.newStartDate);
              const oldDue = formatDate(task.dueDate);
              const newDue = formatDate(shift.newDueDate);

              return (
                <div
                  key={shift.taskId}
                  className="bg-bg-secondary rounded-lg p-4 border border-border-primary"
                >
                  <div className="font-medium text-text-primary mb-2">
                    {task.title}
                  </div>
                  <div className="text-sm text-text-secondary space-y-1">
                    {task.startDate !== shift.newStartDate && (
                      <div className="flex items-center gap-2">
                        <span className="text-text-tertiary">Start:</span>
                        <span className="line-through text-text-tertiary">{oldStart}</span>
                        <span className="text-accent-primary">→</span>
                        <span className="text-text-primary font-medium">{newStart}</span>
                      </div>
                    )}
                    {task.dueDate !== shift.newDueDate && (
                      <div className="flex items-center gap-2">
                        <span className="text-text-tertiary">Due:</span>
                        <span className="line-through text-text-tertiary">{oldDue}</span>
                        <span className="text-accent-primary">→</span>
                        <span className="text-text-primary font-medium">{newDue}</span>
                      </div>
                    )}
                    <div className="text-xs text-text-tertiary mt-2 italic">
                      {shift.reason}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-border-primary flex items-center justify-between">
          <button
            onClick={onDontAskAgain}
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Don't ask again
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-border-primary text-text-primary hover:bg-bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-accent-primary text-white hover:bg-accent-primary-hover transition-colors"
            >
              Shift All Tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
