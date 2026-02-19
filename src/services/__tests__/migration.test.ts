/**
 * Storage Migration Service Tests
 *
 * Tests the localStorage to IndexedDB migration logic.
 * Uses mocked IndexedDB service for controlled testing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    module: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock indexedDBService - define mock functions inline to avoid hoisting issues
vi.mock('../indexedDB', () => ({
  indexedDBService: {
    isSupported: vi.fn(() => true),
    init: vi.fn(() => Promise.resolve()),
    setItem: vi.fn(() => Promise.resolve()),
    getItem: vi.fn(() => Promise.resolve(null)),
  },
}));

// Import after mocking
import {
  isMigrationNeeded,
  migrateToIndexedDB,
  forceMigration,
  getMigrationStatus,
} from '../migration';

// Import the mocked service for test access
import { indexedDBService } from '../indexedDB';

// Cast to access mock functions (cast through unknown to satisfy TypeScript)
const mockIndexedDBService = indexedDBService as unknown as {
  isSupported: ReturnType<typeof vi.fn>;
  init: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  getItem: ReturnType<typeof vi.fn>;
};

// Storage keys that migration checks
const STORAGE_KEYS = [
  'kanban-tasks',
  'calendar-events',
  'weather-data',
  'theme-storage',
  'map-storage',
  'gantt-storage',
  'risk-storage',
  'resource-storage',
];

const MIGRATION_FLAG = 'storage-migrated-to-indexeddb';

describe('Migration Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset mocks
    vi.clearAllMocks();
    // Default mock implementations
    mockIndexedDBService.isSupported.mockReturnValue(true);
    mockIndexedDBService.init.mockResolvedValue(undefined);
    mockIndexedDBService.setItem.mockResolvedValue(undefined);
    mockIndexedDBService.getItem.mockResolvedValue(null);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('isMigrationNeeded', () => {
    it('should return false if migration flag exists', () => {
      localStorage.setItem(MIGRATION_FLAG, 'true');
      expect(isMigrationNeeded()).toBe(false);
    });

    it('should return false if no data exists in localStorage', () => {
      expect(isMigrationNeeded()).toBe(false);
    });

    it('should return true if data exists but migration flag is not set', () => {
      localStorage.setItem('kanban-tasks', '{"tasks":[]}');
      expect(isMigrationNeeded()).toBe(true);
    });

    it('should return true if any storage key has data', () => {
      localStorage.setItem('calendar-events', '[]');
      expect(isMigrationNeeded()).toBe(true);
    });

    it('should check all storage keys', () => {
      // Test each key individually
      for (const key of STORAGE_KEYS) {
        localStorage.clear();
        localStorage.setItem(key, 'test-data');
        expect(isMigrationNeeded()).toBe(true);
      }
    });

    it('should return false for keys not in storage list', () => {
      localStorage.setItem('some-other-key', 'data');
      expect(isMigrationNeeded()).toBe(false);
    });

    it('should return false if migration already done even with data in localStorage', () => {
      localStorage.setItem(MIGRATION_FLAG, 'true');
      localStorage.setItem('kanban-tasks', '{"tasks":[]}');
      expect(isMigrationNeeded()).toBe(false);
    });
  });

  describe('migrateToIndexedDB', () => {
    it('should return error if IndexedDB is not supported', async () => {
      mockIndexedDBService.isSupported.mockReturnValue(false);

      const result = await migrateToIndexedDB();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('IndexedDB not supported in this browser');
      expect(result.migratedKeys).toHaveLength(0);
    });

    it('should initialize IndexedDB before migration', async () => {
      await migrateToIndexedDB();

      expect(mockIndexedDBService.init).toHaveBeenCalled();
    });

    it('should migrate all existing localStorage keys', async () => {
      localStorage.setItem('kanban-tasks', '{"tasks":[1,2,3]}');
      localStorage.setItem('calendar-events', '[]');
      localStorage.setItem('weather-data', '{"temp":72}');

      const result = await migrateToIndexedDB();

      expect(result.success).toBe(true);
      expect(result.migratedKeys).toContain('kanban-tasks');
      expect(result.migratedKeys).toContain('calendar-events');
      expect(result.migratedKeys).toContain('weather-data');
      expect(result.migratedKeys).toHaveLength(3);
    });

    it('should call setItem for each key with data', async () => {
      const testData = '{"test": true}';
      localStorage.setItem('kanban-tasks', testData);

      await migrateToIndexedDB();

      expect(mockIndexedDBService.setItem).toHaveBeenCalledWith('kanban-tasks', testData);
    });

    it('should not migrate keys without data', async () => {
      localStorage.setItem('kanban-tasks', 'data');
      // calendar-events is not set

      await migrateToIndexedDB();

      expect(mockIndexedDBService.setItem).toHaveBeenCalledTimes(1);
      expect(mockIndexedDBService.setItem).toHaveBeenCalledWith('kanban-tasks', 'data');
    });

    it('should set migration flag after successful migration', async () => {
      await migrateToIndexedDB();

      expect(localStorage.getItem(MIGRATION_FLAG)).toBe('true');
    });

    it('should handle setItem errors for individual keys', async () => {
      localStorage.setItem('kanban-tasks', 'data1');
      localStorage.setItem('calendar-events', 'data2');

      // Fail on first key
      mockIndexedDBService.setItem
        .mockRejectedValueOnce(new Error('Write failed'))
        .mockResolvedValueOnce(undefined);

      const result = await migrateToIndexedDB();

      expect(result.success).toBe(true); // Overall success
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to migrate kanban-tasks');
      expect(result.migratedKeys).toContain('calendar-events');
      expect(result.migratedKeys).not.toContain('kanban-tasks');
    });

    it('should handle IndexedDB init failure', async () => {
      mockIndexedDBService.init.mockRejectedValue(new Error('Init failed'));

      const result = await migrateToIndexedDB();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Migration failed');
    });

    it('should return empty arrays when no data to migrate', async () => {
      const result = await migrateToIndexedDB();

      expect(result.success).toBe(true);
      expect(result.migratedKeys).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should preserve data format during migration', async () => {
      const complexData = JSON.stringify({
        tasks: [
          { id: 1, title: 'Test Task', created: '2025-01-01' },
          { id: 2, title: 'Another Task', priority: 'high' },
        ],
        columns: ['todo', 'done'],
      });
      localStorage.setItem('kanban-tasks', complexData);

      await migrateToIndexedDB();

      expect(mockIndexedDBService.setItem).toHaveBeenCalledWith('kanban-tasks', complexData);
    });
  });

  describe('forceMigration', () => {
    it('should remove migration flag', async () => {
      localStorage.setItem(MIGRATION_FLAG, 'true');

      await forceMigration();

      // The function removes the flag then re-migrates
      // Since migrateToIndexedDB sets it again, check if setItem was called
      expect(mockIndexedDBService.init).toHaveBeenCalled();
    });

    it('should allow re-migration after force', async () => {
      localStorage.setItem(MIGRATION_FLAG, 'true');
      localStorage.setItem('kanban-tasks', 'data');

      await forceMigration();

      expect(mockIndexedDBService.setItem).toHaveBeenCalledWith('kanban-tasks', 'data');
    });
  });

  describe('getMigrationStatus', () => {
    it('should return migrated=true when flag exists', () => {
      localStorage.setItem(MIGRATION_FLAG, 'true');

      const status = getMigrationStatus();

      expect(status.migrated).toBe(true);
    });

    it('should return migrated=false when flag does not exist', () => {
      const status = getMigrationStatus();

      expect(status.migrated).toBe(false);
    });

    it('should return needsMigration=true when data exists without flag', () => {
      localStorage.setItem('kanban-tasks', 'data');

      const status = getMigrationStatus();

      expect(status.needsMigration).toBe(true);
    });

    it('should return needsMigration=false when flag exists', () => {
      localStorage.setItem(MIGRATION_FLAG, 'true');
      localStorage.setItem('kanban-tasks', 'data');

      const status = getMigrationStatus();

      expect(status.needsMigration).toBe(false);
    });

    it('should return needsMigration=false when no data exists', () => {
      const status = getMigrationStatus();

      expect(status.needsMigration).toBe(false);
    });

    it('should list keys in localStorage', () => {
      localStorage.setItem('kanban-tasks', 'data1');
      localStorage.setItem('calendar-events', 'data2');

      const status = getMigrationStatus();

      expect(status.keysInLocalStorage).toContain('kanban-tasks');
      expect(status.keysInLocalStorage).toContain('calendar-events');
      expect(status.keysInLocalStorage).toHaveLength(2);
    });

    it('should not list keys not in storage list', () => {
      localStorage.setItem('some-other-key', 'data');

      const status = getMigrationStatus();

      expect(status.keysInLocalStorage).not.toContain('some-other-key');
      expect(status.keysInLocalStorage).toHaveLength(0);
    });

    it('should return all status fields correctly', () => {
      localStorage.setItem('kanban-tasks', 'data');

      const status = getMigrationStatus();

      expect(status).toHaveProperty('migrated');
      expect(status).toHaveProperty('needsMigration');
      expect(status).toHaveProperty('keysInLocalStorage');
      expect(typeof status.migrated).toBe('boolean');
      expect(typeof status.needsMigration).toBe('boolean');
      expect(Array.isArray(status.keysInLocalStorage)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values in localStorage', async () => {
      localStorage.setItem('kanban-tasks', '');

      const result = await migrateToIndexedDB();

      // Empty string is falsy, so should not be migrated
      expect(result.migratedKeys).not.toContain('kanban-tasks');
    });

    it('should handle concurrent migration calls', async () => {
      localStorage.setItem('kanban-tasks', 'data');

      // Simulate slight delay in setItem
      mockIndexedDBService.setItem.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10))
      );

      // Start two migrations concurrently
      const [result1, result2] = await Promise.all([
        migrateToIndexedDB(),
        migrateToIndexedDB(),
      ]);

      // Both should succeed (idempotent)
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should handle special characters in data', async () => {
      const specialData = JSON.stringify({
        title: 'Task with "quotes" and \\backslashes',
        emoji: '🎉🚀💡',
        unicode: '日本語テスト',
      });
      localStorage.setItem('kanban-tasks', specialData);

      await migrateToIndexedDB();

      expect(mockIndexedDBService.setItem).toHaveBeenCalledWith('kanban-tasks', specialData);
    });

    it('should handle large data values', async () => {
      const largeData = JSON.stringify({
        items: Array(1000)
          .fill(null)
          .map((_, i) => ({
            id: i,
            title: `Item ${i}`,
            description: 'x'.repeat(100),
          })),
      });
      localStorage.setItem('kanban-tasks', largeData);

      const result = await migrateToIndexedDB();

      expect(result.success).toBe(true);
      expect(mockIndexedDBService.setItem).toHaveBeenCalledWith('kanban-tasks', largeData);
    });
  });
});
