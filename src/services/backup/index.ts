import { BookmarkNode } from '../../types/bookmarks';
import { bookmarksService } from '../bookmarks';
import { withBulkOperation } from '../bookmarks/bulkLock';

export interface SnapshotMetadata {
  id: string;
  timestamp: number;
  label: string;
  totalBookmarks: number;
  totalFolders: number;
}

export interface SnapshotRecord extends SnapshotMetadata {
  data: BookmarkNode[];
}

const STORAGE_SNAPSHOTS_KEY = 'efm_snapshots';

export async function createLocalSnapshot(label: string = 'Snapshot Automático'): Promise<string> {
  const tree = await bookmarksService.getTree();
  
  let bookmarksCount = 0;
  let foldersCount = 0;

  function count(node: BookmarkNode) {
    if (node.url) bookmarksCount++;
    else if (node.id !== '0') foldersCount++;
    node.children?.forEach(count);
  }
  tree.forEach(count);

  const snapshotId = `snapshot_${Date.now()}`;
  const record: SnapshotRecord = {
    id: snapshotId,
    timestamp: Date.now(),
    label,
    totalBookmarks: bookmarksCount,
    totalFolders: foldersCount,
    data: tree,
  };

  // Save to chrome.storage.local if available, else localStorage
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const existing = await new Promise<Record<string, any>>((resolve) => {
      chrome.storage.local.get([STORAGE_SNAPSHOTS_KEY], (res) => resolve(res || {}));
    });

    const snapshots: any[] = existing[STORAGE_SNAPSHOTS_KEY] || [];
    snapshots.unshift(record);
    // Keep max 15 snapshots
    if (snapshots.length > 15) snapshots.length = 15;

    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [STORAGE_SNAPSHOTS_KEY]: snapshots }, () => resolve());
    });
  } else {
    try {
      const existingStr = localStorage.getItem(STORAGE_SNAPSHOTS_KEY);
      const snapshots = existingStr ? JSON.parse(existingStr) : [];
      snapshots.unshift(record);
      if (snapshots.length > 15) snapshots.length = 15;
      localStorage.setItem(STORAGE_SNAPSHOTS_KEY, JSON.stringify(snapshots));
    } catch (e) {
      console.warn('Could not save snapshot to localStorage:', e);
    }
  }

  return snapshotId;
}

export async function listSnapshots(): Promise<SnapshotMetadata[]> {
  let list: any[] = [];
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const result = await new Promise<Record<string, any>>((resolve) => {
      chrome.storage.local.get([STORAGE_SNAPSHOTS_KEY], (res) => resolve(res || {}));
    });
    list = result[STORAGE_SNAPSHOTS_KEY] || [];
  } else {
    try {
      const str = localStorage.getItem(STORAGE_SNAPSHOTS_KEY);
      list = str ? JSON.parse(str) : [];
    } catch {
      list = [];
    }
  }

  return list.map((item) => ({
    id: item.id,
    timestamp: item.timestamp,
    label: item.label,
    totalBookmarks: item.totalBookmarks,
    totalFolders: item.totalFolders,
  }));
}

export async function getSnapshotById(id: string): Promise<SnapshotRecord | null> {
  let list: any[] = [];
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const result = await new Promise<Record<string, any>>((resolve) => {
      chrome.storage.local.get([STORAGE_SNAPSHOTS_KEY], (res) => resolve(res || {}));
    });
    list = result[STORAGE_SNAPSHOTS_KEY] || [];
  } else {
    try {
      const str = localStorage.getItem(STORAGE_SNAPSHOTS_KEY);
      list = str ? JSON.parse(str) : [];
    } catch {
      list = [];
    }
  }

  return list.find((item) => item.id === id) || null;
}

export async function deleteSnapshot(id: string): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const existing = await new Promise<Record<string, any>>((resolve) => {
      chrome.storage.local.get([STORAGE_SNAPSHOTS_KEY], (res) => resolve(res || {}));
    });
    const snapshots: any[] = (existing[STORAGE_SNAPSHOTS_KEY] || []).filter((s: any) => s.id !== id);
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [STORAGE_SNAPSHOTS_KEY]: snapshots }, () => resolve());
    });
  } else {
    try {
      const existingStr = localStorage.getItem(STORAGE_SNAPSHOTS_KEY);
      const snapshots = existingStr ? JSON.parse(existingStr) : [];
      const filtered = snapshots.filter((s: any) => s.id !== id);
      localStorage.setItem(STORAGE_SNAPSHOTS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Could not delete snapshot from localStorage:', e);
    }
  }
}

/**
 * Restores a snapshot into the browser's bookmark tree (Bug 3 Fix).
 * Creates a safety snapshot of the current state before replacing nodes.
 */
export async function restoreSnapshot(snapshotId: string): Promise<boolean> {
  const snapshot = await getSnapshotById(snapshotId);
  if (!snapshot || !snapshot.data) {
    throw new Error('Snapshot não encontrado ou dados inválidos');
  }

  // 1. Create safety snapshot of current state before replacing
  await createLocalSnapshot('Snapshot prévio à Restauração');

  function findNodeById(nodes: BookmarkNode[], targetId: string): BookmarkNode | null {
    for (const n of nodes) {
      if (n.id === targetId) return n;
      if (n.children) {
        const found = findNodeById(n.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  // Trava de sessão: sem ela, a auto-organização do service worker mexe nos itens restaurados
  await withBulkOperation(async () => {
    // 2. Clear current bookmarks inside editable roots ('1' Bookmarks Bar, '2' Other, '3' Mobile)
    const currentTree = await bookmarksService.getTree();
    for (const rootId of ['1', '2', '3']) {
      const node = findNodeById(currentTree, rootId);
      if (node && node.children) {
        for (const child of [...node.children]) {
          try {
            if (child.url) {
              await bookmarksService.remove(child.id);
            } else {
              await bookmarksService.removeTree(child.id);
            }
          } catch (err) {
            console.warn(`Aviso ao limpar item ${child.id} antes da restauração:`, err);
          }
        }
      }
    }

    // 3. Helper to recreate children recursively
    async function recreateChildren(children: BookmarkNode[], targetParentId: string) {
      for (const child of children) {
        if (child.url) {
          await bookmarksService.create({
            parentId: targetParentId,
            title: child.title,
            url: child.url,
          });
        } else {
          const createdFolder = await bookmarksService.create({
            parentId: targetParentId,
            title: child.title,
          });
          if (child.children && child.children.length > 0) {
            await recreateChildren(child.children, createdFolder.id);
          }
        }
      }
    }

    // 4. Reconstruct items from snapshot.data under '1', '2', '3'
    const snapshotTree = Array.isArray(snapshot.data) ? snapshot.data : [snapshot.data];
    for (const rootId of ['1', '2', '3']) {
      const rootSnapshotNode = findNodeById(snapshotTree, rootId);
      if (rootSnapshotNode && rootSnapshotNode.children && rootSnapshotNode.children.length > 0) {
        await recreateChildren(rootSnapshotNode.children, rootId);
      }
    }
  });

  return true;
}

export function exportBookmarksToJson(tree: BookmarkNode[]): string {
  return JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tree,
    },
    null,
    2
  );
}

export function downloadJsonFile(content: string, filename: string = 'edge-bookmarks-backup.json') {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export * from './htmlParser';
export * from './htmlExporter';
export * from './importer';
export * from './markdownExporter';

