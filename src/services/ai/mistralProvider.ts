/**
 * Mistral AI Provider
 * European AI provider with privacy focus (GDPR-friendly)
 * Free tier available for prototyping (~25 messages)
 *
 * Uses direct fetch API instead of @mistralai/mistralai SDK to reduce bundle size
 */

import type {
  AIProvider,
  AIProviderMetadata,
  AIModel,
  AIMessageOptions,
  AIResponse,
} from './types';
import { ProviderError, ProviderErrorType } from './types';

const MISTRAL_API_BASE = 'https://api.mistral.ai/v1';

/**
 * Mistral provider metadata
 */
const METADATA: AIProviderMetadata = {
  id: 'mistral',
  name: 'Mistral AI',
  displayName: 'Mistral AI',
  description: 'European AI with privacy focus. GDPR-friendly with free tier for prototyping.',

  requiresApiKey: true,
  apiKeyUrl: 'https://console.mistral.ai/api-keys',
  apiKeyLabel: 'Mistral API Key',

  hasFreeModels: true,
  freeModelIds: [
    'mistral-small-latest',
    'mistral-medium-latest',
  ],

  freeTierLimits: {
    description: 'Free tier: Limited usage (~25 messages). Restrictive rate limits after initial use.',
  },

  supportsCORS: false,
  requiresProxy: true, // Mistral likely requires proxy, but we'll try direct
  supportsStreaming: true,

  websiteUrl: 'https://mistral.ai',
  docsUrl: 'https://docs.mistral.ai',
};

/**
 * Free models on Mistral (limited usage)
 */
const FREE_MODELS: AIModel[] = [
  {
    id: 'mistral-small-latest',
    name: 'Mistral Small Latest',
    provider: 'mistral',
    speedRating: 4,
    qualityRating: 4,
    contextWindow: 32768,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    isFree: true,
    requiresApiKey: true,
    useCases: ['chat', 'code', 'analysis'],
    description: 'Mistral\'s efficient small model. Good for most tasks.',
  },
  {
    id: 'mistral-medium-latest',
    name: 'Mistral Medium Latest',
    provider: 'mistral',
    speedRating: 3,
    qualityRating: 4,
    contextWindow: 32768,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    isFree: true,
    requiresApiKey: true,
    useCases: ['chat', 'code', 'reasoning', 'analysis'],
    description: 'Mistral\'s medium model. Better quality for complex tasks.',
  },
];

/**
 * Paid models on Mistral
 */
const PAID_MODELS: AIModel[] = [
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large Latest',
    provider: 'mistral',
    speedRating: 3,
    qualityRating: 5,
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsStreaming: true,
    supportsFunctionCalling: true,
    isFree: false,
    costPer1MTokens: 2.0,
    requiresApiKey: true,
    useCases: ['reasoning', 'code', 'analysis', 'creative'],
    description: 'Mistral\'s flagship model. Excellent for complex reasoning.',
  },
];

interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MistralChatRequest {
  model: string;
  messages: MistralMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface MistralChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Mistral AI Provider Implementation
 * Uses direct fetch API for smaller bundle size
 */
export class MistralProvider implements AIProvider {
  metadata = METADATA;
  models = [...FREE_MODELS, ...PAID_MODELS];

  private apiKey: string | null = null;

  /**
   * Check if provider is configured with API key
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Set API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Get current API key
   */
  getApiKey(): string | null {
    return this.apiKey;
  }

  /**
   * Clear API key
   */
  clearApiKey(): void {
    this.apiKey = null;
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${MISTRAL_API_BASE}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Mistral API key validation failed:', error);
      return false;
    }
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): AIModel | null {
    return this.models.find((m) => m.id === modelId) || null;
  }

  /**
   * Get default model
   */
  getDefaultModel(): AIModel {
    return FREE_MODELS[0]; // Mistral Small Latest
  }

  /**
   * Get all free models
   */
  getFreeModels(): AIModel[] {
    return FREE_MODELS;
  }

  /**
   * Send message to Mistral using fetch API
   */
  async sendMessage(model: string, options: AIMessageOptions): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new ProviderError(
        ProviderErrorType.INVALID_API_KEY,
        'Mistral provider not configured. Please add your API key.',
        'mistral'
      );
    }

    try {
      const messages: MistralMessage[] = [];

      // Add system prompt if provided
      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      // Add conversation history
      if (options.conversationHistory) {
        options.conversationHistory.forEach((msg) => {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          });
        });
      }

      // Add current user prompt
      messages.push({
        role: 'user',
        content: options.prompt,
      });

      const requestBody: MistralChatRequest = {
        model: model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        stream: options.stream || false,
      };

      if (options.stream && options.onChunk) {
        // Streaming mode
        return await this.streamMessage(requestBody, options.onChunk, model);
      } else {
        // Non-streaming mode
        return await this.sendNonStreamingMessage(requestBody, model);
      }
    } catch (error: unknown) {
      // Re-throw ProviderErrors
      if (error instanceof ProviderError) {
        throw error;
      }

      // Map other errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ProviderError(
        ProviderErrorType.UNKNOWN,
        `Mistral error: ${errorMessage}`,
        'mistral'
      );
    }
  }

  /**
   * Send non-streaming message
   */
  private async sendNonStreamingMessage(
    requestBody: MistralChatRequest,
    model: string
  ): Promise<AIResponse> {
    const response = await fetch(`${MISTRAL_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      this.handleErrorResponse(response);
    }

    const data: MistralChatResponse = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      content,
      model,
      provider: 'mistral',
      finishReason: data.choices?.[0]?.finish_reason as 'stop' | 'length' | undefined,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  /**
   * Stream message using SSE
   */
  private async streamMessage(
    requestBody: MistralChatRequest,
    onChunk: (chunk: string) => void,
    model: string
  ): Promise<AIResponse> {
    requestBody.stream = true;

    const response = await fetch(`${MISTRAL_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      this.handleErrorResponse(response);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new ProviderError(
        ProviderErrorType.NETWORK_ERROR,
        'Failed to get response stream',
        'mistral'
      );
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content: fullContent,
      model,
      provider: 'mistral',
      finishReason: 'stop',
    };
  }

  /**
   * Handle error responses from Mistral API
   */
  private handleErrorResponse(response: Response): never {
    const status = response.status;

    if (status === 401) {
      throw new ProviderError(
        ProviderErrorType.INVALID_API_KEY,
        'Invalid Mistral API key. Please check your API key and try again.',
        'mistral'
      );
    } else if (status === 429) {
      throw new ProviderError(
        ProviderErrorType.RATE_LIMIT,
        'Mistral rate limit exceeded. Free tier has restrictive limits after initial usage.',
        'mistral',
        true // retryable
      );
    } else if (status === 402) {
      throw new ProviderError(
        ProviderErrorType.QUOTA_EXCEEDED,
        'Mistral quota exceeded. Free tier usage exhausted (~25 messages).',
        'mistral'
      );
    } else if (status === 404) {
      throw new ProviderError(
        ProviderErrorType.MODEL_NOT_FOUND,
        'Model not found on Mistral.',
        'mistral'
      );
    } else {
      throw new ProviderError(
        ProviderErrorType.UNKNOWN,
        `Mistral API error: ${status} ${response.statusText}`,
        'mistral'
      );
    }
  }
}

// Singleton instance
export const mistralProvider = new MistralProvider();
