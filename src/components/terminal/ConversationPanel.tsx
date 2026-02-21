/**
 * Conversation History Panel
 * Shows list of past conversations with CRUD operations
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { MessageSquarePlus, Pencil, Trash2, Check, X } from 'lucide-react';

interface ConversationPanelProps {
  onClose: () => void;
}

export const ConversationPanel: React.FC<ConversationPanelProps> = ({ onClose }) => {
  const {
    activeConversationId,
    messages,
    getConversationList,
    createConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
    saveCurrentConversation,
  } = useTerminalStore();

  const conversations = getConversationList();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleNewConversation = useCallback(() => {
    createConversation();
    onClose();
  }, [createConversation, onClose]);

  const handleSwitch = useCallback((id: string) => {
    switchConversation(id);
    onClose();
  }, [switchConversation, onClose]);

  const handleStartRename = useCallback((id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
  }, []);

  const handleConfirmRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      renameConversation(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  }, [renamingId, renameValue, renameConversation]);

  const handleCancelRename = useCallback(() => {
    setRenamingId(null);
    setRenameValue('');
  }, []);

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(id);
  }, [deleteConversation]);

  // Save current conversation if it has messages but no ID yet
  const handleSaveCurrent = useCallback(() => {
    if (messages.length > 0 && !activeConversationId) {
      createConversation();
      saveCurrentConversation();
    } else if (messages.length > 0) {
      saveCurrentConversation();
    }
  }, [messages, activeConversationId, createConversation, saveCurrentConversation]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-dark flex-shrink-0">
        <h3 className="text-sm font-medium text-text-dark-primary">Conversations</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewConversation}
            className="p-1.5 hover:bg-surface-dark-elevated rounded transition-all text-text-dark-secondary hover:text-accent-green"
            title="New Conversation"
          >
            <MessageSquarePlus size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-dark-elevated rounded transition-all text-text-dark-secondary hover:text-white"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Current unsaved conversation indicator */}
      {messages.length > 0 && !activeConversationId && (
        <button
          onClick={handleSaveCurrent}
          className="mx-2 mt-2 p-2 text-left rounded-lg bg-accent-green/10 border border-accent-green/30 hover:bg-accent-green/20 transition-all"
        >
          <div className="text-xs font-medium text-accent-green">Unsaved conversation</div>
          <div className="text-[10px] text-text-dark-secondary mt-0.5">
            {messages.length} messages - Click to save
          </div>
        </button>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {conversations.length === 0 && (
          <div className="text-center py-8 text-text-dark-secondary">
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start chatting to create one</p>
          </div>
        )}

        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group relative rounded-lg transition-all cursor-pointer ${
              conv.id === activeConversationId
                ? 'bg-accent-green/10 border border-accent-green/30'
                : 'bg-surface-dark hover:bg-surface-dark-elevated border border-transparent hover:border-border-dark'
            }`}
          >
            {renamingId === conv.id ? (
              <div className="p-2 flex items-center gap-1">
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmRename();
                    if (e.key === 'Escape') handleCancelRename();
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none focus:ring-1 focus:ring-accent-green"
                />
                <button onClick={handleConfirmRename} className="p-1 text-accent-green hover:bg-accent-green/20 rounded">
                  <Check size={14} />
                </button>
                <button onClick={handleCancelRename} className="p-1 text-text-dark-secondary hover:bg-surface-dark-elevated rounded">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleSwitch(conv.id)}
                className="w-full text-left p-2"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-text-dark-primary truncate">
                      {conv.title}
                    </div>
                    <div className="text-[10px] text-text-dark-tertiary mt-0.5">
                      {conv.messageCount} messages • {new Date(conv.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartRename(conv.id, conv.title); }}
                      className="p-1 hover:bg-surface-dark-elevated rounded text-text-dark-secondary hover:text-accent-blue"
                      title="Rename"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(conv.id, e)}
                      className="p-1 hover:bg-surface-dark-elevated rounded text-text-dark-secondary hover:text-accent-red"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
