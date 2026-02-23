/**
 * VideoEmbedNode - Custom Lexical DecoratorNode for Video Embeds
 *
 * Renders YouTube and Vimeo videos as responsive 16:9 iframes.
 * Click to edit the URL, blur or Escape to render.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DecoratorNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type {
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  EditorConfig,
} from 'lexical';

export interface VideoEmbedPayload {
  url?: string;
  key?: NodeKey;
}

export type SerializedVideoEmbedNode = Spread<
  {
    url: string;
  },
  SerializedLexicalNode
>;

/**
 * Parse a video URL and return the embed URL, or null if unsupported.
 */
function getEmbedUrl(url: string): string | null {
  if (!url.trim()) return null;

  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
  const ytWatchMatch = url.match(
    /(?:youtube\.com\/watch\?.*v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytWatchMatch) {
    return `https://www.youtube-nocookie.com/embed/${ytWatchMatch[1]}`;
  }

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
}

/**
 * VideoEmbedComponent - React component rendered by the DecoratorNode
 */
function VideoEmbedComponent({
  nodeKey,
  url,
}: {
  nodeKey: NodeKey;
  url: string;
}) {
  const [editor] = useLexicalComposerContext();
  const [isEditing, setIsEditing] = useState(!url.trim());
  const [editableUrl, setEditableUrl] = useState(url);
  const inputRef = useRef<HTMLInputElement>(null);

  const embedUrl = getEmbedUrl(url);

  const updateNode = useCallback(
    (newUrl: string) => {
      editor.update(() => {
        const node = editor.getEditorState()._nodeMap.get(nodeKey);
        if (node && $isVideoEmbedNode(node)) {
          const writable = node.getWritable();
          writable.__url = newUrl;
        }
      });
    },
    [editor, nodeKey]
  );

  const handleEdit = useCallback(() => {
    if (!editor.isEditable()) return;
    setEditableUrl(url);
    setIsEditing(true);
  }, [editor, url]);

  const handleFinishEditing = useCallback(() => {
    setIsEditing(false);
    updateNode(editableUrl);
  }, [editableUrl, updateNode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setEditableUrl(url);
        setIsEditing(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleFinishEditing();
      }
    },
    [url, handleFinishEditing]
  );

  const handleDelete = useCallback(() => {
    editor.update(() => {
      const node = editor.getEditorState()._nodeMap.get(nodeKey);
      if (node) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div className="my-4 border border-border-light dark:border-border-dark rounded-lg overflow-hidden group relative">
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-xs z-10"
        title="Remove video embed"
      >
        x
      </button>

      {/* Label */}
      <div className="px-4 py-1.5 bg-surface-light-elevated dark:bg-surface-dark-elevated border-b border-border-light dark:border-border-dark flex items-center gap-2">
        <span className="text-xs font-mono text-text-light-secondary dark:text-text-dark-secondary">
          Video Embed
        </span>
        {embedUrl && !isEditing && (
          <button
            onClick={handleEdit}
            className="text-xs text-accent-primary hover:underline ml-auto"
          >
            Change URL
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="p-4 bg-surface-light dark:bg-surface-dark">
          <input
            ref={inputRef}
            type="text"
            value={editableUrl}
            onChange={(e) => setEditableUrl(e.target.value)}
            onBlur={handleFinishEditing}
            onKeyDown={handleKeyDown}
            placeholder="Paste YouTube or Vimeo URL..."
            className="w-full bg-transparent border border-border-light dark:border-border-dark rounded p-3 font-mono text-sm outline-none text-text-light-primary dark:text-text-dark-primary placeholder:opacity-40 focus:ring-2 focus:ring-accent-blue focus:border-transparent"
          />
          <div className="mt-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            Supports YouTube and Vimeo URLs. Press{' '}
            <kbd className="px-1 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark font-mono">
              Enter
            </kbd>{' '}
            to embed or{' '}
            <kbd className="px-1 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark font-mono">
              Esc
            </kbd>{' '}
            to cancel.
          </div>
        </div>
      ) : embedUrl ? (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            title="Embedded video"
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-presentation"
          />
        </div>
      ) : (
        <div
          className="p-8 bg-surface-light dark:bg-surface-dark cursor-pointer hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors text-center"
          onClick={handleEdit}
        >
          <div className="text-3xl mb-2">▶</div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {url.trim()
              ? 'Unsupported video URL. Click to change.'
              : 'Click to add a video URL'}
          </p>
        </div>
      )}
    </div>
  );
}

export class VideoEmbedNode extends DecoratorNode<React.ReactElement> {
  __url: string;

  static getType(): string {
    return 'video-embed';
  }

  static clone(node: VideoEmbedNode): VideoEmbedNode {
    return new VideoEmbedNode(node.__url, node.__key);
  }

  static importJSON(serializedNode: SerializedVideoEmbedNode): VideoEmbedNode {
    return $createVideoEmbedNode({ url: serializedNode.url });
  }

  exportJSON(): SerializedVideoEmbedNode {
    return {
      type: 'video-embed',
      version: 1,
      url: this.__url,
    };
  }

  constructor(url: string, key?: NodeKey) {
    super(key);
    this.__url = url;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = 'video-embed-node';
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): React.ReactElement {
    return <VideoEmbedComponent nodeKey={this.__key} url={this.__url} />;
  }

  getTextContent(): string {
    return this.__url;
  }

  isInline(): boolean {
    return false;
  }
}

export function $createVideoEmbedNode(
  payload: VideoEmbedPayload
): VideoEmbedNode {
  return new VideoEmbedNode(payload.url ?? '', payload.key);
}

export function $isVideoEmbedNode(
  node: LexicalNode | null | undefined
): node is VideoEmbedNode {
  return node instanceof VideoEmbedNode;
}
