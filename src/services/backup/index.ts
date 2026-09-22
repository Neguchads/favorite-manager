import { BookmarkNode } from '../../types/bookmarks';
import { bookmarksService } from '../bookmarks';

export interface SnapshotMetadata {
  id: string;
  timestamp: number;
  label: string;
  totalBookmarks: number;
  totalFolders: number;
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
  const record = {
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
    // Keep max 10 snapshots to save quota
    if (snapshots.length > 10) snapshots.length = 10;

    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [STORAGE_SNAPSHOTS_KEY]: snapshots }, () => resolve());
    });
  } else {
    try {
      const existingStr = localStorage.getItem(STORAGE_SNAPSHOTS_KEY);
      const snapshots = existingStr ? JSON.parse(existingStr) : [];
      snapshots.unshift(record);
      if (snapshots.length > 10) snapshots.length = 10;
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
