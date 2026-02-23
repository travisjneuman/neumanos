/**
 * AI Terminal Store
 * Manages multi-provider AI terminal state, chat history, and encrypted API keys
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { encrypt, decrypt, type EncryptedData } from '../services/encryption';
import { logger } from '../services/logger';

const log = logger.module('TerminalStore');

/**
 * Message interface
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  provider?: string; // Which provider was used
  model?: string; // Which model was used
  tokenUsage?: TokenUsage; // Token usage for this message
}

/**
 * Token usage for a single message exchange
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number; // Estimated cost in USD
}

/**
 * Conversation with history persistence
 */
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  systemPrompt: string | null;
  systemPromptPreset: SystemPromptPreset | null;
  createdAt: number;
  updatedAt: number;
  totalTokens: number;
  totalCost: number;
}

/**
 * System prompt presets
 */
export type SystemPromptPreset = 'general' | 'code' | 'writing' | 'data';

/**
 * Cumulative usage statistics
 */
export interface CumulativeUsage {
  totalTokens: number;
  totalCost: number;
  totalMessages: number;
  byProvider: Record<string, { tokens: number; cost: number; messages: number }>;
  byDate: Record<string, { tokens: number; cost: number; messages: number }>;
}

/**
 * Note destination configuration for AI Terminal saves
 */
export interface NoteDestination {
  type: 'ai-terminal-daily' | 'app-daily' | 'specific-note' | 'ask-always';
  specificNoteId?: string;
  specificFolderId?: string;
}

/**
 * Quick Note mode configuration
 * - permanent: One Quick Note forever, user manually moves content
 * - daily: New Quick Note each day, old ones become regular notes
 * - auto-archive: Single Quick Note that auto-cleans based on age
 */
export type QuickNoteMode = 'permanent' | 'daily' | 'auto-archive';

/**
 * Notes tab sort configuration
 */
export type NotesSortField = 'updatedAt' | 'createdAt' | 'title';
export type NotesSortOrder = 'asc' | 'desc';

/**
 * Provider configuration with encrypted API key
 */
export interface ProviderConfig {
  providerId: string;
  encryptedApiKey: EncryptedData | null;
  isConfigured: boolean;
  lastUsed: number | null;
}

/**
 * AI Context for context-aware prompts
 */
export interface AIContext {
  type: 'note' | 'task';
  id: string;
  title: string;
  content: string;
}

/**
 * Conversation search result
 */
export interface ConversationSearchResult {
  conversationId: string;
  conversationTitle: string;
  messageId: string;
  messageContent: string;
  messageRole: 'user' | 'assistant' | 'system';
  matchSnippet: string;
  timestamp: number;
}

/**
 * Terminal state interface
 */
interface TerminalState {
  // UI State
  isOpen: boolean;
  hasOpenedTerminal: boolean; // Track if terminal has ever been opened (for deferred loading)

  // Multi-Provider Configuration
  providers: Record<string, ProviderConfig>; // API keys per provider
  activeProvider: string; // Currently selected provider
  activeModel: string; // Currently selected model

  // Fallback Configuration
  fallbackEnabled: boolean;
  fallbackOrder: string[]; // Provider priority list
  notifyOnFallback: boolean;

  // Encryption
  encryptionPassword: string | null; // Session password (not persisted)
  passwordHash: string | null; // For verification (persisted)
  passwordExpiry: Date | null; // When to re-prompt
  passwordExpiryDuration: 'daily' | 'weekly' | 'monthly';
  exportEncryptedKeys: boolean; // Include keys in .brain export

  // Chat State
  messages: Message[];
  isStreaming: boolean;

  // Conversation History
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;

  // System Prompt
  customSystemPrompt: string | null; // Per-conversation override

  // Token Usage Tracking
  cumulativeUsage: CumulativeUsage;

  // Note Integration State
  noteDestination: NoteDestination;
  aiTerminalFolderId: string | null;
  recentNoteDestinations: string[];

  // Quick Note State
  quickNoteId: string | null;
  quickNoteMode: QuickNoteMode;
  autoArchiveDays: number; // 0 = disabled, 7 = default
  notesSortField: NotesSortField;
  notesSortOrder: NotesSortOrder;

  // Saved Messages Tracking (for duplicate detection)
  savedMessagesByNote: Record<string, string[]>; // noteId -> messageIds[]

  // Context-Aware AI
  activeContext: AIContext | null;

  // UI Actions
  setOpen: (open: boolean) => void;
  toggleTerminal: () => void;

  // Provider Actions (now async for WebCrypto encryption)
  setProviderApiKey: (providerId: string, apiKey: string, password: string) => Promise<void>;
  getProviderApiKey: (providerId: string, password: string) => Promise<string | null>;
  clearProviderApiKey: (providerId: string) => void;
  setActiveProvider: (providerId: string, modelId: string) => void;

  // Encryption Actions
  setEncryptionPassword: (password: string, passwordHash: string, duration: 'daily' | 'weekly' | 'monthly') => void;
  clearEncryptionPassword: () => void;
  isPasswordExpired: () => boolean;
  setExportEncryptedKeys: (shouldExport: boolean) => void;

  // Fallback Actions
  setFallbackEnabled: (enabled: boolean) => void;
  setFallbackOrder: (order: string[]) => void;
  setNotifyOnFallback: (notify: boolean) => void;

  // Chat Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setStreaming: (streaming: boolean) => void;

  // Conversation History Actions
  createConversation: (title?: string) => string;
  switchConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  renameConversation: (conversationId: string, title: string) => void;
  saveCurrentConversation: () => void;
  getConversationList: () => Array<{ id: string; title: string; updatedAt: number; messageCount: number }>;

  // System Prompt Actions
  setConversationSystemPrompt: (prompt: string | null, preset: SystemPromptPreset | null) => void;
  getActiveSystemPrompt: () => string | null;

  // Token Usage Actions
  recordTokenUsage: (usage: TokenUsage, provider: string) => void;

  // Note Integration Actions
  setNoteDestination: (destination: NoteDestination) => void;
  setAITerminalFolderId: (folderId: string | null) => void;
  addRecentNoteDestination: (noteId: string) => void;
  clearRecentNoteDestinations: () => void;

  // Quick Note Actions
  setQuickNoteId: (noteId: string | null) => void;
  setQuickNoteMode: (mode: QuickNoteMode) => void;
  setAutoArchiveDays: (days: number) => void;
  setNotesSortField: (field: NotesSortField) => void;
  setNotesSortOrder: (order: NotesSortOrder) => void;

  // Saved Messages Tracking Actions
  markMessageSaved: (noteId: string, messageId: string) => void;
  isMessageSavedToNote: (noteId: string, messageId: string) => boolean;
  clearSavedMessagesForNote: (noteId: string) => void;

  // Context-Aware AI Actions
  setActiveContext: (context: AIContext | null) => void;

  // Conversation Search
  searchConversations: (query: string) => ConversationSearchResult[];

  // Legacy Compatibility
  model: string; // Deprecated: use activeModel instead
  setModel: (model: string) => void; // Deprecated
}

/**
 * Default fallback order
 */
const DEFAULT_FALLBACK_ORDER = ['openrouter', 'groq', 'huggingface', 'mistral', 'gemini'];

/**
 * AI Terminal Store with multi-provider support
 */
export const useTerminalStore = create<TerminalState>()(
  persist(
    (set, get) => ({
      // Initial State
      isOpen: true,
      hasOpenedTerminal: false, // Defers AITerminal loading until first open

      // Multi-Provider State
      providers: {},
      activeProvider: 'gemini', // Default to Gemini for backward compatibility
      activeModel: 'gemini-1.5-flash',

      // Fallback Configuration
      fallbackEnabled: true,
      fallbackOrder: DEFAULT_FALLBACK_ORDER,
      notifyOnFallback: true,

      // Encryption State
      encryptionPassword: null,
      passwordHash: null,
      passwordExpiry: null,
      passwordExpiryDuration: 'weekly',
      exportEncryptedKeys: false, // Don't export keys by default for security

      // Chat State
      messages: [],
      isStreaming: false,

      // Conversation History
      conversations: {},
      activeConversationId: null,

      // System Prompt
      customSystemPrompt: null,

      // Token Usage Tracking
      cumulativeUsage: {
        totalTokens: 0,
        totalCost: 0,
        totalMessages: 0,
        byProvider: {},
        byDate: {},
      },

      // Note Integration State
      noteDestination: { type: 'ai-terminal-daily' },
      aiTerminalFolderId: null,
      recentNoteDestinations: [],

      // Quick Note State
      quickNoteId: null,
      quickNoteMode: 'permanent', // Default: one permanent Quick Note
      autoArchiveDays: 7, // Default: 7 days (only used in auto-archive mode)
      notesSortField: 'updatedAt', // Default: sort by last updated
      notesSortOrder: 'desc', // Default: newest first

      // Saved Messages Tracking
      savedMessagesByNote: {}, // noteId -> messageIds[]

      // Context-Aware AI
      activeContext: null,

      // Legacy State (backward compatibility)
      model: 'gemini-1.5-flash',

      // UI Actions
      setOpen: (open) => set((state) => ({
        isOpen: open,
        // Mark as opened once the terminal is first opened (triggers deferred load)
        hasOpenedTerminal: open ? true : state.hasOpenedTerminal,
      })),
      toggleTerminal: () => set((state) => ({
        isOpen: !state.isOpen,
        // Mark as opened once the terminal is first opened (triggers deferred load)
        hasOpenedTerminal: !state.isOpen ? true : state.hasOpenedTerminal,
      })),

      // Provider Actions (async for WebCrypto)
      setProviderApiKey: async (providerId, apiKey, password) => {
        try {
          // Encrypt the API key using WebCrypto
          const encryptedData = await encrypt(apiKey, password);

          set((state) => ({
            providers: {
              ...state.providers,
              [providerId]: {
                providerId,
                encryptedApiKey: encryptedData,
                isConfigured: true,
                lastUsed: Date.now(),
              },
            },
          }));
        } catch (error) {
          log.error('Failed to encrypt API key', { error });
          throw new Error('Failed to encrypt API key. Please try again.');
        }
      },

      getProviderApiKey: async (providerId, password) => {
        const provider = get().providers[providerId];
        if (!provider || !provider.encryptedApiKey) {
          return null;
        }

        try {
          // Decrypt the API key using WebCrypto (with backward compatibility)
          const decrypted = await decrypt(provider.encryptedApiKey, password);
          return decrypted;
        } catch (error) {
          log.error('Failed to decrypt API key', { error });
          throw new Error('Failed to decrypt API key. Incorrect password or corrupted data.');
        }
      },

      clearProviderApiKey: (providerId) => {
        set((state) => {
          const newProviders = { ...state.providers };
          delete newProviders[providerId];
          return { providers: newProviders };
        });
      },

      setActiveProvider: (providerId, modelId) => {
        set({
          activeProvider: providerId,
          activeModel: modelId,
        });
      },

      // Encryption Actions
      setEncryptionPassword: (password, passwordHash, duration) => {
        // Calculate expiry
        const now = new Date();
        const expiry = new Date(now);

        switch (duration) {
          case 'daily':
            expiry.setDate(expiry.getDate() + 1);
            break;
          case 'weekly':
            expiry.setDate(expiry.getDate() + 7);
            break;
          case 'monthly':
            expiry.setMonth(expiry.getMonth() + 1);
            break;
        }

        set({
          encryptionPassword: password,
          passwordHash: passwordHash,
          passwordExpiry: expiry,
          passwordExpiryDuration: duration,
        });
      },

      clearEncryptionPassword: () => {
        set({
          encryptionPassword: null,
          passwordExpiry: null,
        });
      },

      isPasswordExpired: () => {
        const { passwordExpiry } = get();
        if (!passwordExpiry) return true;
        return new Date() > new Date(passwordExpiry);
      },

      setExportEncryptedKeys: (shouldExport) => {
        set({ exportEncryptedKeys: shouldExport });
      },

      // Fallback Actions
      setFallbackEnabled: (enabled) => set({ fallbackEnabled: enabled }),
      setFallbackOrder: (order) => set({ fallbackOrder: order }),
      setNotifyOnFallback: (notify) => set({ notifyOnFallback: notify }),

      // Chat Actions
      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };
        set((state) => ({ messages: [...state.messages, newMessage] }));
      },
      clearMessages: () => set({ messages: [] }),
      setStreaming: (streaming) => set({ isStreaming: streaming }),

      // Conversation History Actions
      createConversation: (title) => {
        const id = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const now = Date.now();

        // Save current conversation before creating new one
        const { activeConversationId, messages } = get();
        if (activeConversationId && messages.length > 0) {
          get().saveCurrentConversation();
        }

        const conversation: Conversation = {
          id,
          title: title || 'New Conversation',
          messages: [],
          systemPrompt: null,
          systemPromptPreset: null,
          createdAt: now,
          updatedAt: now,
          totalTokens: 0,
          totalCost: 0,
        };

        set((state) => ({
          conversations: { ...state.conversations, [id]: conversation },
          activeConversationId: id,
          messages: [],
          customSystemPrompt: null,
        }));

        log.info('Created conversation', { id, title: conversation.title });
        return id;
      },

      switchConversation: (conversationId) => {
        const state = get();

        // Save current conversation first
        if (state.activeConversationId && state.messages.length > 0) {
          state.saveCurrentConversation();
        }

        const conversation = state.conversations[conversationId];
        if (!conversation) {
          log.warn('Conversation not found', { conversationId });
          return;
        }

        set({
          activeConversationId: conversationId,
          messages: conversation.messages,
          customSystemPrompt: conversation.systemPrompt,
        });

        log.info('Switched to conversation', { conversationId, title: conversation.title });
      },

      deleteConversation: (conversationId) => {
        set((state) => {
          const { [conversationId]: deleted, ...remaining } = state.conversations;
          const isActive = state.activeConversationId === conversationId;

          return {
            conversations: remaining,
            activeConversationId: isActive ? null : state.activeConversationId,
            messages: isActive ? [] : state.messages,
            customSystemPrompt: isActive ? null : state.customSystemPrompt,
          };
        });

        log.info('Deleted conversation', { conversationId });
      },

      renameConversation: (conversationId, title) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (!conversation) return state;

          return {
            conversations: {
              ...state.conversations,
              [conversationId]: { ...conversation, title, updatedAt: Date.now() },
            },
          };
        });
      },

      saveCurrentConversation: () => {
        const { activeConversationId, messages, customSystemPrompt, conversations } = get();
        if (!activeConversationId) return;

        const existing = conversations[activeConversationId];
        const totalTokens = messages.reduce((sum, m) => sum + (m.tokenUsage?.totalTokens ?? 0), 0);
        const totalCost = messages.reduce((sum, m) => sum + (m.tokenUsage?.estimatedCost ?? 0), 0);

        // Auto-generate title from first user message if still default
        let title = existing?.title || 'New Conversation';
        if (title === 'New Conversation' && messages.length > 0) {
          const firstUserMsg = messages.find((m) => m.role === 'user');
          if (firstUserMsg) {
            title = firstUserMsg.content.substring(0, 50).trim();
            if (firstUserMsg.content.length > 50) title += '...';
          }
        }

        set((state) => ({
          conversations: {
            ...state.conversations,
            [activeConversationId]: {
              ...existing,
              id: activeConversationId,
              title,
              messages: [...messages],
              systemPrompt: customSystemPrompt,
              systemPromptPreset: existing?.systemPromptPreset ?? null,
              createdAt: existing?.createdAt ?? Date.now(),
              updatedAt: Date.now(),
              totalTokens,
              totalCost,
            },
          },
        }));
      },

      getConversationList: () => {
        const { conversations } = get();
        return Object.values(conversations)
          .map((c) => ({
            id: c.id,
            title: c.title,
            updatedAt: c.updatedAt,
            messageCount: c.messages.length,
          }))
          .sort((a, b) => b.updatedAt - a.updatedAt);
      },

      // System Prompt Actions
      setConversationSystemPrompt: (prompt, preset) => {
        set({ customSystemPrompt: prompt });

        // Also update the active conversation record
        const { activeConversationId } = get();
        if (activeConversationId) {
          set((state) => {
            const conv = state.conversations[activeConversationId];
            if (!conv) return state;
            return {
              conversations: {
                ...state.conversations,
                [activeConversationId]: {
                  ...conv,
                  systemPrompt: prompt,
                  systemPromptPreset: preset,
                  updatedAt: Date.now(),
                },
              },
            };
          });
        }
      },

      getActiveSystemPrompt: () => {
        return get().customSystemPrompt;
      },

      // Token Usage Actions
      recordTokenUsage: (usage, provider) => {
        const dateKey = new Date().toISOString().split('T')[0];

        set((state) => {
          const byProvider = { ...state.cumulativeUsage.byProvider };
          const existing = byProvider[provider] || { tokens: 0, cost: 0, messages: 0 };
          byProvider[provider] = {
            tokens: existing.tokens + usage.totalTokens,
            cost: existing.cost + (usage.estimatedCost ?? 0),
            messages: existing.messages + 1,
          };

          const byDate = { ...state.cumulativeUsage.byDate };
          const dateEntry = byDate[dateKey] || { tokens: 0, cost: 0, messages: 0 };
          byDate[dateKey] = {
            tokens: dateEntry.tokens + usage.totalTokens,
            cost: dateEntry.cost + (usage.estimatedCost ?? 0),
            messages: dateEntry.messages + 1,
          };

          return {
            cumulativeUsage: {
              totalTokens: state.cumulativeUsage.totalTokens + usage.totalTokens,
              totalCost: state.cumulativeUsage.totalCost + (usage.estimatedCost ?? 0),
              totalMessages: state.cumulativeUsage.totalMessages + 1,
              byProvider,
              byDate,
            },
          };
        });
      },

      // Note Integration Actions
      setNoteDestination: (destination) => set({ noteDestination: destination }),
      setAITerminalFolderId: (folderId) => set({ aiTerminalFolderId: folderId }),
      addRecentNoteDestination: (noteId) =>
        set((state) => {
          const filtered = (state.recentNoteDestinations || []).filter((id) => id !== noteId);
          return { recentNoteDestinations: [noteId, ...filtered].slice(0, 5) };
        }),
      clearRecentNoteDestinations: () => set({ recentNoteDestinations: [] }),

      // Quick Note Actions
      setQuickNoteId: (noteId) => set({ quickNoteId: noteId }),
      setQuickNoteMode: (mode) => set({ quickNoteMode: mode }),
      setAutoArchiveDays: (days) => set({ autoArchiveDays: days }),
      setNotesSortField: (field) => set({ notesSortField: field }),
      setNotesSortOrder: (order) => set({ notesSortOrder: order }),

      // Saved Messages Tracking Actions
      markMessageSaved: (noteId, messageId) =>
        set((state) => {
          const existing = state.savedMessagesByNote[noteId] || [];
          if (existing.includes(messageId)) {
            return state; // Already tracked
          }
          return {
            savedMessagesByNote: {
              ...state.savedMessagesByNote,
              [noteId]: [...existing, messageId],
            },
          };
        }),
      isMessageSavedToNote: (noteId, messageId) => {
        const state = get();
        const saved = state.savedMessagesByNote[noteId] || [];
        return saved.includes(messageId);
      },
      clearSavedMessagesForNote: (noteId) =>
        set((state) => {
          const { [noteId]: _, ...rest } = state.savedMessagesByNote;
          return { savedMessagesByNote: rest };
        }),

      // Context-Aware AI Actions
      setActiveContext: (context) => set({ activeContext: context }),

      // Conversation Search
      searchConversations: (query) => {
        const { conversations } = get();
        if (!query.trim()) return [];

        const lowerQuery = query.toLowerCase().trim();
        const results: ConversationSearchResult[] = [];

        Object.values(conversations).forEach((conv) => {
          conv.messages.forEach((msg) => {
            if (msg.role === 'system') return;
            const lowerContent = msg.content.toLowerCase();
            const matchIndex = lowerContent.indexOf(lowerQuery);
            if (matchIndex === -1) return;

            // Build a snippet around the match
            const snippetStart = Math.max(0, matchIndex - 40);
            const snippetEnd = Math.min(msg.content.length, matchIndex + query.length + 40);
            let snippet = msg.content.slice(snippetStart, snippetEnd).trim();
            if (snippetStart > 0) snippet = '...' + snippet;
            if (snippetEnd < msg.content.length) snippet = snippet + '...';

            results.push({
              conversationId: conv.id,
              conversationTitle: conv.title,
              messageId: msg.id,
              messageContent: msg.content,
              messageRole: msg.role,
              matchSnippet: snippet,
              timestamp: msg.timestamp,
            });
          });
        });

        // Sort by recency
        results.sort((a, b) => b.timestamp - a.timestamp);
        return results.slice(0, 50);
      },

      // Legacy Actions (backward compatibility)
      setModel: (model) => {
        set({ model, activeModel: model });
      },
    }),
    {
      name: 'ai-terminal',
      partialize: (state) => ({
        // Persist provider configurations (with encrypted keys)
        providers: state.exportEncryptedKeys ? state.providers : {},

        // Persist UI state for deferred loading optimization
        hasOpenedTerminal: state.hasOpenedTerminal,

        // Persist active selection
        activeProvider: state.activeProvider,
        activeModel: state.activeModel,

        // Persist fallback configuration
        fallbackEnabled: state.fallbackEnabled,
        fallbackOrder: state.fallbackOrder,
        notifyOnFallback: state.notifyOnFallback,

        // Persist encryption settings (but NOT the password itself)
        passwordHash: state.passwordHash,
        passwordExpiryDuration: state.passwordExpiryDuration,
        exportEncryptedKeys: state.exportEncryptedKeys,

        // Persist chat history
        messages: state.messages,

        // Persist conversation history
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        customSystemPrompt: state.customSystemPrompt,

        // Persist token usage
        cumulativeUsage: state.cumulativeUsage,

        // Persist note integration settings
        noteDestination: state.noteDestination,
        aiTerminalFolderId: state.aiTerminalFolderId,
        recentNoteDestinations: state.recentNoteDestinations,

        // Persist Quick Note settings
        quickNoteId: state.quickNoteId,
        quickNoteMode: state.quickNoteMode,
        autoArchiveDays: state.autoArchiveDays,
        notesSortField: state.notesSortField,
        notesSortOrder: state.notesSortOrder,

        // Persist saved messages tracking (for duplicate detection)
        savedMessagesByNote: state.savedMessagesByNote,

        // Legacy compatibility
        model: state.model,

        // Don't persist:
        // - encryptionPassword (security - always prompt)
        // - passwordExpiry (recalculated on load)
        // - isOpen (always start closed)
        // - isStreaming (always start false)
      }),
    }
  )
);
