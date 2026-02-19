/**
 * Time Tracking Store Tests
 *
 * Tests the Zustand time tracking store for timer operations,
 * entry/project CRUD, queries, and filtering functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock logger
vi.mock('../../services/logger', () => ({
  logger: {
    module: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock timeTrackingDb - must be inline to avoid hoisting issues
vi.mock('../../db/timeTrackingDb', () => ({
  timeTrackingDb: {
    addEntry: vi.fn(() => Promise.resolve()),
    updateEntry: vi.fn(() => Promise.resolve()),
    deleteEntry: vi.fn(() => Promise.resolve()),
    addProject: vi.fn(() => Promise.resolve()),
    updateProject: vi.fn(() => Promise.resolve()),
    deleteProject: vi.fn(() => Promise.resolve()),
    archiveProject: vi.fn(() => Promise.resolve()),
    unarchiveProject: vi.fn(() => Promise.resolve()),
    getEntries: vi.fn(() => Promise.resolve([])),
    getProjects: vi.fn(() => Promise.resolve([])),
    getEntriesByDateRange: vi.fn(() => Promise.resolve([])),
    getEntriesByProject: vi.fn(() => Promise.resolve([])),
    getRecentEntries: vi.fn(() => Promise.resolve([])),
    getTodayTotal: vi.fn(() => Promise.resolve(0)),
    bulkDeleteEntries: vi.fn(() => Promise.resolve()),
    bulkUpdateEntries: vi.fn(() => Promise.resolve()),
  },
}));

// Mock useProjectContextStore
vi.mock('../useProjectContextStore', () => ({
  useProjectContextStore: {
    getState: () => ({
      activeProjectIds: [],
    }),
  },
  matchesProjectFilter: vi.fn(() => true),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock crypto.randomUUID
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

// Import after mocking
import { useTimeTrackingStore } from '../useTimeTrackingStore';
import { timeTrackingDb } from '../../db/timeTrackingDb';

// Type the mocked module
const mockTimeTrackingDb = vi.mocked(timeTrackingDb);

describe('useTimeTrackingStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      // Reset state manually
      useTimeTrackingStore.setState({
        activeEntry: null,
        entries: [],
        projects: [],
        selectedDate: new Date().toISOString().split('T')[0],
        selectedProject: null,
        selectedTags: [],
        viewMode: 'list',
        filters: {
          dateRange: 'last7days',
          projectIds: [],
          tags: [],
          searchQuery: '',
        },
        automaticTrackingEnabled: false,
        autoStartThreshold: 30,
        currentContext: null,
      });
    });
    vi.clearAllMocks();
    uuidCounter = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Timer Operations', () => {
    describe('startTimer', () => {
      it('should start a new timer with description', () => {
        const store = useTimeTrackingStore.getState();

        store.startTimer({ description: 'Working on task' });

        const state = useTimeTrackingStore.getState();
        expect(state.activeEntry).toBeDefined();
        expect(state.activeEntry?.description).toBe('Working on task');
        expect(state.activeEntry?.startTime).toBeDefined();
      });

      it('should start timer with project and task IDs', () => {
        const store = useTimeTrackingStore.getState();

        store.startTimer({
          description: 'Project work',
          projectId: 'project-1',
          taskId: 'task-1',
        });

        const state = useTimeTrackingStore.getState();
        expect(state.activeEntry?.projectId).toBe('project-1');
        expect(state.activeEntry?.taskId).toBe('task-1');
      });

      it('should set billable to true by default', () => {
        const store = useTimeTrackingStore.getState();

        store.startTimer({ description: 'Test' });

        const state = useTimeTrackingStore.getState();
        expect(state.activeEntry?.billable).toBe(true);
      });

      it('should set billable to false when specified', () => {
        const store = useTimeTrackingStore.getState();

        store.startTimer({ description: 'Test', billable: false });

        const state = useTimeTrackingStore.getState();
        expect(state.activeEntry?.billable).toBe(false);
      });

      it('should save to localStorage for persistence', () => {
        const store = useTimeTrackingStore.getState();

        store.startTimer({ description: 'Test' });

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'activeTimer',
          expect.any(String)
        );
      });
    });

    describe('stopTimer', () => {
      it('should stop running timer and save entry', async () => {
        const store = useTimeTrackingStore.getState();
        store.startTimer({ description: 'Work session' });

        await store.stopTimer();

        const state = useTimeTrackingStore.getState();
        expect(state.activeEntry).toBeNull();
        expect(state.entries.length).toBeGreaterThan(0);
        expect(mockTimeTrackingDb.addEntry).toHaveBeenCalled();
      });

      it('should calculate duration correctly', async () => {
        const store = useTimeTrackingStore.getState();
        store.startTimer({ description: 'Work session' });

        // Wait a bit to accumulate some time
        await new Promise(resolve => setTimeout(resolve, 100));

        await store.stopTimer();

        const state = useTimeTrackingStore.getState();
        const entry = state.entries[0];
        expect(entry?.duration).toBeGreaterThanOrEqual(0);
        expect(entry?.endTime).toBeDefined();
      });

      it('should do nothing if no timer is running', async () => {
        const store = useTimeTrackingStore.getState();

        await store.stopTimer();

        expect(mockTimeTrackingDb.addEntry).not.toHaveBeenCalled();
      });

      it('should clear localStorage after stopping', async () => {
        const store = useTimeTrackingStore.getState();
        store.startTimer({ description: 'Work' });

        await store.stopTimer();

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('activeTimer');
      });
    });

    describe('pauseTimer', () => {
      it('should pause running timer', () => {
        const store = useTimeTrackingStore.getState();
        store.startTimer({ description: 'Work' });

        store.pauseTimer();

        const state = useTimeTrackingStore.getState();
        expect(state.activeEntry?.isPaused).toBe(true);
        expect(state.activeEntry?.pausedAt).toBeDefined();
      });

      it('should do nothing if no timer is running', () => {
        const store = useTimeTrackingStore.getState();

        store.pauseTimer();

        const state = useTimeTrackingStore.getState();
        expect(state.activeEntry).toBeNull();
      });
    });

    describe('resumeTimer', () => {
      it('should resume paused timer', () => {
        const store = useTimeTrackingStore.getState();
        store.startTimer({ description: 'Work' });
        store.pauseTimer();

        store.resumeTimer();

        const state = useTimeTrackingStore.getState();
        expect(state.activeEntry?.isPaused).toBe(false);
        expect(state.activeEntry?.pausedAt).toBeUndefined();
      });

      it('should do nothing if timer is not paused', () => {
        const store = useTimeTrackingStore.getState();
        store.startTimer({ description: 'Work' });
        const originalStartTime = useTimeTrackingStore.getState().activeEntry?.startTime;

        store.resumeTimer();

        const state = useTimeTrackingStore.getState();
        expect(state.activeEntry?.startTime).toBe(originalStartTime);
      });
    });

    describe('isTimerRunning', () => {
      it('should return true when timer is running', () => {
        const store = useTimeTrackingStore.getState();
        store.startTimer({ description: 'Work' });

        expect(store.isTimerRunning()).toBe(true);
      });

      it('should return false when no timer is running', () => {
        const store = useTimeTrackingStore.getState();

        expect(store.isTimerRunning()).toBe(false);
      });
    });

    describe('updateActiveEntry', () => {
      it('should update active entry fields', () => {
        const store = useTimeTrackingStore.getState();
        store.startTimer({ description: 'Original' });

        store.updateActiveEntry({ description: 'Updated' });

        const state = useTimeTrackingStore.getState();
        expect(state.activeEntry?.description).toBe('Updated');
      });
    });

    describe('updateTimerDescription', () => {
      it('should update timer description', () => {
        const store = useTimeTrackingStore.getState();
        store.startTimer({ description: 'Original' });

        store.updateTimerDescription('New description');

        const state = useTimeTrackingStore.getState();
        expect(state.activeEntry?.description).toBe('New description');
      });
    });
  });

  describe('Entry Operations', () => {
    describe('addManualEntry', () => {
      it('should add a manual time entry', async () => {
        const store = useTimeTrackingStore.getState();

        await store.addManualEntry({
          description: 'Manual entry',
          startTime: '2024-01-01T09:00:00Z',
          endTime: '2024-01-01T10:00:00Z',
          duration: 3600,
          projectId: undefined,
          taskId: undefined,
          billable: true,
          tags: [],
          projectIds: [],
        });

        expect(mockTimeTrackingDb.addEntry).toHaveBeenCalled();
      });
    });

    describe('updateEntry', () => {
      it('should update an existing entry', async () => {
        const store = useTimeTrackingStore.getState();
        // Add an entry first
        useTimeTrackingStore.setState({
          entries: [{
            id: 'entry-1',
            workspaceId: 'default',
            description: 'Original',
            startTime: '2024-01-01T09:00:00Z',
            endTime: '2024-01-01T10:00:00Z',
            duration: 3600,
            billable: true,
            tags: [],
            createdAt: '2024-01-01T09:00:00Z',
            updatedAt: '2024-01-01T10:00:00Z',
            projectIds: [],
          }],
        });

        await store.updateEntry('entry-1', { description: 'Updated' });

        expect(mockTimeTrackingDb.updateEntry).toHaveBeenCalledWith('entry-1', expect.objectContaining({ description: 'Updated' }));
      });
    });

    describe('deleteEntry', () => {
      it('should delete an entry', async () => {
        const store = useTimeTrackingStore.getState();
        useTimeTrackingStore.setState({
          entries: [{
            id: 'entry-1',
            workspaceId: 'default',
            description: 'To delete',
            startTime: '2024-01-01T09:00:00Z',
            duration: 3600,
            billable: true,
            tags: [],
            createdAt: '2024-01-01T09:00:00Z',
            updatedAt: '2024-01-01T09:00:00Z',
            projectIds: [],
          }],
        });

        await store.deleteEntry('entry-1');

        expect(mockTimeTrackingDb.deleteEntry).toHaveBeenCalledWith('entry-1');
      });
    });
  });

  describe('Project Operations', () => {
    describe('addProject', () => {
      it('should add a new project', async () => {
        const store = useTimeTrackingStore.getState();

        await store.addProject({
          name: 'New Project',
          color: '#3b82f6',
          active: true,
          archived: false,
        });

        expect(mockTimeTrackingDb.addProject).toHaveBeenCalled();
      });
    });

    describe('updateProject', () => {
      it('should update an existing project', async () => {
        const store = useTimeTrackingStore.getState();
        useTimeTrackingStore.setState({
          projects: [{
            id: 'project-1',
            name: 'Original',
            color: '#3b82f6',
            active: true,
            archived: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }],
        });

        await store.updateProject('project-1', { name: 'Updated' });

        expect(mockTimeTrackingDb.updateProject).toHaveBeenCalledWith('project-1', expect.objectContaining({ name: 'Updated' }));
      });
    });

    describe('deleteProject', () => {
      it('should delete a project', async () => {
        const store = useTimeTrackingStore.getState();
        useTimeTrackingStore.setState({
          projects: [{
            id: 'project-1',
            name: 'To Delete',
            color: '#3b82f6',
            active: true,
            archived: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }],
        });

        await store.deleteProject('project-1');

        expect(mockTimeTrackingDb.deleteProject).toHaveBeenCalledWith('project-1');
      });
    });

    describe('archiveProject', () => {
      it('should archive a project', async () => {
        const store = useTimeTrackingStore.getState();
        useTimeTrackingStore.setState({
          projects: [{
            id: 'project-1',
            name: 'Active Project',
            color: '#3b82f6',
            active: true,
            archived: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }],
        });

        await store.archiveProject('project-1');

        // archiveProject calls DB and then loadProjects
        expect(mockTimeTrackingDb.archiveProject).toHaveBeenCalledWith('project-1');
      });
    });

    describe('unarchiveProject', () => {
      it('should unarchive a project', async () => {
        const store = useTimeTrackingStore.getState();
        useTimeTrackingStore.setState({
          projects: [{
            id: 'project-1',
            name: 'Archived Project',
            color: '#3b82f6',
            active: false,
            archived: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }],
        });

        await store.unarchiveProject('project-1');

        // unarchiveProject calls DB and then loadProjects
        expect(mockTimeTrackingDb.unarchiveProject).toHaveBeenCalledWith('project-1');
      });
    });
  });

  describe('Query Operations', () => {
    describe('getEntriesByDateRange', () => {
      it('should return entries within date range', () => {
        const store = useTimeTrackingStore.getState();
        useTimeTrackingStore.setState({
          entries: [
            {
              id: 'entry-1',
              workspaceId: 'default',
              description: 'In range',
              startTime: '2024-01-15T09:00:00Z',
              duration: 3600,
              billable: true,
              tags: [],
              createdAt: '2024-01-15T09:00:00Z',
              updatedAt: '2024-01-15T09:00:00Z',
              projectIds: [],
            },
            {
              id: 'entry-2',
              workspaceId: 'default',
              description: 'Out of range',
              startTime: '2024-02-15T09:00:00Z',
              duration: 3600,
              billable: true,
              tags: [],
              createdAt: '2024-02-15T09:00:00Z',
              updatedAt: '2024-02-15T09:00:00Z',
              projectIds: [],
            },
          ],
        });

        const entries = store.getEntriesByDateRange(
          new Date('2024-01-01'),
          new Date('2024-01-31')
        );

        expect(entries).toHaveLength(1);
        expect(entries[0].description).toBe('In range');
      });
    });

    describe('getEntriesByProject', () => {
      it('should return entries for specific project', () => {
        const store = useTimeTrackingStore.getState();
        useTimeTrackingStore.setState({
          entries: [
            {
              id: 'entry-1',
              workspaceId: 'default',
              description: 'Project A entry',
              projectId: 'project-a',
              startTime: '2024-01-15T09:00:00Z',
              duration: 3600,
              billable: true,
              tags: [],
              createdAt: '2024-01-15T09:00:00Z',
              updatedAt: '2024-01-15T09:00:00Z',
              projectIds: [],
            },
            {
              id: 'entry-2',
              workspaceId: 'default',
              description: 'Project B entry',
              projectId: 'project-b',
              startTime: '2024-01-15T09:00:00Z',
              duration: 3600,
              billable: true,
              tags: [],
              createdAt: '2024-01-15T09:00:00Z',
              updatedAt: '2024-01-15T09:00:00Z',
              projectIds: [],
            },
          ],
        });

        const entries = store.getEntriesByProject('project-a');

        expect(entries).toHaveLength(1);
        expect(entries[0].description).toBe('Project A entry');
      });
    });
  });

  describe('Filter Operations', () => {
    describe('setFilters', () => {
      it('should update filter settings', () => {
        const store = useTimeTrackingStore.getState();

        store.setFilters({ dateRange: 'last30days', searchQuery: 'test' });

        const state = useTimeTrackingStore.getState();
        expect(state.filters.dateRange).toBe('last30days');
        expect(state.filters.searchQuery).toBe('test');
      });

      it('should merge with existing filters', () => {
        const store = useTimeTrackingStore.getState();
        store.setFilters({ dateRange: 'last7days', projectIds: ['p1'] });

        store.setFilters({ searchQuery: 'updated' });

        const state = useTimeTrackingStore.getState();
        expect(state.filters.dateRange).toBe('last7days');
        expect(state.filters.projectIds).toEqual(['p1']);
        expect(state.filters.searchQuery).toBe('updated');
      });
    });

    describe('clearFilters', () => {
      it('should reset all filters to defaults', () => {
        const store = useTimeTrackingStore.getState();
        store.setFilters({
          dateRange: 'last30days',
          projectIds: ['p1'],
          searchQuery: 'test',
        });

        store.clearFilters();

        const state = useTimeTrackingStore.getState();
        expect(state.filters.projectIds).toEqual([]);
        expect(state.filters.searchQuery).toBe('');
      });
    });

    describe('setViewMode', () => {
      it('should update view mode', () => {
        const store = useTimeTrackingStore.getState();

        store.setViewMode('calendar');

        const state = useTimeTrackingStore.getState();
        expect(state.viewMode).toBe('calendar');
      });
    });
  });

  describe('Utility Operations', () => {
    describe('getTotalTime', () => {
      it('should calculate total time for all entries', () => {
        const store = useTimeTrackingStore.getState();
        useTimeTrackingStore.setState({
          entries: [
            {
              id: 'entry-1',
              workspaceId: 'default',
              description: 'Entry 1',
              startTime: '2024-01-15T09:00:00Z',
              duration: 3600, // 1 hour
              billable: true,
              tags: [],
              createdAt: '2024-01-15T09:00:00Z',
              updatedAt: '2024-01-15T09:00:00Z',
              projectIds: [],
            },
            {
              id: 'entry-2',
              workspaceId: 'default',
              description: 'Entry 2',
              startTime: '2024-01-15T10:00:00Z',
              duration: 1800, // 30 min
              billable: true,
              tags: [],
              createdAt: '2024-01-15T10:00:00Z',
              updatedAt: '2024-01-15T10:00:00Z',
              projectIds: [],
            },
          ],
        });

        const total = store.getTotalTime();

        expect(total).toBe(5400); // 1.5 hours in seconds
      });
    });

    describe('getTimeByProject', () => {
      it('should aggregate time by project', () => {
        const store = useTimeTrackingStore.getState();
        useTimeTrackingStore.setState({
          entries: [
            {
              id: 'entry-1',
              workspaceId: 'default',
              description: 'Project A work',
              projectId: 'project-a',
              startTime: '2024-01-15T09:00:00Z',
              duration: 3600,
              billable: true,
              tags: [],
              createdAt: '2024-01-15T09:00:00Z',
              updatedAt: '2024-01-15T09:00:00Z',
              projectIds: [],
            },
            {
              id: 'entry-2',
              workspaceId: 'default',
              description: 'Project A more work',
              projectId: 'project-a',
              startTime: '2024-01-15T10:00:00Z',
              duration: 1800,
              billable: true,
              tags: [],
              createdAt: '2024-01-15T10:00:00Z',
              updatedAt: '2024-01-15T10:00:00Z',
              projectIds: [],
            },
            {
              id: 'entry-3',
              workspaceId: 'default',
              description: 'Project B work',
              projectId: 'project-b',
              startTime: '2024-01-15T11:00:00Z',
              duration: 7200,
              billable: true,
              tags: [],
              createdAt: '2024-01-15T11:00:00Z',
              updatedAt: '2024-01-15T11:00:00Z',
              projectIds: [],
            },
          ],
        });

        const timeByProject = store.getTimeByProject();

        expect(timeByProject['project-a']).toBe(5400); // 1.5 hours
        expect(timeByProject['project-b']).toBe(7200); // 2 hours
      });
    });

    describe('exportToCSV', () => {
      it('should export entries to CSV format', () => {
        const store = useTimeTrackingStore.getState();
        const entries = [
          {
            id: 'entry-1',
            workspaceId: 'default',
            description: 'Test entry',
            startTime: '2024-01-15T09:00:00Z',
            endTime: '2024-01-15T10:00:00Z',
            duration: 3600,
            billable: true,
            tags: ['tag1'],
            createdAt: '2024-01-15T09:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
            projectIds: [],
          },
        ];

        const csv = store.exportToCSV(entries);

        // Check header and content - header uses "Description" not "description"
        expect(csv).toContain('Description');
        expect(csv).toContain('Test entry');
        // Duration is formatted (e.g., "1h 00m") not raw seconds
        expect(csv).toContain('1h 00m');
      });
    });
  });

  describe('Bulk Operations', () => {
    describe('bulkDeleteEntries', () => {
      it('should delete multiple entries', async () => {
        const store = useTimeTrackingStore.getState();
        useTimeTrackingStore.setState({
          entries: [
            { id: 'entry-1', workspaceId: 'default', description: 'Entry 1', startTime: '2024-01-01T09:00:00Z', duration: 3600, billable: true, tags: [], createdAt: '2024-01-01T09:00:00Z', updatedAt: '2024-01-01T09:00:00Z', projectIds: [] },
            { id: 'entry-2', workspaceId: 'default', description: 'Entry 2', startTime: '2024-01-01T10:00:00Z', duration: 3600, billable: true, tags: [], createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z', projectIds: [] },
            { id: 'entry-3', workspaceId: 'default', description: 'Entry 3', startTime: '2024-01-01T11:00:00Z', duration: 3600, billable: true, tags: [], createdAt: '2024-01-01T11:00:00Z', updatedAt: '2024-01-01T11:00:00Z', projectIds: [] },
          ],
        });

        await store.bulkDeleteEntries(['entry-1', 'entry-2']);

        // Store uses deleteEntry in a loop via Promise.all
        expect(mockTimeTrackingDb.deleteEntry).toHaveBeenCalledWith('entry-1');
        expect(mockTimeTrackingDb.deleteEntry).toHaveBeenCalledWith('entry-2');
        expect(mockTimeTrackingDb.deleteEntry).toHaveBeenCalledTimes(2);

        // Verify state updated
        const state = useTimeTrackingStore.getState();
        expect(state.entries).toHaveLength(1);
        expect(state.entries[0].id).toBe('entry-3');
      });
    });

    describe('bulkUpdateEntries', () => {
      it('should update multiple entries', async () => {
        const store = useTimeTrackingStore.getState();
        useTimeTrackingStore.setState({
          entries: [
            { id: 'entry-1', workspaceId: 'default', description: 'Entry 1', startTime: '2024-01-01T09:00:00Z', duration: 3600, billable: false, tags: [], createdAt: '2024-01-01T09:00:00Z', updatedAt: '2024-01-01T09:00:00Z', projectIds: [] },
            { id: 'entry-2', workspaceId: 'default', description: 'Entry 2', startTime: '2024-01-01T10:00:00Z', duration: 3600, billable: false, tags: [], createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z', projectIds: [] },
          ],
        });

        await store.bulkUpdateEntries(['entry-1', 'entry-2'], { billable: true });

        // Store uses updateEntry in a loop via Promise.all
        expect(mockTimeTrackingDb.updateEntry).toHaveBeenCalledWith('entry-1', { billable: true });
        expect(mockTimeTrackingDb.updateEntry).toHaveBeenCalledWith('entry-2', { billable: true });

        // Verify state updated
        const state = useTimeTrackingStore.getState();
        expect(state.entries[0].billable).toBe(true);
        expect(state.entries[1].billable).toBe(true);
      });
    });
  });

  describe('Automatic Tracking', () => {
    describe('setAutomaticTracking', () => {
      it('should enable automatic tracking', () => {
        const store = useTimeTrackingStore.getState();

        store.setAutomaticTracking(true);

        const state = useTimeTrackingStore.getState();
        expect(state.automaticTrackingEnabled).toBe(true);
      });

      it('should disable automatic tracking', () => {
        const store = useTimeTrackingStore.getState();
        store.setAutomaticTracking(true);

        store.setAutomaticTracking(false);

        const state = useTimeTrackingStore.getState();
        expect(state.automaticTrackingEnabled).toBe(false);
      });
    });

    describe('setAutoStartThreshold', () => {
      it('should update threshold', () => {
        const store = useTimeTrackingStore.getState();

        store.setAutoStartThreshold(60);

        const state = useTimeTrackingStore.getState();
        expect(state.autoStartThreshold).toBe(60);
      });
    });

    describe('updateContext', () => {
      it('should not update context when automatic tracking is disabled', () => {
        const store = useTimeTrackingStore.getState();
        store.setAutomaticTracking(false);

        store.updateContext({ type: 'task', id: 'task-1', name: 'Test Task' });

        const state = useTimeTrackingStore.getState();
        expect(state.currentContext).toBeNull();
      });

      it('should update context when automatic tracking is enabled', () => {
        const store = useTimeTrackingStore.getState();
        store.setAutomaticTracking(true);

        store.updateContext({ type: 'task', id: 'task-1', name: 'Test Task' });

        const state = useTimeTrackingStore.getState();
        expect(state.currentContext?.type).toBe('task');
        expect(state.currentContext?.id).toBe('task-1');
        expect(state.currentContext?.name).toBe('Test Task');
      });
    });
  });

  describe('Kanban Integration', () => {
    describe('getEntriesForCard', () => {
      it('should return entries for specific card', () => {
        const store = useTimeTrackingStore.getState();
        useTimeTrackingStore.setState({
          entries: [
            { id: 'entry-1', workspaceId: 'default', description: 'Card work', taskId: 'card-1', startTime: '2024-01-01T09:00:00Z', duration: 3600, billable: true, tags: [], createdAt: '2024-01-01T09:00:00Z', updatedAt: '2024-01-01T09:00:00Z', projectIds: [] },
            { id: 'entry-2', workspaceId: 'default', description: 'Other card', taskId: 'card-2', startTime: '2024-01-01T10:00:00Z', duration: 3600, billable: true, tags: [], createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z', projectIds: [] },
          ],
        });

        const entries = store.getEntriesForCard('card-1');

        expect(entries).toHaveLength(1);
        expect(entries[0].description).toBe('Card work');
      });
    });

    describe('getTotalTimeForCard', () => {
      it('should calculate total time for card', () => {
        const store = useTimeTrackingStore.getState();
        useTimeTrackingStore.setState({
          entries: [
            { id: 'entry-1', workspaceId: 'default', description: 'Work 1', taskId: 'card-1', startTime: '2024-01-01T09:00:00Z', duration: 3600, billable: true, tags: [], createdAt: '2024-01-01T09:00:00Z', updatedAt: '2024-01-01T09:00:00Z', projectIds: [] },
            { id: 'entry-2', workspaceId: 'default', description: 'Work 2', taskId: 'card-1', startTime: '2024-01-01T10:00:00Z', duration: 1800, billable: true, tags: [], createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z', projectIds: [] },
          ],
        });

        const total = store.getTotalTimeForCard('card-1');

        expect(total).toBe(5400); // 1.5 hours
      });
    });

    describe('startTimerForCard', () => {
      it('should start timer for specific card', () => {
        const store = useTimeTrackingStore.getState();

        store.startTimerForCard('card-1', 'Task Name');

        const state = useTimeTrackingStore.getState();
        expect(state.activeEntry?.taskId).toBe('card-1');
        expect(state.activeEntry?.description).toBe('Task Name');
      });
    });
  });
});
