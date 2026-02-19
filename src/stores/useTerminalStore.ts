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

  // Legacy Compatibility (for existing Gemini-only code)
  apiKey: string | null; // Deprecated: use providers instead
  model: string; // Deprecated: use activeModel instead
  setApiKey: (key: string | null) => Promise<void>; // Deprecated (now async for WebCrypto)
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

      // Legacy State (backward compatibility)
      apiKey: null,
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

      // Legacy Actions (backward compatibility)
      setApiKey: async (key) => {
        set({ apiKey: key });
        // Also set as gemini provider if key is provided
        if (key) {
          const password = get().encryptionPassword;
          if (password) {
            try {
              const encryptedData = await encrypt(key, password);
              set((state) => ({
                providers: {
                  ...state.providers,
                  gemini: {
                    providerId: 'gemini',
                    encryptedApiKey: encryptedData,
                    isConfigured: true,
                    lastUsed: Date.now(),
                  },
                },
              }));
            } catch (error) {
              log.error('Failed to encrypt legacy API key', { error });
            }
          }
        }
      },
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
        apiKey: state.apiKey,
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
