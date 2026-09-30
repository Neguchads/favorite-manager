import { BookmarkNode } from '../../types/bookmarks';

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates an official Netscape Bookmark File 1 (HTML format)
 * compatible with Microsoft Edge, Google Chrome, Mozilla Firefox, and Safari.
 */
export function generateNetscapeHtml(tree: BookmarkNode[]): string {
  const lines: string[] = [];

  lines.push('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
  lines.push('<!-- This is an automatically generated file.');
  lines.push('     It will be read and overwritten.');
  lines.push('     DO NOT EDIT! -->');
  lines.push('<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">');
  lines.push('<TITLE>Bookmarks</TITLE>');
  lines.push('<H1>Bookmarks</H1>');
  lines.push('<DL><p>');

  function renderNodes(nodes: BookmarkNode[], indentLevel: number) {
    const indent = '    '.repeat(indentLevel);

    for (const node of nodes) {
      const unixDate = Math.floor((node.dateAdded || Date.now()) / 1000);

      if (node.url) {
        // Bookmark link
        const safeUrl = escapeHtml(node.url);
        const safeTitle = escapeHtml(node.title || node.url);
        lines.push(`${indent}<DT><A HREF="${safeUrl}" ADD_DATE="${unixDate}">${safeTitle}</A>`);
      } else {
        // Folder
        if (node.id === '0') {
          // Skip root wrapper node 0, process its children
          if (node.children) renderNodes(node.children, indentLevel);
          continue;
        }

        const folderTitle =
          node.id === '1'
            ? 'Barra de favoritos'
            : node.id === '2'
            ? 'Outros favoritos'
            : node.id === '3'
            ? 'Favoritos móveis'
            : node.title;

        const safeFolderTitle = escapeHtml(folderTitle || 'Nova Pasta');
        // Navegadores reconhecem a barra por este atributo ao importar
        const toolbarAttr = node.id === '1' ? ' PERSONAL_TOOLBAR_FOLDER="true"' : '';
        lines.push(`${indent}<DT><H3 ADD_DATE="${unixDate}" LAST_MODIFIED="${unixDate}"${toolbarAttr}>${safeFolderTitle}</H3>`);
        lines.push(`${indent}<DL><p>`);

        if (node.children && node.children.length > 0) {
          renderNodes(node.children, indentLevel + 1);
        }

        lines.push(`${indent}</DL><p>`);
      }
    }
  }

  // If tree has root wrapper (node id 0), take its children or the whole tree
  const rootNodes = tree.length > 0 && tree[0].id === '0' && tree[0].children ? tree[0].children : tree;
  renderNodes(rootNodes, 1);

  lines.push('</DL><p>');
  return lines.join('\n');
}

/**
 * Downloads the exported Netscape HTML file directly to the user's downloads folder.
 */
export function downloadNetscapeHtmlFile(
  tree: BookmarkNode[],
  filename: string = 'favoritos_edge_backup.html'
): void {
  const content = generateNetscapeHtml(tree);
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
