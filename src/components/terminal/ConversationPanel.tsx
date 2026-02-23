/**
 * Conversation History Panel
 * Shows list of past conversations with CRUD operations
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { MessageSquarePlus, Pencil, Trash2, Check, X, FolderPlus, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';

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
    conversationFolders,
    createConversationFolder,
    renameConversationFolder,
    deleteConversationFolder,
    moveConversationToFolder,
    conversations: conversationsRecord,
  } = useTerminalStore();

  const conversations = getConversationList();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const renameFolderInputRef = useRef<HTMLInputElement>(null);

  // Categorize conversations
  const { folderedConvs, unfolderedConvs } = useMemo(() => {
    const foldered = new Map<string, typeof conversations>();
    const unfoldered: typeof conversations = [];

    for (const conv of conversations) {
      const folderId = conversationsRecord[conv.id]?.folderId;
      if (folderId) {
        if (!foldered.has(folderId)) foldered.set(folderId, []);
        foldered.get(folderId)!.push(conv);
      } else {
        unfoldered.push(conv);
      }
    }

    return { folderedConvs: foldered, unfolderedConvs: unfoldered };
  }, [conversations, conversationsRecord]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => {
    if (showNewFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [showNewFolder]);

  useEffect(() => {
    if (renamingFolderId && renameFolderInputRef.current) {
      renameFolderInputRef.current.focus();
      renameFolderInputRef.current.select();
    }
  }, [renamingFolderId]);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  const handleCreateFolder = useCallback(() => {
    if (newFolderName.trim()) {
      createConversationFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    }
  }, [newFolderName, createConversationFolder]);

  const handleRenameFolderConfirm = useCallback(() => {
    if (renamingFolderId && renameFolderValue.trim()) {
      renameConversationFolder(renamingFolderId, renameFolderValue.trim());
    }
    setRenamingFolderId(null);
    setRenameFolderValue('');
  }, [renamingFolderId, renameFolderValue, renameConversationFolder]);

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

  const renderConversation = (conv: { id: string; title: string; updatedAt: number; messageCount: number }) => (
    <div
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
              {/* Move to folder */}
              {conversationFolders.length > 0 && (
                <select
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { moveConversationToFolder(conv.id, e.target.value || null); e.target.value = ''; }}
                  value=""
                  className="w-5 h-5 opacity-0 group-hover:opacity-100 cursor-pointer text-[10px] bg-transparent"
                  title="Move to folder"
                  aria-label="Move to folder"
                >
                  <option value="">Move...</option>
                  <option value="">Unfiled</option>
                  {conversationFolders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
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
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-dark flex-shrink-0">
        <h3 className="text-sm font-medium text-text-dark-primary">Conversations</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNewFolder(true)}
            className="p-1.5 hover:bg-surface-dark-elevated rounded transition-all text-text-dark-secondary hover:text-accent-yellow"
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
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
        {/* New Folder Input */}
        {showNewFolder && (
          <div className="flex items-center gap-1 p-2 bg-surface-dark rounded-lg border border-accent-yellow/30">
            <Folder size={14} className="text-accent-yellow flex-shrink-0" />
            <input
              ref={newFolderInputRef}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); }
              }}
              placeholder="Folder name..."
              className="flex-1 px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none focus:ring-1 focus:ring-accent-yellow"
            />
            <button onClick={handleCreateFolder} className="p-1 text-accent-green hover:bg-accent-green/20 rounded">
              <Check size={14} />
            </button>
            <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="p-1 text-text-dark-secondary hover:bg-surface-dark-elevated rounded">
              <X size={14} />
            </button>
          </div>
        )}

        {conversations.length === 0 && (
          <div className="text-center py-8 text-text-dark-secondary">
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start chatting to create one</p>
          </div>
        )}

        {/* Folders */}
        {conversationFolders.map((folder) => {
          const isExpanded = expandedFolders.has(folder.id);
          const folderConvs = folderedConvs.get(folder.id) || [];
          return (
            <div key={folder.id} className="space-y-1">
              <div className="group flex items-center gap-1 p-1.5 rounded-lg bg-surface-dark hover:bg-surface-dark-elevated transition-all">
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                >
                  {isExpanded ? <ChevronDown size={12} className="text-text-dark-tertiary" /> : <ChevronRight size={12} className="text-text-dark-tertiary" />}
                  {isExpanded ? <FolderOpen size={14} className="text-accent-yellow" /> : <Folder size={14} className="text-accent-yellow" />}
                  {renamingFolderId === folder.id ? (
                    <input
                      ref={renameFolderInputRef}
                      value={renameFolderValue}
                      onChange={(e) => setRenameFolderValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameFolderConfirm();
                        if (e.key === 'Escape') setRenamingFolderId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 px-1 py-0.5 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none focus:ring-1 focus:ring-accent-yellow"
                    />
                  ) : (
                    <span className="text-xs font-medium text-text-dark-primary truncate">
                      {folder.name} ({folderConvs.length})
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {renamingFolderId === folder.id ? (
                    <>
                      <button onClick={handleRenameFolderConfirm} className="p-0.5 text-accent-green hover:bg-accent-green/20 rounded">
                        <Check size={12} />
                      </button>
                      <button onClick={() => setRenamingFolderId(null)} className="p-0.5 text-text-dark-secondary hover:bg-surface-dark-elevated rounded">
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRenamingFolderId(folder.id); setRenameFolderValue(folder.name); }}
                        className="p-0.5 hover:bg-surface-dark-elevated rounded text-text-dark-secondary hover:text-accent-blue"
                        title="Rename folder"
                      >
                        <Pencil size={10} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversationFolder(folder.id); }}
                        className="p-0.5 hover:bg-surface-dark-elevated rounded text-text-dark-secondary hover:text-accent-red"
                        title="Delete folder"
                      >
                        <Trash2 size={10} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {isExpanded && folderConvs.map((conv) => (
                <div key={conv.id} className="pl-6">
                  {renderConversation(conv)}
                </div>
              ))}
            </div>
          );
        })}

        {/* Unfoldered Conversations */}
        {unfolderedConvs.map((conv) => (
          <React.Fragment key={conv.id}>
            {renderConversation(conv)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
