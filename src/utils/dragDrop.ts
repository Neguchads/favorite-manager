import { BookmarkNode } from '../types/bookmarks';

export type DropPosition = 'before' | 'inside' | 'after';

export interface DragItemPayload {
  type: 'bookmark' | 'folder' | 'multiple';
  id?: string;
  ids?: string[];
}

/**
 * Checks if targetId is identical to ancestorId or is located inside ancestorId's subtree.
 */
export function isDescendantOf(
  targetId: string,
  ancestorId: string,
  nodeMap: Map<string, BookmarkNode>
): boolean {
  if (targetId === ancestorId) return true;
  let current = nodeMap.get(targetId);
  let guard = 0;
  while (current && current.parentId && guard < 100) {
    if (current.parentId === ancestorId) return true;
    current = nodeMap.get(current.parentId);
    guard++;
  }
  return false;
}

/**
 * Extracts item IDs from a drag event payload safely.
 */
export function parseDragPayload(e: React.DragEvent): { ids: string[]; type: string } | null {
  const rawData =
    e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
  if (!rawData) return null;

  try {
    const parsed = JSON.parse(rawData);
    if (parsed.type === 'multiple' && Array.isArray(parsed.ids) && parsed.ids.length > 0) {
      return { ids: parsed.ids, type: 'multiple' };
    }
    if ((parsed.type === 'bookmark' || parsed.type === 'folder') && parsed.id) {
      return { ids: [parsed.id], type: parsed.type };
    }
  } catch {
    // Plain string id fallback
    const trimmed = rawData.trim();
    if (trimmed && !trimmed.startsWith('http')) {
      return { ids: [trimmed], type: 'unknown' };
    }
  }
  return null;
}

/**
 * Calculates drop position ('before', 'inside', or 'after') relative to element coordinates.
 */
export function getDropPosition(
  e: React.DragEvent,
  canDropInside: boolean
): DropPosition {
  const rect = e.currentTarget.getBoundingClientRect();
  const relY = (e.clientY - rect.top) / rect.height;

  if (canDropInside) {
    if (relY < 0.25) return 'before';
    if (relY > 0.75) return 'after';
    return 'inside';
  } else {
    return relY < 0.5 ? 'before' : 'after';
  }
}
