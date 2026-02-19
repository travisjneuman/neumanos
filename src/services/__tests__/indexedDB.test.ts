/**
 * IndexedDB Service Tests
 *
 * Tests the IndexedDB service using fake-indexeddb for real IndexedDB behavior.
 * Uses vi.doUnmock to bypass the global mock in vitest.setup.ts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';

// Unmock the indexedDB service to test the real implementation
vi.doUnmock('../indexedDB');

// Mock logger to prevent console noise
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

// Import after unmocking
const { indexedDBService } = await import('../indexedDB');

describe('IndexedDBService', () => {
  beforeEach(async () => {
    // Clear any existing data before each test
    // Note: fake-indexeddb resets between test files but not between tests
    try {
      await indexedDBService.clear();
    } catch {
      // Ignore if not initialized yet
    }
  });

  afterEach(async () => {
    // Clear after each test
    try {
      await indexedDBService.clear();
    } catch {
      // Ignore if not initialized
    }
  });

  describe('isSupported', () => {
    it('should return true when IndexedDB is available', () => {
      expect(indexedDBService.isSupported()).toBe(true);
    });
  });

  describe('init', () => {
    it('should initialize successfully', async () => {
      await expect(indexedDBService.init()).resolves.toBeUndefined();
    });

    it('should be idempotent (calling multiple times is safe)', async () => {
      await indexedDBService.init();
      await expect(indexedDBService.init()).resolves.toBeUndefined();
    });
  });

  describe('setItem and getItem', () => {
    it('should store and retrieve a string value', async () => {
      await indexedDBService.setItem('test-key', 'test-value');
      const result = await indexedDBService.getItem('test-key');
      expect(result).toBe('test-value');
    });

    it('should return null for non-existent key', async () => {
      const result = await indexedDBService.getItem('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle empty string values', async () => {
      await indexedDBService.setItem('empty-key', '');
      const result = await indexedDBService.getItem('empty-key');
      expect(result).toBe('');
    });

    it('should handle JSON string values', async () => {
      const jsonData = JSON.stringify({ name: 'test', value: 123 });
      await indexedDBService.setItem('json-key', jsonData);
      const result = await indexedDBService.getItem('json-key');
      expect(result).toBe(jsonData);
      expect(JSON.parse(result!)).toEqual({ name: 'test', value: 123 });
    });

    it('should handle large string values', async () => {
      const largeValue = 'x'.repeat(100000); // 100KB string
      await indexedDBService.setItem('large-key', largeValue);
      const result = await indexedDBService.getItem('large-key');
      expect(result).toBe(largeValue);
    });

    it('should handle special characters in keys', async () => {
      await indexedDBService.setItem('key-with-special-chars!@#$%', 'value');
      const result = await indexedDBService.getItem('key-with-special-chars!@#$%');
      expect(result).toBe('value');
    });

    it('should handle unicode values', async () => {
      const unicodeValue = '日本語テスト 🎉 emoji';
      await indexedDBService.setItem('unicode-key', unicodeValue);
      const result = await indexedDBService.getItem('unicode-key');
      expect(result).toBe(unicodeValue);
    });

    it('should overwrite existing values', async () => {
      await indexedDBService.setItem('overwrite-key', 'original');
      await indexedDBService.setItem('overwrite-key', 'updated');
      const result = await indexedDBService.getItem('overwrite-key');
      expect(result).toBe('updated');
    });
  });

  describe('removeItem', () => {
    it('should remove an existing item', async () => {
      await indexedDBService.setItem('remove-key', 'value');
      await indexedDBService.removeItem('remove-key');
      const result = await indexedDBService.getItem('remove-key');
      expect(result).toBeNull();
    });

    it('should not throw when removing non-existent key', async () => {
      await expect(indexedDBService.removeItem('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('getAllKeys', () => {
    it('should return empty array when no items', async () => {
      await indexedDBService.init();
      const keys = await indexedDBService.getAllKeys();
      expect(keys).toEqual([]);
    });

    it('should return all stored keys', async () => {
      await indexedDBService.setItem('key1', 'value1');
      await indexedDBService.setItem('key2', 'value2');
      await indexedDBService.setItem('key3', 'value3');
      const keys = await indexedDBService.getAllKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });
  });

  describe('getAllData', () => {
    it('should return empty object when no items', async () => {
      await indexedDBService.init();
      const data = await indexedDBService.getAllData();
      expect(data).toEqual({});
    });

    it('should return all stored key-value pairs', async () => {
      await indexedDBService.setItem('key1', 'value1');
      await indexedDBService.setItem('key2', 'value2');
      const data = await indexedDBService.getAllData();
      expect(data).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });
  });

  describe('clear', () => {
    it('should remove all items', async () => {
      await indexedDBService.setItem('key1', 'value1');
      await indexedDBService.setItem('key2', 'value2');
      await indexedDBService.clear();
      const keys = await indexedDBService.getAllKeys();
      expect(keys).toEqual([]);
    });

    it('should not throw when clearing empty store', async () => {
      await indexedDBService.init();
      await expect(indexedDBService.clear()).resolves.toBeUndefined();
    });
  });

  describe('setItemsBatch and getItemsBatch', () => {
    it('should batch write multiple items', async () => {
      const items = {
        'batch-key1': 'value1',
        'batch-key2': 'value2',
        'batch-key3': 'value3',
      };
      await indexedDBService.setItemsBatch(items);

      const result1 = await indexedDBService.getItem('batch-key1');
      const result2 = await indexedDBService.getItem('batch-key2');
      const result3 = await indexedDBService.getItem('batch-key3');

      expect(result1).toBe('value1');
      expect(result2).toBe('value2');
      expect(result3).toBe('value3');
    });

    it('should handle empty batch write', async () => {
      await expect(indexedDBService.setItemsBatch({})).resolves.toBeUndefined();
    });

    it('should batch read multiple items', async () => {
      await indexedDBService.setItem('read-key1', 'value1');
      await indexedDBService.setItem('read-key2', 'value2');

      const results = await indexedDBService.getItemsBatch(['read-key1', 'read-key2', 'non-existent']);

      expect(results).toEqual({
        'read-key1': 'value1',
        'read-key2': 'value2',
      });
      // non-existent key should not be in results
      expect(results['non-existent']).toBeUndefined();
    });

    it('should handle empty batch read', async () => {
      const results = await indexedDBService.getItemsBatch([]);
      expect(results).toEqual({});
    });
  });

  describe('setObject and getObject', () => {
    it('should store and retrieve objects', async () => {
      const obj = { name: 'test', count: 42, nested: { value: true } };
      await indexedDBService.setObject('obj-key', obj);
      const result = await indexedDBService.getObject('obj-key');
      expect(result).toEqual(obj);
    });

    it('should return null for non-existent object key', async () => {
      const result = await indexedDBService.getObject('non-existent');
      expect(result).toBeNull();
    });

    it('should handle arrays', async () => {
      const arr = [1, 2, 3, { nested: true }];
      await indexedDBService.setObject('arr-key', arr);
      const result = await indexedDBService.getObject('arr-key');
      expect(result).toEqual(arr);
    });

    it('should handle null values', async () => {
      await indexedDBService.setObject('null-key', null);
      const result = await indexedDBService.getObject('null-key');
      expect(result).toBeNull();
    });

    it('should handle Date objects', async () => {
      const dateObj = { created: new Date('2025-01-01') };
      await indexedDBService.setObject('date-key', dateObj);
      const result = await indexedDBService.getObject<typeof dateObj>('date-key');
      // Date objects are serialized in IndexedDB structured clone
      expect(result?.created instanceof Date).toBe(true);
    });
  });

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(indexedDBService.formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes', () => {
      expect(indexedDBService.formatBytes(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(indexedDBService.formatBytes(1024)).toBe('1 KB');
      expect(indexedDBService.formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(indexedDBService.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(indexedDBService.formatBytes(1024 * 1024 * 5.5)).toBe('5.5 MB');
    });

    it('should format gigabytes', () => {
      expect(indexedDBService.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should round to 2 decimal places', () => {
      expect(indexedDBService.formatBytes(1234567)).toBe('1.18 MB');
    });
  });

  describe('getQuota', () => {
    it('should return quota information', async () => {
      const quota = await indexedDBService.getQuota();
      expect(quota).toHaveProperty('usage');
      expect(quota).toHaveProperty('quota');
      expect(quota).toHaveProperty('percentUsed');
      expect(quota).toHaveProperty('available');
      expect(quota).toHaveProperty('usageFormatted');
      expect(quota).toHaveProperty('quotaFormatted');
      expect(quota).toHaveProperty('availableFormatted');
      expect(typeof quota.usage).toBe('number');
      expect(typeof quota.quota).toBe('number');
    });
  });

  describe('isStorageNearlyFull', () => {
    it('should return false when storage is not full', async () => {
      const result = await indexedDBService.isStorageNearlyFull();
      expect(result).toBe(false);
    });
  });

  describe('image storage', () => {
    // Note: Image compression tests require canvas/Image which may not work in jsdom
    // These are tested via E2E tests instead

    it('should delete note images by prefix', async () => {
      // Simulate stored images
      await indexedDBService.setItem('image_note123_12345_abc', 'blob-data-1');
      await indexedDBService.setItem('image_note123_12346_def', 'blob-data-2');
      await indexedDBService.setItem('image_note456_12347_ghi', 'blob-data-3');

      await indexedDBService.deleteNoteImages('note123');

      const keys = await indexedDBService.getAllKeys();
      expect(keys).not.toContain('image_note123_12345_abc');
      expect(keys).not.toContain('image_note123_12346_def');
      expect(keys).toContain('image_note456_12347_ghi');
    });

    it('should handle deleteNoteImages when no images exist', async () => {
      await indexedDBService.init();
      await expect(indexedDBService.deleteNoteImages('non-existent-note')).resolves.toBeUndefined();
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent writes correctly', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(indexedDBService.setItem(`concurrent-key-${i}`, `value-${i}`));
      }
      await Promise.all(promises);

      const keys = await indexedDBService.getAllKeys();
      expect(keys.filter((k) => k.startsWith('concurrent-key-'))).toHaveLength(10);
    });

    it('should handle concurrent reads and writes', async () => {
      await indexedDBService.setItem('rw-key', 'initial');

      const promises = [
        indexedDBService.getItem('rw-key'),
        indexedDBService.setItem('rw-key', 'updated'),
        indexedDBService.getItem('rw-key'),
      ];

      await Promise.all(promises);

      const finalValue = await indexedDBService.getItem('rw-key');
      expect(finalValue).toBe('updated');
    });
  });
});
