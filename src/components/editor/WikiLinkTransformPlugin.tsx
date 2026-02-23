/**
 * WikiLinkTransformPlugin
 *
 * Lexical plugin that:
 * 1. Detects [[Note Title]] patterns in text
 * 2. Transforms them into WikiLinkNode instances
 * 3. Determines if links are broken (note doesn't exist)
 * 4. Updates link states when notes are created/deleted
 * 5. Handles clicks on broken links to create notes
 */

import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  TextNode,
  COMMAND_PRIORITY_LOW,
  CLICK_COMMAND,
  type LexicalNode,
} from 'lexical';
import type { Note } from '../../types/notes';
import { WikiLinkNode, $createWikiLinkNode, $isWikiLinkNode, isLinkBroken } from './WikiLinkNode';
import { ConfirmDialog } from '../ConfirmDialog';
import { useNotesStore } from '../../stores/useNotesStore';
import { useNavigate } from 'react-router-dom';
import { parseBlockReference } from '../../utils/blockReferences';

interface WikiLinkTransformPluginProps {
  notes: Record<string, Note>;
}

export default function WikiLinkTransformPlugin({ notes }: WikiLinkTransformPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [pendingLinkTitle, setPendingLinkTitle] = useState<string>('');
  const createNote = useNotesStore((state) => state.createNote);
  const navigate = useNavigate();

  useEffect(() => {
    const removeTransform = editor.registerNodeTransform(TextNode, (textNode) => {
      if ($isWikiLinkNode(textNode)) {
        return;
      }

      const text = textNode.getTextContent();
      const wikiLinkPattern = /\[\[([^\]]+)\]\]/g;
      let match;
      const matches: Array<{ start: number; end: number; title: string }> = [];

      while ((match = wikiLinkPattern.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          title: match[1].trim(),
        });
      }

      if (matches.length === 0) {
        return;
      }

      let currentOffset = 0;
      const nodesToInsert: Array<TextNode | WikiLinkNode> = [];

      matches.forEach((linkMatch) => {
        if (linkMatch.start > currentOffset) {
          const beforeText = text.slice(currentOffset, linkMatch.start);
          nodesToInsert.push(new TextNode(beforeText));
        }

        // Parse block reference
        const blockRef = parseBlockReference(linkMatch.title);
        const isBroken = isLinkBroken(blockRef.noteTitle, notes);
        const wikiLinkNode = $createWikiLinkNode(
          blockRef.noteTitle,
          isBroken,
          blockRef.blockId
        );
        nodesToInsert.push(wikiLinkNode);

        currentOffset = linkMatch.end;
      });

      if (currentOffset < text.length) {
        const afterText = text.slice(currentOffset);
        nodesToInsert.push(new TextNode(afterText));
      }

      if (nodesToInsert.length > 0) {
        textNode.replace(nodesToInsert[0]);
        for (let i = 1; i < nodesToInsert.length; i++) {
          nodesToInsert[i - 1].insertAfter(nodesToInsert[i]);
        }
      }
    });

    return removeTransform;
  }, [editor, notes]);

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();

      root.getChildren().forEach((node) => {
        if ('getChildren' in node && typeof node.getChildren === 'function') {
          (node.getChildren() as LexicalNode[]).forEach((child: LexicalNode) => {
            if ($isWikiLinkNode(child)) {
              const linkTitle = child.getLinkTitle();
              const isBroken = isLinkBroken(linkTitle, notes);

              if (child.getIsBroken() !== isBroken) {
                child.setIsBroken(isBroken);
              }
            }
          });
        }
      });
    });
  }, [editor, notes]);

  useEffect(() => {
    const removeClickListener = editor.registerCommand(
      CLICK_COMMAND,
      (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        if (target.classList.contains('wiki-link')) {
          event.preventDefault();

          let linkTitle: string | null = null;
          let isBroken: boolean = false;

          editor.getEditorState().read(() => {
            const root = $getRoot();

            root.getChildren().forEach((node) => {
              if ('getChildren' in node && typeof node.getChildren === 'function') {
                (node.getChildren() as LexicalNode[]).forEach((child: LexicalNode) => {
                  if ($isWikiLinkNode(child)) {
                    const dom = editor.getElementByKey(child.getKey());
                    if (dom === target) {
                      linkTitle = child.getLinkTitle();
                      isBroken = child.getIsBroken();
                    }
                  }
                });
              }
            });
          });

          if (linkTitle !== null) {
            const title: string = linkTitle;
            if (isBroken) {
              setPendingLinkTitle(title);
              setCreateDialogOpen(true);
            } else {
              const notesArray = Object.values(notes);
              const linkTitleLower = title.toLowerCase();
              const targetNote = notesArray.find(
                (note) =>
                  note.title.toLowerCase() === linkTitleLower ||
                  note.title.toLowerCase().startsWith(linkTitleLower) ||
                  (note.aliases?.some(
                    (alias) => alias.toLowerCase() === linkTitleLower
                  ) ?? false)
              );

              if (targetNote) {
                navigate(`/notes?note=${targetNote.id}`);
              }
            }
          }

          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    return removeClickListener;
  }, [editor, notes, navigate]);

  const handleCreateNote = () => {
    if (!pendingLinkTitle) return;

    const newNote = createNote({
      title: pendingLinkTitle,
      contentText: '',
      content: '',
    });

    navigate(`/notes?note=${newNote.id}`);

    setCreateDialogOpen(false);
    setPendingLinkTitle('');
  };

  return (
    <>
      <ConfirmDialog
        isOpen={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setPendingLinkTitle('');
        }}
        onConfirm={handleCreateNote}
        title="Create Note"
        message={`Note "${pendingLinkTitle}" doesn't exist. Create it?`}
        confirmText="Create"
        cancelText="Cancel"
        variant="info"
      />
    </>
  );
}
