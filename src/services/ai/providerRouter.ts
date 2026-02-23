/**
 * AI Provider Router
 * Routes messages to appropriate providers with automatic fallback support
 * Handles provider failures, rate limits, and intelligent routing
 *
 * PERFORMANCE: Uses dynamic imports via providerLoader.ts to avoid loading
 * all AI SDKs upfront. SDKs are loaded only when a provider is first used.
 * This reduces initial bundle from ~1.5MB to ~10KB for metadata.
 */

import type {
  AIProvider,
  AIModel,
  AIMessageOptions,
  AIResponse,
  ProviderRouterConfig,
} from './types';
import { ProviderError, ProviderErrorType } from './types';
import {
  PROVIDER_METADATA,
  PROVIDER_MODELS,
  loadProvider,
  isProviderLoaded,
  getLoadedProvider,
  getAllProviderIds,
} from './providerLoader';
import { logger } from '../logger';

const log = logger.module('ProviderRouter');

/**
 * Fallback notification callback
 */
export type FallbackCallback = (
  failedProvider: string,
  failedModel: string,
  nextProvider: string,
  nextModel: string,
  reason: string
) => void;

/**
 * Default fallback order (best to worst)
 */
const DEFAULT_FALLBACK_ORDER = [
  'openrouter', // Best flexibility
  'groq', // Best speed
  'huggingface', // Free fallback
  'mistral', // European option
  'gemini', // Google fallback
];

/**
 * AI Provider Router
 * Manages provider selection and automatic fallbacks
 */
export class AIProviderRouter {
  private config: ProviderRouterConfig;
  private onFallback?: FallbackCallback;
  private apiKeys: Map<string, string> = new Map();

  constructor(config: ProviderRouterConfig, onFallback?: FallbackCallback) {
    this.config = config;
    this.onFallback = onFallback;
  }

  /**
   * Update router configuration
   */
  updateConfig(config: Partial<ProviderRouterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Store API key for a provider (will be applied when provider loads)
   */
  setProviderApiKey(providerId: string, apiKey: string): void {
    this.apiKeys.set(providerId, apiKey);

    // If provider is already loaded, apply the key
    const loadedProvider = getLoadedProvider(providerId);
    if (loadedProvider) {
      loadedProvider.setApiKey(apiKey);
    }
  }

  /**
   * Clear API key for a provider
   */
  clearProviderApiKey(providerId: string): void {
    this.apiKeys.delete(providerId);

    const loadedProvider = getLoadedProvider(providerId);
    if (loadedProvider) {
      loadedProvider.clearApiKey();
    }
  }

  /**
   * Get provider by ID (async - loads SDK if needed)
   */
  async getProvider(providerId: string): Promise<AIProvider | null> {
    if (!PROVIDER_METADATA[providerId]) {
      return null;
    }

    try {
      const provider = await loadProvider(providerId);

      // Apply stored API key if we have one
      const storedKey = this.apiKeys.get(providerId);
      if (storedKey && !provider.isConfigured()) {
        provider.setApiKey(storedKey);
      }

      return provider;
    } catch (error) {
      log.error('Failed to load provider', { providerId, error });
      return null;
    }
  }

  /**
   * Get provider synchronously (returns null if not yet loaded)
   * Use for UI display where you don't want to trigger loading
   */
  getProviderSync(providerId: string): AIProvider | null {
    return getLoadedProvider(providerId);
  }

  /**
   * Get provider metadata (sync - no SDK loading)
   */
  getProviderMetadata(providerId: string) {
    return PROVIDER_METADATA[providerId] ?? null;
  }

  /**
   * Get all provider metadata (sync - no SDK loading)
   */
  getAllProviderMetadata() {
    return PROVIDER_METADATA;
  }

  /**
   * Get all providers (sync - uses static registry)
   * @deprecated Use getProvider(id) for actual provider access
   */
  getAllProviders(): Record<string, AIProvider | null> {
    const result: Record<string, AIProvider | null> = {};
    for (const id of getAllProviderIds()) {
      result[id] = getLoadedProvider(id);
    }
    return result;
  }

  /**
   * Get model list for a provider (sync for display)
   */
  getProviderModels(providerId: string): AIModel[] {
    // First check if provider is loaded (has accurate model list)
    const loadedProvider = getLoadedProvider(providerId);
    if (loadedProvider) {
      return loadedProvider.models;
    }

    // Fall back to static model list (may be incomplete for some providers)
    return PROVIDER_MODELS[providerId] ?? [];
  }

  /**
   * Get configured providers (those with API keys stored)
   */
  getConfiguredProviderIds(): string[] {
    return getAllProviderIds().filter((id) => this.apiKeys.has(id));
  }

  /**
   * Get configured providers as AIProvider array (async - loads SDKs)
   */
  async getConfiguredProviders(): Promise<AIProvider[]> {
    const ids = this.getConfiguredProviderIds();
    const providers: AIProvider[] = [];

    for (const id of ids) {
      const provider = await this.getProvider(id);
      if (provider) {
        providers.push(provider);
      }
    }

    return providers;
  }

  /**
   * Check if a provider has an API key configured
   */
  isProviderConfigured(providerId: string): boolean {
    return this.apiKeys.has(providerId);
  }

  /**
   * Get primary provider
   */
  async getPrimaryProvider(): Promise<AIProvider | null> {
    return this.getProvider(this.config.primaryProvider);
  }

  /**
   * Get fallback providers in order
   */
  async getFallbackProviders(): Promise<AIProvider[]> {
    const fallbackOrder =
      this.config.fallbackOrder.length > 0
        ? this.config.fallbackOrder
        : DEFAULT_FALLBACK_ORDER;

    const providers: AIProvider[] = [];

    for (const id of fallbackOrder) {
      if (id === this.config.primaryProvider) continue; // Skip primary
      if (!this.apiKeys.has(id)) continue; // Skip unconfigured

      const provider = await this.getProvider(id);
      if (provider && provider.isConfigured()) {
        providers.push(provider);
      }
    }

    return providers;
  }

  /**
   * Check if a provider error is retryable with fallback
   */
  private isRetryableError(error: ProviderError): boolean {
    return (
      error.type === ProviderErrorType.RATE_LIMIT ||
      error.type === ProviderErrorType.QUOTA_EXCEEDED ||
      error.type === ProviderErrorType.NETWORK_ERROR ||
      error.type === ProviderErrorType.TIMEOUT
    );
  }

  /**
   * Send message with automatic fallback
   */
  async sendMessage(options: AIMessageOptions): Promise<AIResponse> {
    // Check connectivity before attempting any network requests
    if (!navigator.onLine) {
      throw new ProviderError(
        ProviderErrorType.NETWORK_ERROR,
        'You are offline. AI features require an internet connection.',
        this.config.primaryProvider,
        false
      );
    }

    const primaryProvider = await this.getPrimaryProvider();

    if (!primaryProvider) {
      throw new Error(
        `Primary provider "${this.config.primaryProvider}" not found or not configured.`
      );
    }

    // Try primary provider first
    try {
      const response = await primaryProvider.sendMessage(
        this.config.primaryModel,
        options
      );
      return response;
    } catch (error) {
      // If fallback is disabled, throw immediately
      if (!this.config.fallbackEnabled) {
        throw error;
      }

      // Check if error is retryable
      if (error instanceof ProviderError && this.isRetryableError(error)) {
        log.warn('Provider failed with retryable error, attempting fallback', {
          provider: error.provider,
          message: error.message,
        });

        // Try fallback providers
        const fallbackProviders = await this.getFallbackProviders();

        for (const fallbackProvider of fallbackProviders) {
          try {
            // Get default model for fallback provider
            const fallbackModel = fallbackProvider.getDefaultModel();

            // Notify about fallback
            if (this.config.notifyOnFallback && this.onFallback) {
              this.onFallback(
                this.config.primaryProvider,
                this.config.primaryModel,
                fallbackProvider.metadata.id,
                fallbackModel.id,
                error.message
              );
            }

            log.info('Falling back to provider', {
              provider: fallbackProvider.metadata.name,
              model: fallbackModel.name,
            });

            // Try fallback provider
            const response = await fallbackProvider.sendMessage(
              fallbackModel.id,
              options
            );

            // Success! Return response with fallback info
            return {
              ...response,
              provider: fallbackProvider.metadata.id,
              model: fallbackModel.id,
            };
          } catch (fallbackError) {
            log.warn('Fallback provider also failed', {
              provider: fallbackProvider.metadata.name,
              error: fallbackError,
            });
            // Continue to next fallback
          }
        }

        // All providers failed
        throw new Error(
          `All providers failed. Primary: ${error.message}. No working fallback found.`
        );
      }

      // Non-retryable error (invalid API key, model not found, etc.)
      throw error;
    }
  }

  /**
   * Send message to specific provider (bypass routing)
   */
  async sendMessageToProvider(
    providerId: string,
    modelId: string,
    options: AIMessageOptions
  ): Promise<AIResponse> {
    // Check connectivity before attempting any network requests
    if (!navigator.onLine) {
      throw new ProviderError(
        ProviderErrorType.NETWORK_ERROR,
        'You are offline. AI features require an internet connection.',
        providerId,
        false
      );
    }

    const provider = await this.getProvider(providerId);

    if (!provider) {
      throw new Error(`Provider "${providerId}" not found.`);
    }

    if (!provider.isConfigured()) {
      throw new Error(
        `Provider "${providerId}" is not configured. Please add an API key.`
      );
    }

    return provider.sendMessage(modelId, options);
  }

  /**
   * Validate API key for a provider
   */
  async validateProviderApiKey(
    providerId: string,
    apiKey: string
  ): Promise<boolean> {
    const provider = await this.getProvider(providerId);
    if (!provider) return false;

    try {
      return await provider.validateApiKey(apiKey);
    } catch {
      return false;
    }
  }

  /**
   * Validate all configured providers
   */
  async validateProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const id of this.getConfiguredProviderIds()) {
      const provider = await this.getProvider(id);
      if (provider) {
        const apiKey = provider.getApiKey();
        if (apiKey) {
          try {
            results[id] = await provider.validateApiKey(apiKey);
          } catch {
            results[id] = false;
          }
        } else {
          results[id] = false;
        }
      } else {
        results[id] = false;
      }
    }

    return results;
  }

  /**
   * Get provider status summary (sync - uses metadata)
   */
  getProviderStatus(): Record<
    string,
    {
      configured: boolean;
      name: string;
      hasFreeModels: boolean;
      modelCount: number;
    }
  > {
    const status: Record<
      string,
      {
        configured: boolean;
        name: string;
        hasFreeModels: boolean;
        modelCount: number;
      }
    > = {};

    for (const [id, metadata] of Object.entries(PROVIDER_METADATA)) {
      const loadedProvider = getLoadedProvider(id);
      const modelCount = loadedProvider
        ? loadedProvider.models.length
        : (PROVIDER_MODELS[id]?.length ?? 0);

      status[id] = {
        configured: this.apiKeys.has(id),
        name: metadata.displayName,
        hasFreeModels: metadata.hasFreeModels,
        modelCount,
      };
    }

    return status;
  }

  /**
   * Get all available models across all configured providers
   */
  async getAllAvailableModels(): Promise<
    Array<{
      providerId: string;
      providerName: string;
      model: AIModel;
    }>
  > {
    const models: Array<{
      providerId: string;
      providerName: string;
      model: AIModel;
    }> = [];

    for (const id of this.getConfiguredProviderIds()) {
      const provider = await this.getProvider(id);
      if (provider) {
        provider.models.forEach((model) => {
          models.push({
            providerId: id,
            providerName: provider.metadata.displayName,
            model: model,
          });
        });
      }
    }

    return models;
  }

  /**
   * Get free models across all configured providers
   */
  async getFreeModels(): Promise<
    Array<{
      providerId: string;
      providerName: string;
      model: AIModel;
    }>
  > {
    const allModels = await this.getAllAvailableModels();
    return allModels.filter((item) => item.model.isFree);
  }

  /**
   * Recommend best provider for a given use case
   */
  async recommendProvider(
    useCase: string,
    requireFree: boolean = false
  ): Promise<{
    providerId: string;
    modelId: string;
  } | null> {
    const configuredIds = this.getConfiguredProviderIds();

    if (configuredIds.length === 0) {
      return null;
    }

    // Load and check each configured provider
    for (const id of configuredIds) {
      const provider = await this.getProvider(id);
      if (!provider) continue;

      const suitableModels = provider.models.filter((model) => {
        const matchesUseCase = model.useCases.includes(useCase);
        const matchesFreeRequirement = !requireFree || model.isFree;
        return matchesUseCase && matchesFreeRequirement;
      });

      if (suitableModels.length > 0) {
        // Sort by quality rating (descending)
        suitableModels.sort((a, b) => b.qualityRating - a.qualityRating);

        return {
          providerId: provider.metadata.id,
          modelId: suitableModels[0].id,
        };
      }
    }

    // No suitable model found, return default from first configured provider
    const firstId = configuredIds[0];
    const defaultProvider = await this.getProvider(firstId);
    if (defaultProvider) {
      return {
        providerId: defaultProvider.metadata.id,
        modelId: defaultProvider.getDefaultModel().id,
      };
    }

    return null;
  }
}

/**
 * Create default router instance
 */
export function createDefaultRouter(
  onFallback?: FallbackCallback
): AIProviderRouter {
  const config: ProviderRouterConfig = {
    primaryProvider: 'openrouter',
    primaryModel: 'meta-llama/llama-3.3-70b-instruct:free',
    fallbackEnabled: true,
    fallbackOrder: DEFAULT_FALLBACK_ORDER,
    notifyOnFallback: true,
  };

  return new AIProviderRouter(config, onFallback);
}

// Re-export for convenience
export { PROVIDER_METADATA, PROVIDER_MODELS, loadProvider, isProviderLoaded };
