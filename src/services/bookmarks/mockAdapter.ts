import { BookmarkNode } from '../../types/bookmarks';
import { CreateBookmarkParams, IBookmarksService, MoveBookmarkParams, UpdateBookmarkParams } from './types';

const INITIAL_MOCK_TREE: BookmarkNode[] = [
  {
    id: '0',
    title: 'root',
    children: [
      {
        id: '1',
        parentId: '0',
        title: 'Barra de favoritos',
        dateAdded: 1700000000000,
        children: [
          {
            id: '10',
            parentId: '1',
            title: 'Geral & Desorganizados',
            dateAdded: 1710000000000,
            children: [
              // Dev & IA
              {
                id: '101',
                parentId: '10',
                title: 'Claude AI',
                url: 'https://claude.ai',
                dateAdded: 1711000000000,
              },
              {
                id: '102',
                parentId: '10',
                title: 'GitHub: Let’s build from here',
                url: 'https://github.com',
                dateAdded: 1711200000000,
              },
              {
                id: '103',
                parentId: '10',
                title: 'Ollama - Get up and running with Llama 3',
                url: 'https://ollama.com',
                dateAdded: 1711300000000,
              },
              {
                id: '104',
                parentId: '10',
                title: 'Stack Overflow',
                url: 'https://stackoverflow.com',
                dateAdded: 1711400000000,
              },
              // Jogos
              {
                id: '105',
                parentId: '10',
                title: 'Steam Community :: Hub de Jogos',
                url: 'https://store.steampowered.com',
                dateAdded: 1711500000000,
              },
              {
                id: '106',
                parentId: '10',
                title: 'Twitch - Transmissões de Games e Esportes',
                url: 'https://twitch.tv',
                dateAdded: 1711600000000,
              },
              // Filmes & Séries
              {
                id: '107',
                parentId: '10',
                title: 'Netflix - Filmes e Séries Online',
                url: 'https://www.netflix.com',
                dateAdded: 1711700000000,
              },
              {
                id: '108',
                parentId: '10',
                title: 'IMDb: Avaliações de Filmes e Séries',
                url: 'https://www.imdb.com',
                dateAdded: 1711800000000,
              },
              // Músicas & Áudio
              {
                id: '109',
                parentId: '10',
                title: 'Spotify - Web Player',
                url: 'https://open.spotify.com',
                dateAdded: 1711900000000,
              },
              {
                id: '110',
                parentId: '10',
                title: 'Cifra Club - Cifras e Tablaturas',
                url: 'https://www.cifraclub.com.br',
                dateAdded: 1712000000000,
              },
              // Eletroeletrônica
              {
                id: '111',
                parentId: '10',
                title: 'Arduino - Documentação e Projetos de Circuitos',
                url: 'https://www.arduino.cc',
                dateAdded: 1712100000000,
              },
              {
                id: '112',
                parentId: '10',
                title: 'EasyEDA - Editor de Esquemas Elétricos e PCB',
                url: 'https://easyeda.com',
                dateAdded: 1712200000000,
              },
              {
                id: '113',
                parentId: '10',
                title: 'AllDataSheet - Catálogo de Componentes e Transistores',
                url: 'https://www.alldatasheet.com',
                dateAdded: 1712300000000,
              },
              // Mecânica & Engenharia
              {
                id: '114',
                parentId: '10',
                title: 'GrabCAD - Biblioteca de Modelos CAD 3D e Engenharia',
                url: 'https://grabcad.com',
                dateAdded: 1712400000000,
              },
              {
                id: '115',
                parentId: '10',
                title: 'SolidWorks 3D CAD Design Software',
                url: 'https://www.solidworks.com',
                dateAdded: 1712500000000,
              },
              // Turismo & Viagens
              {
                id: '116',
                parentId: '10',
                title: 'Booking.com - Hotéis e Pousadas',
                url: 'https://www.booking.com',
                dateAdded: 1712600000000,
              },
              {
                id: '117',
                parentId: '10',
                title: 'Decolar - Passagens Aéreas e Pacotes de Viagem',
                url: 'https://www.decolar.com',
                dateAdded: 1712700000000,
              },
              // Lojas & Compras
              {
                id: '118',
                parentId: '10',
                title: 'Mercado Livre Brasil',
                url: 'https://www.mercadolivre.com.br',
                dateAdded: 1712800000000,
              },
              {
                id: '119',
                parentId: '10',
                title: 'KaBuM! - Hardware e Eletrônicos',
                url: 'https://www.kabum.com.br',
                dateAdded: 1712900000000,
              },
              // Finanças
              {
                id: '120',
                parentId: '10',
                title: 'Status Invest - Análise de Ações e FIIs',
                url: 'https://statusinvest.com.br',
                dateAdded: 1713000000000,
              },
            ],
          },
          {
            id: '401',
            parentId: '1',
            title: 'GitHub (Duplicado Exato)',
            url: 'https://github.com',
            dateAdded: 1715000000000,
          },
          {
            id: '402',
            parentId: '1',
            title: 'GitHub (Duplicado com UTM)',
            url: 'https://github.com/?utm_source=test&utm_medium=banner',
            dateAdded: 1716000000000,
          },
          {
            id: '403',
            parentId: '1',
            title: '',
            url: 'https://example.com/untitled-link',
            dateAdded: 1717000000000,
          },
        ],
      },
      {
        id: '2',
        parentId: '0',
        title: 'Outros favoritos',
        dateAdded: 1700000000000,
        children: [
          {
            id: '501',
            parentId: '2',
            title: 'Edge Side Panel API',
            url: 'https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/sidebar',
            dateAdded: 1718000000000,
          },
          {
            id: '502',
            parentId: '2',
            title: 'Pasta Vazia Teste',
            dateAdded: 1719000000000,
            children: [],
          },
        ],
      },
      {
        id: '3',
        parentId: '0',
        title: 'Favoritos móveis',
        dateAdded: 1700000000000,
        children: [],
      },
    ],
  },
];

export class MockBookmarksService implements IBookmarksService {
  private tree: BookmarkNode[];
  private listeners: Set<() => void> = new Set();
  private nextId = 1000;

  constructor() {
    this.tree = JSON.parse(JSON.stringify(INITIAL_MOCK_TREE));
    this.reindexAll(this.tree[0]);
  }

  isNative(): boolean {
    return false;
  }

  async getTree(): Promise<BookmarkNode[]> {
    return JSON.parse(JSON.stringify(this.tree));
  }

  async getSubTree(id: string): Promise<BookmarkNode[]> {
    const node = this.findNode(this.tree[0], id);
    if (!node) throw new Error(`Node ${id} not found`);
    return [JSON.parse(JSON.stringify(node))];
  }

  async create(params: CreateBookmarkParams): Promise<BookmarkNode> {
    const parentId = params.parentId || '1';
    const parent = this.findNode(this.tree[0], parentId);
    if (!parent) throw new Error(`Parent ${parentId} not found`);

    if (!parent.children) {
      parent.children = [];
    }

    const newNode: BookmarkNode = {
      id: String(this.nextId++),
      parentId: parent.id,
      title: params.title,
      url: params.url,
      dateAdded: Date.now(),
      children: params.url ? undefined : [],
    };

    if (params.index !== undefined && params.index >= 0) {
      parent.children.splice(params.index, 0, newNode);
    } else {
      parent.children.push(newNode);
    }
    this.reindex(parent);

    this.notify();
    return JSON.parse(JSON.stringify(newNode));
  }

  async update(id: string, params: UpdateBookmarkParams): Promise<BookmarkNode> {
    const node = this.findNode(this.tree[0], id);
    if (!node) throw new Error(`Node ${id} not found`);

    if (params.title !== undefined) node.title = params.title;
    if (params.url !== undefined && node.url !== undefined) node.url = params.url;

    this.notify();
    return JSON.parse(JSON.stringify(node));
  }

  async move(id: string, params: MoveBookmarkParams): Promise<BookmarkNode> {
    const { node, parent } = this.findNodeAndParent(this.tree[0], id);
    if (!node || !parent) throw new Error(`Node ${id} or parent not found`);

    const oldIndex = parent.children?.findIndex((c) => c.id === id) ?? -1;
    parent.children = parent.children?.filter((c) => c.id !== id);

    const targetParentId = params.parentId || parent.id;
    const targetParent = this.findNode(this.tree[0], targetParentId);
    if (!targetParent) throw new Error(`Target parent ${targetParentId} not found`);

    if (!targetParent.children) targetParent.children = [];
    node.parentId = targetParent.id;

    if (params.index !== undefined && params.index >= 0) {
      // Igual ao Chrome: descendo na mesma pasta, o índice conta com o item ainda no lugar antigo
      const finalIndex = targetParent.id === parent.id && params.index > oldIndex ? params.index - 1 : params.index;
      targetParent.children.splice(finalIndex, 0, node);
    } else {
      targetParent.children.push(node);
    }
    this.reindex(parent);
    this.reindex(targetParent);

    this.notify();
    return JSON.parse(JSON.stringify(node));
  }

  async remove(id: string): Promise<void> {
    const { parent } = this.findNodeAndParent(this.tree[0], id);
    if (parent && parent.children) {
      parent.children = parent.children.filter((c) => c.id !== id);
      this.reindex(parent);
      this.notify();
    }
  }

  async removeTree(id: string): Promise<void> {
    await this.remove(id);
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb());
  }

  // Mantém o campo index como o Chrome devolve (posição na pasta)
  private reindex(parent: BookmarkNode): void {
    parent.children?.forEach((child, i) => {
      child.index = i;
    });
  }

  private reindexAll(node: BookmarkNode): void {
    this.reindex(node);
    node.children?.forEach((child) => this.reindexAll(child));
  }

  private findNode(current: BookmarkNode, id: string): BookmarkNode | null {
    if (current.id === id) return current;
    if (current.children) {
      for (const child of current.children) {
        const found = this.findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  private findNodeAndParent(
    current: BookmarkNode,
    id: string,
    parent: BookmarkNode | null = null
  ): { node: BookmarkNode | null; parent: BookmarkNode | null } {
    if (current.id === id) return { node: current, parent };
    if (current.children) {
      for (const child of current.children) {
        const found = this.findNodeAndParent(child, id, current);
        if (found.node) return found;
      }
    }
    return { node: null, parent: null };
  }
}
