/**
 * AI Summarize Plugin
 *
 * Adds a toolbar button that summarizes the current note content.
 * Uses the AI provider if configured, otherwise falls back to
 * extractive summarization (first sentence of each paragraph).
 */

import React, { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import { $createCalloutNode } from '../../editor/nodes/CalloutNode';
import { useTerminalStore } from '../../../stores/useTerminalStore';
import { AIProviderRouter } from '../../../services/ai/providerRouter';
import { toast } from '../../../stores/useToastStore';

/**
 * Extractive fallback: first sentence of each paragraph
 */
function extractiveSummary(text: string): string {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) return 'No content to summarize.';

  const sentences = paragraphs
    .map((p) => {
      const match = p.match(/^[^.!?]+[.!?]/);
      return match ? match[0].trim() : p.slice(0, 120).trim();
    })
    .filter((s) => s.length > 10);

  if (sentences.length === 0) return paragraphs[0].slice(0, 200);

  return sentences.slice(0, 5).join(' ');
}

interface AISummarizePluginProps {
  className?: string;
}

export const AISummarizePlugin: React.FC<AISummarizePluginProps> = ({ className }) => {
  const [editor] = useLexicalComposerContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleSummarize = useCallback(async () => {
    if (isLoading) return;

    // Get current note content
    let noteText = '';
    editor.getEditorState().read(() => {
      const root = $getRoot();
      noteText = root.getTextContent();
    });

    if (!noteText.trim()) {
      toast.warning('Nothing to summarize', 'The note is empty.');
      return;
    }

    if (noteText.trim().length < 50) {
      toast.warning('Content too short', 'The note needs more content to generate a useful summary.');
      return;
    }

    setIsLoading(true);

    let summary: string;

    try {
      // Try AI provider first
      const terminalState = useTerminalStore.getState();
      const hasProvider = terminalState.providers[terminalState.activeProvider]?.isConfigured;

      if (hasProvider && terminalState.encryptionPassword) {
        const apiKey = await terminalState.getProviderApiKey(
          terminalState.activeProvider,
          terminalState.encryptionPassword
        );

        if (apiKey) {
          const router = new AIProviderRouter({
            primaryProvider: terminalState.activeProvider,
            primaryModel: terminalState.activeModel,
            fallbackEnabled: false,
            fallbackOrder: [],
            notifyOnFallback: false,
          });

          router.setProviderApiKey(terminalState.activeProvider, apiKey);

          const response = await router.sendMessage({
            prompt: `Summarize the following note content in 2-3 concise sentences. Focus on the key points and main ideas.\n\n---\n${noteText.slice(0, 4000)}\n---`,
          });

          summary = response.content;
        } else {
          summary = extractiveSummary(noteText);
        }
      } else {
        summary = extractiveSummary(noteText);
      }
    } catch {
      // AI failed, use extractive fallback
      summary = extractiveSummary(noteText);
    }

    // Insert summary as a callout node
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const calloutNode = $createCalloutNode({
          calloutType: 'info',
          title: 'Summary',
          content: summary,
        });
        selection.insertNodes([calloutNode]);
      } else {
        // If no selection, append to the end
        const root = $getRoot();
        const calloutNode = $createCalloutNode({
          calloutType: 'info',
          title: 'Summary',
          content: summary,
        });
        root.append(calloutNode);
      }
    });

    setIsLoading(false);
    toast.success('Summary generated');
  }, [editor, isLoading]);

  return (
    <button
      onClick={handleSummarize}
      disabled={isLoading}
      className={className}
      title="AI Summarize"
    >
      <Sparkles
        size={14}
        className={isLoading ? 'animate-spin' : ''}
      />
    </button>
  );
};

export default AISummarizePlugin;
