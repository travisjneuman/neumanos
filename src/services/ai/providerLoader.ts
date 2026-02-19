/**
 * AI Provider Lazy Loader
 * Dynamically imports AI provider SDKs only when needed
 * This dramatically reduces initial bundle size (1.5MB → ~50KB for metadata)
 */

import type { AIProvider, AIProviderMetadata, AIModel } from './types';

/**
 * Provider metadata (lightweight - no SDK imports)
 * These are statically available for UI display without loading SDKs
 */
export const PROVIDER_METADATA: Record<string, AIProviderMetadata> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    displayName: 'OpenRouter',
    description: 'Access 200+ models through a single API. Best flexibility and free tier.',
    requiresApiKey: true,
    apiKeyUrl: 'https://openrouter.ai/keys',
    apiKeyLabel: 'OpenRouter API Key',
    hasFreeModels: true,
    freeModelIds: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemma-2-9b-it:free',
      'mistralai/mistral-7b-instruct:free',
    ],
    freeTierLimits: {
      requestsPerDay: 50,
      description: '~50 requests/day on free models',
    },
    supportsCORS: true,
    requiresProxy: false,
    supportsStreaming: true,
    websiteUrl: 'https://openrouter.ai',
    docsUrl: 'https://openrouter.ai/docs',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    displayName: 'Groq',
    description: 'Ultra-fast inference with LPU technology. Generous free tier.',
    requiresApiKey: true,
    apiKeyUrl: 'https://console.groq.com/keys',
    apiKeyLabel: 'Groq API Key',
    hasFreeModels: true,
    freeModelIds: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    freeTierLimits: {
      requestsPerMinute: 30,
      tokensPerMinute: 30000,
      description: '30 req/min, 30K tokens/min on free tier',
    },
    supportsCORS: true,
    requiresProxy: false,
    supportsStreaming: true,
    websiteUrl: 'https://groq.com',
    docsUrl: 'https://console.groq.com/docs',
  },
  huggingface: {
    id: 'huggingface',
    name: 'HuggingFace',
    displayName: 'HuggingFace',
    description: 'Open-source models. Great for experimentation.',
    requiresApiKey: true,
    apiKeyUrl: 'https://huggingface.co/settings/tokens',
    apiKeyLabel: 'HuggingFace Access Token',
    hasFreeModels: true,
    freeModelIds: ['mistralai/Mistral-7B-Instruct-v0.2'],
    freeTierLimits: {
      requestsPerDay: 1000,
      description: 'Rate limited based on model popularity',
    },
    supportsCORS: true,
    requiresProxy: false,
    supportsStreaming: false,
    websiteUrl: 'https://huggingface.co',
    docsUrl: 'https://huggingface.co/docs/inference-endpoints',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    displayName: 'Mistral AI',
    description: 'European AI. GDPR-friendly, efficient models.',
    requiresApiKey: true,
    apiKeyUrl: 'https://console.mistral.ai/api-keys',
    apiKeyLabel: 'Mistral API Key',
    hasFreeModels: false,
    supportsCORS: true,
    requiresProxy: false,
    supportsStreaming: true,
    websiteUrl: 'https://mistral.ai',
    docsUrl: 'https://docs.mistral.ai',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    displayName: 'Google Gemini',
    description: 'Google\'s multimodal AI. Large context window.',
    requiresApiKey: true,
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
    apiKeyLabel: 'Gemini API Key',
    hasFreeModels: true,
    freeModelIds: ['gemini-1.5-flash'],
    freeTierLimits: {
      requestsPerMinute: 60,
      requestsPerDay: 1500,
      description: '60 req/min, 1500 req/day on free tier',
    },
    supportsCORS: true,
    requiresProxy: false,
    supportsStreaming: true,
    websiteUrl: 'https://ai.google.dev',
    docsUrl: 'https://ai.google.dev/docs',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    displayName: 'OpenAI',
    description: 'Industry-leading models. Requires paid API key.',
    requiresApiKey: true,
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    apiKeyLabel: 'OpenAI API Key',
    hasFreeModels: false,
    supportsCORS: false,
    requiresProxy: true,
    supportsStreaming: true,
    websiteUrl: 'https://openai.com',
    docsUrl: 'https://platform.openai.com/docs',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    displayName: 'Anthropic',
    description: 'Claude models. Best for reasoning and safety.',
    requiresApiKey: true,
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    apiKeyLabel: 'Anthropic API Key',
    hasFreeModels: false,
    supportsCORS: false,
    requiresProxy: true,
    supportsStreaming: true,
    websiteUrl: 'https://anthropic.com',
    docsUrl: 'https://docs.anthropic.com',
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    displayName: 'xAI (Grok)',
    description: 'Grok models from xAI.',
    requiresApiKey: true,
    apiKeyUrl: 'https://x.ai',
    apiKeyLabel: 'xAI API Key',
    hasFreeModels: false,
    supportsCORS: false,
    requiresProxy: true,
    supportsStreaming: true,
    websiteUrl: 'https://x.ai',
    docsUrl: 'https://docs.x.ai',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    displayName: 'DeepSeek',
    description: 'Cost-effective reasoning models.',
    requiresApiKey: true,
    apiKeyUrl: 'https://platform.deepseek.com',
    apiKeyLabel: 'DeepSeek API Key',
    hasFreeModels: false,
    supportsCORS: true,
    requiresProxy: false,
    supportsStreaming: true,
    websiteUrl: 'https://deepseek.com',
    docsUrl: 'https://platform.deepseek.com/docs',
  },
};

/**
 * Provider model lists (lightweight - just metadata, no SDK)
 * Duplicated from providers to avoid loading SDKs for UI display
 */
export const PROVIDER_MODELS: Record<string, AIModel[]> = {
  openrouter: [
    {
      id: 'meta-llama/llama-3.3-70b-instruct:free',
      name: 'Llama 3.3 70B (Free)',
      provider: 'openrouter',
      speedRating: 3,
      qualityRating: 5,
      contextWindow: 131072,
      supportsStreaming: true,
      isFree: true,
      requiresApiKey: true,
      useCases: ['chat', 'code', 'reasoning'],
      description: 'Latest Llama 3.3 70B. Excellent all-around performance.',
    },
    {
      id: 'google/gemma-2-9b-it:free',
      name: 'Gemma 2 9B (Free)',
      provider: 'openrouter',
      speedRating: 4,
      qualityRating: 3,
      contextWindow: 8192,
      supportsStreaming: true,
      isFree: true,
      requiresApiKey: true,
      useCases: ['chat', 'quick-tasks'],
      description: 'Google\'s efficient open model.',
    },
  ],
  groq: [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B Versatile',
      provider: 'groq',
      speedRating: 5,
      qualityRating: 5,
      contextWindow: 131072,
      supportsStreaming: true,
      isFree: true,
      requiresApiKey: true,
      useCases: ['chat', 'code', 'reasoning'],
      description: 'Fastest Llama 3.3 70B inference.',
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B Instant',
      provider: 'groq',
      speedRating: 5,
      qualityRating: 3,
      contextWindow: 131072,
      supportsStreaming: true,
      isFree: true,
      requiresApiKey: true,
      useCases: ['chat', 'quick-tasks'],
      description: 'Ultra-fast small model.',
    },
  ],
  // Other providers have models defined in their respective provider files
  // They are loaded lazily when the provider is first used
  huggingface: [],
  mistral: [],
  gemini: [],
  openai: [],
  anthropic: [],
  xai: [],
  deepseek: [],
};

/**
 * Cache for loaded providers
 */
const loadedProviders: Map<string, AIProvider> = new Map();

/**
 * Loading promises to prevent duplicate loads
 */
const loadingPromises: Map<string, Promise<AIProvider>> = new Map();

/**
 * Load a provider dynamically
 * SDKs are only loaded when the provider is first used
 */
export async function loadProvider(providerId: string): Promise<AIProvider> {
  // Return cached provider if already loaded
  if (loadedProviders.has(providerId)) {
    return loadedProviders.get(providerId)!;
  }

  // Return existing loading promise if already loading
  if (loadingPromises.has(providerId)) {
    return loadingPromises.get(providerId)!;
  }

  // Create loading promise
  const loadingPromise = (async (): Promise<AIProvider> => {
    let provider: AIProvider;

    switch (providerId) {
      case 'openrouter': {
        const { openRouterProvider } = await import('./openRouterProvider');
        provider = openRouterProvider;
        break;
      }
      case 'groq': {
        const { groqProvider } = await import('./groqProvider');
        provider = groqProvider;
        break;
      }
      case 'huggingface': {
        const { huggingFaceProvider } = await import('./huggingFaceProvider');
        provider = huggingFaceProvider;
        break;
      }
      case 'mistral': {
        const { mistralProvider } = await import('./mistralProvider');
        provider = mistralProvider;
        break;
      }
      case 'gemini': {
        const { geminiProvider } = await import('./geminiProvider');
        provider = geminiProvider;
        break;
      }
      case 'openai': {
        const { openaiProvider } = await import('./openaiProvider');
        provider = openaiProvider;
        break;
      }
      case 'anthropic': {
        const { anthropicProvider } = await import('./anthropicProvider');
        provider = anthropicProvider;
        break;
      }
      case 'xai': {
        const { xaiProvider } = await import('./xaiProvider');
        provider = xaiProvider;
        break;
      }
      case 'deepseek': {
        const { deepseekProvider } = await import('./deepseekProvider');
        provider = deepseekProvider;
        break;
      }
      default:
        throw new Error(`Unknown provider: ${providerId}`);
    }

    // Cache the loaded provider
    loadedProviders.set(providerId, provider);
    loadingPromises.delete(providerId);

    return provider;
  })();

  loadingPromises.set(providerId, loadingPromise);
  return loadingPromise;
}

/**
 * Check if a provider is loaded
 */
export function isProviderLoaded(providerId: string): boolean {
  return loadedProviders.has(providerId);
}

/**
 * Get a loaded provider (returns null if not yet loaded)
 */
export function getLoadedProvider(providerId: string): AIProvider | null {
  return loadedProviders.get(providerId) ?? null;
}

/**
 * Get all loaded providers
 */
export function getAllLoadedProviders(): Map<string, AIProvider> {
  return loadedProviders;
}

/**
 * Get all provider IDs
 */
export function getAllProviderIds(): string[] {
  return Object.keys(PROVIDER_METADATA);
}

/**
 * Preload providers that have API keys configured
 * Called on app initialization to have providers ready
 */
export async function preloadConfiguredProviders(
  getApiKey: (providerId: string) => string | null
): Promise<void> {
  const providerIds = getAllProviderIds();

  const loadPromises = providerIds
    .filter(id => getApiKey(id) !== null)
    .map(async id => {
      try {
        const provider = await loadProvider(id);
        const apiKey = getApiKey(id);
        if (apiKey) {
          provider.setApiKey(apiKey);
        }
      } catch (error) {
        console.warn(`Failed to preload provider ${id}:`, error);
      }
    });

  await Promise.all(loadPromises);
}
