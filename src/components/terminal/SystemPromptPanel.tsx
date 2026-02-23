/**
 * System Prompt Customization Panel
 * Allows setting custom system prompts per conversation with presets
 */

import React, { useState, useCallback } from 'react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import type { SystemPromptPreset } from '../../stores/useTerminalStore';
import { SYSTEM_PROMPT_PRESETS, getSystemPromptPreset } from '../../services/systemPrompts';
import { X, RotateCcw } from 'lucide-react';

interface SystemPromptPanelProps {
  onClose: () => void;
}

export const SystemPromptPanel: React.FC<SystemPromptPanelProps> = ({ onClose }) => {
  const { customSystemPrompt, setConversationSystemPrompt, activeConversationId, conversations, customInstructions, setCustomInstructions } = useTerminalStore();

  const activeConversation = activeConversationId ? conversations[activeConversationId] : null;
  const currentPreset = activeConversation?.systemPromptPreset ?? null;

  const [editedPrompt, setEditedPrompt] = useState(customSystemPrompt ?? '');
  const [selectedPreset, setSelectedPreset] = useState<SystemPromptPreset | null>(currentPreset);
  const [isCustom, setIsCustom] = useState(!currentPreset && !!customSystemPrompt);
  const [editedInstructions, setEditedInstructions] = useState(customInstructions);
  const [showInstructions, setShowInstructions] = useState(!!customInstructions);

  const handleSelectPreset = useCallback((presetId: SystemPromptPreset) => {
    const preset = getSystemPromptPreset(presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setEditedPrompt(preset.prompt);
      setIsCustom(false);
      setConversationSystemPrompt(preset.prompt, presetId);
    }
  }, [setConversationSystemPrompt]);

  const handleSaveCustom = useCallback(() => {
    const prompt = editedPrompt.trim() || null;
    setConversationSystemPrompt(prompt, null);
    setSelectedPreset(null);
  }, [editedPrompt, setConversationSystemPrompt]);

  const handleClear = useCallback(() => {
    setConversationSystemPrompt(null, null);
    setEditedPrompt('');
    setSelectedPreset(null);
    setIsCustom(false);
  }, [setConversationSystemPrompt]);

  const handleToggleCustom = useCallback(() => {
    setIsCustom(true);
    setSelectedPreset(null);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-dark flex-shrink-0">
        <h3 className="text-sm font-medium text-text-dark-primary">System Prompt</h3>
        <div className="flex items-center gap-1">
          {customSystemPrompt && (
            <button
              onClick={handleClear}
              className="p-1.5 hover:bg-surface-dark-elevated rounded transition-all text-text-dark-secondary hover:text-accent-red"
              title="Clear system prompt"
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-dark-elevated rounded transition-all text-text-dark-secondary hover:text-white"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Presets */}
        <div>
          <div className="text-xs font-medium text-text-dark-secondary mb-2">Presets</div>
          <div className="grid grid-cols-2 gap-2">
            {SYSTEM_PROMPT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`p-2 text-left rounded-lg border transition-all ${
                  selectedPreset === preset.id && !isCustom
                    ? 'bg-accent-green/10 border-accent-green/40 text-accent-green'
                    : 'bg-surface-dark border-border-dark hover:border-accent-green/30 text-text-dark-primary hover:text-accent-green'
                }`}
              >
                <div className="text-xs font-medium">{preset.name}</div>
                <div className="text-[10px] text-text-dark-tertiary mt-0.5 line-clamp-2">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt Toggle */}
        <div>
          <button
            onClick={handleToggleCustom}
            className={`w-full p-2 text-left rounded-lg border transition-all ${
              isCustom
                ? 'bg-accent-blue/10 border-accent-blue/40 text-accent-blue'
                : 'bg-surface-dark border-border-dark hover:border-accent-blue/30 text-text-dark-primary hover:text-accent-blue'
            }`}
          >
            <div className="text-xs font-medium">Custom Prompt</div>
            <div className="text-[10px] text-text-dark-tertiary mt-0.5">
              Write your own system instructions
            </div>
          </button>
        </div>

        {/* Custom Prompt Editor */}
        {isCustom && (
          <div>
            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              placeholder="Enter custom system instructions..."
              className="w-full h-40 px-3 py-2 text-xs bg-surface-dark-elevated border border-border-dark rounded-lg text-text-dark-primary placeholder-text-dark-tertiary focus:outline-none focus:ring-1 focus:ring-accent-blue resize-none font-mono"
            />
            <button
              onClick={handleSaveCustom}
              className="mt-2 w-full px-3 py-1.5 text-xs bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 rounded transition-all font-medium"
            >
              Apply Custom Prompt
            </button>
          </div>
        )}

        {/* Current Prompt Preview */}
        {customSystemPrompt && !isCustom && (
          <div>
            <div className="text-xs font-medium text-text-dark-secondary mb-1">Active Prompt Preview</div>
            <div className="p-2 bg-surface-dark-elevated rounded-lg text-[10px] text-text-dark-tertiary font-mono max-h-24 overflow-y-auto">
              {customSystemPrompt.substring(0, 200)}
              {customSystemPrompt.length > 200 && '...'}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border-dark pt-3">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className={`w-full p-2 text-left rounded-lg border transition-all ${
              showInstructions
                ? 'bg-accent-primary/10 border-accent-primary/40 text-accent-primary'
                : 'bg-surface-dark border-border-dark hover:border-accent-primary/30 text-text-dark-primary hover:text-accent-primary'
            }`}
          >
            <div className="text-xs font-medium">Custom Instructions (Global)</div>
            <div className="text-[10px] text-text-dark-tertiary mt-0.5">
              Persistent instructions prepended to every conversation
            </div>
          </button>
        </div>

        {showInstructions && (
          <div>
            <textarea
              value={editedInstructions}
              onChange={(e) => setEditedInstructions(e.target.value)}
              placeholder="e.g., Always respond in bullet points. Use formal tone. Focus on TypeScript."
              className="w-full h-28 px-3 py-2 text-xs bg-surface-dark-elevated border border-border-dark rounded-lg text-text-dark-primary placeholder-text-dark-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary resize-none font-mono"
            />
            <button
              onClick={() => setCustomInstructions(editedInstructions.trim())}
              className="mt-2 w-full px-3 py-1.5 text-xs bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 rounded transition-all font-medium"
            >
              {customInstructions ? 'Update Instructions' : 'Save Instructions'}
            </button>
            {customInstructions && (
              <button
                onClick={() => {
                  setCustomInstructions('');
                  setEditedInstructions('');
                }}
                className="mt-1 w-full px-3 py-1 text-[10px] text-accent-red/60 hover:text-accent-red transition-all"
              >
                Clear Instructions
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
