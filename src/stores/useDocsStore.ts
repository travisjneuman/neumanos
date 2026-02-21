import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  Doc,
  DocFolder,
  PlatformDocMeta,
  ProfessionalDoc,
  SpreadsheetDoc,
  PresentationDoc,
  SpreadsheetSheet,
  Slide,
  SlideTheme,
  DocType,
} from '../types';
import { createSyncedStorage } from '../lib/syncedStorage';
import { useProjectContextStore, matchesProjectFilter } from './useProjectContextStore';
import { toast } from './useToastStore';

// Default slide theme
const DEFAULT_THEME: SlideTheme = {
  id: 'default',
  name: 'Default',
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    accent: '#06B6D4',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
  },
};

// Create empty sheet
function createEmptySheet(name: string = 'Sheet 1'): SpreadsheetSheet {
  // Create 100 rows x 26 columns of empty cells
  const data: string[][] = Array.from({ length: 100 }, () =>
    Array.from({ length: 26 }, () => '')
  );

  return {
    id: nanoid(),
    name,
    data,
    columnWidths: Array(26).fill(100),
    rowHeights: Array(100).fill(24),
    cellStyles: {},
    mergedCells: [],
  };
}

// Create empty slide
function createEmptySlide(order: number): Slide {
  return {
    id: nanoid(),
    order,
    background: { type: 'color', color: '#FFFFFF' },
    elements: [],
    speakerNotes: '',
    layout: 'blank',
  };
}

interface DocsStoreState {
  // User documents (persisted)
  docs: Doc[];
  folders: DocFolder[];

  // Platform docs metadata (loaded from build output)
  platformDocs: PlatformDocMeta[];

  // UI state
  activeFolderId: string | null;
  activeDocId: string | null;
  viewMode: 'list' | 'grid';
  sidebarExpanded: boolean;

  // Document CRUD
  createDoc: (type: DocType, title?: string, folderId?: string) => string;
  updateDoc: (id: string, updates: Partial<Doc>) => void;
  deleteDoc: (id: string) => void;
  duplicateDoc: (id: string) => string | null;

  // Folder CRUD
  createFolder: (name: string, parentId?: string | null) => string;
  updateFolder: (id: string, updates: Partial<DocFolder>) => void;
  deleteFolder: (id: string) => void;

  // Navigation
  setActiveDoc: (id: string | null) => void;
  setActiveFolder: (id: string | null) => void;
  setViewMode: (mode: 'list' | 'grid') => void;
  toggleSidebar: () => void;

  // Platform docs
  setPlatformDocs: (docs: PlatformDocMeta[]) => void;

  // Project context filtering
  getFilteredDocs: () => Doc[];

  // Recent docs
  trackDocAccess: (id: string) => void;
  getRecentDocs: (limit?: number) => Doc[];

  // Getters
  getDocById: (id: string) => Doc | undefined;
  getFolderById: (id: string) => DocFolder | undefined;
  getDocsInFolder: (folderId: string | null) => Doc[];
  getSubfolders: (parentId: string | null) => DocFolder[];
}

export const useDocsStore = create<DocsStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      docs: [],
      folders: [],
      platformDocs: [],
      activeFolderId: null,
      activeDocId: null,
      viewMode: 'list',
      sidebarExpanded: true,

      // Create a new document
      createDoc: (type, title, folderId) => {
        const id = nanoid();
        const now = new Date().toISOString();
        const activeProjects = useProjectContextStore.getState().activeProjectIds;

        let newDoc: Doc;

        switch (type) {
          case 'doc':
            newDoc = {
              id,
              title: title || 'Untitled Document',
              source: 'user',
              type: 'doc',
              folderId: folderId || undefined,
              createdAt: now,
              updatedAt: now,
              order: get().docs.length,
              version: 1,
              projectIds: activeProjects,
              content: JSON.stringify({
                type: 'doc',
                content: [{ type: 'paragraph' }],
              }),
            } as ProfessionalDoc;
            break;

          case 'sheet':
            newDoc = {
              id,
              title: title || 'Untitled Spreadsheet',
              source: 'user',
              type: 'sheet',
              folderId: folderId || undefined,
              createdAt: now,
              updatedAt: now,
              order: get().docs.length,
              version: 1,
              projectIds: activeProjects,
              sheets: [createEmptySheet()],
              activeSheetIndex: 0,
            } as SpreadsheetDoc;
            break;

          case 'slides':
            newDoc = {
              id,
              title: title || 'Untitled Presentation',
              source: 'user',
              type: 'slides',
              folderId: folderId || undefined,
              createdAt: now,
              updatedAt: now,
              order: get().docs.length,
              version: 1,
              projectIds: activeProjects,
              slides: [createEmptySlide(0)],
              theme: DEFAULT_THEME,
            } as PresentationDoc;
            break;
        }

        set((state) => ({
          docs: [...state.docs, newDoc],
          activeDocId: id,
        }));

        toast.success(
          `Created ${type === 'doc' ? 'document' : type === 'sheet' ? 'spreadsheet' : 'presentation'}`
        );

        return id;
      },

      // Update a document
      updateDoc: (id, updates) => {
        set((state) => ({
          docs: state.docs.map((doc) => {
            if (doc.id !== id) return doc;
            // Preserve the discriminated union type by casting
            const updatedDoc = {
              ...doc,
              ...updates,
              updatedAt: new Date().toISOString(),
              version: doc.version + 1,
            } as Doc;
            return updatedDoc;
          }),
        }));
      },

      // Delete a document
      deleteDoc: (id) => {
        const doc = get().docs.find((d) => d.id === id);
        if (!doc) return;

        set((state) => ({
          docs: state.docs.filter((d) => d.id !== id),
          activeDocId: state.activeDocId === id ? null : state.activeDocId,
        }));

        toast.success(`Deleted "${doc.title}"`);
      },

      // Duplicate a document
      duplicateDoc: (id) => {
        const doc = get().docs.find((d) => d.id === id);
        if (!doc || doc.source === 'platform') return null;

        const newId = nanoid();
        const now = new Date().toISOString();

        const newDoc: Doc = {
          ...doc,
          id: newId,
          title: `${doc.title} (Copy)`,
          createdAt: now,
          updatedAt: now,
          version: 1,
          order: get().docs.length,
        };

        set((state) => ({
          docs: [...state.docs, newDoc],
        }));

        toast.success(`Duplicated "${doc.title}"`);
        return newId;
      },

      // Create a folder
      createFolder: (name, parentId = null) => {
        const id = nanoid();
        const now = new Date().toISOString();

        const newFolder: DocFolder = {
          id,
          name,
          parentId,
          createdAt: now,
          order: get().folders.length,
        };

        set((state) => ({
          folders: [...state.folders, newFolder],
        }));

        toast.success(`Created folder "${name}"`);
        return id;
      },

      // Update a folder
      updateFolder: (id, updates) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id ? { ...folder, ...updates } : folder
          ),
        }));
      },

      // Delete a folder (moves contents to parent/root)
      deleteFolder: (id) => {
        const folder = get().folders.find((f) => f.id === id);
        if (!folder) return;

        set((state) => ({
          // Move all docs in this folder to parent or root
          docs: state.docs.map((doc) =>
            doc.folderId === id
              ? { ...doc, folderId: folder.parentId || undefined }
              : doc
          ),
          // Move all subfolders to parent or root
          folders: state.folders
            .filter((f) => f.id !== id)
            .map((f) =>
              f.parentId === id ? { ...f, parentId: folder.parentId } : f
            ),
          activeFolderId:
            state.activeFolderId === id ? folder.parentId : state.activeFolderId,
        }));

        toast.success(`Deleted folder "${folder.name}"`);
      },

      // Navigation
      setActiveDoc: (id) => {
        set({ activeDocId: id });
        // Track document access for recent docs list
        if (id) {
          get().trackDocAccess(id);
        }
      },

      setActiveFolder: (id) => {
        set({ activeFolderId: id });
      },

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarExpanded: !state.sidebarExpanded }));
      },

      // Platform docs
      setPlatformDocs: (docs) => {
        set({ platformDocs: docs });
      },

      // Project context filtering
      getFilteredDocs: () => {
        const { docs } = get();
        const { activeProjectIds } = useProjectContextStore.getState();

        // Filter user docs using centralized project filter utility
        return docs.filter(
          (d) =>
            d.source === 'user' &&
            matchesProjectFilter(d.projectIds, activeProjectIds)
        );
      },

      // Recent docs
      trackDocAccess: (id) => {
        set((state) => ({
          docs: state.docs.map((doc) =>
            doc.id === id
              ? { ...doc, lastAccessedAt: new Date().toISOString() } as Doc
              : doc
          ),
        }));
      },

      getRecentDocs: (limit = 10) => {
        const { docs } = get();
        const { activeProjectIds } = useProjectContextStore.getState();

        return docs
          .filter(
            (d) =>
              d.source === 'user' &&
              d.lastAccessedAt &&
              matchesProjectFilter(d.projectIds, activeProjectIds)
          )
          .sort((a, b) => {
            const aTime = a.lastAccessedAt || a.updatedAt;
            const bTime = b.lastAccessedAt || b.updatedAt;
            return bTime.localeCompare(aTime);
          })
          .slice(0, limit);
      },

      // Getters
      getDocById: (id) => {
        return get().docs.find((d) => d.id === id);
      },

      getFolderById: (id) => {
        return get().folders.find((f) => f.id === id);
      },

      getDocsInFolder: (folderId) => {
        return get()
          .docs.filter((d) => {
            if (folderId === null) {
              return !d.folderId;
            }
            return d.folderId === folderId;
          })
          .sort((a, b) => a.order - b.order);
      },

      getSubfolders: (parentId) => {
        return get()
          .folders.filter((f) => f.parentId === parentId)
          .sort((a, b) => a.order - b.order);
      },
    }),
    {
      name: 'docs-store',
      storage: createJSONStorage(() => createSyncedStorage()),
      partialize: (state) => ({
        docs: state.docs,
        folders: state.folders,
        viewMode: state.viewMode,
        sidebarExpanded: state.sidebarExpanded,
      }),
      version: 1,
      migrate: (persisted) => persisted,
    }
  )
);

export default useDocsStore;
