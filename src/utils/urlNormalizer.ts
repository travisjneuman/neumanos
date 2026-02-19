/**
 * URL Normalizer
 *
 * Normalizes URLs for duplicate detection by:
 * - Removing www. prefix
 * - Lowercasing host and path
 * - Preserving non-standard ports (e.g., :3000, :8080)
 * - Removing tracking parameters (utm_*, fbclid, gclid, etc.)
 * - Removing trailing slashes (except root)
 * - Sorting query parameters alphabetically
 *
 * Example normalizations:
 * - https://www.Example.com/PATH/ → https://example.com/path
 * - http://localhost:3000/app → http://localhost:3000/app (port preserved)
 * - https://site.com?utm_source=x&id=1 → https://site.com?id=1 (tracking removed)
 */

// Tracking parameters to remove
const TRACKING_PARAMS = new Set([
  // Google Analytics
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_source_platform',
  'utm_creative_format',
  'utm_marketing_tactic',
  // Facebook
  'fbclid',
  'fb_action_ids',
  'fb_action_types',
  'fb_source',
  'fb_ref',
  // Google Ads
  'gclid',
  'gclsrc',
  'dclid',
  // Microsoft/Bing
  'msclkid',
  // Twitter
  'twclid',
  // TikTok
  'ttclid',
  // Generic tracking
  'ref',
  'ref_src',
  'ref_url',
  'source',
  'src',
  // Mailchimp
  'mc_cid',
  'mc_eid',
  // HubSpot
  'hsa_acc',
  'hsa_cam',
  'hsa_grp',
  'hsa_ad',
  'hsa_src',
  'hsa_tgt',
  'hsa_kw',
  'hsa_mt',
  'hsa_net',
  'hsa_ver',
  // Other common
  '_ga',
  '_gl',
  '_hsenc',
  '_hsmi',
  'mkt_tok',
  'igshid',
  's_kwcid',
  'trk',
  'trkInfo',
  'clickid',
  'affiliate_id',
  'partner_id',
  'campaign_id',
]);

/**
 * Normalize a URL for duplicate comparison
 *
 * @param url - The URL to normalize
 * @returns Normalized URL string, or original if parsing fails
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // 1. Remove www. prefix and lowercase hostname
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    // 2. Lowercase path and remove trailing slash (except for root)
    let pathname = parsed.pathname.toLowerCase();
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // 3. Filter and sort query parameters
    const params = new URLSearchParams(parsed.search);
    const filteredParams = new URLSearchParams();

    // Sort parameter keys and filter out tracking params
    const sortedKeys = Array.from(params.keys()).sort();
    for (const key of sortedKeys) {
      const lowerKey = key.toLowerCase();
      // Skip tracking parameters (check prefix patterns too)
      if (TRACKING_PARAMS.has(lowerKey)) continue;
      if (lowerKey.startsWith('utm_')) continue;
      if (lowerKey.startsWith('mc_')) continue;
      if (lowerKey.startsWith('hsa_')) continue;

      const value = params.get(key);
      if (value !== null) {
        filteredParams.set(key, value);
      }
    }

    // 4. Build normalized URL (include port if non-standard)
    // Note: URL.port is empty string for default ports (80 for http, 443 for https)
    let normalized = `${parsed.protocol}//${hostname}`;
    if (parsed.port) {
      normalized += `:${parsed.port}`;
    }
    normalized += pathname;

    const queryString = filteredParams.toString();
    if (queryString) {
      normalized += `?${queryString}`;
    }

    // Include hash fragment - URLs with different hashes are different destinations
    // e.g., page#section1 and page#section2 link to different parts of the page
    if (parsed.hash) {
      normalized += parsed.hash.toLowerCase();
    }

    return normalized;
  } catch {
    // If URL parsing fails, return original (lowercased)
    return url.toLowerCase();
  }
}

/**
 * Check if two URLs are duplicates (same normalized form)
 */
export function areUrlsDuplicates(url1: string, url2: string): boolean {
  return normalizeUrl(url1) === normalizeUrl(url2);
}

/**
 * Extract domain from URL (without www. prefix)
 */
export function extractDomain(url: string): string {
  try {
    let hostname = new URL(url).hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    return hostname;
  } catch {
    return url;
  }
}

/**
 * Group URLs by their normalized form
 *
 * @param urls - Array of URLs to group
 * @returns Map of normalized URL to array of original URLs
 */
export function groupUrlsByNormalized(urls: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  for (const url of urls) {
    const normalized = normalizeUrl(url);
    const existing = groups.get(normalized) || [];
    existing.push(url);
    groups.set(normalized, existing);
  }

  return groups;
}
