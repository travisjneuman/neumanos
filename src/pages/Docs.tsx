/**
 * Create Page (formerly Docs)
 * Phase 5: Renamed from Docs to Create, added TabNavigation with 6 tabs
 * - Create (all docs)
 * - Documents
 * - Spreadsheets
 * - Presentations
 * - Diagrams (embedded from Diagrams page)
 * - Forms (embedded from Forms page)
 */
import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Table2,
  Presentation,
  Plus,
  FolderPlus,
  Grid,
  List,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  Edit,
  Trash2,
  Copy,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Shapes,
  ClipboardList,
} from 'lucide-react';
import { StoreErrorBoundary } from '../components/StoreErrorBoundary';
import { useDocsStore } from '../stores/useDocsStore';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Doc, DocFolder, DocType } from '../types';
import { platformDocsMeta, getPlatformDoc } from 'virtual:platform-docs';
import type { PlatformDocMeta } from 'virtual:platform-docs';
import { PageContent } from '../components/PageContent';
import { TabNavigation, type Tab } from '../components/TabNavigation';
import { DiagramsContent } from './Diagrams';
import { FormsContent } from './Forms';

// Lazy load RecentDocsList
const RecentDocsList = lazy(() => import('../components/docs/RecentDocsList'));

// Lazy load DocViewer, DocumentEditor, SpreadsheetEditor, PresentationEditor, and TemplatePicker for code splitting
const DocViewer = lazy(() => import('../components/docs/DocViewer'));
const DocumentEditor = lazy(() => import('../components/docs/DocumentEditor'));
const SpreadsheetEditor = lazy(() => import('../components/docs/SpreadsheetEditor'));
const PresentationEditor = lazy(() =>
  import('../components/docs/PresentationEditor').then((m) => ({ default: m.PresentationEditor }))
);
const TemplatePicker = lazy(() => import('../components/docs/TemplatePicker'));

// Icon mapping for document types
const DOC_TYPE_ICONS = {
  doc: FileText,
  sheet: Table2,
  slides: Presentation,
};

const DOC_TYPE_LABELS = {
  doc: 'Document',
  sheet: 'Spreadsheet',
  slides: 'Presentation',
};

// Category labels for platform docs
const CATEGORY_LABELS: Record<string, string> = {
  'getting-started': 'Getting Started',
  'user-guides': 'User Guides',
  'product': 'Product',
  'other': 'Other',
};

interface DocItemProps {
  doc: Doc;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function DocItem({ doc, isActive, onClick, onContextMenu }: DocItemProps) {
  const Icon = DOC_TYPE_ICONS[doc.type];

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
        isActive
          ? 'bg-accent-primary/10 text-accent-primary'
          : 'text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate text-sm">{doc.title}</span>
    </button>
  );
}

interface FolderItemProps {
  folder: DocFolder;
  isExpanded: boolean;
  isActive: boolean;
  isEditing: boolean;
  editingName: string;
  onClick: () => void;
  onToggle: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onEditChange: (name: string) => void;
  onEditSave: () => void;
  children?: React.ReactNode;
}

function FolderItem({
  folder,
  isExpanded,
  isActive,
  isEditing,
  editingName,
  onClick,
  onToggle,
  onContextMenu,
  onEditChange,
  onEditSave,
  children,
}: FolderItemProps) {
  const FolderIcon = isExpanded ? FolderOpen : Folder;
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer ${
          isActive
            ? 'bg-accent-primary/10'
            : 'hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
        }`}
        onContextMenu={onContextMenu}
      >
        <button
          onClick={onToggle}
          className="p-0.5 hover:bg-surface-light dark:hover:bg-surface-dark rounded"
        >
          <ChevronIcon className="w-3 h-3 text-text-light-tertiary dark:text-text-dark-tertiary" />
        </button>
        <button onClick={onClick} className="flex items-center gap-2 flex-1 min-w-0">
          <FolderIcon className="w-4 h-4 text-accent-yellow shrink-0" />
          {isEditing ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => onEditChange(e.target.value)}
              onBlur={onEditSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEditSave();
                if (e.key === 'Escape') onEditSave();
              }}
              autoFocus
              className="flex-1 min-w-0 text-sm bg-transparent border-b border-accent-primary focus:outline-none text-text-light-primary dark:text-text-dark-primary"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate text-sm text-text-light-primary dark:text-text-dark-primary">
              {folder.name}
            </span>
          )}
        </button>
      </div>
      {isExpanded && children && <div className="ml-4 mt-1">{children}</div>}
    </div>
  );
}


interface ContextMenuProps {
  x: number;
  y: number;
  doc: Doc;
  onClose: () => void;
}

function ContextMenu({ x, y, doc, onClose }: ContextMenuProps) {
  const { deleteDoc, duplicateDoc, setActiveDoc } = useDocsStore();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    setActiveDoc(doc.id);
    navigate(`/create/${doc.id}`);
    onClose();
  };

  const handleDuplicate = () => {
    duplicateDoc(doc.id);
    onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteDoc(doc.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-48 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg"
        style={{ left: x, top: y }}
      >
        <button
          onClick={handleEdit}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-light-alt dark:hover:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
        >
          <Edit className="w-4 h-4" />
          <span className="text-sm">Edit</span>
        </button>
        <button
          onClick={handleDuplicate}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-light-alt dark:hover:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
        >
          <Copy className="w-4 h-4" />
          <span className="text-sm">Duplicate</span>
        </button>
        <div className="border-t border-border-light dark:border-border-dark" />
        <button
          onClick={handleDelete}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-status-error/10 text-status-error"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm">Delete</span>
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); onClose(); }}
        onConfirm={confirmDelete}
        title="Delete Document"
        message={`Delete "${doc.title}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}

interface FolderContextMenuProps {
  x: number;
  y: number;
  folder: DocFolder;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function FolderContextMenu({ x, y, folder: _folder, onClose, onRename, onDelete }: FolderContextMenuProps) {
  // folder prop included for type consistency with ContextMenu pattern
  void _folder;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-48 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg"
        style={{ left: x, top: y }}
      >
        <button
          onClick={onRename}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-light-alt dark:hover:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
        >
          <Edit className="w-4 h-4" />
          <span className="text-sm">Rename</span>
        </button>
        <div className="border-t border-border-light dark:border-border-dark" />
        <button
          onClick={onDelete}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-status-error/10 text-status-error"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm">Delete</span>
        </button>
      </div>
    </>
  );
}

// Phase 5: Tab configuration for Create page (simplified - removed redundant document type tabs)
type CreateTabType = 'create' | 'diagrams' | 'forms';

const VALID_TABS: CreateTabType[] = ['create', 'diagrams', 'forms'];

// Tab configuration for TabNavigation component
const CREATE_TABS: Tab[] = [
  { id: 'create', label: 'Create', icon: Sparkles },
  { id: 'diagrams', label: 'Diagrams', icon: Shapes },
  { id: 'forms', label: 'Forms', icon: ClipboardList },
];

export function Docs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  // Phase 5: Tab state management (simplified - only create, diagrams, forms tabs)
  const getTabFromUrl = (): CreateTabType => {
    const tab = searchParams.get('tab');
    if (tab && VALID_TABS.includes(tab as CreateTabType)) {
      return tab as CreateTabType;
    }
    return 'create'; // Default tab
  };

  const [activeTab, setActiveTab] = useState<CreateTabType>(getTabFromUrl);

  // Update tab when URL changes
  useEffect(() => {
    const newTab = getTabFromUrl();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: CreateTabType) => {
    setActiveTab(tab);
    navigate(`/create?tab=${tab}`, { replace: true });
  };


  // Check if viewing a platform doc (supports both legacy /docs and new /create)
  const isPlatformDocRoute = location.pathname.startsWith('/create/platform/') || location.pathname.startsWith('/docs/platform/');
  const platformDocId = isPlatformDocRoute ? id : null;

  const {
    docs,
    folders,
    activeDocId,
    activeFolderId,
    viewMode,
    sidebarExpanded,
    createDoc,
    updateDoc,
    setActiveDoc,
    setActiveFolder,
    setViewMode,
    getDocsInFolder,
    getSubfolders,
    getFilteredDocs,
    createFolder,
    updateFolder,
    deleteFolder,
  } = useDocsStore();

  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    doc: Doc;
  } | null>(null);
  const [showPlatformDocs, setShowPlatformDocs] = useState(true);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderContextMenu, setFolderContextMenu] = useState<{
    x: number;
    y: number;
    folder: DocFolder;
  } | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<DocFolder | null>(null);

  // Get platform doc content if viewing one
  const activePlatformDoc = useMemo(() => {
    if (platformDocId) {
      return getPlatformDoc(platformDocId);
    }
    return null;
  }, [platformDocId]);

  // Group platform docs by category
  const platformDocsByCategory = useMemo(() => {
    const grouped: Record<string, PlatformDocMeta[]> = {};
    for (const doc of platformDocsMeta) {
      if (!grouped[doc.category]) {
        grouped[doc.category] = [];
      }
      grouped[doc.category].push(doc);
    }
    return grouped;
  }, []);

  // Sync URL with active doc (for user docs only)
  useEffect(() => {
    if (id && !isPlatformDocRoute) {
      setActiveDoc(id);
    } else if (!id) {
      setActiveDoc(null);
    }
  }, [id, isPlatformDocRoute, setActiveDoc]);

  // Get filtered docs based on project context
  const filteredDocs = useMemo(() => getFilteredDocs(), [docs, getFilteredDocs]);

  // Get docs at root level
  const rootDocs = useMemo(
    () => filteredDocs.filter((d) => !d.folderId),
    [filteredDocs]
  );

  // Get folders at root level
  const rootFolders = useMemo(
    () => folders.filter((f) => !f.parentId),
    [folders]
  );

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateDoc = (type: DocType, templateContent?: object) => {
    // For documents, use template content if provided
    if (type === 'doc' && templateContent) {
      const docId = createDoc(type);
      // Update with template content
      updateDoc(docId, { content: JSON.stringify(templateContent) });
      navigate(`/create/${docId}`);
    } else if (type === 'doc') {
      // Show template picker for documents
      setShowTemplatePicker(true);
    } else {
      // For sheets and slides, create directly
      const docId = createDoc(type);
      navigate(`/create/${docId}`);
    }
  };

  const handleTemplateSelect = (template: import('../components/docs/documentTemplates').DocumentTemplate) => {
    const docId = createDoc('doc', template.name);
    // Update with template content
    updateDoc(docId, { content: JSON.stringify(template.content) });
    setShowTemplatePicker(false);
    navigate(`/create/${docId}`);
  };

  const handleContextMenu = (e: React.MouseEvent, doc: Doc) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, doc });
  };

  const handleDocClick = (doc: Doc) => {
    setActiveDoc(doc.id);
    navigate(`/create/${doc.id}`);
  };

  // Folder handlers
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim(), activeFolderId);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folder: DocFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setFolderContextMenu({ x: e.clientX, y: e.clientY, folder });
  };

  const handleStartEditFolder = (folder: DocFolder) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
    setFolderContextMenu(null);
  };

  const handleSaveEditFolder = () => {
    if (editingFolderId && editingFolderName.trim()) {
      updateFolder(editingFolderId, { name: editingFolderName.trim() });
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleDeleteFolder = (folder: DocFolder) => {
    setFolderToDelete(folder);
    setFolderContextMenu(null);
  };

  const confirmDeleteFolder = () => {
    if (folderToDelete) {
      deleteFolder(folderToDelete.id);
      setFolderToDelete(null);
    }
  };

  // Get active document
  const activeDoc = useMemo(
    () => docs.find((d) => d.id === activeDocId),
    [docs, activeDocId]
  );

  // Render folder tree recursively
  const renderFolderTree = (parentId: string | null): React.ReactNode => {
    const childFolders = getSubfolders(parentId);
    const childDocs = getDocsInFolder(parentId).filter((d) =>
      filteredDocs.includes(d)
    );

    return (
      <>
        {childFolders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            isExpanded={expandedFolders.has(folder.id)}
            isActive={activeFolderId === folder.id}
            isEditing={editingFolderId === folder.id}
            editingName={editingFolderId === folder.id ? editingFolderName : folder.name}
            onClick={() => setActiveFolder(folder.id)}
            onToggle={() => toggleFolder(folder.id)}
            onContextMenu={(e) => handleFolderContextMenu(e, folder)}
            onEditChange={setEditingFolderName}
            onEditSave={handleSaveEditFolder}
          >
            {renderFolderTree(folder.id)}
          </FolderItem>
        ))}
        {childDocs.map((doc) => (
          <DocItem
            key={doc.id}
            doc={doc}
            isActive={activeDocId === doc.id}
            onClick={() => handleDocClick(doc)}
            onContextMenu={(e) => handleContextMenu(e, doc)}
          />
        ))}
      </>
    );
  };

  // Check if we're showing docs content (create tab) or embedded content (diagrams, forms)
  const isDocsTab = activeTab === 'create';

  return (
    <PageContent page="create">
      {/* Phase 5: Tab Navigation */}
      <TabNavigation
        tabs={CREATE_TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => handleTabChange(tabId as CreateTabType)}
        ariaLabel="Create navigation"
      />

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="min-h-[600px]"
      >
        {/* Diagrams Tab - Embedded DiagramsContent */}
        {activeTab === 'diagrams' && (
          <StoreErrorBoundary storeName="diagrams">
            <div className="flex flex-col h-full">
              <DiagramsContent />
            </div>
          </StoreErrorBoundary>
        )}

        {/* Forms Tab - Embedded FormsContent */}
        {activeTab === 'forms' && (
          <StoreErrorBoundary storeName="forms">
            <div className="flex flex-col h-full">
              <FormsContent />
            </div>
          </StoreErrorBoundary>
        )}

        {/* Docs Tabs (Create, Documents, Spreadsheets, Presentations) */}
        {isDocsTab && (
          <StoreErrorBoundary storeName="docs">
            <div className="flex h-full">
              {/* Sidebar */}
              {sidebarExpanded && (
                <aside className="w-64 border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex flex-col">
                  {/* Sidebar header - direct create buttons */}
                  <div className="p-3 border-b border-border-light dark:border-border-dark space-y-1.5">
                    <button
                      onClick={() => handleCreateDoc('doc')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary"
                    >
                      <Plus className="w-4 h-4 text-accent-primary" />
                      <FileText className="w-4 h-4 text-accent-primary" />
                      <span className="text-sm">Document</span>
                    </button>
                    <button
                      onClick={() => handleCreateDoc('sheet')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary"
                    >
                      <Plus className="w-4 h-4 text-accent-primary" />
                      <Table2 className="w-4 h-4 text-accent-primary" />
                      <span className="text-sm">Spreadsheet</span>
                    </button>
                    <button
                      onClick={() => handleCreateDoc('slides')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary"
                    >
                      <Plus className="w-4 h-4 text-accent-purple" />
                      <Presentation className="w-4 h-4 text-accent-purple" />
                      <span className="text-sm">Presentation</span>
                    </button>
                  </div>

                  {/* Sidebar content */}
                  <div className="flex-1 overflow-y-auto p-2">
                    {/* Platform Docs Section */}
                    <div className="mb-4">
                      <button
                        onClick={() => setShowPlatformDocs(!showPlatformDocs)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary"
                      >
                        {showPlatformDocs ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        <BookOpen className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">
                          Platform Docs
                        </span>
                      </button>
                      {showPlatformDocs && (
                        <div className="ml-2 mt-1 space-y-2">
                          {Object.entries(platformDocsByCategory).map(([category, categoryDocs]) => (
                            <div key={category}>
                              <div className="px-2 py-1 text-xs font-medium text-text-light-tertiary dark:text-text-dark-tertiary uppercase tracking-wider">
                                {CATEGORY_LABELS[category] || category}
                              </div>
                              <div className="space-y-0.5">
                                {categoryDocs.map((doc) => (
                                  <button
                                    key={doc.id}
                                    onClick={() => navigate(`/create/platform/${doc.id}`)}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-left text-sm transition-colors ${
                                      platformDocId === doc.id
                                        ? 'bg-accent-primary/10 text-accent-primary'
                                        : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
                                    }`}
                                  >
                                    <File className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{doc.title}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* User Docs Section */}
                    <div>
                      <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-text-light-secondary dark:text-text-dark-secondary">
                          My Documents
                        </span>
                        <button
                          onClick={() => setIsCreatingFolder(true)}
                          className="p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary"
                          title="Create folder"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* New folder input */}
                      {isCreatingFolder && (
                        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                          <Folder className="w-4 h-4 text-accent-yellow shrink-0" />
                          <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onBlur={() => {
                              if (!newFolderName.trim()) setIsCreatingFolder(false);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCreateFolder();
                              if (e.key === 'Escape') {
                                setIsCreatingFolder(false);
                                setNewFolderName('');
                              }
                            }}
                            placeholder="New folder name..."
                            autoFocus
                            className="flex-1 min-w-0 text-sm bg-transparent border-b border-accent-primary focus:outline-none text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary"
                          />
                        </div>
                      )}

                      <div className="space-y-0.5">{renderFolderTree(null)}</div>

                      {/* Empty state */}
                      {rootDocs.length === 0 && rootFolders.length === 0 && (
                        <div className="text-center py-8 px-4">
                          <FileText className="w-10 h-10 mx-auto text-text-light-tertiary dark:text-text-dark-tertiary mb-3" />
                          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
                            No documents yet
                          </p>
                          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                            Click "New" to create a document, spreadsheet, or presentation
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View toggle */}
                  <div className="p-2 border-t border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-1 bg-surface-light-alt dark:bg-surface-dark rounded-lg p-0.5">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs ${
                          viewMode === 'list'
                            ? 'bg-surface-light dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary'
                            : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        List
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs ${
                          viewMode === 'grid'
                            ? 'bg-surface-light dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary'
                            : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                        }`}
                      >
                        <Grid className="w-3.5 h-3.5" />
                        Grid
                      </button>
                    </div>
                  </div>
                </aside>
              )}

              {/* Main content */}
              <main className="flex-1 overflow-auto">
                {/* Platform Doc View */}
                {activePlatformDoc ? (
                  <div className="h-full">
                    {/* Back button and header */}
                    <div className="sticky top-0 z-10 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-6 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate('/create')}
                          className="p-1.5 rounded-lg hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated transition-colors"
                          aria-label="Back to create"
                        >
                          <ArrowLeft className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
                        </button>
                        <div>
                          <h1 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                            {activePlatformDoc.title}
                          </h1>
                          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                            Platform Documentation
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Doc content */}
                    <div className="p-6 max-w-4xl mx-auto">
                      <Suspense
                        fallback={
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-pulse text-text-light-tertiary dark:text-text-dark-tertiary">
                              Loading documentation...
                            </div>
                          </div>
                        }
                      >
                        <DocViewer content={activePlatformDoc.content} />
                      </Suspense>
                    </div>
                  </div>
                ) : activeDoc ? (
                  <div className="h-full flex flex-col">
                    {/* Document header */}
                    <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate('/create')}
                          className="p-1.5 rounded-lg hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated transition-colors"
                          aria-label="Back to create"
                        >
                          <ArrowLeft className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
                        </button>
                        {(() => {
                          const Icon = DOC_TYPE_ICONS[activeDoc.type];
                          return <Icon className="w-5 h-5 text-accent-primary" />;
                        })()}
                        <input
                          type="text"
                          value={activeDoc.title}
                          onChange={(e) => updateDoc(activeDoc.id, { title: e.target.value })}
                          className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary bg-transparent border-none focus:outline-none focus:ring-0"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                          {DOC_TYPE_LABELS[activeDoc.type]}
                        </span>
                      </div>
                    </div>

                    {/* Document editor area */}
                    <div className="flex-1 overflow-auto p-4">
                      <Suspense
                        fallback={
                          <div className="flex items-center justify-center h-64">
                            <div className="animate-pulse text-text-light-tertiary dark:text-text-dark-tertiary">
                              Loading editor...
                            </div>
                          </div>
                        }
                      >
                        {activeDoc.type === 'doc' && (
                          <DocumentEditor
                            content={(activeDoc as import('../types').ProfessionalDoc).content}
                            onSave={(content) => updateDoc(activeDoc.id, { content })}
                            title={activeDoc.title}
                          />
                        )}
                        {activeDoc.type === 'sheet' && (
                          <SpreadsheetEditor
                            doc={activeDoc as import('../types').SpreadsheetDoc}
                            onSave={(updates) => updateDoc(activeDoc.id, updates)}
                          />
                        )}
                        {activeDoc.type === 'slides' && (
                          <PresentationEditor
                            doc={activeDoc as import('../types').PresentationDoc}
                            onSave={(updates) => updateDoc(activeDoc.id, updates)}
                          />
                        )}
                      </Suspense>
                    </div>
                  </div>
                ) : (
                  // Empty state - no document selected (with recent docs)
                  <div className="h-full overflow-auto p-6">
                    {/* Recent Documents */}
                    <Suspense fallback={null}>
                      <RecentDocsList onDocClick={handleDocClick} />
                    </Suspense>

                    {/* Welcome message */}
                    <div className="flex items-center justify-center min-h-[300px]">
                      <div className="text-center p-8 max-w-lg">
                        <div className="flex justify-center gap-4 mb-6">
                          <FileText className="w-12 h-12 text-accent-primary opacity-80" />
                          <Table2 className="w-12 h-12 text-accent-secondary opacity-80" />
                          <Presentation className="w-12 h-12 text-accent-purple opacity-80" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-3">
                          Documents, Spreadsheets & Presentations
                        </h2>
                        <p className="text-text-light-secondary dark:text-text-dark-secondary">
                          Create professional documents, analyze data with spreadsheets, and
                          build stunning presentations - all stored locally with full privacy.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </main>

              {/* Context Menu */}
              {contextMenu && (
                <ContextMenu
                  x={contextMenu.x}
                  y={contextMenu.y}
                  doc={contextMenu.doc}
                  onClose={() => setContextMenu(null)}
                />
              )}

              {/* Folder Context Menu */}
              {folderContextMenu && (
                <FolderContextMenu
                  x={folderContextMenu.x}
                  y={folderContextMenu.y}
                  folder={folderContextMenu.folder}
                  onClose={() => setFolderContextMenu(null)}
                  onRename={() => handleStartEditFolder(folderContextMenu.folder)}
                  onDelete={() => handleDeleteFolder(folderContextMenu.folder)}
                />
              )}

              {/* Template Picker Modal */}
              {showTemplatePicker && (
                <Suspense fallback={null}>
                  <TemplatePicker
                    onSelect={handleTemplateSelect}
                    onClose={() => setShowTemplatePicker(false)}
                  />
                </Suspense>
              )}

              {/* Delete Folder Confirmation Dialog */}
              <ConfirmDialog
                isOpen={folderToDelete !== null}
                onClose={() => setFolderToDelete(null)}
                onConfirm={confirmDeleteFolder}
                title="Delete Folder"
                message={folderToDelete ? `Delete folder "${folderToDelete.name}"? Documents inside will be moved to the parent folder.` : ''}
                confirmText="Delete"
                variant="danger"
              />
            </div>
          </StoreErrorBoundary>
        )}
      </div>
    </PageContent>
  );
}

export default Docs;
