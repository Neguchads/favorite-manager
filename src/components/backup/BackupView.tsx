import React, { useState, useEffect } from 'react';
import {
  HardDriveDownload,
  Camera,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileText,
  Trash2,
  AlertTriangle,
  UploadCloud,
  FileCode,
} from 'lucide-react';
import { BookmarkNode } from '../../types/bookmarks';
import {
  createLocalSnapshot,
  listSnapshots,
  restoreSnapshot,
  deleteSnapshot,
  SnapshotMetadata,
  exportBookmarksToJson,
  downloadJsonFile,
} from '../../services/backup';
import { downloadMarkdownAwesomeList } from '../../services/backup/markdownExporter';
import { downloadNetscapeHtmlFile } from '../../services/backup/htmlExporter';
import { formatDate } from '../../utils/date';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ImportBookmarksModal } from '../modals/ImportBookmarksModal';
import { FolderOption } from '../../hooks/useBookmarks';

interface BackupViewProps {
  tree: BookmarkNode[];
  onRefresh?: () => Promise<void>;
  folders?: FolderOption[];
}

export const BackupView: React.FC<BackupViewProps> = ({ tree, onRefresh, folders = [] }) => {
  const [snapshots, setSnapshots] = useState<SnapshotMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Restore confirmation modal
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const load = async () => {
    const list = await listSnapshots();
    setSnapshots(list);
  };

  useEffect(() => {
    load();
  }, []);

  const handleExportHtml = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadNetscapeHtmlFile(tree, `favoritos_edge_backup_${dateStr}.html`);
    setSuccessMsg('Download do arquivo Netscape HTML (.html) oficial iniciado! Compatível com todos os navegadores.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleExportJson = () => {
    const jsonStr = exportBookmarksToJson(tree);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadJsonFile(jsonStr, `edge-bookmarks-backup-${dateStr}.json`);
    setSuccessMsg('Download do arquivo de backup JSON iniciado!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleExportMarkdown = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadMarkdownAwesomeList(tree, `favoritos_awesome_list_${dateStr}.md`);
    setSuccessMsg('Download da coleção Awesome List em Markdown (.md) iniciado!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleCreateSnapshot = async () => {
    setLoading(true);
    await createLocalSnapshot('Snapshot Manual do Usuário');
    await load();
    setLoading(false);
    setSuccessMsg('Snapshot de segurança criado com sucesso no armazenamento local!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleConfirmRestore = async () => {
    if (!confirmRestoreId) return;
    try {
      setRestoring(true);
      setErrorMsg(null);
      await restoreSnapshot(confirmRestoreId);
      if (onRefresh) {
        await onRefresh();
      }
      await load();
      setSuccessMsg('Favoritos restaurados com sucesso a partir do snapshot!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao restaurar snapshot');
    } finally {
      setRestoring(false);
      setConfirmRestoreId(null);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    await deleteSnapshot(id);
    await load();
    setSuccessMsg('Snapshot removido.');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  return (
    <div className="p-5 space-y-6 text-xs max-w-4xl">
      {/* Header card */}
      <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-200 dark:border-sky-800/60 rounded-xl p-4 flex items-start space-x-3">
        <ShieldCheck className="w-6 h-6 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Segurança, Backup e Importação de Favoritos
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            O Edge Favorite Manager gera automaticamente snapshots antes de qualquer operação em massa.
            Você pode importar arquivos HTML de favoritos de qualquer navegador, exportar em múltiplos formatos e restaurar snapshots instantaneamente.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 flex items-center space-x-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Prominent Import Section */}
      <div className="p-4 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-xl border border-sky-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Importar Favoritos de Arquivo (HTML / JSON)
            </h4>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
              Importe o arquivo <code className="font-mono text-sky-600 dark:text-sky-400">bookmarks.html</code> do Edge, Chrome ou Firefox. Suporta manter a estrutura original ou <strong>organização inteligente com IA</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsImportModalOpen(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2 shrink-0 shadow-sm shadow-sky-500/20"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Abrir Assistente de Importação</span>
        </button>
      </div>

      {/* Export & Snapshot action buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. HTML Netscape Export */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-sky-600 dark:text-sky-400 font-semibold mb-1">
              <FileCode className="w-4 h-4" />
              <span>HTML Oficial (.html)</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-4">
              Padrão Netscape aceito nativamente por Microsoft Edge, Chrome, Safari e Firefox para restauração direta.
            </p>
          </div>
          <button
            onClick={handleExportHtml}
            className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar HTML (.html)</span>
          </button>
        </div>

        {/* 2. JSON Export */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-semibold mb-1">
              <Download className="w-4 h-4" />
              <span>Backup JSON (.json)</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-4">
              Gera um arquivo JSON estruturado com toda a árvore de pastas, URLs e metadados para backups avançados.
            </p>
          </div>
          <button
            onClick={handleExportJson}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar JSON</span>
          </button>
        </div>

        {/* 3. Markdown Awesome List Export */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
              <FileText className="w-4 h-4" />
              <span>Awesome List (.md)</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-4">
              Exporta sua coleção inteira como um README.md formatado com índice temático pronto para o GitHub ou Obsidian.
            </p>
          </div>
          <button
            onClick={handleExportMarkdown}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Baixar README.md</span>
          </button>
        </div>

        {/* 4. Instant Snapshot */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-semibold mb-1">
              <Camera className="w-4 h-4" />
              <span>Snapshot Local</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-4">
              Ponto de restauração instantâneo salvo no navegador. Permite recuperação com 1 clique.
            </p>
          </div>
          <button
            onClick={handleCreateSnapshot}
            disabled={loading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 shadow-2xs"
          >
            <HardDriveDownload className="w-3.5 h-3.5" />
            <span>{loading ? 'Criando Snapshot...' : 'Criar Snapshot'}</span>
          </button>
        </div>
      </div>

      {/* Snapshots history */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Histórico de Snapshots Locais ({snapshots.length})
            </span>
          </div>
          <button
            onClick={load}
            className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Atualizar lista</span>
          </button>
        </div>

        {snapshots.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Camera className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-medium text-slate-600 dark:text-slate-300">
              Nenhum snapshot gravado ainda
            </p>
            <p className="text-[11px] mt-1 text-slate-400">
              Snapshots são criados automaticamente antes de reorganizações em massa ou manualmente clicando no botão acima.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {snap.label}
                    </span>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{formatDate(snap.timestamp)}</span>
                      <span>•</span>
                      <span>{snap.totalBookmarks} favoritos</span>
                      <span>•</span>
                      <span>{snap.totalFolders} pastas</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setConfirmRestoreId(snap.id)}
                    className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-md font-medium transition-colors flex items-center space-x-1"
                    title="Restaurar este snapshot no Edge"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSnapshot(snap.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded"
                    title="Excluir snapshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmRestoreId)}
        title="Confirmar Restauração de Snapshot"
        message="Atenção: A restauração substituirá os favoritos atuais do Edge pelo estado salvo neste snapshot. Um novo snapshot do estado atual será gravado automaticamente como garantia antes da restauração. Deseja prosseguir?"
        confirmLabel={restoring ? 'Restaurando...' : 'Sim, Restaurar Favoritos'}
        isDestructive={true}
        onConfirm={handleConfirmRestore}
        onClose={() => setConfirmRestoreId(null)}
      />

      {/* Import Bookmarks Modal */}
      <ImportBookmarksModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        folders={folders}
        onRefreshTree={onRefresh}
      />
    </div>
  );
};
