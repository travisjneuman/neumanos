import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { TimeEntry, TimeTrackingProject } from '../types';

/**
 * Time Tracking Database using Dexie.js for IndexedDB
 * Handles efficient storage and querying of time entries and projects
 */
class TimeTrackingDatabase extends Dexie {
  timeEntries!: Table<TimeEntry, string>;
  projects!: Table<TimeTrackingProject, string>;

  constructor() {
    // Historical name retained for data continuity — do not rename without migration
    super('NeumanBrainTimeTracking');

    // Schema version 1 - Original schema
    this.version(1).stores({
      timeEntries: 'id, projectId, taskId, startTime, endTime, [projectId+startTime], description',
      projects: 'id, name, active, archived'
    });

    // Schema version 2 - Add projectIds array for global project context filter
    // Note: We add *projectIds as a multi-entry index for efficient querying
    this.version(2).stores({
      timeEntries: 'id, projectId, taskId, startTime, endTime, [projectId+startTime], description, *projectIds',
      projects: 'id, name, active, archived'
    }).upgrade(async tx => {
      // Migrate existing entries: add empty projectIds array
      await tx.table('timeEntries').toCollection().modify(entry => {
        if (!entry.projectIds) {
          entry.projectIds = [];
        }
      });
      console.log('[TimeTrackingDB] Migrated entries to include projectIds field');
    });
  }
}

// Create database instance
export const db = new TimeTrackingDatabase();

/**
 * Time Tracking Database Helper Functions
 * Provides a clean API for database operations
 */
export const timeTrackingDb = {
  // ==================== TIME ENTRIES ====================

  /**
   * Add a new time entry
   */
  async addEntry(entry: TimeEntry): Promise<void> {
    await db.timeEntries.add(entry);
  },

  /**
   * Get time entries with optional filters
   * OPTIMIZED: Uses database-level filtering for date ranges and projects
   */
  async getEntries(filters?: {
    startDate?: Date;
    endDate?: Date;
    projectId?: string;
    searchQuery?: string;
    limit?: number;
    offset?: number;
  }): Promise<TimeEntry[]> {
    // Start with the most selective filter for performance
    let collection;

    // 1. Date range filtering (database-level, most efficient)
    if (filters?.startDate && filters?.endDate) {
      collection = db.timeEntries
        .where('startTime')
        .between(
          filters.startDate.toISOString(),
          filters.endDate.toISOString(),
          true,  // include lower bound
          true   // include upper bound
        );
    } else {
      // No date filter - start with all entries ordered by time
      collection = db.timeEntries.orderBy('startTime');
    }

    // 2. Project filtering (database-level if no date filter, otherwise client-side)
    if (filters?.projectId) {
      if (!filters?.startDate || !filters?.endDate) {
        // Use database index when no date filter
        collection = db.timeEntries.where('projectId').equals(filters.projectId);
      } else {
        // Apply as client-side filter after date filtering
        collection = collection.filter(entry => entry.projectId === filters.projectId);
      }
    }

    // Always reverse to show newest first
    collection = collection.reverse();

    // 3. Pagination (database-level)
    if (filters?.offset !== undefined) {
      collection = collection.offset(filters.offset);
    }

    if (filters?.limit !== undefined) {
      collection = collection.limit(filters.limit);
    }

    // 4. Get results
    let entries = await collection.toArray();

    // 5. Search filtering (must be client-side - no full-text index)
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      entries = entries.filter(entry =>
        entry.description.toLowerCase().includes(query) ||
        (entry.notes?.toLowerCase().includes(query) ?? false)
      );
    }

    return entries;
  },

  /**
   * Get total count of entries matching filters (for pagination)
   */
  async getEntriesCount(filters?: {
    startDate?: Date;
    endDate?: Date;
    projectId?: string;
    searchQuery?: string;
  }): Promise<number> {
    let collection;

    // Use same filtering logic as getEntries for consistency
    if (filters?.startDate && filters?.endDate) {
      collection = db.timeEntries
        .where('startTime')
        .between(
          filters.startDate.toISOString(),
          filters.endDate.toISOString(),
          true,
          true
        );
    } else {
      collection = db.timeEntries.toCollection();
    }

    if (filters?.projectId) {
      if (!filters?.startDate || !filters?.endDate) {
        collection = db.timeEntries.where('projectId').equals(filters.projectId);
      } else {
        collection = collection.filter(entry => entry.projectId === filters.projectId);
      }
    }

    // For search queries, we need to count after client-side filtering
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return await collection
        .filter(entry =>
          entry.description.toLowerCase().includes(query) ||
          (entry.notes?.toLowerCase().includes(query) ?? false)
        )
        .count();
    }

    return await collection.count();
  },

  /**
   * Get a single time entry by ID
   */
  async getEntry(id: string): Promise<TimeEntry | undefined> {
    return await db.timeEntries.get(id);
  },

  /**
   * Update a time entry
   */
  async updateEntry(id: string, updates: Partial<TimeEntry>): Promise<void> {
    await db.timeEntries.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * Delete a time entry
   */
  async deleteEntry(id: string): Promise<void> {
    await db.timeEntries.delete(id);
  },

  /**
   * Get entries for a specific date range (optimized for reports)
   */
  async getEntriesByDateRange(startDate: Date, endDate: Date): Promise<TimeEntry[]> {
    return await db.timeEntries
      .where('startTime')
      .between(startDate.toISOString(), endDate.toISOString(), true, true)
      .reverse()
      .toArray();
  },

  /**
   * Get all entries for a specific project
   */
  async getEntriesByProject(projectId: string): Promise<TimeEntry[]> {
    return await db.timeEntries
      .where('projectId')
      .equals(projectId)
      .reverse()
      .toArray();
  },

  /**
   * Get all entries for a specific task (Kanban integration)
   */
  async getEntriesByTask(taskId: string): Promise<TimeEntry[]> {
    return await db.timeEntries
      .where('taskId')
      .equals(taskId)
      .reverse()
      .toArray();
  },

  // ==================== PROJECTS ====================

  /**
   * Add a new project
   */
  async addProject(project: TimeTrackingProject): Promise<void> {
    await db.projects.add(project);
  },

  /**
   * Get all projects (optionally include archived)
   */
  async getProjects(includeArchived = false): Promise<TimeTrackingProject[]> {
    let collection = db.projects.orderBy('name');

    if (!includeArchived) {
      collection = collection.filter(p => !p.archived);
    }

    return await collection.toArray();
  },

  /**
   * Get active projects only
   */
  async getActiveProjects(): Promise<TimeTrackingProject[]> {
    return await db.projects
      .where('active')
      .equals(1)
      .and(p => !p.archived)
      .sortBy('name');
  },

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<TimeTrackingProject | undefined> {
    return await db.projects.get(id);
  },

  /**
   * Update a project
   */
  async updateProject(id: string, updates: Partial<TimeTrackingProject>): Promise<void> {
    await db.projects.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * Delete a project and all its time entries
   */
  async deleteProject(id: string): Promise<void> {
    // Delete all time entries for this project
    const entries = await db.timeEntries.where('projectId').equals(id).toArray();
    await db.timeEntries.bulkDelete(entries.map(e => e.id));

    // Delete the project
    await db.projects.delete(id);
  },

  /**
   * Archive a project (soft delete)
   */
  async archiveProject(id: string): Promise<void> {
    await db.projects.update(id, {
      archived: true,
      active: false,
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * Unarchive a project
   */
  async unarchiveProject(id: string): Promise<void> {
    await db.projects.update(id, {
      archived: false,
      active: true,
      updatedAt: new Date().toISOString()
    });
  },

  // ==================== ANALYTICS ====================

  /**
   * Get statistics for a specific project
   */
  async getProjectStats(projectId: string): Promise<{
    totalTime: number;
    entryCount: number;
    averageSessionLength: number;
  }> {
    const entries = await db.timeEntries
      .where('projectId')
      .equals(projectId)
      .toArray();

    const totalTime = entries.reduce((sum, entry) => sum + entry.duration, 0);

    return {
      totalTime,
      entryCount: entries.length,
      averageSessionLength: entries.length > 0 ? totalTime / entries.length : 0
    };
  },

  /**
   * Get total time tracked for a date range
   */
  async getTotalTimeForDateRange(startDate: Date, endDate: Date): Promise<number> {
    const entries = await this.getEntriesByDateRange(startDate, endDate);
    return entries.reduce((total, entry) => total + entry.duration, 0);
  },

  /**
   * Get time tracked by project for a date range (for reports)
   */
  async getTimeByProject(startDate: Date, endDate: Date): Promise<Record<string, number>> {
    const entries = await this.getEntriesByDateRange(startDate, endDate);

    const timeByProject: Record<string, number> = {};
    entries.forEach(entry => {
      const projectId = entry.projectId || 'no-project';
      timeByProject[projectId] = (timeByProject[projectId] || 0) + entry.duration;
    });

    return timeByProject;
  },

  /**
   * Get time tracked by day for a date range (for charts)
   */
  async getTimeByDay(startDate: Date, endDate: Date): Promise<Record<string, number>> {
    const entries = await this.getEntriesByDateRange(startDate, endDate);

    const timeByDay: Record<string, number> = {};
    entries.forEach(entry => {
      const day = entry.startTime.split('T')[0]; // YYYY-MM-DD
      timeByDay[day] = (timeByDay[day] || 0) + entry.duration;
    });

    return timeByDay;
  },

  // ==================== BULK OPERATIONS ====================

  /**
   * Import time entries (for CSV import)
   */
  async importEntries(entries: TimeEntry[]): Promise<void> {
    await db.timeEntries.bulkAdd(entries);
  },

  /**
   * Export all time entries (for backup/export)
   */
  async exportAllEntries(): Promise<TimeEntry[]> {
    return await db.timeEntries.toArray();
  },

  /**
   * Export all projects (for backup/export)
   */
  async exportAllProjects(): Promise<TimeTrackingProject[]> {
    return await db.projects.toArray();
  },

  /**
   * Clear all data (for testing or reset)
   */
  async clearAllData(): Promise<void> {
    await db.timeEntries.clear();
    await db.projects.clear();
  },

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    entryCount: number;
    projectCount: number;
    totalTimeTracked: number;
    oldestEntry?: string;
    newestEntry?: string;
  }> {
    const entries = await db.timeEntries.toArray();
    const projects = await db.projects.toArray();

    const totalTimeTracked = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const sortedByTime = entries.sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return {
      entryCount: entries.length,
      projectCount: projects.length,
      totalTimeTracked,
      oldestEntry: sortedByTime[0]?.startTime,
      newestEntry: sortedByTime[sortedByTime.length - 1]?.startTime
    };
  }
};

export default timeTrackingDb;
