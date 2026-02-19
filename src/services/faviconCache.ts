/**
 * Favicon Cache Service
 *
 * 3-tier caching for link favicons:
 * 1. Memory cache (instant access, session-scoped)
 * 2. IndexedDB cache (persistent across sessions)
 * 3. Network fetch (DDG primary, Google fallback)
 *
 * Features:
 * - Queue system with concurrency control (4 concurrent)
 * - Canvas normalization to 32x32 PNG data URLs
 * - Size validation (reject <8px or >10KB)
 * - CORS-safe fallback handling
 */

import { indexedDBService } from './indexedDB';
import { logger } from './logger';

const log = logger.module('FaviconCache');

// ============================================================================
// Types
// ============================================================================

interface CachedFavicon {
  domain: string;
  dataUrl: string;
  fetchedAt: number;
  size: number;
}

interface FaviconStats {
  memoryCount: number;
  indexedDBCount: number;
  totalSize: number;
}

// ============================================================================
// Constants
// ============================================================================

const CACHE_PREFIX = 'favicon_';
const MAX_CONCURRENT_FETCHES = 4;
const BATCH_DELAY_MS = 100;
const FETCH_TIMEOUT_MS = 5000;
const TARGET_SIZE = 32;
const MIN_SIZE = 8;
const MAX_DATA_URL_SIZE = 10 * 1024; // 10KB
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Favicon API sources (in priority order)
const FAVICON_SOURCES = [
  (domain: string) => `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=${TARGET_SIZE}`,
];

// ============================================================================
// Service Implementation
// ============================================================================

class FaviconCacheService {
  // L1: Memory cache (session-scoped)
  private memoryCache = new Map<string, CachedFavicon>();

  // Prevent duplicate fetches
  private loadingPromises = new Map<string, Promise<string | null>>();

  // Queue for batch fetching
  private fetchQueue: string[] = [];
  private isProcessingQueue = false;
  private activeFetches = 0;

  /**
   * Get domain from URL
   */
  private getDomain(url: string): string | null {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  /**
   * Get cache key for a domain
   */
  private getCacheKey(domain: string): string {
    return `${CACHE_PREFIX}${domain}`;
  }

  /**
   * Check if cached favicon is still valid
   */
  private isValidCache(cached: CachedFavicon): boolean {
    return Date.now() - cached.fetchedAt < CACHE_TTL_MS;
  }

  /**
   * Fetch image with timeout
   */
  private async fetchWithTimeout(url: string): Promise<Blob | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors',
      });

      if (!response.ok) return null;

      const blob = await response.blob();
      return blob;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Validate and normalize image to 32x32 PNG data URL
   */
  private async normalizeToDataUrl(blob: Blob): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Validate minimum size
        if (img.width < MIN_SIZE || img.height < MIN_SIZE) {
          log.debug('Favicon too small', { width: img.width, height: img.height });
          resolve(null);
          return;
        }

        // Normalize to TARGET_SIZE x TARGET_SIZE PNG
        const canvas = document.createElement('canvas');
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // Draw with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, TARGET_SIZE, TARGET_SIZE);

        const dataUrl = canvas.toDataURL('image/png');

        // Validate max size
        if (dataUrl.length > MAX_DATA_URL_SIZE) {
          log.debug('Favicon data URL too large', { size: dataUrl.length });
          resolve(null);
          return;
        }

        resolve(dataUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  }

  /**
   * Fetch favicon from network (tries DDG, then Google)
   */
  private async fetchFromNetwork(domain: string): Promise<string | null> {
    for (const getUrl of FAVICON_SOURCES) {
      const url = getUrl(domain);

      try {
        const blob = await this.fetchWithTimeout(url);
        if (!blob) continue;

        const dataUrl = await this.normalizeToDataUrl(blob);
        if (dataUrl) {
          log.debug('Favicon fetched', { domain, source: url });
          return dataUrl;
        }
      } catch (error) {
        log.debug('Favicon fetch failed', { domain, source: url, error });
      }
    }

    return null;
  }

  /**
   * Get favicon from L2 cache (IndexedDB)
   */
  private async getFromIndexedDB(domain: string): Promise<CachedFavicon | null> {
    try {
      const key = this.getCacheKey(domain);
      const cached = await indexedDBService.getItem(key);

      if (!cached) return null;

      const parsed = JSON.parse(cached) as CachedFavicon;

      // Check TTL
      if (!this.isValidCache(parsed)) {
        // Expired, remove it
        await indexedDBService.removeItem(key);
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Save favicon to L2 cache (IndexedDB)
   */
  private async saveToIndexedDB(domain: string, dataUrl: string): Promise<void> {
    try {
      const cached: CachedFavicon = {
        domain,
        dataUrl,
        fetchedAt: Date.now(),
        size: dataUrl.length,
      };

      const key = this.getCacheKey(domain);
      await indexedDBService.setItem(key, JSON.stringify(cached));
    } catch (error) {
      log.error('Failed to save favicon to IndexedDB', { domain, error });
    }
  }

  /**
   * Get favicon for a URL (main entry point)
   * Returns data URL or null if not available
   */
  async getFavicon(url: string): Promise<string | null> {
    const domain = this.getDomain(url);
    if (!domain) return null;

    // L1: Check memory cache
    const memoryCached = this.memoryCache.get(domain);
    if (memoryCached && this.isValidCache(memoryCached)) {
      return memoryCached.dataUrl;
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(domain);
    if (existingPromise) {
      return existingPromise;
    }

    // Create loading promise
    const loadPromise = (async () => {
      try {
        // L2: Check IndexedDB cache
        const indexedDBCached = await this.getFromIndexedDB(domain);
        if (indexedDBCached) {
          // Populate memory cache
          this.memoryCache.set(domain, indexedDBCached);
          return indexedDBCached.dataUrl;
        }

        // L3: Fetch from network
        const dataUrl = await this.fetchFromNetwork(domain);

        if (dataUrl) {
          // Save to both caches
          const cached: CachedFavicon = {
            domain,
            dataUrl,
            fetchedAt: Date.now(),
            size: dataUrl.length,
          };
          this.memoryCache.set(domain, cached);
          await this.saveToIndexedDB(domain, dataUrl);
        }

        return dataUrl;
      } finally {
        this.loadingPromises.delete(domain);
      }
    })();

    this.loadingPromises.set(domain, loadPromise);
    return loadPromise;
  }

  /**
   * Get favicon synchronously from memory cache only
   * Returns data URL or null (does not trigger fetch)
   */
  getFaviconSync(url: string): string | null {
    const domain = this.getDomain(url);
    if (!domain) return null;

    const cached = this.memoryCache.get(domain);
    if (cached && this.isValidCache(cached)) {
      return cached.dataUrl;
    }

    return null;
  }

  /**
   * Process the fetch queue with concurrency control
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.fetchQueue.length > 0) {
      // Wait for available slot
      while (this.activeFetches >= MAX_CONCURRENT_FETCHES) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const url = this.fetchQueue.shift();
      if (!url) continue;

      this.activeFetches++;

      // Fire and forget - getFavicon handles caching
      this.getFavicon(url)
        .catch(() => {
          // Ignore fetch errors in queue
        })
        .finally(() => {
          this.activeFetches--;
        });

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }

    this.isProcessingQueue = false;
  }

  /**
   * Prefetch favicons for multiple URLs (batch operation)
   * Queues fetches with rate limiting
   */
  async prefetchFavicons(urls: string[]): Promise<void> {
    const uniqueDomains = new Set<string>();

    for (const url of urls) {
      const domain = this.getDomain(url);
      if (domain && !this.memoryCache.has(domain)) {
        uniqueDomains.add(url);
      }
    }

    if (uniqueDomains.size === 0) return;

    log.info('Prefetching favicons', { count: uniqueDomains.size });

    // Add to queue
    this.fetchQueue.push(...uniqueDomains);

    // Start processing
    this.processQueue();
  }

  /**
   * Clear all cached favicons
   */
  async clearCache(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear IndexedDB cache
    try {
      const allKeys = await indexedDBService.getAllKeys();
      const faviconKeys = allKeys.filter((key: string) => key.startsWith(CACHE_PREFIX));

      for (const key of faviconKeys) {
        await indexedDBService.removeItem(key);
      }

      log.info('Favicon cache cleared', { keysRemoved: faviconKeys.length });
    } catch (error) {
      log.error('Failed to clear favicon cache', { error });
    }
  }

  /**
   * Remove expired entries from IndexedDB
   */
  async cleanExpiredEntries(): Promise<number> {
    try {
      const allKeys = await indexedDBService.getAllKeys();
      const faviconKeys = allKeys.filter((key: string) => key.startsWith(CACHE_PREFIX));

      let removed = 0;
      for (const key of faviconKeys) {
        const cached = await indexedDBService.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached) as CachedFavicon;
          if (!this.isValidCache(parsed)) {
            await indexedDBService.removeItem(key);
            removed++;
          }
        }
      }

      if (removed > 0) {
        log.info('Cleaned expired favicons', { count: removed });
      }

      return removed;
    } catch (error) {
      log.error('Failed to clean expired favicons', { error });
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<FaviconStats> {
    let indexedDBCount = 0;
    let totalSize = 0;

    try {
      const allKeys = await indexedDBService.getAllKeys();
      const faviconKeys = allKeys.filter((key: string) => key.startsWith(CACHE_PREFIX));

      indexedDBCount = faviconKeys.length;

      for (const key of faviconKeys) {
        const cached = await indexedDBService.getItem(key);
        if (cached) {
          totalSize += cached.length;
        }
      }
    } catch {
      // Ignore errors, return partial stats
    }

    return {
      memoryCount: this.memoryCache.size,
      indexedDBCount,
      totalSize,
    };
  }

  /**
   * Preload memory cache from IndexedDB on startup
   */
  async warmCache(): Promise<void> {
    try {
      const allKeys = await indexedDBService.getAllKeys();
      const faviconKeys = allKeys.filter((key: string) => key.startsWith(CACHE_PREFIX));

      let loaded = 0;
      for (const key of faviconKeys) {
        const cached = await indexedDBService.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached) as CachedFavicon;
          if (this.isValidCache(parsed)) {
            this.memoryCache.set(parsed.domain, parsed);
            loaded++;
          }
        }
      }

      if (loaded > 0) {
        log.info('Warmed favicon cache', { count: loaded });
      }
    } catch (error) {
      log.error('Failed to warm favicon cache', { error });
    }
  }
}

// Export singleton instance
export const faviconCacheService = new FaviconCacheService();
