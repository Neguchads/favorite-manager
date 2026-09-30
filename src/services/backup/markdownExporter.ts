import { BookmarkNode } from '../../types/bookmarks';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Converts a bookmark tree into a clean GitHub Flavored Markdown "Awesome List" document
 */
export function generateAwesomeListMarkdown(tree: BookmarkNode[]): string {
  let totalBookmarks = 0;
  let totalFolders = 0;

  // Count totals
  function countStats(nodes: BookmarkNode[]) {
    for (const n of nodes) {
      if (n.url) totalBookmarks++;
      else totalFolders++;
      if (n.children) countStats(n.children);
    }
  }
  countStats(tree);

  const lines: string[] = [];
  lines.push('# 📚 Meus Favoritos — Coleção Awesome List');
  lines.push('');
  lines.push(`> Exportado em **${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}** via **Favorite Manager**.`);
  lines.push(`> Total de links: **${totalBookmarks}** | Pastas: **${totalFolders}**`);
  lines.push('');

  // Extract top-level sections for Table of Contents
  const rootNode = tree[0];
  const mainFolders = (rootNode?.children || tree).filter((c) => !c.url);

  lines.push('## 📑 Índice Geral');
  lines.push('');
  for (const folder of mainFolders) {
    const slug = slugify(folder.title);
    lines.push(`- [${folder.title}](#${slug})`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Recursive formatter
  function formatFolder(node: BookmarkNode, depth: number) {
    const title = node.title || 'Sem Título';
    const hashes = '#'.repeat(Math.min(depth, 5));
    lines.push(`${hashes} ${title}`);
    lines.push('');

    const bookmarks: BookmarkNode[] = [];
    const subfolders: BookmarkNode[] = [];

    for (const child of node.children || []) {
      if (child.url) {
        bookmarks.push(child);
      } else {
        subfolders.push(child);
      }
    }

    if (bookmarks.length > 0) {
      for (const bm of bookmarks) {
        const cleanTitle = (bm.title || bm.url || 'Link').trim().replace(/\[/g, '(').replace(/\]/g, ')');
        lines.push(`- [${cleanTitle}](${bm.url})`);
      }
      lines.push('');
    }

    for (const sub of subfolders) {
      formatFolder(sub, depth + 1);
    }
  }

  for (const folder of mainFolders) {
    formatFolder(folder, 2);
  }

  lines.push('---');
  lines.push('*Gerado com orgulho pelo Favorite Manager.*');

  return lines.join('\n');
}

/**
 * Triggers browser download of the Awesome List Markdown file
 */
export function downloadMarkdownAwesomeList(tree: BookmarkNode[], filename: string = 'favoritos_awesome_list.md'): void {
  const mdContent = generateAwesomeListMarkdown(tree);
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
